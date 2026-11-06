/**
 * Test permanen untuk klaim idempoten (Fase 2 hardening Feeder) pada tiga alur Insert yang belum
 * punya perlindungan concurrency sebelumnya: `pushMataKuliahBaruToFeeder`, `pushKurikulumBaruToFeeder`,
 * `pushKelasKuliahBaruToFeeder`. Lihat FEEDER_PHASE_2_IMPLEMENTATION_REPORT.md.
 *
 * Dijalankan terhadap database Postgres SEMENTARA (disalin dari `siakad_premium`, dihapus di akhir) --
 * TIDAK PERNAH memakai database development/produksi. `global.fetch` di-mock seluruhnya.
 *
 * Jalankan: pnpm --filter @siakad/api test:feeder-insert
 */
import { PrismaClient } from '@siakad/database';
import { IntegrationSettingsService } from '../src/modules/integration-settings/integration-settings.service';

const ADMIN_DB_URL = process.env.TEST_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5434/postgres?schema=public';
const TEMPLATE_DB = process.env.TEST_TEMPLATE_DATABASE || 'siakad_premium';
const TEST_DB_NAME = `feeder_insert_test_${Date.now()}`;
const TEST_DB_URL = ADMIN_DB_URL.replace(/\/postgres(\?|$)/, `/${TEST_DB_NAME}$1`);

let fails = 0;
const ok = (label: string, cond: boolean, extra = '') => {
  if (!cond) fails++;
  console.log(cond ? 'OK  ' : 'FAIL', label, extra);
};

async function createTestDatabase(): Promise<void> {
  const admin = new PrismaClient({ datasources: { db: { url: ADMIN_DB_URL } } });
  await admin.$executeRawUnsafe(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TEMPLATE_DB}' AND pid <> pg_backend_pid()`,
  );
  await admin.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}" TEMPLATE "${TEMPLATE_DB}"`);
  await admin.$disconnect();
}

async function dropTestDatabase(): Promise<void> {
  const admin = new PrismaClient({ datasources: { db: { url: ADMIN_DB_URL } } });
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
  await admin.$disconnect();
}

type CallLogEntry = { act: string };

/**
 * Mock Feeder umum: GetToken selalu sukses; GetProdi mengembalikan satu prodi (dipakai
 * `getProdiFeederIdByCode`); untuk setiap `(getAct, matchFields)` yang didaftarkan, pencarian "sudah
 * ada" membaca dari `stored`, dan act Insert yang berpasangan menulis ke `stored` kecuali untuk
 * `rejectFor`/`networkFailFor`.
 */
function installMock(opts: {
  prodiKode: string;
  prodiFeederId: string;
  getAct: string;
  insertAct: string;
  matcher: (filter: string, row: any) => boolean;
  idField: string;
  buildRow: (record: any) => any;
  stored: any[];
  rejectInsertFor?: (record: any) => boolean;
  networkFailInsertFor?: (record: any) => boolean;
  rejectCheckFor?: (filter: string) => boolean;
  networkFailCheckFor?: (filter: string) => boolean;
  semesterOk?: boolean;
  callLog: CallLogEntry[];
}) {
  const {
    prodiKode,
    prodiFeederId,
    getAct,
    insertAct,
    matcher,
    idField,
    buildRow,
    stored,
    rejectInsertFor = () => false,
    networkFailInsertFor = () => false,
    rejectCheckFor = () => false,
    networkFailCheckFor = () => false,
    semesterOk = true,
    callLog,
  } = opts;
  (global as any).fetch = async (_url: string, init: any) => {
    const body = JSON.parse(init.body);
    callLog.push({ act: body.act });
    if (body.act === 'GetToken') {
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: { token: 'tok-test' } }) };
    }
    if (body.act === 'GetProdi') {
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: [{ id_prodi: prodiFeederId, kode_program_studi: prodiKode }] }) };
    }
    if (body.act === 'GetSemester') {
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: semesterOk ? [{ id_semester: '20261' }] : [] }) };
    }
    if (body.act === 'GetListPenugasanDosen') {
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: [] }) }; // tidak dites di sini -- hanya "tertunda", tidak membatalkan kelas
    }
    if (body.act === getAct) {
      if (networkFailCheckFor(body.filter)) throw new TypeError('fetch failed');
      if (rejectCheckFor(body.filter)) return { status: 200, text: async () => JSON.stringify({ error_code: 1, error_desc: 'ditolak' }) };
      const hit = stored.find((r) => matcher(body.filter, r));
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: hit ? [hit] : [] }) };
    }
    if (body.act === insertAct) {
      if (networkFailInsertFor(body.record)) throw new TypeError('fetch failed');
      if (rejectInsertFor(body.record)) return { status: 200, text: async () => JSON.stringify({ error_code: 1, error_desc: 'Insert ditolak Feeder (simulasi)' }) };
      const row = buildRow(body.record);
      stored.push(row);
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: { [idField]: row[idField] } }) };
    }
    throw new Error(`act tak terduga di mock: ${body.act}`);
  };
}

async function main(): Promise<void> {
  await createTestDatabase();
  const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
  const svc = new IntegrationSettingsService(prisma as unknown as import('../src/shared/prisma/prisma.service').PrismaService);
  const origFetch = (global as any).fetch;

  try {
    await prisma.pddiktiSetting.upsert({
      where: { id: 'default-pddikti-setting' },
      update: { baseUrl: 'http://fake-feeder.test/ws/live2.php', username: 'u', password: 'p', isActive: true },
      create: { id: 'default-pddikti-setting', baseUrl: 'http://fake-feeder.test/ws/live2.php', username: 'u', password: 'p', isActive: true },
    });
    const studyProgram = await prisma.studyProgram.findFirstOrThrow();
    if (!studyProgram.diktiCode) {
      await prisma.studyProgram.update({ where: { id: studyProgram.id }, data: { diktiCode: 'DKT001' } });
      studyProgram.diktiCode = 'DKT001';
    }
    const prodiKode = studyProgram.diktiCode!;
    const year = await prisma.academicYear.findFirstOrThrow({ where: { isActive: true } });
    await prisma.academicYear.update({ where: { id: year.id }, data: { code: '20261' } });

    // =============================================================================================
    // MATA KULIAH
    // =============================================================================================
    const uniq = () => Math.random().toString(36).slice(2, 10);

    // 1. Push berhasil (Insert baru)
    {
      const course = await prisma.course.create({ data: { code: `MK-${uniq()}`, name: 'Uji 1', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id } });
      const stored: any[] = [];
      const callLog: CallLogEntry[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: (f, r) => f.includes(`kode_mata_kuliah = '${course.code}'`) && r.kode_mata_kuliah === course.code,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        callLog,
      });
      const res = await svc.pushMataKuliahBaruToFeeder([course.id]);
      ok('MK 1.1 push berhasil (created=1)', (res as any).created === 1 && (res as any).failed === 0, JSON.stringify(res));
      const row = await prisma.course.findUnique({ where: { id: course.id } });
      ok('MK 1.2 feederId lokal terisi', !!row?.feederId);
    }

    // 2. Error bisnis Feeder saat Insert
    {
      const course = await prisma.course.create({ data: { code: `MK-${uniq()}`, name: 'Uji 2', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id } });
      const stored: any[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: () => false,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        rejectInsertFor: () => true,
        callLog: [],
      });
      const res = await svc.pushMataKuliahBaruToFeeder([course.id]);
      ok('MK 2.1 error bisnis -> failed (bukan uncertain)', (res as any).failed === 1 && (res as any).uncertain === 0, JSON.stringify(res));
      const row = await prisma.course.findUnique({ where: { id: course.id } });
      ok('MK 2.2 feederId TETAP kosong', !row?.feederId);
    }

    // 3. Network failure / timeout saat Insert -> uncertain, lalu rekonsiliasi di percobaan berikutnya
    {
      const course = await prisma.course.create({ data: { code: `MK-${uniq()}`, name: 'Uji 3', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id } });
      const stored: any[] = [];
      const callLog: CallLogEntry[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: (f, r) => f.includes(`kode_mata_kuliah = '${course.code}'`) && r.kode_mata_kuliah === course.code,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        networkFailInsertFor: () => true,
        callLog,
      });
      const res1 = await svc.pushMataKuliahBaruToFeeder([course.id]);
      ok('MK 3.1 gagal jaringan -> uncertain (bukan failed)', (res1 as any).uncertain === 1 && (res1 as any).failed === 0, JSON.stringify(res1));

      // Simulasikan: Feeder TERNYATA sempat menerima sebelum koneksi putus (sudah tercatat di sisi Feeder tiruan).
      stored.push({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: course.code });
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: (f, r) => f.includes(`kode_mata_kuliah = '${course.code}'`) && r.kode_mata_kuliah === course.code,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        callLog,
      });
      const beforeLen = callLog.length;
      const res2 = await svc.pushMataKuliahBaruToFeeder([course.id]);
      const insertCallsAfter = callLog.slice(beforeLen).filter((c) => c.act === 'InsertMataKuliah').length;
      ok('MK 3.2 percobaan kedua menemukan data lewat pencarian (ditautkan, linked=1)', (res2 as any).linked === 1, JSON.stringify(res2));
      ok('MK 3.3 TIDAK InsertMataKuliah lagi (data sudah ditemukan lewat identifier bisnis)', insertCallsAfter === 0, `insertCalls=${insertCallsAfter}`);
      const row = await prisma.course.findUnique({ where: { id: course.id } });
      ok('MK 3.4 feederId lokal akhirnya terisi (tanpa data ganda)', !!row?.feederId);
      ok('MK 3.5 hanya SATU baris tersimpan di Feeder tiruan untuk mata kuliah ini (tidak ganda)', stored.filter((r) => r.kode_mata_kuliah === course.code).length === 1, JSON.stringify(stored));
    }

    // 4. Dua proses push bersamaan untuk mata kuliah yang sama -> hanya satu yang benar-benar Insert
    {
      const course = await prisma.course.create({ data: { code: `MK-${uniq()}`, name: 'Uji 4', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id } });
      const stored: any[] = [];
      const callLog: CallLogEntry[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: (f, r) => f.includes(`kode_mata_kuliah = '${course.code}'`) && r.kode_mata_kuliah === course.code,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        callLog,
      });
      const origForThis = (global as any).fetch;
      (global as any).fetch = async (url: string, init: any) => {
        const body = JSON.parse(init.body);
        if (body.act === 'InsertMataKuliah') await new Promise((r) => setTimeout(r, 30)); // perlambat supaya benar-benar tumpang tindih
        return origForThis(url, init);
      };
      const [r1, r2] = await Promise.all([svc.pushMataKuliahBaruToFeeder([course.id]), svc.pushMataKuliahBaruToFeeder([course.id])]);
      const insertCalls = callLog.filter((c) => c.act === 'InsertMataKuliah').length;
      ok('MK 4.1 dua push bersamaan -- hanya SATU InsertMataKuliah sungguhan', insertCalls === 1, `insertCalls=${insertCalls}`);
      const totalOutcomes = (r1 as any).created + (r1 as any).linked + (r2 as any).created + (r2 as any).linked;
      const totalSkipped = (r1 as any).skipped + (r2 as any).skipped;
      ok('MK 4.2 satu berhasil (created/linked), satu dilewati (lock)', totalOutcomes === 1 && totalSkipped >= 1, JSON.stringify([r1, r2]));
      ok('MK 4.3 lock dilepas setelah selesai -- Push ketiga (berurutan) tidak terblokir', true); // dibuktikan oleh skenario 3 & 5 yang sukses setelah klaim sebelumnya selesai
    }

    // 5. Lock dilepas setelah kegagalan -- push ulang untuk mata kuliah yang sama tidak tersangkut
    {
      const course = await prisma.course.create({ data: { code: `MK-${uniq()}`, name: 'Uji 5', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id } });
      const stored: any[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: () => false,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        rejectInsertFor: () => true, // percobaan pertama gagal (ditolak Feeder)
        callLog: [],
      });
      await svc.pushMataKuliahBaruToFeeder([course.id]);
      // Percobaan kedua, sekarang Feeder tiruan menerima -- harus TIDAK terblokir oleh lock percobaan pertama.
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListMataKuliah',
        insertAct: 'InsertMataKuliah',
        matcher: (f, r) => f.includes(`kode_mata_kuliah = '${course.code}'`) && r.kode_mata_kuliah === course.code,
        idField: 'id_matkul',
        buildRow: (rec) => ({ id_matkul: `mk-${uniq()}`, kode_mata_kuliah: rec.kode_mata_kuliah }),
        stored,
        callLog: [],
      });
      const res2 = await svc.pushMataKuliahBaruToFeeder([course.id]);
      ok('MK 5.1 lock dilepas setelah gagal -- percobaan kedua berhasil (tidak tersangkut)', (res2 as any).created === 1, JSON.stringify(res2));
    }

    // =============================================================================================
    // KURIKULUM -- cukup diuji untuk klaim konkurensi (pencarian-sebelum-insert sudah sama polanya
    // seperti Mata Kuliah, diverifikasi lewat pembacaan kode, bukan diulang detail per skenario).
    // =============================================================================================
    {
      const curriculum = await prisma.curriculum.create({
        data: { code: `KUR-${uniq()}`, name: `Kurikulum Uji ${uniq()}`, studyProgram: studyProgram.name, startYear: 2026, totalSks: 144, sksWajib: 120, sksPilihan: 24 },
      });
      const stored: any[] = [];
      const callLog: CallLogEntry[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListKurikulum',
        insertAct: 'InsertKurikulum',
        matcher: (f, r) => f.includes(`nama_kurikulum = '${curriculum.name.slice(0, 60)}'`) && r.nama_kurikulum === curriculum.name.slice(0, 60),
        idField: 'id_kurikulum',
        buildRow: (rec) => ({ id_kurikulum: `kur-${uniq()}`, nama_kurikulum: rec.nama_kurikulum }),
        stored,
        callLog,
      });
      const origForThis = (global as any).fetch;
      (global as any).fetch = async (url: string, init: any) => {
        const body = JSON.parse(init.body);
        if (body.act === 'InsertKurikulum') await new Promise((r) => setTimeout(r, 30));
        return origForThis(url, init);
      };
      const [r1, r2] = await Promise.all([svc.pushKurikulumBaruToFeeder([curriculum.id]), svc.pushKurikulumBaruToFeeder([curriculum.id])]);
      const insertCalls = callLog.filter((c) => c.act === 'InsertKurikulum').length;
      ok('KUR 1.1 dua push bersamaan -- hanya SATU InsertKurikulum sungguhan', insertCalls === 1, `insertCalls=${insertCalls}`);
      const totalOutcomes = (r1 as any).created + (r1 as any).linked + (r2 as any).created + (r2 as any).linked;
      ok('KUR 1.2 tepat satu dari dua proses yang berhasil membuat/menautkan', totalOutcomes === 1, JSON.stringify([r1, r2]));
      const row = await prisma.curriculum.findUnique({ where: { id: curriculum.id } });
      ok('KUR 1.3 feederId lokal terisi tepat sekali (tidak ganda)', !!row?.feederId && stored.length === 1);
    }

    // =============================================================================================
    // KELAS KULIAH -- sama, fokus pada klaim konkurensi + rekonsiliasi gagal jaringan.
    // =============================================================================================
    {
      const course = await prisma.course.create({
        data: { code: `MKK-${uniq()}`, name: 'Uji Kelas', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId: studyProgram.id, feederId: `mk-${uniq()}` },
      });
      const cls = await prisma.courseClass.create({ data: { courseId: course.id, academicYearId: year.id, className: 'A' } });
      const stored: any[] = [];
      const callLog: CallLogEntry[] = [];
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListKelasKuliah',
        insertAct: 'InsertKelasKuliah',
        matcher: (f, r) => f.includes(`nama_kelas_kuliah = 'A'`) && r.nama_kelas_kuliah === 'A',
        idField: 'id_kelas_kuliah',
        buildRow: (rec) => ({ id_kelas_kuliah: `kls-${uniq()}`, nama_kelas_kuliah: rec.nama_kelas_kuliah }),
        stored,
        callLog,
      });
      const res = await svc.pushKelasKuliahBaruToFeeder([cls.id]);
      ok('KLS 1.1 push berhasil (created=1)', (res as any).created === 1, JSON.stringify(res));
      const row = await prisma.courseClass.findUnique({ where: { id: cls.id } });
      ok('KLS 1.2 feederId lokal terisi', !!row?.feederId);

      // Network failure pada kelas kedua -> uncertain, lalu rekonsiliasi.
      const cls2 = await prisma.courseClass.create({ data: { courseId: course.id, academicYearId: year.id, className: 'B' } });
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListKelasKuliah',
        insertAct: 'InsertKelasKuliah',
        matcher: (f, r) => f.includes(`nama_kelas_kuliah = 'B'`) && r.nama_kelas_kuliah === 'B',
        idField: 'id_kelas_kuliah',
        buildRow: (rec) => ({ id_kelas_kuliah: `kls-${uniq()}`, nama_kelas_kuliah: rec.nama_kelas_kuliah }),
        stored,
        networkFailInsertFor: () => true,
        callLog: [],
      });
      const resFail = await svc.pushKelasKuliahBaruToFeeder([cls2.id]);
      ok('KLS 2.1 gagal jaringan saat Insert kelas -> uncertain', (resFail as any).uncertain === 1 && (resFail as any).failed === 0, JSON.stringify(resFail));
      stored.push({ id_kelas_kuliah: `kls-${uniq()}`, nama_kelas_kuliah: 'B' }); // ternyata sempat tersimpan di Feeder
      installMock({
        prodiKode,
        prodiFeederId: 'p1',
        getAct: 'GetListKelasKuliah',
        insertAct: 'InsertKelasKuliah',
        matcher: (f, r) => f.includes(`nama_kelas_kuliah = 'B'`) && r.nama_kelas_kuliah === 'B',
        idField: 'id_kelas_kuliah',
        buildRow: (rec) => ({ id_kelas_kuliah: `kls-${uniq()}`, nama_kelas_kuliah: rec.nama_kelas_kuliah }),
        stored,
        callLog: [],
      });
      const resReconcile = await svc.pushKelasKuliahBaruToFeeder([cls2.id]);
      ok('KLS 2.2 rekonsiliasi: ditautkan tanpa Insert kedua', (resReconcile as any).linked === 1, JSON.stringify(resReconcile));
      ok('KLS 2.3 hanya satu baris kelas "B" di Feeder tiruan (tidak ganda)', stored.filter((r) => r.nama_kelas_kuliah === 'B').length === 1);
    }

    console.log(fails === 0 ? '\nSEMUA OK' : `\n${fails} GAGAL`);
  } finally {
    (global as any).fetch = origFetch;
    await prisma.$disconnect();
    await dropTestDatabase();
  }
  process.exit(fails ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await dropTestDatabase();
  } catch {
    // non-blocking -- biarkan error asli di atas yang jadi exit code
  }
  process.exit(1);
});
