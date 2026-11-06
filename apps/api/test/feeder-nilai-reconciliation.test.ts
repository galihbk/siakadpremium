/**
 * Test permanen untuk integrasi `runFeederSync()` ke `pushNilaiToFeeder()` (Fase 1 hardening Feeder --
 * lihat FEEDER_PHASE_1_IMPLEMENTATION_REPORT.md). Mencakup pengiriman berhasil, penolakan bisnis Feeder,
 * kegagalan jaringan/status tidak pasti, rekonsiliasi, konkurensi, dan filter FINAL/duplikasi.
 *
 * Dijalankan terhadap database Postgres SEMENTARA yang dibuat khusus untuk test ini (disalin dari
 * `siakad_premium` lalu dihapus di akhir) -- TIDAK PERNAH memakai database development atau produksi.
 * `global.fetch` di-mock seluruhnya; TIDAK ADA permintaan jaringan sungguhan ke server Feeder mana pun.
 *
 * Jalankan: pnpm --filter @siakad/api test:feeder-nilai
 * (lihat script di apps/api/package.json -- memanggil ts-node langsung, tidak ada framework test baru
 * ditambahkan ke repo ini karena belum ada satu pun sebelumnya; lihat FEEDER_PHASE_1_IMPLEMENTATION_REPORT.md).
 */
import { PrismaClient } from '@siakad/database';
import { IntegrationSettingsService } from '../src/modules/integration-settings/integration-settings.service';

const ADMIN_DB_URL = process.env.TEST_ADMIN_DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5434/postgres?schema=public';
const TEMPLATE_DB = process.env.TEST_TEMPLATE_DATABASE || 'siakad_premium';
const TEST_DB_NAME = `feeder_nilai_test_${Date.now()}`;
const TEST_DB_URL = ADMIN_DB_URL.replace(/\/postgres(\?|$)/, `/${TEST_DB_NAME}$1`);

let fails = 0;
const ok = (label: string, cond: boolean, extra = '') => {
  if (!cond) fails++;
  console.log(cond ? 'OK  ' : 'FAIL', label, extra);
};
const rejects = async (label: string, fn: () => Promise<unknown>, re: RegExp) => {
  try {
    await fn();
    ok(label, false, 'tidak ditolak');
  } catch (e: any) {
    ok(label, re.test(String(e?.message ?? e)), String(e?.message ?? e));
  }
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

/** Satu baris mentah dari `GetDetailNilaiPerkuliahanKelas`, dipakai mock Feeder & langkah rekonsiliasi. */
type FakeFeederRow = { id_kelas_kuliah: string; id_registrasi_mahasiswa: string; nilai_huruf: string };

/**
 * Mock Feeder minimal: GetToken selalu sukses; GetDetailNilaiPerkuliahanKelas membaca dari `stored`
 * (nilai yang "sudah tersimpan" di Feeder tiruan ini); UpdateNilaiPerkuliahanKelas menulis ke `stored`
 * KECUALI utk id yang ada di `rejectUpdateFor` (disimulasikan sebagai penolakan bisnis) atau
 * `networkFailFor` (disimulasikan sebagai kegagalan jaringan -- fetch() melempar sebelum ada balasan).
 */
function installFeederMock(opts: {
  stored: Map<string, FakeFeederRow>;
  rejectUpdateFor?: Set<string>;
  networkFailFor?: Set<string>;
  callLog: { act: string; key?: any }[];
}) {
  const { stored, rejectUpdateFor = new Set(), networkFailFor = new Set(), callLog } = opts;
  (global as any).fetch = async (_url: string, init: any) => {
    const body = JSON.parse(init.body);
    callLog.push({ act: body.act, key: body.key });
    if (body.act === 'GetToken') {
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: { token: 'tok-test' } }) };
    }
    if (body.act === 'GetDetailNilaiPerkuliahanKelas') {
      const m = /id_kelas_kuliah = '([^']+)' and id_registrasi_mahasiswa = '([^']+)'/.exec(body.filter || '');
      const key = m ? `${m[1]}::${m[2]}` : '';
      const row = stored.get(key);
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: row ? [row] : [] }) };
    }
    if (body.act === 'UpdateNilaiPerkuliahanKelas') {
      const key = `${body.key.id_kelas_kuliah}::${body.key.id_registrasi_mahasiswa}`;
      if (networkFailFor.has(key)) {
        throw new TypeError('fetch failed'); // kegagalan jaringan -- TIDAK ADA balasan Feeder sama sekali
      }
      if (rejectUpdateFor.has(key)) {
        return { status: 200, text: async () => JSON.stringify({ error_code: 1178, error_desc: 'Data Nilai Perkuliahan Kelas tidak ditemukan' }) };
      }
      stored.set(key, { id_kelas_kuliah: body.key.id_kelas_kuliah, id_registrasi_mahasiswa: body.key.id_registrasi_mahasiswa, nilai_huruf: body.record.nilai_huruf });
      return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: {} }) };
    }
    throw new Error(`act tak terduga di mock: ${body.act}`);
  };
}

async function main(): Promise<void> {
  await createTestDatabase();
  const prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
  // `IntegrationSettingsService` meminta tipe `PrismaService` (subclass NestJS dari `PrismaClient`), tapi
  // hanya memakai method `PrismaClient` biasa -- aman memakai klien polos di sini tanpa bootstrap Nest.
  const svc = new IntegrationSettingsService(prisma as unknown as import('../src/shared/prisma/prisma.service').PrismaService);
  const origFetch = (global as any).fetch;

  try {
    await prisma.pddiktiSetting.upsert({
      where: { id: 'default-pddikti-setting' },
      update: { baseUrl: 'http://fake-feeder.test/ws/live2.php', username: 'u', password: 'p', isActive: true },
      create: { id: 'default-pddikti-setting', baseUrl: 'http://fake-feeder.test/ws/live2.php', username: 'u', password: 'p', isActive: true },
    });

    const year = await prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!year) throw new Error('Tidak ada tahun akademik aktif di template -- tidak bisa menyiapkan data uji.');
    const course = await prisma.course.findFirst();
    const studyProgramId = course?.studyProgramId ?? (await prisma.studyProgram.findFirstOrThrow()).id;
    const localCourse = await prisma.course.create({
      data: { code: `NT-${Date.now()}`, name: 'MK Uji Nilai', sksTeori: 3, sksPraktik: 0, totalSks: 3, sks: 3, studyProgramId },
    });

    /** Membuat satu KRS siap-push-nilai: kelas & mahasiswa sudah tertaut Feeder, KRS sudah tersinkron. */
    const makeEnrollment = async (opts: {
      gradeStatus?: string;
      gradeLetter?: string | null;
      feederGradeSyncedAt?: Date | null;
      classFeederId?: string;
      studentRegId?: string;
    }) => {
      const cls = await prisma.courseClass.create({
        data: {
          courseId: localCourse.id,
          academicYearId: year.id,
          className: `K-${Math.random().toString(36).slice(2, 10)}`,
          feederId: opts.classFeederId ?? `kls-${Math.random().toString(36).slice(2)}`,
        },
      });
      const user = await prisma.user.create({ data: { email: `nilai-${Math.random().toString(36).slice(2)}@test.local`, passwordHash: 'x', fullName: 'Mhs Uji', role: 'STUDENT' } });
      const student = await prisma.student.create({
        data: { userId: user.id, studyProgramId, nim: `NT${Date.now()}${Math.floor(Math.random() * 10000)}`, entryYear: 2026, feederRegistrationId: opts.studentRegId ?? `reg-${Math.random().toString(36).slice(2)}` },
      });
      const enrollment = await prisma.courseEnrollment.create({
        data: {
          studentId: student.id,
          courseId: localCourse.id,
          academicYearId: year.id,
          courseClassId: cls.id,
          status: 'APPROVED',
          gradeStatus: opts.gradeStatus ?? 'FINAL',
          gradeLetter: opts.gradeLetter === undefined ? 'A' : opts.gradeLetter,
          totalScore: 88,
          gradePoint: 4,
          feederSyncedAt: new Date(),
          feederGradeSyncedAt: opts.feederGradeSyncedAt ?? null,
        },
      });
      return { enrollment, classFeederId: cls.feederId!, studentRegId: student.feederRegistrationId! };
    };

    // ===================== 1. Pengiriman nilai berhasil =====================
    {
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, callLog });
      const { enrollment } = await makeEnrollment({});
      const res = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('1.1 push sukses melaporkan 1 terkirim', (res as any).created === 1 && (res as any).failed === 0, JSON.stringify(res));
      const row = await prisma.courseEnrollment.findUnique({ where: { id: enrollment.id } });
      ok('1.2 feederGradeSyncedAt terisi', row?.feederGradeSyncedAt != null);
      const log = await prisma.feederSyncLog.findFirst({ where: { entity: 'CourseEnrollment', localId: enrollment.id }, orderBy: { startedAt: 'desc' } });
      ok('1.3 FeederSyncLog SUCCESS tercatat (bukan dari HTTP 200 semata, tapi error_code=0)', log?.status === 'SUCCESS', JSON.stringify(log));
    }

    // ===================== 2. Feeder mengembalikan error bisnis =====================
    {
      const { enrollment, classFeederId, studentRegId } = await makeEnrollment({});
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, rejectUpdateFor: new Set([`${classFeederId}::${studentRegId}`]), callLog });
      const res = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('2.1 push gagal dilaporkan sebagai failed (bukan uncertain)', (res as any).failed === 1 && (res as any).uncertain === 0, JSON.stringify(res));
      const row = await prisma.courseEnrollment.findUnique({ where: { id: enrollment.id } });
      ok('2.2 feederGradeSyncedAt TETAP kosong (tidak ditandai sukses)', row?.feederGradeSyncedAt == null);
      const log = await prisma.feederSyncLog.findFirst({ where: { entity: 'CourseEnrollment', localId: enrollment.id }, orderBy: { startedAt: 'desc' } });
      ok('2.3 FeederSyncLog FAILED tercatat', log?.status === 'FAILED', JSON.stringify(log));
    }

    // ===================== 3 & 6. Kegagalan jaringan -> status tidak pasti -> rekonsiliasi =====================
    {
      const { enrollment, classFeederId, studentRegId } = await makeEnrollment({});
      const key = `${classFeederId}::${studentRegId}`;
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, networkFailFor: new Set([key]), callLog });

      const res1 = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('3.1 kegagalan jaringan dilaporkan sebagai uncertain, BUKAN failed', (res1 as any).uncertain === 1 && (res1 as any).failed === 0, JSON.stringify(res1));
      let row = await prisma.courseEnrollment.findUnique({ where: { id: enrollment.id } });
      ok('3.2 feederGradeSyncedAt tetap kosong setelah gagal jaringan', row?.feederGradeSyncedAt == null);
      let log = await prisma.feederSyncLog.findFirst({ where: { entity: 'CourseEnrollment', localId: enrollment.id }, orderBy: { startedAt: 'desc' } });
      ok('3.3 FeederSyncLog berstatus PENDING (status tidak pasti), bukan FAILED', log?.status === 'PENDING', JSON.stringify(log));

      // Skenario A: ternyata Feeder SEMPAT menerima sebelum koneksi putus (ditemukan lewat rekonsiliasi).
      stored.set(key, { id_kelas_kuliah: classFeederId, id_registrasi_mahasiswa: studentRegId, nilai_huruf: 'A' });
      const callLogBefore = callLog.length;
      const res2 = await svc.pushNilaiToFeeder([enrollment.id]);
      const reconcileCalls = callLog.slice(callLogBefore).filter((c) => c.act === 'GetDetailNilaiPerkuliahanKelas').length;
      const updateCallsAfterReconcile = callLog.slice(callLogBefore).filter((c) => c.act === 'UpdateNilaiPerkuliahanKelas').length;
      ok('6.1 percobaan berikutnya mengecek ke Feeder dulu (rekonsiliasi), bukan langsung kirim lagi', reconcileCalls === 1, `reconcileCalls=${reconcileCalls}`);
      ok('6.2 karena sudah cocok, TIDAK mengirim UpdateNilaiPerkuliahanKelas lagi', updateCallsAfterReconcile === 0, `updateCalls=${updateCallsAfterReconcile}`);
      ok('6.3 hasil rekonsiliasi dihitung sebagai berhasil', (res2 as any).created === 1, JSON.stringify(res2));
      row = await prisma.courseEnrollment.findUnique({ where: { id: enrollment.id } });
      ok('6.4 feederGradeSyncedAt terisi setelah rekonsiliasi', row?.feederGradeSyncedAt != null);
      log = await prisma.feederSyncLog.findFirst({ where: { entity: 'CourseEnrollment', localId: enrollment.id }, orderBy: { startedAt: 'desc' } });
      ok('6.5 percobaan rekonsiliasi tercatat SUCCESS', log?.status === 'SUCCESS', JSON.stringify(log));
    }

    // ===================== 4. Timeout (AbortError) diperlakukan sama seperti gagal jaringan =====================
    {
      const { enrollment, classFeederId, studentRegId } = await makeEnrollment({});
      const stored = new Map<string, FakeFeederRow>();
      (global as any).fetch = async (_url: string, init: any) => {
        const body = JSON.parse(init.body);
        if (body.act === 'GetToken') return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: { token: 'tok-test' } }) };
        if (body.act === 'UpdateNilaiPerkuliahanKelas') {
          const e = new Error('The operation was aborted');
          e.name = 'AbortError';
          throw e;
        }
        return { status: 200, text: async () => JSON.stringify({ error_code: 0, data: [] }) };
      };
      const res = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('4.1 timeout (AbortError) tercatat sebagai uncertain, bukan failed', (res as any).uncertain === 1 && (res as any).failed === 0, JSON.stringify(res));
      void classFeederId; void studentRegId;
    }

    // ===================== 7. Dua proses mengirim nilai yang sama secara bersamaan =====================
    {
      const { enrollment } = await makeEnrollment({});
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      let updateCalls = 0;
      installFeederMock({ stored, callLog });
      const origFetchForThis = (global as any).fetch;
      (global as any).fetch = async (url: string, init: any) => {
        const body = JSON.parse(init.body);
        if (body.act === 'UpdateNilaiPerkuliahanKelas') {
          updateCalls += 1;
          await new Promise((r) => setTimeout(r, 30)); // perlambat supaya kedua proses benar-benar tumpang tindih
        }
        return origFetchForThis(url, init);
      };
      const [r1, r2] = await Promise.all([svc.pushNilaiToFeeder([enrollment.id]), svc.pushNilaiToFeeder([enrollment.id])]);
      const totalCreated = (r1 as any).created + (r2 as any).created;
      const totalSkipped = (r1 as any).skipped + (r2 as any).skipped;
      ok('7.1 dua push bersamaan untuk KRS yang sama -- hanya SATU yang benar-benar mengirim ke Feeder', updateCalls === 1, `updateCalls=${updateCalls}`);
      ok('7.2 satu proses berhasil, satu dilewati (bukan dua-duanya berhasil / dua-duanya gagal)', totalCreated === 1 && totalSkipped === 1, JSON.stringify([r1, r2]));
    }

    // ===================== 8. Nilai DRAFT tidak pernah dikirim =====================
    {
      const { enrollment, classFeederId, studentRegId } = await makeEnrollment({ gradeStatus: 'DRAFT' });
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, callLog });
      const res = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('8.1 enrollment DRAFT tidak diproses sama sekali (processed=0)', (res as any).processed === 0, JSON.stringify(res));
      const updateCalls = callLog.filter((c) => c.act === 'UpdateNilaiPerkuliahanKelas').length;
      ok('8.2 tidak ada panggilan UpdateNilaiPerkuliahanKelas untuk nilai DRAFT', updateCalls === 0, `updateCalls=${updateCalls}`);
      void classFeederId; void studentRegId; void enrollment;
    }

    // ===================== 9. Nilai FINAL yang sudah terkirim tidak dikirim ulang =====================
    {
      const { enrollment } = await makeEnrollment({ feederGradeSyncedAt: new Date() });
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, callLog });
      const res = await svc.pushNilaiToFeeder([enrollment.id]);
      ok('9.1 enrollment yang sudah feederGradeSyncedAt tidak diproses lagi (processed=0)', (res as any).processed === 0, JSON.stringify(res));
      const updateCalls = callLog.filter((c) => c.act === 'UpdateNilaiPerkuliahanKelas').length;
      ok('9.2 tidak ada panggilan UpdateNilaiPerkuliahanKelas untuk nilai yang sudah terkirim', updateCalls === 0, `updateCalls=${updateCalls}`);
    }

    // ===================== 5. Feeder sukses tetapi penyimpanan lokal gagal (rekonsiliasi) =====================
    {
      const { enrollment } = await makeEnrollment({});
      const stored = new Map<string, FakeFeederRow>();
      const callLog: { act: string }[] = [];
      installFeederMock({ stored, callLog });
      const originalUpdate = prisma.courseEnrollment.update.bind(prisma.courseEnrollment);
      (prisma.courseEnrollment as any).update = async (args: any) => {
        if (args?.where?.id === enrollment.id && args?.data?.feederGradeSyncedAt) {
          throw new Error('Simulasi: koneksi database lokal terputus tepat setelah Feeder mengonfirmasi.');
        }
        return originalUpdate(args);
      };
      await rejects(
        '5.1 kegagalan simpan lokal SETELAH Feeder konfirmasi tetap dilaporkan sebagai error ke pemanggil',
        () =>
          (svc as any).runFeederSync(
            { entity: 'CourseEnrollment', localId: enrollment.id, operation: 'UPDATE', act: 'UpdateNilaiPerkuliahanKelas' } as any,
            async (markSynced: (d?: string) => void) => {
              const { errorCode } = await (svc as any).callFeeder('http://fake-feeder.test/ws/live2.php', {
                act: 'UpdateNilaiPerkuliahanKelas',
                token: 'tok-test',
                key: { id_registrasi_mahasiswa: 'x', id_kelas_kuliah: 'y' },
                record: { nilai_huruf: 'A' },
              });
              if (errorCode !== '0') throw new Error('tidak terduga');
              markSynced('nilai_huruf=A');
              await prisma.courseEnrollment.update({ where: { id: enrollment.id }, data: { feederGradeSyncedAt: new Date() } });
            },
          ),
        /koneksi database lokal terputus/,
      );
      (prisma.courseEnrollment as any).update = originalUpdate;
      const log = await prisma.feederSyncLog.findFirst({ where: { entity: 'CourseEnrollment', localId: enrollment.id }, orderBy: { startedAt: 'desc' } });
      ok('5.2 TETAP tercatat SUCCESS (Feeder sudah terima), bukan FAILED -- supaya tidak dikirim ulang dan menduplikasi', log?.status === 'SUCCESS', JSON.stringify(log));
      ok('5.3 ditandai perlu rekonsiliasi manual di responseSummary', (log?.responseSummary || '').includes('NEEDS_RECONCILIATION'), log?.responseSummary ?? '');
      const row = await prisma.courseEnrollment.findUnique({ where: { id: enrollment.id } });
      ok('5.4 feederGradeSyncedAt lokal TETAP kosong (baris inilah yang perlu ditinjau admin secara manual)', row?.feederGradeSyncedAt == null);
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
