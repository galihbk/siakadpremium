import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateBankSettingDto } from './dto/update-bank-setting.dto';
import { UpdatePddiktiSettingDto } from './dto/update-pddikti-setting.dto';

const BANK_SETTING_ID = 'default-bank-setting';
const PDDIKTI_SETTING_ID = 'default-pddikti-setting';

export interface RemoteMahasiswaItem {
  feederId?: string; // id_mahasiswa dari Feeder -- kunci paling stabil untuk re-sync
  feederRegistrationId?: string; // id_registrasi_mahasiswa -- menandakan sudah terdaftar penuh di Feeder
  nim?: string;
  nik?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string; // ISO date string
  entryYear?: number;
  // Dihitung dari GetAktivitasKuliahMahasiswa -- jumlah semester berstatus "Aktif" (bukan
  // Cuti) yang pernah dilalui mahasiswa ini, dipakai sebagai Student.currentSemester.
  // Opsional karena GetAktivitasKuliahMahasiswa gagal ditarik secara non-blocking tidak
  // boleh menggagalkan seluruh Pull Mahasiswa -- kalau kosong, currentSemester lokal
  // dibiarkan apa adanya (tidak ditimpa dengan tebakan).
  currentSemester?: number;
  status?: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  email?: string;
  phone?: string;
  religion?: string;
  address?: string;
  kecamatan?: string;
  postalCode?: string;
  motherName?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherJob?: string;
  fatherIncome?: string;
  motherPhone?: string;
  motherJob?: string;
  motherIncome?: string;
  // Home-base prodi versi Feeder -- dicocokkan ke StudyProgram lokal lewat code/diktiCode,
  // sama seperti alur dosen. Kalau tidak cocok, admin pilih manual di frontend.
  prodiCode?: string;
  studyProgramId?: string;
  raw?: Record<string, any>;
}

export interface RemoteDosenItem {
  // Dosen bisa cuma punya NIDN, cuma NUPTK, atau dua-duanya (terkonfirmasi dari Neo
  // Feeder sungguhan) -- jadi keduanya opsional di sini, tapi minimal salah satu wajib
  // terisi supaya ada identitas untuk pencocokan/pembuatan data lokal.
  feederId?: string; // id_dosen dari Feeder -- kunci paling stabil untuk re-sync
  nidn?: string;
  nuptk?: string;
  nip?: string;
  nidk?: string;
  nik?: string;
  npwp?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string; // ISO date string, atau undefined kalau Feeder tidak kirim
  phone?: string;
  officePhone?: string;
  email?: string;
  religion?: string;
  motherName?: string;
  maritalStatus?: string;
  spouseName?: string;
  spouseNip?: string;
  spouseOccupation?: string;
  address?: string;
  dusun?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  postalCode?: string;
  functionalPosition?: string;
  employmentStatus?: string;
  lastEducation?: string;
  sdmType?: string;
  rankGroup?: string;
  salarySource?: string;
  skNumber?: string;
  skDate?: string;
  appointingInstitution?: string;
  // Home-base prodi versi Feeder -- dipakai untuk mencocokkan ke StudyProgram lokal
  // (lewat code ATAU diktiCode). Kalau tidak cocok, admin wajib pilih manual di frontend,
  // sama seperti alur sinkronisasi Prodi.
  prodiCode?: string;
  studyProgramId?: string;
  // Field mentah lengkap apa adanya dari Feeder, tidak dibuang -- supaya tidak ada data
  // yang hilang diam-diam kalau ada field Feeder yang belum kepetakan di atas.
  raw?: Record<string, any>;
}

export interface RemoteProdiItem {
  code: string;
  diktiCode?: string;
  name: string;
  degreeLevel?: string;
  facultyCode?: string;
  facultyName?: string;
  accreditation?: string;
  /**
   * Fakultas TIDAK pernah dikirim oleh Neo Feeder -- PDDIKTI secara nasional tidak
   * punya entitas "Fakultas" sama sekali, hanya Program Studi langsung di bawah
   * Perguruan Tinggi. Jadi `facultyId` di sini selalu dipilih manual oleh admin di
   * frontend sebelum item dikirim ke endpoint sync, bukan hasil tebakan sistem.
   */
  facultyId?: string;
}

export interface RemoteCourseItem {
  feederId?: string;
  // id_kurikulum dari GetMatkulKurikulum -- dipakai sync untuk mengaitkan mata kuliah ini
  // ke baris Curriculum lokal (lewat Curriculum.feederId), BUKAN ditebak dari nama/prodi.
  kurikulumFeederId?: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCurriculumItem {
  feederId?: string;
  name: string;
  startYear?: number;
  totalSks?: number;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCourseClassItem {
  feederId?: string; // id_kelas_kuliah dari Feeder -- kunci paling stabil untuk re-sync
  className: string; // nama_kelas_kuliah
  courseFeederId?: string; // id_matkul -- dicocokkan ke Course lokal lewat Course.feederId
  courseCode?: string; // ditampilkan di frontend saja, hasil lookup Course lokal
  courseName?: string; // ditampilkan di frontend saja, hasil lookup Course lokal
  academicYearCode?: string; // id_semester Feeder -- formatnya sama dengan AcademicYear.code (mis. "20261")
  sks?: number;
  studentCount?: number; // jumlah_mahasiswa dari Feeder -- info jumlah peserta saat ini, BUKAN kuota (quota tetap pakai nilai lokal)
  prodiCode?: string;
  lecturerFeederId?: string; // id_dosen pengampu pertama (GetDosenPengajarKelasKuliah) -- CourseClass cuma 1 dosen, first-wins kalau lebih dari satu
  lecturerNidn?: string;
  lecturerName?: string; // nama_dosen, ditampilkan di frontend saja
}

export interface RemoteAcademicYearItem {
  code: string; // id_semester dari Feeder -- dipakai LANGSUNG sebagai AcademicYear.code lokal (formatnya sama, mis. "20261"), bukan field terpisah
  name: string; // mis. "2026/2027"
  semesterType: 'ODD' | 'EVEN' | 'SHORT';
  startDate: string; // ISO date
  endDate: string; // ISO date
  isActiveAtFeeder?: boolean; // a_periode_aktif dari Feeder -- cuma info, TIDAK dipakai menimpa status aktif sistem lokal
}

export interface RemoteEnrollmentItem {
  classFeederId: string; // id_kelas_kuliah -- dicocokkan ke CourseClass lokal lewat feederId (juga menurunkan courseId & academicYearId-nya)
  className?: string; // ditampilkan di frontend saja
  studentFeederId?: string; // id_mahasiswa -- dicocokkan ke Student lokal lewat feederId
  nim?: string; // fallback pencocokan kalau studentFeederId tidak ketemu
  studentName?: string; // ditampilkan di frontend saja
  courseCode?: string; // ditampilkan di frontend saja
  courseName?: string; // ditampilkan di frontend saja
  prodiCode?: string;
}

export interface RemoteGradeScaleItem {
  prodiName: string; // nama_program_studi -- GetListSkalaNilaiProdi itu per-prodi, bukan global, jadi dikelompokkan di frontend untuk dipilih admin
  letter: string; // nilai_huruf
  minScore: number; // bobot_nilai_min
  maxScore: number; // bobot_nilai_maks
  gradePoint: number; // nilai_indeks
}

export interface NilaiSyncJobStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  totalClasses: number;
  processedClasses: number;
  updatedGrades: number;
  skippedGrades: number;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  /** Tahap yang sedang berjalan (mis. "Mengambil daftar kelas dari Feeder 3/20") -- untuk ditampilkan di UI. */
  phase?: string;
}

function maskSecret(value?: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

@Injectable()
export class IntegrationSettingsService {
  constructor(private prisma: PrismaService) {}

  async getBankSetting() {
    const setting = await this.prisma.bankGatewaySetting.upsert({
      where: { id: BANK_SETTING_ID },
      update: {},
      create: { id: BANK_SETTING_ID },
    });

    return {
      ...setting,
      apiKey: maskSecret(setting.apiKey),
      apiSecret: maskSecret(setting.apiSecret),
      hasApiKey: Boolean(setting.apiKey),
      hasApiSecret: Boolean(setting.apiSecret),
    };
  }

  async updateBankSetting(dto: UpdateBankSettingDto, userId?: string) {
    const data: any = { ...dto };
    // Jangan timpa kredensial tersimpan kalau field dikirim kosong (frontend hanya isi saat mau ganti)
    if (!data.apiKey) delete data.apiKey;
    if (!data.apiSecret) delete data.apiSecret;
    if (userId) data.updatedByUserId = userId;

    await this.prisma.bankGatewaySetting.upsert({
      where: { id: BANK_SETTING_ID },
      update: data,
      create: { id: BANK_SETTING_ID, ...data },
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'BANK_SETTING_UPDATE',
          detail: 'Super Administrator memperbarui konfigurasi payment gateway bank',
        },
      });
    } catch {
      // non-blocking
    }

    return this.getBankSetting();
  }

  async getPddiktiSetting() {
    const setting = await this.prisma.pddiktiSetting.upsert({
      where: { id: PDDIKTI_SETTING_ID },
      update: {},
      create: { id: PDDIKTI_SETTING_ID },
    });

    return {
      ...setting,
      password: maskSecret(setting.password),
      secretKey: maskSecret(setting.secretKey),
      hasPassword: Boolean(setting.password),
      hasSecretKey: Boolean(setting.secretKey),
      isConnected: Boolean(setting.isActive && setting.baseUrl && setting.username && setting.password),
    };
  }

  private liveStatusCache: { result: any; expiresAt: number } | null = null;

  // Status job background Pull+Sync Nilai Perkuliahan -- disimpan di memori proses API
  // (bukan database/Redis, belum ada infrastruktur job queue di proyek ini), jadi cukup
  // untuk dicek ulang selama server API tidak restart, tapi tidak tahan reboot server.
  private nilaiSyncJob: NilaiSyncJobStatus = {
    status: 'idle',
    totalClasses: 0,
    processedClasses: 0,
    updatedGrades: 0,
    skippedGrades: 0,
  };

  /**
   * Status ringkas, TERMASUK tes koneksi sungguhan ke Feeder (bukan cuma cek kolom
   * kredensial terisi atau tidak) -- supaya badge di UI tidak bilang "terhubung" padahal
   * Feeder sebenarnya menolak login. Hasil live check di-cache 60 detik di memori supaya
   * tidak nge-hit Feeder berkali-kali kalau halaman di-reload beruntun.
   */
  async getPddiktiConnectionStatus() {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    const isConfigured = Boolean(setting?.baseUrl && setting?.username && setting?.password);
    const base = { isConfigured, isActive: Boolean(setting?.isActive), lastSyncAt: setting?.lastSyncAt ?? null };

    if (!isConfigured) {
      return { ...base, isConnected: false, connectionError: null };
    }

    if (this.liveStatusCache && this.liveStatusCache.expiresAt > Date.now()) {
      return { ...base, ...this.liveStatusCache.result };
    }

    try {
      await this.getFeederToken(setting!.baseUrl!, setting!.username!, setting!.password!, 8000);
      const result = { isConnected: true, connectionError: null };
      this.liveStatusCache = { result, expiresAt: Date.now() + 60000 };
      return { ...base, ...result };
    } catch (err: any) {
      const result = { isConnected: false, connectionError: err?.message || 'Gagal terhubung ke Feeder.' };
      this.liveStatusCache = { result, expiresAt: Date.now() + 60000 };
      return { ...base, ...result };
    }
  }

  // Rekap sinkronisasi NYATA (bukan placeholder) -- dihitung langsung dari kolom feederId per entitas,
  // dipakai halaman Status Sinkronisasi Feeder supaya BAAK tahu persis mana yang belum ter-push/pull.
  async getFeederSyncStatus() {
    const [
      lecturerTotal,
      lecturerSynced,
      studentTotal,
      studentBiodataSynced,
      studentRegistered,
      courseTotal,
      courseSynced,
      courseClassTotal,
      courseClassSynced,
      curriculumTotal,
      curriculumSynced,
    ] = await Promise.all([
      this.prisma.lecturer.count(),
      this.prisma.lecturer.count({ where: { feederId: { not: null } } }),
      this.prisma.student.count(),
      this.prisma.student.count({ where: { feederId: { not: null } } }),
      this.prisma.student.count({ where: { feederRegistrationId: { not: null } } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { feederId: { not: null } } }),
      this.prisma.courseClass.count(),
      this.prisma.courseClass.count({ where: { feederId: { not: null } } }),
      this.prisma.curriculum.count(),
      this.prisma.curriculum.count({ where: { feederId: { not: null } } }),
    ]);

    const entity = (key: string, label: string, totalLocal: number, totalSynced: number, extra?: Record<string, number>) => ({
      key,
      label,
      totalLocal,
      totalSynced,
      totalBelum: Math.max(0, totalLocal - totalSynced),
      percentage: totalLocal > 0 ? Math.round((totalSynced / totalLocal) * 1000) / 10 : 0,
      ...extra,
    });

    return [
      entity('dosen', 'Dosen', lecturerTotal, lecturerSynced),
      entity('mahasiswa', 'Mahasiswa (Biodata)', studentTotal, studentBiodataSynced, { totalTerdaftarFeeder: studentRegistered }),
      entity('mata-kuliah', 'Mata Kuliah', courseTotal, courseSynced),
      entity('kurikulum', 'Kurikulum', curriculumTotal, curriculumSynced),
      entity('kelas-kuliah', 'Kelas Kuliah', courseClassTotal, courseClassSynced),
    ];
  }

  // Daftar mahasiswa aktif yang BELUM terdaftar (registrasi) di Feeder, lengkap pesan error
  // Push terakhir kalau ada -- dipakai tab "Push" di halaman Sinkronisasi Feeder.
  async getPendingMahasiswaPush() {
    const students = await this.prisma.student.findMany({
      where: { status: 'ACTIVE', feederRegistrationId: null },
      include: { user: { select: { fullName: true } }, studyProgram: { select: { name: true } } },
      orderBy: [{ feederSyncErrorAt: 'desc' }, { createdAt: 'asc' }],
    });
    return students.map((s) => ({
      id: s.id,
      nim: s.nim,
      fullName: s.user.fullName,
      studyProgram: s.studyProgram?.name ?? null,
      hasFeederId: Boolean(s.feederId),
      lastError: s.feederSyncError,
      lastErrorAt: s.feederSyncErrorAt,
    }));
  }

  /** Normalisasi parameter tabel server-side: halaman >= 1, ukuran halaman dibatasi 10..200. */
  private normalizeTableQuery(q: { page?: string | number; pageSize?: string | number; search?: string; sortDir?: string }) {
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(String(q.pageSize ?? '50'), 10) || 50));
    const search = (q.search ?? '').toString().trim();
    const sortDir: 'asc' | 'desc' = q.sortDir === 'desc' ? 'desc' : 'asc';
    return { page, pageSize, skip: (page - 1) * pageSize, search, sortDir };
  }

  /**
   * Tabel perbandingan Mahasiswa (server-side): pencarian, urutan, dan halaman dihitung di
   * database, jadi browser cuma menerima satu halaman -- bukan seluruh ribuan mahasiswa.
   * Kolom "Feeder" = punya feederId (hasil Pull/Push, tersimpan permanen).
   */
  async getMahasiswaTable(q: { page?: string; pageSize?: string; search?: string; sortKey?: string; sortDir?: string }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const where: any = search
      ? {
          OR: [
            { nim: { contains: search, mode: 'insensitive' } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
            { studyProgram: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};
    const orderByMap: Record<string, any> = {
      nim: { nim: sortDir },
      name: { user: { fullName: sortDir } },
      studyProgram: { studyProgram: { name: sortDir } },
      entryYear: { entryYear: sortDir },
      status: { status: sortDir },
      inFeeder: { feederId: { sort: sortDir, nulls: 'last' } },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.nim, { nim: 'asc' }];

    const [total, linked, rows] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.count({ where: { ...where, feederId: { not: null } } }),
      this.prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          nim: true,
          entryYear: true,
          status: true,
          feederId: true,
          user: { select: { fullName: true } },
          studyProgram: { select: { name: true } },
        },
      }),
    ]);

    return {
      total,
      linked,
      page,
      pageSize,
      items: rows.map((s) => ({
        id: s.id,
        nim: s.nim,
        name: s.user?.fullName ?? '',
        studyProgram: s.studyProgram?.name ?? '-',
        entryYear: s.entryYear,
        status: s.status,
        hasFeederId: Boolean(s.feederId),
      })),
    };
  }

  /** Tabel perbandingan Kelas Perkuliahan (server-side). Kolom "Feeder" = punya feederId. */
  async getKelasKuliahTable(q: { page?: string; pageSize?: string; search?: string; sortKey?: string; sortDir?: string }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const where: any = search
      ? {
          OR: [
            { className: { contains: search, mode: 'insensitive' } },
            { course: { code: { contains: search, mode: 'insensitive' } } },
            { course: { name: { contains: search, mode: 'insensitive' } } },
            { academicYear: { name: { contains: search, mode: 'insensitive' } } },
            { academicYear: { code: { contains: search, mode: 'insensitive' } } },
            { lecturer: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {};
    const orderByMap: Record<string, any> = {
      className: { className: sortDir },
      courseLabel: { course: { code: sortDir } },
      academicYear: { academicYear: { code: sortDir } },
      lecturerName: { lecturer: { user: { fullName: sortDir } } },
      inFeeder: { feederId: { sort: sortDir, nulls: 'last' } },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.className, { className: 'asc' }, { id: 'asc' }];

    const [total, linked, totalAll, rows] = await Promise.all([
      this.prisma.courseClass.count({ where }),
      this.prisma.courseClass.count({ where: { ...where, feederId: { not: null } } }),
      this.prisma.courseClass.count(),
      this.prisma.courseClass.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          className: true,
          feederId: true,
          course: { select: { code: true, name: true } },
          academicYear: { select: { code: true, name: true } },
          lecturer: { select: { nidn: true, nuptk: true, user: { select: { fullName: true } } } },
        },
      }),
    ]);

    return {
      total,
      linked,
      totalAll,
      page,
      pageSize,
      items: rows.map((c) => ({
        id: c.id,
        className: c.className,
        courseLabel: c.course ? `${c.course.code} -- ${c.course.name}` : '-',
        academicYear: c.academicYear?.name || c.academicYear?.code || '-',
        lecturerName: c.lecturer?.user?.fullName
          ? `${c.lecturer.user.fullName}${c.lecturer.nidn || c.lecturer.nuptk ? ` (${c.lecturer.nidn || c.lecturer.nuptk})` : ''}`
          : '-',
        hasFeederId: Boolean(c.feederId),
      })),
    };
  }

  /**
   * Tabel riwayat pendidikan (registrasi) mahasiswa lokal yang sudah punya
   * `feederRegistrationId` -- kandidat `UpdateRiwayatPendidikanMahasiswa` (server-side).
   */
  async getRiwayatPendidikanTable(q: { page?: string; pageSize?: string; search?: string; sortKey?: string; sortDir?: string }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const base: any = { feederRegistrationId: { not: null } };
    const where: any = search
      ? {
          AND: [
            base,
            {
              OR: [
                { nim: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { studyProgram: { name: { contains: search, mode: 'insensitive' } } },
              ],
            },
          ],
        }
      : base;
    const orderByMap: Record<string, any> = {
      nim: { nim: sortDir },
      name: { user: { fullName: sortDir } },
      studyProgram: { studyProgram: { name: sortDir } },
      entryYear: { entryYear: sortDir },
      lastError: { feederSyncErrorAt: { sort: sortDir, nulls: 'last' } },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.nim, { nim: 'asc' }];

    const [total, totalAll, rows] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.count({ where: base }),
      this.prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          nim: true,
          entryYear: true,
          feederSyncError: true,
          user: { select: { fullName: true } },
          studyProgram: { select: { name: true, diktiCode: true } },
        },
      }),
    ]);

    return {
      total,
      totalAll,
      page,
      pageSize,
      items: rows.map((s) => ({
        id: s.id,
        nim: s.nim,
        name: s.user?.fullName ?? '',
        studyProgram: s.studyProgram?.name ?? '-',
        prodiCode: s.studyProgram?.diktiCode ?? '',
        entryYear: s.entryYear,
        lastError: s.feederSyncError,
      })),
    };
  }

  /** Semua id mahasiswa terdaftar di Feeder yang cocok dengan pencarian -- untuk "Bandingkan semua". */
  async getRiwayatPendidikanIds(search?: string) {
    const q = (search ?? '').trim();
    const base: any = { feederRegistrationId: { not: null } };
    const where: any = q
      ? {
          AND: [
            base,
            {
              OR: [
                { nim: { contains: q, mode: 'insensitive' } },
                { user: { fullName: { contains: q, mode: 'insensitive' } } },
                { studyProgram: { name: { contains: q, mode: 'insensitive' } } },
              ],
            },
          ],
        }
      : base;
    const rows = await this.prisma.student.findMany({ where, select: { id: true }, orderBy: { nim: 'asc' } });
    return { total: rows.length, ids: rows.map((r) => r.id) };
  }

  /** Peta kode_program_studi <-> id_prodi Feeder (dipakai perbandingan & update riwayat pendidikan). */
  private async getProdiMaps(baseUrl: string, token: string) {
    const codeToId = new Map<string, string>();
    const idToCode = new Map<string, string>();
    const { data, errorCode } = await this.callFeeder(baseUrl, { act: 'GetProdi', token });
    if (errorCode === '0' && Array.isArray(data)) {
      for (const p of data) {
        if (p?.id_prodi && p?.kode_program_studi) {
          const code = String(p.kode_program_studi).trim();
          codeToId.set(code, String(p.id_prodi));
          idToCode.set(String(p.id_prodi), code);
        }
      }
    }
    return { codeToId, idToCode };
  }

  /** Ambil baris riwayat pendidikan Feeder per mahasiswa (key id_registrasi_mahasiswa, fallback NIM). */
  private async fetchRiwayatRows(
    baseUrl: string,
    token: string,
    students: { id: string; nim: string; feederRegistrationId: string | null }[]
  ) {
    const byStudent = new Map<string, any>();

    // Tahap cepat: satu panggilan filter IN untuk seluruh batch (id registrasi). Yang tidak
    // ikut terkembalikan dicari ulang satu per satu di bawah (IN tidak selalu andal).
    const regIds = students.map((s) => s.feederRegistrationId).filter((v): v is string => Boolean(v));
    if (regIds.length > 0) {
      try {
        const idsFilter = regIds.map((i) => this.escapeFeederFilter(i)).join("', '");
        const { data, errorCode } = await this.callFeeder(
          baseUrl,
          {
            act: 'GetListRiwayatPendidikanMahasiswa',
            token,
            filter: `id_registrasi_mahasiswa IN ('${idsFilter}')`,
            limit: regIds.length + 20,
            offset: 0,
          },
          45000
        );
        if (errorCode === '0' && Array.isArray(data)) {
          const byReg = new Map<string, any>();
          for (const r of data) if (r?.id_registrasi_mahasiswa) byReg.set(String(r.id_registrasi_mahasiswa), r);
          for (const s of students) {
            const row = s.feederRegistrationId ? byReg.get(s.feederRegistrationId) : undefined;
            if (row) byStudent.set(s.id, row);
          }
        }
      } catch {
        // non-blocking -- semua dicari satu per satu di bawah
      }
    }

    const remaining = students.filter((s) => !byStudent.has(s.id));
    await this.runWithConcurrency(remaining, 5, async (s) => {
      try {
        if (s.feederRegistrationId) {
          const { data, errorCode } = await this.callFeeder(
            baseUrl,
            {
              act: 'GetListRiwayatPendidikanMahasiswa',
              token,
              filter: `id_registrasi_mahasiswa = '${this.escapeFeederFilter(s.feederRegistrationId)}'`,
              limit: 1,
              offset: 0,
            },
            30000
          );
          const row = errorCode === '0' && Array.isArray(data) ? data[0] : null;
          if (row) {
            byStudent.set(s.id, row);
            return;
          }
        }
        const { data, errorCode } = await this.callFeeder(
          baseUrl,
          {
            act: 'GetListRiwayatPendidikanMahasiswa',
            token,
            filter: `nim = '${this.escapeFeederFilter(s.nim)}'`,
            limit: 1,
            offset: 0,
          },
          30000
        );
        const row = errorCode === '0' && Array.isArray(data) ? data[0] : null;
        if (row) byStudent.set(s.id, row);
      } catch {
        // non-blocking -- mahasiswa ini dilaporkan "tidak ditemukan"
      }
    });
    return byStudent;
  }

  /**
   * Bandingkan riwayat pendidikan lokal vs Feeder (hanya membaca, maks 100 per panggilan):
   * NIM, program studi (lewat kode prodi), dan tahun masuk (4 digit pertama id_periode_masuk).
   */
  async compareRiwayatPendidikan(studentIds: string[]) {
    const BATCH = 100;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: true, message: 'Tidak ada mahasiswa untuk dibandingkan.', items: [] as any[] };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'Konfigurasi Web Service Neo Feeder belum lengkap.', items: [] as any[] };
    }
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const { idToCode } = await this.getProdiMaps(setting.baseUrl, token);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds.slice(0, BATCH) }, feederRegistrationId: { not: null } },
        select: { id: true, nim: true, entryYear: true, feederRegistrationId: true, studyProgram: { select: { diktiCode: true, name: true } } },
      });
      const rows = await this.fetchRiwayatRows(setting.baseUrl, token, students);

      const items = students.map((s) => {
        const row = rows.get(s.id);
        if (!row) return { id: s.id, foundInFeeder: false, diffs: [] as any[] };

        const diffs: { field: string; label: string; local: string; feeder: string }[] = [];
        const feederNim = this.cleanFeederValue(row.nim) || '';
        if (s.nim && s.nim.trim() !== feederNim.trim()) {
          diffs.push({ field: 'nim', label: 'NIM', local: s.nim, feeder: feederNim });
        }
        const feederProdiCode = idToCode.get(String(row.id_prodi)) || '';
        const localProdiCode = (s.studyProgram?.diktiCode || '').trim();
        if (localProdiCode && localProdiCode !== feederProdiCode) {
          diffs.push({
            field: 'prodi',
            label: 'Program Studi',
            local: `${s.studyProgram?.name || ''} (${localProdiCode})`,
            feeder: `${this.cleanFeederValue(row.nama_program_studi) || '-'} (${feederProdiCode || '-'})`,
          });
        }
        const feederPeriode = this.cleanFeederValue(row.id_periode_masuk) || '';
        const feederYear = parseInt(feederPeriode.slice(0, 4), 10);
        if (s.entryYear && !Number.isNaN(feederYear) && s.entryYear !== feederYear) {
          diffs.push({ field: 'angkatan', label: 'Tahun Masuk', local: String(s.entryYear), feeder: String(feederYear) });
        }
        return { id: s.id, foundInFeeder: true, diffs };
      });
      return { success: true, message: `${items.length} mahasiswa dibandingkan.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal membandingkan riwayat pendidikan: ${err?.message || 'Unknown error'}`, items: [] as any[] };
    }
  }

  /**
   * `UpdateRiwayatPendidikanMahasiswa` (key `id_registrasi_mahasiswa`) untuk mahasiswa
   * terpilih. Menulis ke basis data resmi Dikti, jadi `studentIds` wajib diisi dan dibatasi.
   *
   * Record dibangun dari baris riwayat yang SAAT INI ada di Feeder, lalu hanya NIM, prodi,
   * dan tahun masuk yang ditimpa dari data lokal (semester masuk -- digit terakhir
   * id_periode_masuk -- dipertahankan dari Feeder). Field lain yang lokal tidak punya
   * (jenis/jalur daftar, tanggal daftar, pembiayaan, dst.) dipakai apa adanya dari Feeder,
   * bukan nilai default karangan.
   */
  async updateRiwayatPendidikanToFeeder(studentIds: string[]) {
    const empty = { processed: 0, updated: 0, failed: 0, skipped: 0 };
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu mahasiswa yang akan diupdate.', ...empty };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'Konfigurasi Web Service Neo Feeder belum lengkap.', ...empty };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const { codeToId } = await this.getProdiMaps(setting.baseUrl, token);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds.slice(0, LIMIT_PER_RUN) }, feederRegistrationId: { not: null } },
        select: {
          id: true,
          nim: true,
          entryYear: true,
          feederRegistrationId: true,
          studyProgram: { select: { diktiCode: true } },
        },
      });
      const rows = await this.fetchRiwayatRows(setting.baseUrl, token, students);

      let processed = 0;
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = async (studentId: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.student
          .update({ where: { id: studentId }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } })
          .catch(() => null);
      };

      for (const s of students) {
        processed += 1;
        const row = rows.get(s.id);
        if (!row) {
          await markFailed(s.id, 'Riwayat pendidikan tidak ditemukan di Feeder (ID registrasi maupun NIM)');
          continue;
        }

        const feederPeriode = this.cleanFeederValue(row.id_periode_masuk) || '';
        const semesterDigit = feederPeriode.length >= 5 ? feederPeriode.slice(4) : '1';
        const idPeriodeMasuk = s.entryYear ? `${s.entryYear}${semesterDigit}` : feederPeriode;
        const localProdiCode = (s.studyProgram?.diktiCode || '').trim();
        const idProdi = (localProdiCode && codeToId.get(localProdiCode)) || this.cleanFeederValue(row.id_prodi);

        const record: Record<string, any> = {
          id_mahasiswa: row.id_mahasiswa,
          nim: s.nim,
          id_jenis_daftar: row.id_jenis_daftar,
          id_jalur_daftar: row.id_jalur_daftar,
          id_periode_masuk: idPeriodeMasuk,
          tanggal_daftar: this.parseFeederDate(this.cleanFeederValue(row.tanggal_daftar)) || this.cleanFeederValue(row.tanggal_daftar),
          id_perguruan_tinggi: row.id_perguruan_tinggi,
          id_prodi: idProdi,
        };
        for (const optional of ['sks_diakui', 'id_pembiayaan', 'biaya_masuk', 'id_bidang_minat', 'id_perguruan_tinggi_asal', 'id_prodi_asal']) {
          const v = row[optional];
          if (v !== null && v !== undefined && v !== '') record[optional] = v;
        }

        const unchanged =
          record.nim === this.cleanFeederValue(row.nim) &&
          record.id_prodi === this.cleanFeederValue(row.id_prodi) &&
          record.id_periode_masuk === feederPeriode;
        if (unchanged) {
          skipped += 1;
          continue;
        }

        try {
          const { errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'UpdateRiwayatPendidikanMahasiswa',
            token,
            key: { id_registrasi_mahasiswa: row.id_registrasi_mahasiswa },
            record,
          });
          if (errorCode !== '0') {
            await markFailed(s.id, `Update riwayat pendidikan ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`);
            continue;
          }
          await this.prisma.student.update({
            where: { id: s.id },
            data: { feederSyncError: null, feederSyncErrorAt: null },
          });
          updated += 1;
        } catch (err: any) {
          await markFailed(s.id, `Gagal menghubungi Feeder: ${err?.message || 'Unknown error'}`);
        }
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'RIWAYAT_PENDIDIKAN_UPDATE_TO_FEEDER',
            detail: `Update riwayat pendidikan ke Feeder: ${processed} diproses, ${updated} berhasil, ${failed} gagal, ${skipped} tidak ada perubahan.`,
          },
        });
      } catch {
        // non-blocking
      }

      const failReasonText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';
      const overLimit = studentIds.length > LIMIT_PER_RUN ? ` Dibatasi ${LIMIT_PER_RUN} per proses -- jalankan lagi untuk sisanya.` : '';
      return {
        success: true,
        message: `Update selesai: ${processed} diproses, ${updated} berhasil diupdate di Feeder, ${failed} gagal, ${skipped} tidak ada perubahan.${overLimit}${failReasonText}`,
        processed,
        updated,
        failed,
        skipped,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal update riwayat pendidikan: ${err?.message || 'Unknown error'}`, ...empty };
    }
  }

  // ================= AKTIVITAS KULIAH MAHASISWA (AKM) =================

  /**
   * Nilai AKM lokal per mahasiswa untuk satu semester, dihitung dari KRS yang APPROVED:
   * SKS semester = jumlah SKS mata kuliah semester itu, IPS = rata-rata tertimbang nilai
   * semester itu, SKS total & IPK = akumulasi semua semester sampai (dan termasuk) semester
   * itu. Hanya mahasiswa yang sudah punya `feederRegistrationId` yang ikut (AKM menunjuk
   * registrasi mahasiswa di Feeder).
   */
  private async computeAkmLocal(
    semesterCode: string,
    opts: { studentIds?: string[]; search?: string; sortKey?: string; sortDir?: 'asc' | 'desc'; limit?: number; offset?: number }
  ) {
    const dir = opts.sortDir === 'desc' ? 'DESC' : 'ASC';
    const sortMap: Record<string, string> = {
      nim: 's.nim',
      name: 'u."fullName"',
      studyProgram: 'sp.name',
      sksSemester: 'cur.sks_semester',
      ips: 'ips',
      ipk: 'ipk',
      sksTotal: 'cum.sks_total',
    };
    const orderCol = sortMap[opts.sortKey || ''] || 's.nim';
    const search = opts.search ? `%${opts.search.replace(/[%_]/g, (m) => '\\' + m)}%` : null;
    const ids = opts.studentIds && opts.studentIds.length > 0 ? opts.studentIds : null;

    // Semua nilai dari pengguna dilewatkan sebagai parameter ($n), bukan disisipkan ke SQL.
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      WITH sem AS (SELECT id, code FROM academic_years WHERE code = $1),
      cur AS (
        SELECT e."studentId",
               SUM(c.sks)::int AS sks_semester,
               SUM(c.sks * e."gradePoint") FILTER (WHERE e."gradePoint" IS NOT NULL) AS pts,
               SUM(c.sks) FILTER (WHERE e."gradePoint" IS NOT NULL) AS graded_sks
        FROM course_enrollments e
        JOIN courses c ON c.id = e."courseId"
        JOIN sem ON sem.id = e."academicYearId"
        WHERE e.status = 'APPROVED'
        GROUP BY e."studentId"
      ),
      cum AS (
        SELECT e."studentId",
               SUM(c.sks)::int AS sks_total,
               SUM(c.sks * e."gradePoint") FILTER (WHERE e."gradePoint" IS NOT NULL) AS pts,
               SUM(c.sks) FILTER (WHERE e."gradePoint" IS NOT NULL) AS graded_sks
        FROM course_enrollments e
        JOIN courses c ON c.id = e."courseId"
        JOIN academic_years ay ON ay.id = e."academicYearId"
        WHERE e.status = 'APPROVED' AND ay.code <= $1
        GROUP BY e."studentId"
      )
      SELECT s.id, s.nim, u."fullName" AS name, sp.name AS "studyProgram",
             s."feederRegistrationId" AS "feederRegistrationId",
             cur.sks_semester AS "sksSemester",
             CASE WHEN cur.graded_sks > 0 THEN ROUND((cur.pts / cur.graded_sks)::numeric, 2) ELSE NULL END AS ips,
             COALESCE(cum.sks_total, 0) AS "sksTotal",
             CASE WHEN cum.graded_sks > 0 THEN ROUND((cum.pts / cum.graded_sks)::numeric, 2) ELSE NULL END AS ipk,
             COUNT(*) OVER()::int AS total
      FROM cur
      JOIN students s ON s.id = cur."studentId"
      JOIN users u ON u.id = s."userId"
      JOIN study_programs sp ON sp.id = s."studyProgramId"
      LEFT JOIN cum ON cum."studentId" = s.id
      WHERE s."feederRegistrationId" IS NOT NULL
        AND ($2::text IS NULL OR s.nim ILIKE $2 OR u."fullName" ILIKE $2 OR sp.name ILIKE $2)
        AND ($3::text[] IS NULL OR s.id = ANY($3::text[]))
      ORDER BY ${orderCol} ${dir} NULLS LAST, s.nim ASC
      LIMIT $4 OFFSET $5
      `,
      semesterCode,
      search,
      ids,
      opts.limit ?? 50,
      opts.offset ?? 0
    );
    return rows.map((r) => ({
      id: r.id as string,
      nim: r.nim as string,
      name: r.name as string,
      studyProgram: r.studyProgram as string,
      feederRegistrationId: r.feederRegistrationId as string,
      sksSemester: Number(r.sksSemester ?? 0),
      ips: r.ips !== null && r.ips !== undefined ? Number(r.ips) : null,
      sksTotal: Number(r.sksTotal ?? 0),
      ipk: r.ipk !== null && r.ipk !== undefined ? Number(r.ipk) : null,
      total: Number(r.total ?? 0),
    }));
  }

  /** Tabel AKM lokal per semester (server-side): SKS, IPS, SKS total, IPK hasil hitung dari KRS. */
  async getAkmTable(q: { semester?: string; page?: string; pageSize?: string; search?: string; sortKey?: string; sortDir?: string }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const semester = (q.semester || '').trim();
    if (!semester) return { total: 0, page, pageSize, items: [] as any[] };
    const rows = await this.computeAkmLocal(semester, {
      search,
      sortKey: q.sortKey,
      sortDir,
      limit: pageSize,
      offset: skip,
    });
    return {
      total: rows[0]?.total ?? 0,
      page,
      pageSize,
      items: rows.map(({ total: _t, feederRegistrationId: _f, ...rest }) => rest),
    };
  }

  /** Semua id mahasiswa yang punya AKM lokal di semester ini (sesuai pencarian) -- untuk "Bandingkan semua". */
  async getAkmIds(semester: string, search?: string) {
    const rows = await this.computeAkmLocal((semester || '').trim(), { search: (search ?? '').trim() || undefined, limit: 100000 });
    return { total: rows.length, ids: rows.map((r) => r.id) };
  }

  /** Ambil baris AKM Feeder untuk satu semester dan satu batch id registrasi (satu panggilan). */
  private async fetchAkmFeederRows(baseUrl: string, token: string, semester: string, regIds: string[]) {
    const map = new Map<string, any>();
    if (regIds.length === 0) return map;
    const idsFilter = regIds.map((i) => this.escapeFeederFilter(i)).join("', '");
    const rows = await this.fetchAllFeederPages(baseUrl, token, 'GetAktivitasKuliahMahasiswa', 500, 45000, {
      filter: `id_semester = '${this.escapeFeederFilter(semester)}' AND id_registrasi_mahasiswa IN ('${idsFilter}')`,
    });
    for (const r of rows) if (r?.id_registrasi_mahasiswa) map.set(String(r.id_registrasi_mahasiswa), r);
    return map;
  }

  /**
   * Bandingkan AKM lokal vs Feeder untuk mahasiswa terpilih pada satu semester (hanya
   * membaca, maks 100 per panggilan): SKS semester, IPS, SKS total, IPK.
   */
  async compareAkm(semester: string, studentIds: string[]) {
    const BATCH = 100;
    if (!semester || !Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: true, message: 'Tidak ada mahasiswa untuk dibandingkan.', items: [] as any[] };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'Konfigurasi Web Service Neo Feeder belum lengkap.', items: [] as any[] };
    }
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const locals = await this.computeAkmLocal(semester, { studentIds: studentIds.slice(0, BATCH), limit: BATCH });
      const feeder = await this.fetchAkmFeederRows(
        setting.baseUrl,
        token,
        semester,
        locals.map((l) => l.feederRegistrationId)
      );

      const num = (v: any) => {
        const n = parseFloat(String(v ?? ''));
        return Number.isNaN(n) ? null : n;
      };
      const items = locals.map((l) => {
        const f = feeder.get(l.feederRegistrationId);
        if (!f) return { id: l.id, foundInFeeder: false, diffs: [] as any[] };
        const diffs: { field: string; label: string; local: string; feeder: string }[] = [];
        const push = (field: string, label: string, local: number | null, remote: number | null, tol = 0) => {
          if (local === null && remote === null) return;
          if (local !== null && remote !== null && Math.abs(local - remote) <= tol) return;
          diffs.push({ field, label, local: local === null ? '' : String(local), feeder: remote === null ? '' : String(remote) });
        };
        push('sksSemester', 'SKS Semester', l.sksSemester, num(f.sks_semester));
        push('ips', 'IPS', l.ips, num(f.ips), 0.005);
        push('sksTotal', 'SKS Total', l.sksTotal, num(f.sks_total));
        push('ipk', 'IPK', l.ipk, num(f.ipk), 0.005);
        return {
          id: l.id,
          foundInFeeder: true,
          status: this.cleanFeederValue(f.nama_status_mahasiswa) || '',
          diffs,
        };
      });
      return { success: true, message: `${items.length} mahasiswa dibandingkan.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal membandingkan AKM: ${err?.message || 'Unknown error'}`, items: [] as any[] };
    }
  }

  /**
   * Kirim AKM lokal ke Feeder untuk mahasiswa terpilih pada satu semester: yang sudah ada
   * di Feeder di-UPDATE (`UpdatePerkuliahanMahasiswa`, status mahasiswa dipertahankan dari
   * Feeder), yang belum ada di-INSERT (`InsertPerkuliahanMahasiswa`, status Aktif karena
   * punya KRS di semester itu). Menulis ke basis data resmi Dikti, jadi `studentIds` wajib
   * dan dibatasi per proses.
   */
  async syncAkmToFeeder(semester: string, studentIds: string[]) {
    const empty = { processed: 0, inserted: 0, updated: 0, failed: 0, skipped: 0 };
    if (!semester || !Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: false, message: 'Pilih semester dan minimal satu mahasiswa.', ...empty };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'Konfigurasi Web Service Neo Feeder belum lengkap.', ...empty };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const locals = await this.computeAkmLocal(semester, { studentIds: studentIds.slice(0, LIMIT_PER_RUN), limit: LIMIT_PER_RUN });
      const feeder = await this.fetchAkmFeederRows(
        setting.baseUrl,
        token,
        semester,
        locals.map((l) => l.feederRegistrationId)
      );

      let inserted = 0;
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const fail = (reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
      };
      const fmt = (v: number | null) => (v === null ? 0 : v);

      for (const l of locals) {
        const f = feeder.get(l.feederRegistrationId);
        const values = {
          ips: fmt(l.ips),
          ipk: fmt(l.ipk),
          sks_semester: l.sksSemester,
          sks_total: l.sksTotal,
        };
        try {
          if (f) {
            const same =
              Math.abs(fmt(l.ips) - (parseFloat(String(f.ips)) || 0)) <= 0.005 &&
              Math.abs(fmt(l.ipk) - (parseFloat(String(f.ipk)) || 0)) <= 0.005 &&
              l.sksSemester === (parseInt(String(f.sks_semester), 10) || 0) &&
              l.sksTotal === (parseInt(String(f.sks_total), 10) || 0);
            if (same) {
              skipped += 1;
              continue;
            }
            const { errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
              act: 'UpdatePerkuliahanMahasiswa',
              token,
              key: { id_registrasi_mahasiswa: l.feederRegistrationId, id_semester: semester },
              record: { id_status_mahasiswa: f.id_status_mahasiswa, ...values },
            });
            if (errorCode !== '0') fail(`Update AKM ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`);
            else updated += 1;
          } else {
            const { errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
              act: 'InsertPerkuliahanMahasiswa',
              token,
              record: {
                id_registrasi_mahasiswa: l.feederRegistrationId,
                id_semester: semester,
                id_status_mahasiswa: 'A',
                ...values,
                biaya_kuliah_smt: 0,
              },
            });
            if (errorCode !== '0') fail(`Insert AKM ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`);
            else inserted += 1;
          }
        } catch (err: any) {
          fail(`Gagal menghubungi Feeder: ${err?.message || 'Unknown error'}`);
        }
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'AKM_SYNC_TO_FEEDER',
            detail: `AKM semester ${semester} ke Feeder: ${locals.length} diproses, ${inserted} ditambahkan, ${updated} diperbarui, ${failed} gagal, ${skipped} tidak ada perubahan.`,
          },
        });
      } catch {
        // non-blocking
      }

      const failText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';
      const over = studentIds.length > LIMIT_PER_RUN ? ` Dibatasi ${LIMIT_PER_RUN} per proses -- jalankan lagi untuk sisanya.` : '';
      return {
        success: true,
        message: `AKM selesai: ${locals.length} diproses, ${inserted} ditambahkan, ${updated} diperbarui, ${failed} gagal, ${skipped} tidak ada perubahan.${over}${failText}`,
        processed: locals.length,
        inserted,
        updated,
        failed,
        skipped,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal sinkronisasi AKM: ${err?.message || 'Unknown error'}`, ...empty };
    }
  }

  /**
   * Tabel nilai perkuliahan lokal (server-side). `grade` memfilter: `graded` (sudah ada
   * nilai, default -- sama dengan hitungan "Total Lokal"), `unsynced` (sudah bernilai lokal
   * tapi belum cocok dengan Feeder -- kandidat Push), `ungraded` (KRS belum bernilai), atau `all`.
   */
  async getNilaiTable(q: {
    page?: string;
    pageSize?: string;
    search?: string;
    sortKey?: string;
    sortDir?: string;
    grade?: string;
  }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const gradeFilter = q.grade === 'ungraded' || q.grade === 'all' || q.grade === 'unsynced' ? q.grade : 'graded';
    const base: any =
      gradeFilter === 'graded'
        ? { gradePoint: { not: null } }
        : gradeFilter === 'unsynced'
          ? { gradePoint: { not: null }, feederGradeSyncedAt: null }
          : gradeFilter === 'ungraded'
            ? { gradePoint: null, courseClassId: { not: null } }
            : {};
    const where: any = search
      ? {
          AND: [
            base,
            {
              OR: [
                { student: { nim: { contains: search, mode: 'insensitive' } } },
                { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
                { course: { code: { contains: search, mode: 'insensitive' } } },
                { course: { name: { contains: search, mode: 'insensitive' } } },
                { courseClass: { className: { contains: search, mode: 'insensitive' } } },
              ],
            },
          ],
        }
      : base;
    const orderByMap: Record<string, any> = {
      nim: { student: { nim: sortDir } },
      studentName: { student: { user: { fullName: sortDir } } },
      courseLabel: { course: { code: sortDir } },
      className: { courseClass: { className: sortDir } },
      academicYear: { academicYear: { code: sortDir } },
      totalScore: { totalScore: { sort: sortDir, nulls: 'last' } },
      gradeLetter: { gradeLetter: { sort: sortDir, nulls: 'last' } },
      gradePoint: { gradePoint: { sort: sortDir, nulls: 'last' } },
      gradeStatus: { gradeStatus: sortDir },
      synced: { feederGradeSyncedAt: { sort: sortDir, nulls: 'last' } },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.nim, { id: 'asc' }];

    const [total, totalGraded, synced, rows] = await Promise.all([
      this.prisma.courseEnrollment.count({ where }),
      this.prisma.courseEnrollment.count({ where: { gradePoint: { not: null } } }),
      this.prisma.courseEnrollment.count({ where: { ...where, feederGradeSyncedAt: { not: null } } }),
      this.prisma.courseEnrollment.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          totalScore: true,
          gradeLetter: true,
          gradePoint: true,
          gradeStatus: true,
          feederGradeSyncedAt: true,
          student: { select: { nim: true, user: { select: { fullName: true } } } },
          course: { select: { code: true, name: true } },
          courseClass: { select: { className: true } },
          academicYear: { select: { code: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      totalGraded,
      synced,
      page,
      pageSize,
      items: rows.map((r) => ({
        id: r.id,
        nim: r.student?.nim ?? '',
        studentName: r.student?.user?.fullName ?? '',
        courseLabel: r.course ? `${r.course.code} -- ${r.course.name}` : '-',
        className: r.courseClass?.className ?? '-',
        academicYear: r.academicYear?.name || r.academicYear?.code || '-',
        totalScore: r.totalScore,
        gradeLetter: r.gradeLetter,
        gradePoint: r.gradePoint,
        gradeStatus: r.gradeStatus,
        feederGradeSyncedAt: r.feederGradeSyncedAt,
      })),
    };
  }

  /**
   * Tabel KRS lokal (server-side). KRS tidak punya feederId sendiri, jadi yang ditampilkan
   * adalah dua fakta nyata: kelasnya sudah punya ID Feeder & mahasiswanya sudah punya ID
   * Feeder (prasyarat Push/Sync KRS) -- bukan klaim bahwa baris KRS itu sudah ada di Feeder.
   */
  async getKrsTable(q: { page?: string; pageSize?: string; search?: string; sortKey?: string; sortDir?: string }) {
    const { page, pageSize, skip, search, sortDir } = this.normalizeTableQuery(q);
    const base: any = { courseClassId: { not: null } };
    const where: any = search
      ? {
          ...base,
          OR: [
            { student: { nim: { contains: search, mode: 'insensitive' } } },
            { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
            { course: { code: { contains: search, mode: 'insensitive' } } },
            { course: { name: { contains: search, mode: 'insensitive' } } },
            { courseClass: { className: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : base;
    const orderByMap: Record<string, any> = {
      nim: { student: { nim: sortDir } },
      studentName: { student: { user: { fullName: sortDir } } },
      courseLabel: { course: { code: sortDir } },
      className: { courseClass: { className: sortDir } },
      academicYear: { academicYear: { code: sortDir } },
      synced: { feederSyncedAt: { sort: sortDir, nulls: 'last' } },
      classInFeeder: { courseClass: { feederId: { sort: sortDir, nulls: 'last' } } },
      studentInFeeder: { student: { feederId: { sort: sortDir, nulls: 'last' } } },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.nim, { id: 'asc' }];

    const [total, synced, totalAll, rows] = await Promise.all([
      this.prisma.courseEnrollment.count({ where }),
      this.prisma.courseEnrollment.count({ where: { ...where, feederSyncedAt: { not: null } } }),
      this.prisma.courseEnrollment.count({ where: base }),
      this.prisma.courseEnrollment.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          feederSyncedAt: true,
          student: { select: { nim: true, feederId: true, user: { select: { fullName: true } } } },
          course: { select: { code: true, name: true } },
          courseClass: { select: { className: true, feederId: true } },
          academicYear: { select: { code: true, name: true } },
        },
      }),
    ]);

    return {
      total,
      synced,
      totalAll,
      page,
      pageSize,
      items: rows.map((r) => ({
        id: r.id,
        nim: r.student?.nim ?? '',
        studentName: r.student?.user?.fullName ?? '',
        courseLabel: r.course ? `${r.course.code} -- ${r.course.name}` : '-',
        className: r.courseClass?.className ?? '',
        academicYear: r.academicYear?.name || r.academicYear?.code || '-',
        classInFeeder: Boolean(r.courseClass?.feederId),
        studentInFeeder: Boolean(r.student?.feederId),
        feederSyncedAt: r.feederSyncedAt,
      })),
    };
  }

  // Daftar kelas kuliah lokal yang BELUM punya feederId (belum ada di Feeder) -- dipakai tab
  // "Push" halaman Sinkronisasi Kelas Perkuliahan.
  async getPendingKelasKuliahPush() {
    const classes = await this.prisma.courseClass.findMany({
      where: { feederId: null },
      include: {
        course: { select: { code: true, name: true } },
        academicYear: { select: { code: true, name: true } },
        lecturer: { select: { nidn: true, nuptk: true, user: { select: { fullName: true } } } },
      },
      orderBy: [{ academicYear: { code: 'desc' } }, { className: 'asc' }],
    });
    return classes.map((c) => ({
      id: c.id,
      className: c.className,
      courseCode: c.course?.code ?? '',
      courseName: c.course?.name ?? '',
      academicYear: c.academicYear ? `${c.academicYear.name} (${c.academicYear.code})` : '',
      lecturerName: c.lecturer?.user?.fullName ?? null,
      lecturerNidn: c.lecturer?.nidn || c.lecturer?.nuptk || null,
      lastError: c.feederSyncError ?? null,
    }));
  }

  // Daftar mata kuliah yang BELUM punya feederId, lengkap pesan error Push terakhir kalau ada.
  async getPendingMataKuliahPush() {
    const courses = await this.prisma.course.findMany({
      where: { feederId: null, studyProgramId: { not: null } },
      orderBy: [{ feederSyncErrorAt: 'desc' }, { createdAt: 'asc' }],
    });
    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgramName,
      lastError: c.feederSyncError,
      lastErrorAt: c.feederSyncErrorAt,
    }));
  }

  // Daftar kurikulum yang BELUM punya feederId, lengkap pesan error Push terakhir kalau ada.
  async getPendingKurikulumPush() {
    const curricula = await this.prisma.curriculum.findMany({
      where: { feederId: null },
      orderBy: [{ feederSyncErrorAt: 'desc' }, { createdAt: 'asc' }],
    });
    return curricula.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgram,
      lastError: c.feederSyncError,
      lastErrorAt: c.feederSyncErrorAt,
    }));
  }

  async updatePddiktiSetting(dto: UpdatePddiktiSettingDto, userId?: string) {
    const data: any = { ...dto };
    if (!data.password) delete data.password;
    if (!data.secretKey) delete data.secretKey;
    if (userId) data.updatedByUserId = userId;

    await this.prisma.pddiktiSetting.upsert({
      where: { id: PDDIKTI_SETTING_ID },
      update: data,
      create: { id: PDDIKTI_SETTING_ID, ...data },
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'PDDIKTI_SETTING_UPDATE',
          detail: 'Super Administrator memperbarui konfigurasi koneksi Web Service Neo Feeder PDDIKTI',
        },
      });
    } catch {
      // non-blocking
    }

    return this.getPddiktiSetting();
  }

  /**
   * Memanggil endpoint live2.php Web Service Neo Feeder PDDIKTI.
   * Protokolnya: POST JSON berisi `act` + parameter lain, balasannya selalu berbentuk
   * { error_code, error_desc, data }. error_code "0" (string) berarti sukses.
   */
  private async callFeeder(
    baseUrl: string,
    body: Record<string, any>,
    timeoutMs = 20000
  ): Promise<{ data?: any; errorCode?: string; errorDesc?: string }> {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Endpoint tidak mengembalikan JSON yang valid (status HTTP ${res.status}).`);
    }

    return { data: json?.data, errorCode: json?.error_code != null ? String(json.error_code) : undefined, errorDesc: json?.error_desc };
  }

  /** Login ke Web Service Neo Feeder (act: GetToken) dan mengembalikan token sesi. */
  private async getFeederToken(baseUrl: string, username: string, password: string, timeoutMs = 20000): Promise<string> {
    const { data, errorCode, errorDesc } = await this.callFeeder(baseUrl, { act: 'GetToken', username, password }, timeoutMs);
    if (errorCode !== '0' || !data?.token) {
      throw new Error(errorDesc || 'Gagal memperoleh token -- periksa kembali username dan password Web Service.');
    }
    return data.token;
  }

  /** Menebak DegreeLevel (enum lokal) dari nama_jenjang_pendidikan yang dikembalikan Feeder, tanpa menebak ID numerik. */
  private mapFeederDegreeLevel(namaJenjang?: string): string | undefined {
    const n = (namaJenjang || '').toLowerCase();
    if (!n) return undefined;
    if (n.includes('doktor')) return 'S3';
    if (n.includes('magister') || n === 's2' || n.includes('spesialis')) return 'S2';
    if (n.includes('diploma empat') || n.includes('diploma iv') || n.includes('sarjana terapan')) return 'D4';
    if (n.includes('diploma tiga') || n.includes('diploma iii')) return 'D3';
    if (n.includes('profesi')) return 'PROFESI';
    if (n.includes('sarjana')) return 'S1';
    return undefined;
  }

  /**
   * Menarik daftar program studi resmi dari Web Service Neo Feeder PDDIKTI
   * (act: GetToken lalu act: GetProdi), sesuai protokol live2.php yang dipakai
   * seluruh Perguruan Tinggi di Indonesia untuk pelaporan PDDIKTI.
   *
   * CATATAN JUJUR: GetProdi hanya mengembalikan id_prodi, kode_program_studi,
   * nama_program_studi, status, dan jenjang pendidikan -- TIDAK ada data fakultas
   * atau akreditasi di endpoint ini, jadi field tersebut sengaja dibiarkan kosong
   * di sini (bukan ditebak/dipalsukan) dan tetap memakai data lokal saat sinkronisasi.
   */
  async pullProdiFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteProdiItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const { data, errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, { act: 'GetProdi', token });

      if (errorCode !== '0') {
        return {
          success: false,
          message: errorDesc || 'Web Service Neo Feeder menolak permintaan data program studi.',
          items: [],
        };
      }

      const rows: any[] = Array.isArray(data) ? data : [];
      const items: RemoteProdiItem[] = rows
        .filter((r) => r?.kode_program_studi && r?.nama_program_studi)
        .map((r) => ({
          // CATATAN: sebelumnya diktiCode salah diisi dari id_prodi (UUID internal baris
          // Feeder), padahal "Kode DIKTI" yang sesungguhnya adalah kode_program_studi --
          // id_prodi bukan kode resmi apa pun, cuma primary key internal Feeder.
          code: String(r.kode_program_studi).trim(),
          diktiCode: String(r.kode_program_studi).trim(),
          name: String(r.nama_program_studi).trim(),
          // Kalau nama jenjang dari Feeder tidak cocok pola standar (S1/S2/D3/dst),
          // tampilkan apa adanya string dari Feeder -- jangan dibuang jadi "-" seolah
          // datanya kosong, supaya admin tahu persis apa yang dikirim Feeder.
          degreeLevel: this.mapFeederDegreeLevel(r.nama_jenjang_pendidikan) || r.nama_jenjang_pendidikan || undefined,
        }));

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return {
        success: true,
        message: `Berhasil menarik ${items.length} program studi dari Web Service Neo Feeder.`,
        items,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menarik data dari Web Service Neo Feeder: ${err?.message || 'Unknown error'}`,
        items: [],
      };
    }
  }

  /**
   * Menyamakan data prodi lokal dengan hasil tarikan dari Feeder (berdasarkan kode prodi / kode Dikti).
   *
   * PDDIKTI tidak punya entitas Fakultas sama sekali, jadi `facultyId` prodi BARU wajib
   * dipilih manual oleh admin (dikirim dari frontend) -- sistem ini tidak pernah menebak
   * fakultas induknya sendiri. Prodi tanpa facultyId dilewati dan dilaporkan jujur.
   */
  async syncProdiFromFeeder(items: RemoteProdiItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, message: 'Tidak ada data prodi untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.code?.trim() || !item.name?.trim()) continue;

      const existing = await this.prisma.studyProgram.findFirst({
        where: { OR: [{ code: item.code.trim() }, ...(item.diktiCode ? [{ diktiCode: item.diktiCode.trim() }] : [])] },
      });

      if (existing) {
        await this.prisma.studyProgram.update({
          where: { id: existing.id },
          data: {
            diktiCode: item.diktiCode?.trim() || existing.diktiCode,
            name: item.name.trim(),
            accreditation: item.accreditation?.trim() || existing.accreditation,
          },
        });
        updated += 1;
        continue;
      }

      if (!item.facultyId?.trim()) {
        skipped += 1;
        continue;
      }

      const faculty = await this.prisma.faculty.findUnique({ where: { id: item.facultyId.trim() } });
      if (!faculty) {
        skipped += 1;
        continue;
      }

      await this.prisma.studyProgram.create({
        data: {
          facultyId: faculty.id,
          code: item.code.trim(),
          diktiCode: item.diktiCode?.trim() || null,
          name: item.name.trim(),
          degreeLevel: (item.degreeLevel as any) || 'S1',
          accreditation: item.accreditation?.trim() || 'Baik',
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'PRODI_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi prodi dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati (fakultas belum dipilih).`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} prodi baru dibuat, ${updated} diperbarui, ${skipped} dilewati karena fakultas belum dipilih.`
          : `Sinkronisasi selesai: ${created} prodi baru dibuat, ${updated} prodi diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /** Menebak Gender (enum lokal) dari jenis_kelamin yang dikembalikan Feeder ("L"/"P" atau nama lengkap). */
  private mapFeederGender(jenisKelamin?: string): 'MALE' | 'FEMALE' | undefined {
    const g = (jenisKelamin || '').trim().toUpperCase();
    if (!g) return undefined;
    if (g === 'L' || g.startsWith('LAKI')) return 'MALE';
    if (g === 'P' || g.startsWith('PEREMPUAN') || g.startsWith('WANITA')) return 'FEMALE';
    return undefined;
  }

  /** Mengubah tanggal format Feeder (umumnya DD-MM-YYYY atau YYYY-MM-DD) jadi ISO, tanpa menebak kalau formatnya tidak dikenali. */
  /**
   * Feeder sering mengirim "-" sebagai placeholder untuk field yang kosong (bukan null/
   * string kosong), terkonfirmasi dari data nyata (nip: "-" dipakai berkali-kali untuk
   * dosen berbeda). Kalau dibiarkan apa adanya, nilai "-" itu akan lolos ke kolom unique
   * (nip/nik/dll) dan bentrok antar dosen. Semua pemetaan field Feeder -> RemoteDosenItem
   * wajib lewat sini, bukan `String(x).trim()` langsung.
   */
  private cleanFeederValue(value: any): string | undefined {
    if (value === null || value === undefined) return undefined;
    const v = String(value).trim();
    if (v === '' || v === '-') return undefined;
    return v;
  }

  /** Escape tanda kutip tunggal supaya aman diselipkan ke dalam string `filter` Feeder (mis. "nim = '...'"). */
  private escapeFeederFilter(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * Email mahasiswa lokal yang BUKAN buatan sistem. Mahasiswa yang email-nya kosong di
   * Feeder diberi email cadangan `<nim>@mahasiswa.itn.ac.id` (kolom email akun wajib &
   * unik) -- email semacam itu tidak boleh dikirim/dibandingkan ke Feeder seolah-olah
   * data asli.
   */
  private realStudentEmail(email?: string | null): string {
    const e = (email || '').trim();
    return e && !e.toLowerCase().endsWith('@mahasiswa.itn.ac.id') ? e : '';
  }

  private parseFeederDate(value?: string): string | undefined {
    if (!value?.trim()) return undefined;
    const v = value.trim();
    const ddmmyyyy = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // Beberapa field Feeder (mis. mulai_sk_pengangkatan) datang sebagai ISO datetime penuh
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
    return undefined;
  }

  /** Mengambil seluruh baris dari satu act Feeder yang mendukung limit/offset, halaman demi halaman. */
  private async fetchAllFeederPages(
    baseUrl: string,
    token: string,
    act: string,
    pageSize: number,
    timeoutMs: number,
    extraBody?: Record<string, any>
  ): Promise<any[]> {
    const rows: any[] = [];
    let offset = 0;
    let guard = 0;
    while (guard < 200) {
      guard += 1;
      const { data, errorCode, errorDesc } = await this.callFeeder(
        baseUrl,
        { act, token, limit: pageSize, offset, ...extraBody },
        timeoutMs
      );
      if (errorCode !== '0') {
        if (rows.length > 0) break; // sudah dapat sebagian -- lanjutkan dengan itu daripada gagal total
        throw new Error(errorDesc || `Web Service Neo Feeder menolak permintaan ${act}.`);
      }
      const page: any[] = Array.isArray(data) ? data : [];
      rows.push(...page);
      if (page.length < pageSize) break; // halaman terakhir
      offset += pageSize;
    }
    return rows;
  }

  /** Peta kode_program_studi -> id_prodi Feeder (dipakai pull mata kuliah/kurikulum untuk mencocokkan prodi lokal). */
  private async getProdiCodeMap(baseUrl: string, token: string): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const { data, errorCode } = await this.callFeeder(baseUrl, { act: 'GetProdi', token });
      if (errorCode === '0' && Array.isArray(data)) {
        for (const p of data) {
          if (p?.id_prodi && p?.kode_program_studi) {
            map.set(String(p.id_prodi), String(p.kode_program_studi).trim());
          }
        }
      }
    } catch {
      // non-blocking -- home base jadi kosong, tetap lanjut
    }
    return map;
  }

  /**
   * Menarik daftar mata kuliah dari Web Service Neo Feeder PDDIKTI (`GetListMataKuliah`),
   * diperkaya info semester lewat `GetMatkulKurikulum` (act terpisah -- GetListMataKuliah
   * sendiri tidak punya kolom semester). Home base prodi dicocokkan lewat `GetProdi`,
   * sama seperti pull Dosen/Mahasiswa.
   */
  async pullMataKuliahFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteCourseItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiCodeMap = await this.getProdiCodeMap(setting.baseUrl, token);

      const mkRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListMataKuliah', 500, 60000);

      // Semester per mata kuliah TIDAK ada di GetListMataKuliah -- diambil terpisah lewat
      // GetMatkulKurikulum (kolom `semester` + `id_kurikulum`). id_kurikulum dipakai nanti
      // saat sync untuk mengaitkan Course ke Curriculum lokal yang benar (lewat
      // Curriculum.feederId) -- tanpa ini, kolom "Kurikulum" di UI selalu kosong walau
      // datanya sebenarnya ada hubungannya di Feeder.
      //
      // PENTING: satu id_matkul BISA muncul di lebih dari satu baris GetMatkulKurikulum
      // (dipakai beberapa prodi/kurikulum sekaligus -- mata kuliah umum semacam
      // Pendidikan Agama/Pancasila lazim dipakai bareng begitu di banyak institusi).
      // Kalau cuma disimpan 1 nilai per id_matkul, baris yang diproses BELAKANGAN akan
      // menimpa baris sebelumnya secara acak tergantung urutan respons Feeder -- ini
      // yang bikin sebagian kurikulum (mis. kurikulum terbaru) kehilangan mata kuliah
      // semester awal padahal datanya ada. Makanya disimpan PER-PRODI (id_matkul +
      // id_prodi dari GetMatkulKurikulum, kalau field itu ada), supaya baris yang benar
      // dipilih sesuai prodi mata kuliahnya sendiri, bukan asal yang terakhir menang.
      const semesterMap = new Map<string, number>();
      const kurikulumMap = new Map<string, string>();
      const hasProdiInMapping = true;
      try {
        const mkKurRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetMatkulKurikulum', 500, 60000);
        for (const r of mkKurRows) {
          const idMatkul = this.cleanFeederValue(r?.id_matkul);
          if (!idMatkul) continue;
          const idProdi = this.cleanFeederValue(r?.id_prodi);
          // Kalau baris ini punya id_prodi, pakai key gabungan supaya tidak tabrakan
          // dengan baris id_matkul yang sama tapi prodi berbeda. Kalau tidak ada
          // id_prodi di respons, fallback ke key id_matkul polos (sebelumnya seperti
          // ini terus -- dipertahankan sebagai fallback, bukan dihapus).
          const key = idProdi ? `${idMatkul}|${idProdi}` : idMatkul;

          const sem = parseInt(String(r?.semester ?? ''), 10);
          if (!Number.isNaN(sem) && !semesterMap.has(key)) semesterMap.set(key, sem);
          const idKurikulum = this.cleanFeederValue(r?.id_kurikulum);
          if (idKurikulum && !kurikulumMap.has(key)) kurikulumMap.set(key, idKurikulum);

          // Fallback polos (tanpa prodi) TETAP diisi kalau belum ada, supaya item yang
          // GetListMataKuliah-nya tidak punya id_prodi (jarang, tapi bisa terjadi) masih
          // kebagian mapping -- diisi dari baris PERTAMA yang ditemukan, bukan terakhir.
          if (!semesterMap.has(idMatkul) && !Number.isNaN(sem)) semesterMap.set(idMatkul, sem);
          if (!kurikulumMap.has(idMatkul) && idKurikulum) kurikulumMap.set(idMatkul, idKurikulum);
        }
      } catch {
        // non-blocking -- semester default ke 1 & kurikulum kosong kalau mapping gagal diambil
      }

      const items: RemoteCourseItem[] = mkRows
        .filter((r) => r?.id_matkul && r?.kode_mata_kuliah)
        .map((r) => {
          const feederId = this.cleanFeederValue(r.id_matkul)!;
          const idProdi = this.cleanFeederValue(r.id_prodi);
          const compositeKey = hasProdiInMapping && idProdi ? `${feederId}|${idProdi}` : undefined;
          const sks = parseInt(String(r.sks_mata_kuliah ?? ''), 10);
          return {
            feederId,
            kurikulumFeederId: (compositeKey && kurikulumMap.get(compositeKey)) || kurikulumMap.get(feederId),
            code: this.cleanFeederValue(r.kode_mata_kuliah) || feederId,
            name: this.cleanFeederValue(r.nama_mata_kuliah) || '',
            sks: !Number.isNaN(sks) && sks > 0 ? sks : 2,
            semester: (compositeKey && semesterMap.get(compositeKey)) || semesterMap.get(feederId) || 1,
            prodiCode: r.id_prodi ? prodiCodeMap.get(String(r.id_prodi)) : undefined,
          };
        })
        .filter((i) => i.name);

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return { success: true, message: `Berhasil menarik ${items.length} mata kuliah dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data mata kuliah: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /** Cocokkan/buat ulang Course lokal dari hasil pull Feeder -- dicocokkan lewat feederId dulu, fallback kode mata kuliah. */
  async syncMataKuliahFromFeeder(rawItems: RemoteCourseItem[]) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { success: true, message: 'Tidak ada data mata kuliah untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    // Satu mata kuliah (id_matkul) bisa muncul berkali-kali di hasil Pull (dipakai
    // beberapa prodi sekaligus di Feeder) -- karena kode mata kuliah & feederId kita
    // tetap unik global (1 baris Course = 1 kurikulum/prodi, sesuai keputusan), yang
    // dipakai cuma kemunculan PERTAMA per feederId/kode supaya hasilnya konsisten,
    // bukan baris terakhir yang kebetulan diproses belakangan menimpa yang sebelumnya.
    const seenKeys = new Set<string>();
    let duplicatesSkipped = 0;
    const items = rawItems.filter((item) => {
      const dedupeKey = item.feederId || item.code;
      if (!dedupeKey) return true;
      if (seenKeys.has(dedupeKey)) {
        duplicatesSkipped += 1;
        return false;
      }
      seenKeys.add(dedupeKey);
      return true;
    });

    let created = 0;
    let updated = 0;
    let skipped = duplicatesSkipped;

    for (const item of items) {
      const code = item.code?.trim();
      if (!code || !item.name?.trim()) {
        skipped += 1;
        continue;
      }

      const existing = await this.prisma.course.findFirst({
        where: { OR: [...(item.feederId ? [{ feederId: item.feederId }] : []), { code }] },
      });

      // Nama prodi disimpan terdenormalisasi di Course.studyProgramName (dipakai LANGSUNG
      // di banyak tempat lain di aplikasi -- bukan di-join dari relasi), jadi wajib selalu
      // diisi bareng studyProgramId, bukan cuma ID-nya saja -- kalau tidak, UI lain
      // (tabel Kurikulum & Mata Kuliah) jatuh ke fallback "Seluruh Program Studi" walau
      // prodinya sebenarnya sudah benar tersimpan.
      let studyProgramName: string | undefined;
      if (item.studyProgramId?.trim()) {
        const sp = await this.prisma.studyProgram.findUnique({ where: { id: item.studyProgramId.trim() } });
        if (sp) studyProgramName = sp.name;
      }

      // Kaitkan ke Curriculum lokal lewat feederId (diisi saat Kurikulum disinkronkan).
      // Kalau kurikulumnya belum pernah disinkronkan, kolom ini sengaja dibiarkan kosong
      // (bukan ditebak) -- sinkronkan Kurikulum dulu, baru Mata Kuliah, supaya tautannya
      // benar-benar ada saat dicari di sini.
      let curriculumId: string | undefined;
      if (item.kurikulumFeederId) {
        const curriculum = await this.prisma.curriculum.findUnique({ where: { feederId: item.kurikulumFeederId } });
        if (curriculum) curriculumId = curriculum.id;
      }

      if (existing) {
        await this.prisma.course.update({
          where: { id: existing.id },
          data: {
            feederId: item.feederId || existing.feederId,
            name: item.name.trim(),
            sks: item.sks || existing.sks,
            semester: item.semester || existing.semester,
            ...(item.studyProgramId ? { studyProgramId: item.studyProgramId, studyProgramName } : {}),
            ...(curriculumId ? { curriculumId } : {}),
          },
        });
        updated += 1;
        continue;
      }

      if (!item.studyProgramId?.trim() || !studyProgramName) {
        skipped += 1;
        continue;
      }

      const codeTaken = await this.prisma.course.findUnique({ where: { code } });
      if (codeTaken) {
        skipped += 1;
        continue;
      }

      await this.prisma.course.create({
        data: {
          feederId: item.feederId || null,
          studyProgramId: item.studyProgramId.trim(),
          studyProgramName,
          curriculumId: curriculumId || null,
          code,
          name: item.name.trim(),
          sks: item.sks || 2,
          sksTeori: item.sks || 2,
          totalSks: item.sks || 2,
          semester: item.semester || 1,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'MATAKULIAH_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi mata kuliah dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} mata kuliah baru dibuat, ${updated} diperbarui, ${skipped} dilewati.`
          : `Sinkronisasi selesai: ${created} mata kuliah baru dibuat, ${updated} mata kuliah diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /**
   * Menarik daftar kurikulum dari Web Service Neo Feeder PDDIKTI (`GetListKurikulum`).
   * SKS wajib/pilihan/total TIDAK dipaksa dihitung ulang dari Feeder di sini -- cuma
   * `jumlah_sks_lulus` (dipakai sebagai total SKS) yang diambil apa adanya; rincian
   * wajib/pilihan tetap memakai nilai default lokal kalau kurikulumnya baru, supaya tidak
   * menebak pembagian yang sebenarnya cuma diketahui institusi.
   */
  async pullKurikulumFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteCurriculumItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiCodeMap = await this.getProdiCodeMap(setting.baseUrl, token);
      const kurRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListKurikulum', 500, 60000);

      const items: RemoteCurriculumItem[] = kurRows
        .filter((r) => r?.id_kurikulum && r?.nama_kurikulum)
        .map((r) => {
          const idSemester = this.cleanFeederValue(r.id_semester);
          const startYear = idSemester ? parseInt(idSemester.slice(0, 4), 10) : undefined;
          const sksLulus = parseInt(String(r.jumlah_sks_lulus ?? ''), 10);
          return {
            feederId: this.cleanFeederValue(r.id_kurikulum)!,
            name: this.cleanFeederValue(r.nama_kurikulum) || '',
            startYear: startYear && !Number.isNaN(startYear) ? startYear : undefined,
            totalSks: !Number.isNaN(sksLulus) && sksLulus > 0 ? sksLulus : undefined,
            prodiCode: r.id_prodi ? prodiCodeMap.get(String(r.id_prodi)) : undefined,
          };
        })
        .filter((i) => i.name);

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return { success: true, message: `Berhasil menarik ${items.length} kurikulum dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data kurikulum: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /** Cocokkan/buat ulang Curriculum lokal dari hasil pull Feeder -- dicocokkan lewat feederId, fallback nama+prodi. */
  async syncKurikulumFromFeeder(items: RemoteCurriculumItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, message: 'Tidak ada data kurikulum untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.name?.trim()) {
        skipped += 1;
        continue;
      }

      const existing = await this.prisma.curriculum.findFirst({
        where: { OR: [...(item.feederId ? [{ feederId: item.feederId }] : []), { name: item.name.trim() }] },
      });

      if (existing) {
        await this.prisma.curriculum.update({
          where: { id: existing.id },
          data: {
            feederId: item.feederId || existing.feederId,
            startYear: item.startYear || existing.startYear,
            totalSks: item.totalSks || existing.totalSks,
          },
        });
        updated += 1;
        continue;
      }

      if (!item.studyProgramId?.trim()) {
        skipped += 1;
        continue;
      }
      const studyProgram = await this.prisma.studyProgram.findUnique({
        where: { id: item.studyProgramId.trim() },
        include: { faculty: true },
      });
      if (!studyProgram) {
        skipped += 1;
        continue;
      }

      // Curriculum.code wajib unik -- dibentuk dari kode prodi + tahun mulai, bukan dari
      // Feeder (Feeder tidak punya "kode kurikulum" pendek, cuma nama & id internal).
      let code = `${studyProgram.code}-${item.startYear || new Date().getFullYear()}`;
      let suffix = 1;
      while (await this.prisma.curriculum.findUnique({ where: { code } })) {
        suffix += 1;
        code = `${studyProgram.code}-${item.startYear || new Date().getFullYear()}-${suffix}`;
      }

      await this.prisma.curriculum.create({
        data: {
          feederId: item.feederId || null,
          code,
          name: item.name.trim(),
          studyProgram: studyProgram.name,
          facultyCode: studyProgram.faculty?.code || 'UNIVERSITAS',
          startYear: item.startYear || new Date().getFullYear(),
          totalSks: item.totalSks || 144,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'KURIKULUM_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi kurikulum dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} kurikulum baru dibuat, ${updated} diperbarui, ${skipped} dilewati.`
          : `Sinkronisasi selesai: ${created} kurikulum baru dibuat, ${updated} kurikulum diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /** Peta kode_program_studi -> id_prodi Feeder, dibalik dari getProdiCodeMap (dipakai Push, yang butuh arah sebaliknya). */
  private async getProdiFeederIdByCode(baseUrl: string, token: string): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    try {
      const { data, errorCode } = await this.callFeeder(baseUrl, { act: 'GetProdi', token });
      if (errorCode === '0' && Array.isArray(data)) {
        for (const p of data) {
          if (p?.id_prodi && p?.kode_program_studi) {
            map.set(String(p.kode_program_studi).trim(), String(p.id_prodi));
          }
        }
      }
    } catch {
      // non-blocking
    }
    return map;
  }

  /**
   * Push mata kuliah lokal yang belum punya feederId ke Feeder (`InsertMataKuliah`).
   * Dicek dulu lewat `GetListMataKuliah` (prodi + kode) sebelum insert supaya tidak
   * membuat data dobel di Feeder kalau mata kuliah itu ternyata sudah pernah didaftarkan
   * lewat jalur lain. Field & act mengikuti GetDictionary('InsertMataKuliah') yang
   * terverifikasi di implementasi referensi: id_prodi, kode_mata_kuliah, nama_mata_kuliah,
   * id_jenis_mata_kuliah ('A' wajib / 'B' pilihan), sks_tatap_muka.
   */
  async pushMataKuliahBaruToFeeder(courseIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {} as Record<string, number>,
      };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiFeederIdByCode = await this.getProdiFeederIdByCode(setting.baseUrl, token);

      const eligible = await this.prisma.course.findMany({
        where: {
          feederId: null,
          studyProgramId: { not: null },
          ...(courseIds && courseIds.length > 0 ? { id: { in: courseIds } } : {}),
        },
        include: { studyProgram: true },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let processed = 0;
      let created = 0;
      let linked = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      // Catat alasan gagal pada BARIS mata kuliah itu sendiri (feederSyncError), bukan cuma
      // agregat -- supaya tab Push di halaman Sinkronisasi Feeder bisa menampilkan errornya per baris.
      const markFailed = async (courseId: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.course
          .update({ where: { id: courseId }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } })
          .catch(() => null);
      };

      for (const course of eligible) {
        processed += 1;
        const diktiCode = course.studyProgram?.diktiCode?.trim();
        const idProdiFeeder = diktiCode ? prodiFeederIdByCode.get(diktiCode) : undefined;
        if (!idProdiFeeder) {
          skipped += 1;
          continue;
        }

        try {
          const { data: existingData, errorCode: existingErr, errorDesc: existingErrDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetListMataKuliah',
            token,
            filter: `id_prodi = '${this.escapeFeederFilter(idProdiFeeder)}' and kode_mata_kuliah = '${this.escapeFeederFilter(course.code)}'`,
            limit: 1,
            offset: 0,
          });
          if (existingErr !== '0') throw new Error(existingErrDesc || 'Respon Feeder tidak valid');
          const found = Array.isArray(existingData) ? existingData[0] : null;
          if (found?.id_matkul) {
            await this.prisma.course.update({
              where: { id: course.id },
              data: { feederId: found.id_matkul, feederSyncError: null, feederSyncErrorAt: null },
            });
            linked += 1;
            continue;
          }
        } catch (err: any) {
          await markFailed(course.id, `Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
          continue;
        }

        const { data: insertData, errorCode: insertErr, errorDesc: insertErrDesc } = await this.callFeeder(setting.baseUrl, {
          act: 'InsertMataKuliah',
          token,
          record: {
            id_prodi: idProdiFeeder,
            kode_mata_kuliah: course.code,
            nama_mata_kuliah: course.name,
            id_jenis_mata_kuliah: course.type?.toLowerCase().includes('pilihan') ? 'B' : 'A',
            sks_tatap_muka: course.sks,
          },
        });
        if (insertErr !== '0' || !insertData?.id_matkul) {
          await markFailed(course.id, `Insert mata kuliah ditolak Feeder: ${insertErrDesc || 'tanpa keterangan'}`);
          continue;
        }
        await this.prisma.course.update({
          where: { id: course.id },
          data: { feederId: insertData.id_matkul, feederSyncError: null, feederSyncErrorAt: null },
        });
        created += 1;
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'MATAKULIAH_PUSH_TO_FEEDER',
            detail: `Push mata kuliah ke Feeder: ${processed} diproses, ${created} baru dibuat, ${linked} sudah ada (ditautkan), ${failed} gagal, ${skipped} dilewati (prodi belum sinkron).`,
          },
        });
      } catch {
        // non-blocking
      }

      const remaining = await this.prisma.course.count({ where: { feederId: null, studyProgramId: { not: null } } });
      const failReasonText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';

      return {
        success: true,
        message:
          `Push selesai: ${processed} diproses, ${created} mata kuliah baru dibuat di Feeder, ${linked} sudah ada (ditautkan), ` +
          `${failed} gagal, ${skipped} dilewati (prodi belum sinkron ke Feeder).` +
          (remaining > 0 ? ` Masih ada ${remaining} mata kuliah belum terdaftar -- jalankan Push lagi untuk lanjut.` : '') +
          failReasonText,
        processed,
        created,
        linked,
        failed,
        skipped,
        failReasons,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal push data mata kuliah: ${err?.message || 'Unknown error'}`,
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {},
      };
    }
  }

  /**
   * Push kurikulum lokal yang belum punya feederId ke Feeder (`InsertKurikulum`). Prodi
   * dicocokkan lewat nama (Curriculum.studyProgram tidak punya relasi FK, cuma teks nama)
   * -- kalau tidak cocok persis ke StudyProgram lokal, kurikulum itu dilewati dengan alasan
   * jelas, bukan ditebak. Semester mulai berlaku divalidasi dulu ke Feeder (`GetSemester`)
   * sebelum insert, field & act mengikuti GetDictionary('InsertKurikulum').
   */
  async pushKurikulumBaruToFeeder(curriculumIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {} as Record<string, number>,
      };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiFeederIdByCode = await this.getProdiFeederIdByCode(setting.baseUrl, token);
      const studyPrograms = await this.prisma.studyProgram.findMany();

      const eligible = await this.prisma.curriculum.findMany({
        where: { feederId: null, ...(curriculumIds && curriculumIds.length > 0 ? { id: { in: curriculumIds } } : {}) },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let processed = 0;
      let created = 0;
      let linked = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = async (curriculumId: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.curriculum
          .update({ where: { id: curriculumId }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } })
          .catch(() => null);
      };

      for (const curriculum of eligible) {
        processed += 1;

        const studyProgram = studyPrograms.find((p) => p.name.trim().toLowerCase() === curriculum.studyProgram.trim().toLowerCase());
        const diktiCode = studyProgram?.diktiCode?.trim();
        const idProdiFeeder = diktiCode ? prodiFeederIdByCode.get(diktiCode) : undefined;
        if (!idProdiFeeder) {
          skipped += 1;
          continue;
        }

        if (!/^\d{4}$/.test(String(curriculum.startYear))) {
          await markFailed(curriculum.id, 'Tahun mulai kurikulum tidak valid');
          continue;
        }
        const idSemester = `${curriculum.startYear}1`;
        const namaKurikulum = curriculum.name.slice(0, 60);

        try {
          const { data: existingData, errorCode: existingErr, errorDesc: existingErrDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetListKurikulum',
            token,
            filter: `id_prodi = '${this.escapeFeederFilter(idProdiFeeder)}' and nama_kurikulum = '${this.escapeFeederFilter(namaKurikulum)}'`,
            limit: 1,
            offset: 0,
          });
          if (existingErr !== '0') throw new Error(existingErrDesc || 'Respon Feeder tidak valid');
          const found = Array.isArray(existingData) ? existingData[0] : null;
          if (found?.id_kurikulum) {
            await this.prisma.curriculum.update({
              where: { id: curriculum.id },
              data: { feederId: found.id_kurikulum, feederSyncError: null, feederSyncErrorAt: null },
            });
            linked += 1;
            continue;
          }

          const { data: semData, errorCode: semErr, errorDesc: semErrDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetSemester',
            token,
            filter: `id_semester = '${this.escapeFeederFilter(idSemester)}'`,
            limit: 1,
            offset: 0,
          });
          if (semErr !== '0') throw new Error(semErrDesc || 'Respon Feeder tidak valid');
          if (!Array.isArray(semData) || semData.length === 0) {
            await markFailed(curriculum.id, `Semester ${idSemester} tidak ada di Feeder`);
            continue;
          }
        } catch (err: any) {
          await markFailed(curriculum.id, `Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
          continue;
        }

        if (curriculum.totalSks <= 0 || curriculum.sksWajib <= 0) {
          await markFailed(curriculum.id, `Jumlah SKS kurikulum tidak valid (total ${curriculum.totalSks}, wajib ${curriculum.sksWajib})`);
          continue;
        }

        const { data: insertData, errorCode: insertErr, errorDesc: insertErrDesc } = await this.callFeeder(setting.baseUrl, {
          act: 'InsertKurikulum',
          token,
          record: {
            nama_kurikulum: namaKurikulum,
            id_prodi: idProdiFeeder,
            id_semester: idSemester,
            jumlah_sks_lulus: curriculum.totalSks,
            jumlah_sks_wajib: curriculum.sksWajib,
            jumlah_sks_pilihan: curriculum.sksPilihan,
          },
        });
        if (insertErr !== '0' || !insertData?.id_kurikulum) {
          await markFailed(curriculum.id, `Insert kurikulum ditolak Feeder: ${insertErrDesc || 'tanpa keterangan'}`);
          continue;
        }
        await this.prisma.curriculum.update({
          where: { id: curriculum.id },
          data: { feederId: insertData.id_kurikulum, feederSyncError: null, feederSyncErrorAt: null },
        });
        created += 1;
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'KURIKULUM_PUSH_TO_FEEDER',
            detail: `Push kurikulum ke Feeder: ${processed} diproses, ${created} baru dibuat, ${linked} sudah ada (ditautkan), ${failed} gagal, ${skipped} dilewati (prodi tidak cocok).`,
          },
        });
      } catch {
        // non-blocking
      }

      const remaining = await this.prisma.curriculum.count({ where: { feederId: null } });
      const failReasonText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';

      return {
        success: true,
        message:
          `Push selesai: ${processed} diproses, ${created} kurikulum baru dibuat di Feeder, ${linked} sudah ada (ditautkan), ` +
          `${failed} gagal, ${skipped} dilewati (prodi tidak cocok ke Feeder).` +
          (remaining > 0 ? ` Masih ada ${remaining} kurikulum belum terdaftar -- jalankan Push lagi untuk lanjut.` : '') +
          failReasonText,
        processed,
        created,
        linked,
        failed,
        skipped,
        failReasons,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal push data kurikulum: ${err?.message || 'Unknown error'}`,
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {},
      };
    }
  }

  /**
   * Menarik daftar dosen resmi dari Web Service Neo Feeder PDDIKTI.
   *
   * Field & struktur di bawah ini SUDAH diverifikasi langsung ke Web Service Neo Feeder
   * sungguhan milik institusi Anda (bukan tebakan):
   *   - act list-nya `GetListDosen` (BUKAN `GetDosen`), mendukung paging limit/offset.
   *     Tapi responsnya cuma RINGKASAN -- cek langsung ke Feeder: 0 dari semua baris
   *     punya email/no HP/alamat sama sekali. Field yang beneran ada cuma: id_dosen,
   *     nama_dosen, nidn, nuptk, nip, jenis_kelamin ("L"/"P"), tanggal_lahir,
   *     nama_status_aktif ("Aktif"/dll).
   *   - Home base program studi dosen TIDAK ada di GetListDosen sama sekali -- ditarik
   *     terpisah lewat act `GetListPenugasanDosen` (pasangan id_dosen + id_prodi), lalu
   *     id_prodi itu dicocokkan ke kode_program_studi lewat act `GetProdi`.
   *   - Data lengkap (email, handphone, alamat, NIK, dst) ada di act TERPISAH LAGI:
   *     `DetailBiodataDosen` dengan `filter: "id_dosen = '<id>'"`, dipanggil SATU PER
   *     DOSEN (bukan bulk) -- makanya di bawah dipanggil belakangan, beberapa sekaligus
   *     secara paralel, setelah daftar ringkasan & home base selesai digabung.
   */
  async pullDosenFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteDosenItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);

      const dosenRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListDosen', 500, 60000);

      // Home base prodi: gabungkan GetListPenugasanDosen (id_dosen -> id_prodi) dengan
      // GetProdi (id_prodi -> kode_program_studi) supaya dapat kode prodi yang bisa
      // dicocokkan ke StudyProgram lokal. Kalau salah satu gagal ditarik, lanjutkan
      // tanpa home base (bukan gagal total) -- admin tetap bisa pilih manual.
      const prodiIdToCode = new Map<string, string>();
      try {
        const { data: prodiData, errorCode: prodiErr } = await this.callFeeder(setting.baseUrl, { act: 'GetProdi', token });
        if (prodiErr === '0' && Array.isArray(prodiData)) {
          for (const p of prodiData) {
            if (p?.id_prodi && p?.kode_program_studi) {
              prodiIdToCode.set(String(p.id_prodi), String(p.kode_program_studi).trim());
            }
          }
        }
      } catch {
        // non-blocking -- home base jadi kosong, tetap lanjut
      }

      const dosenIdToProdiCode = new Map<string, string>();
      try {
        const penugasanRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListPenugasanDosen', 500, 60000);
        for (const p of penugasanRows) {
          if (p?.id_dosen && p?.id_prodi) {
            const kode = prodiIdToCode.get(String(p.id_prodi));
            if (kode) dosenIdToProdiCode.set(String(p.id_dosen), kode);
          }
        }
      } catch {
        // non-blocking -- home base jadi kosong, tetap lanjut
      }

      // Dosen minimal punya salah satu dari NIDN atau NUPTK sebagai identitas --
      // terkonfirmasi dari tampilan Neo Feeder sungguhan (kolom NIDN & NUPTK terpisah,
      // keduanya bisa kosong salah satu). Jangan buang baris yang NIDN-nya kosong tapi
      // NUPTK-nya ada.
      const allItems: RemoteDosenItem[] = dosenRows
        .filter((r) => r?.nidn || r?.nuptk)
        .map((r) => ({
          feederId: this.cleanFeederValue(r.id_dosen),
          nidn: this.cleanFeederValue(r.nidn),
          nuptk: this.cleanFeederValue(r.nuptk),
          nip: this.cleanFeederValue(r.nip),
          nidk: this.cleanFeederValue(r.nidk),
          fullName: String(r.nama_dosen || '').trim(),
          gender: this.mapFeederGender(r.jenis_kelamin),
          birthPlace: this.cleanFeederValue(r.tempat_lahir),
          birthDate: this.parseFeederDate(r.tanggal_lahir),
          religion: this.cleanFeederValue(r.nama_agama),
          employmentStatus: this.cleanFeederValue(r.nama_status_aktif),
          prodiCode: r.id_dosen ? dosenIdToProdiCode.get(String(r.id_dosen)) : undefined,
          raw: r,
        }));

      // CATATAN: sesuai konfirmasi langsung dari admin institusi -- baris GetListDosen
      // yang TIDAK punya penugasan mengajar di prodi mana pun (tidak ada di
      // GetListPenugasanDosen) itu sebenarnya staf/tenaga kependidikan, bukan dosen
      // aktif mengajar, meskipun Feeder memasukkan mereka ke daftar "Dosen". Baris
      // seperti itu sengaja dilewati di sini, bukan dipaksa pilih prodi secara manual.
      const items = allItems.filter((i) => i.prodiCode);
      const skippedAsStaff = allItems.length - items.length;

      // GetListDosen itu cuma ringkasan -- TIDAK ada email, no HP, alamat, dst sama
      // sekali (terkonfirmasi: 0 dari 49 baris punya field itu). Data lengkap per-dosen
      // baru ada di act terpisah `DetailBiodataDosen` (filter per id_dosen), termasuk
      // email, handphone, alamat lengkap, NIK, dst. Dipanggil di sini satu per satu,
      // beberapa dosen sekaligus secara paralel supaya tidak terlalu lama -- kalau satu
      // dosen gagal diambil detailnya, dosen itu tetap disertakan pakai data ringkasan
      // saja (bukan digagalkan semua).
      const BIODATA_CONCURRENCY = 8;
      for (let i = 0; i < items.length; i += BIODATA_CONCURRENCY) {
        const batch = items.slice(i, i + BIODATA_CONCURRENCY);
        await Promise.all(
          batch.map(async (item) => {
            const idDosen = item.raw?.id_dosen;
            if (!idDosen) return;
            try {
              const { data, errorCode } = await this.callFeeder(
                setting.baseUrl,
                { act: 'DetailBiodataDosen', token, filter: `id_dosen = '${this.escapeFeederFilter(String(idDosen))}'` },
                15000
              );
              const biodata = errorCode === '0' && Array.isArray(data) ? data[0] : null;
              if (!biodata) return;
              // ds_kel dari Feeder datang sebagai "Kelurahan-Kecamatan" digabung satu string
              // dengan tanda strip -- dipecah di sini supaya bisa dipetakan ke dua kolom
              // terpisah (kelurahan & kecamatan) yang dipakai UI cascading Provinsi/Kab/Kec/Kel.
              let dsKelurahan: string | undefined;
              let dsKecamatan: string | undefined;
              const dsKel = this.cleanFeederValue(biodata.ds_kel);
              if (dsKel) {
                const parts = dsKel.split('-');
                if (parts.length >= 2) {
                  dsKelurahan = parts[0].trim();
                  dsKecamatan = parts.slice(1).join('-').trim();
                } else {
                  dsKelurahan = dsKel;
                }
              }
              const rt = this.cleanFeederValue(biodata.rt);
              const rw = this.cleanFeederValue(biodata.rw);
              item.email = this.cleanFeederValue(biodata.email) || item.email;
              item.phone = this.cleanFeederValue(biodata.handphone) || item.phone;
              item.officePhone = this.cleanFeederValue(biodata.telepon);
              item.religion = this.cleanFeederValue(biodata.nama_agama) || item.religion;
              item.birthPlace = this.cleanFeederValue(biodata.tempat_lahir) || item.birthPlace;
              item.nik = this.cleanFeederValue(biodata.nik);
              item.npwp = this.cleanFeederValue(biodata.npwp);
              item.motherName = this.cleanFeederValue(biodata.nama_ibu_kandung);
              item.maritalStatus = this.cleanFeederValue(biodata.status_pernikahan);
              item.spouseName = this.cleanFeederValue(biodata.nama_suami_istri);
              item.spouseNip = this.cleanFeederValue(biodata.nip_suami_istri);
              item.spouseOccupation = this.cleanFeederValue(biodata.nama_pekerjaan_suami_istri);
              item.sdmType = this.cleanFeederValue(biodata.nama_jenis_sdm);
              item.rankGroup = this.cleanFeederValue(biodata.nama_pangkat_golongan);
              item.salarySource = this.cleanFeederValue(biodata.nama_sumber_gaji);
              item.skNumber = this.cleanFeederValue(biodata.no_sk_pengangkatan);
              item.skDate = this.parseFeederDate(biodata.mulai_sk_pengangkatan);
              item.appointingInstitution = this.cleanFeederValue(biodata.nama_lembaga_pengangkatan);
              item.address = this.cleanFeederValue(biodata.jalan);
              item.dusun = this.cleanFeederValue(biodata.dusun);
              item.rtRw = rt || rw ? `${rt || ''}/${rw || ''}` : undefined;
              // nama_wilayah TIDAK selalu level kabupaten/kota walau namanya begitu --
              // terkonfirmasi dari data nyata, untuk sebagian besar dosen di institusi ini
              // nama_wilayah justru berisi teks level KECAMATAN (mis. "Kec. Rakit"), bukan
              // kabupaten (mis. "Kab. Cilacap"). Kalau dipetakan buta ke `city`, hasilnya
              // salah kolom (kecamatan nyasar ke field Kabupaten/Kota). Diklasifikasi di
              // sini berdasarkan prefiksnya supaya masuk ke kolom yang benar.
              const namaWilayah = this.cleanFeederValue(biodata.nama_wilayah);
              const isKecamatanLevel = namaWilayah ? /^kec\.?\s/i.test(namaWilayah) : false;
              item.kelurahan = dsKelurahan;
              item.kecamatan = dsKecamatan || (isKecamatanLevel ? namaWilayah : undefined);
              item.city = isKecamatanLevel ? undefined : namaWilayah;
              item.postalCode = this.cleanFeederValue(biodata.kode_pos);
              item.raw = { ...item.raw, biodata };
            } catch {
              // non-blocking -- dosen ini tetap disertakan dengan data ringkasan saja
            }
          })
        );
      }

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return {
        success: true,
        message:
          skippedAsStaff > 0
            ? `Berhasil menarik ${items.length} dosen dari Web Service Neo Feeder. ${skippedAsStaff} baris dilewati karena tidak punya penugasan mengajar di prodi mana pun (kemungkinan staf/tenaga kependidikan, bukan dosen).`
            : `Berhasil menarik ${items.length} dosen dari Web Service Neo Feeder.`,
        items,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menarik data dari Web Service Neo Feeder: ${err?.message || 'Unknown error'}`,
        items: [],
      };
    }
  }

  /**
   * Menyamakan data dosen lokal dengan hasil tarikan dari Feeder, dicocokkan lewat NIDN
   * ATAU NUPTK (dosen bisa cuma punya salah satu). Dosen yang belum ada lokal wajib
   * sudah punya `studyProgramId` (home base prodi) terisi -- dicocokkan otomatis di
   * frontend lewat `prodiCode`, atau dipilih manual oleh admin kalau tidak ketemu, sama
   * seperti alur sinkronisasi Prodi.
   */
  async syncDosenFromFeeder(items: RemoteDosenItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, message: 'Tidak ada data dosen untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const nidn = item.nidn?.trim();
      const nuptk = item.nuptk?.trim();
      const feederId = item.feederId?.trim();
      if ((!nidn && !nuptk) || !item.fullName?.trim()) continue;

      // feederId (id_dosen) paling stabil buat pencocokan ulang -- NIDN/NUPTK dosen baru
      // kadang belum terbit saat pertama ditarik, jadi dicek duluan sebelum fallback ke
      // NIDN/NUPTK supaya tidak membuat baris duplikat untuk dosen yang sama.
      const existing = await this.prisma.lecturer.findFirst({
        where: {
          OR: [...(feederId ? [{ feederId }] : []), ...(nidn ? [{ nidn }] : []), ...(nuptk ? [{ nuptk }] : [])],
        },
      });

      if (existing) {
        await this.prisma.lecturer.update({
          where: { id: existing.id },
          data: {
            feederId: feederId || existing.feederId,
            nidn: nidn || existing.nidn,
            nuptk: nuptk || existing.nuptk,
            nip: item.nip?.trim() || existing.nip,
            nidk: item.nidk?.trim() || existing.nidk,
            nik: item.nik?.trim() || existing.nik,
            npwp: item.npwp?.trim() || existing.npwp,
            gender: item.gender || existing.gender,
            birthPlace: item.birthPlace?.trim() || existing.birthPlace,
            birthDate: item.birthDate ? new Date(item.birthDate) : existing.birthDate,
            phone: item.phone?.trim() || existing.phone,
            officePhone: item.officePhone?.trim() || existing.officePhone,
            functionalPosition: item.functionalPosition?.trim() || existing.functionalPosition,
            employmentStatus: item.employmentStatus?.trim() || existing.employmentStatus,
            lastEducation: item.lastEducation?.trim() || existing.lastEducation,
            religion: item.religion?.trim() || existing.religion,
            motherName: item.motherName?.trim() || existing.motherName,
            maritalStatus: item.maritalStatus?.trim() || existing.maritalStatus,
            spouseName: item.spouseName?.trim() || existing.spouseName,
            spouseNip: item.spouseNip?.trim() || existing.spouseNip,
            spouseOccupation: item.spouseOccupation?.trim() || existing.spouseOccupation,
            sdmType: item.sdmType?.trim() || existing.sdmType,
            rankGroup: item.rankGroup?.trim() || existing.rankGroup,
            salarySource: item.salarySource?.trim() || existing.salarySource,
            skNumber: item.skNumber?.trim() || existing.skNumber,
            skDate: item.skDate ? new Date(item.skDate) : existing.skDate,
            appointingInstitution: item.appointingInstitution?.trim() || existing.appointingInstitution,
            address: item.address?.trim() || existing.address,
            dusun: item.dusun?.trim() || existing.dusun,
            rtRw: item.rtRw?.trim() || existing.rtRw,
            kelurahan: item.kelurahan?.trim() || existing.kelurahan,
            kecamatan: item.kecamatan?.trim() || existing.kecamatan,
            city: item.city?.trim() || existing.city,
            postalCode: item.postalCode?.trim() || existing.postalCode,
          },
        });
        // Kalau Feeder sekarang punya email ASLI (dari DetailBiodataDosen) dan email
        // lokal masih pakai fallback bentukan sistem ({nidn}@dosen...), ganti ke yang
        // asli -- tapi jangan timpa kalau admin sudah ubah manual ke email lain.
        if (item.email?.trim() && existing.userId) {
          const currentUser = await this.prisma.user.findUnique({ where: { id: existing.userId } });
          const looksLikeFallback = currentUser?.email?.endsWith('@dosen.itn.ac.id');
          if (currentUser?.email !== item.email.trim() && (looksLikeFallback || !currentUser?.email)) {
            const emailTaken = await this.prisma.user.findUnique({ where: { email: item.email.trim() } });
            if (!emailTaken) {
              await this.prisma.user.update({ where: { id: existing.userId }, data: { email: item.email.trim() } });
            }
          }
        }
        await this.prisma.user.update({
          where: { id: existing.userId },
          data: { fullName: item.fullName.trim() },
        });
        updated += 1;
        continue;
      }

      if (!item.studyProgramId?.trim()) {
        skipped += 1;
        continue;
      }

      const studyProgram = await this.prisma.studyProgram.findUnique({ where: { id: item.studyProgramId.trim() } });
      if (!studyProgram) {
        skipped += 1;
        continue;
      }

      const email = item.email?.trim() || `${nidn || nuptk}@dosen.itn.ac.id`;
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        skipped += 1;
        continue;
      }

      // Password awal = tanggal lahir (DDMMYYYY), fallback ke NIDN/NUPTK kalau Feeder
      // tidak punya tanggal lahirnya -- supaya tiap dosen punya password awal yang beda,
      // bukan satu string statis yang dibagi rame-rame ke semua akun.
      const defaultPassword = item.birthDate
        ? (() => {
            const d = new Date(item.birthDate!);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${dd}${mm}${d.getFullYear()}`;
          })()
        : nidn || nuptk || '12345678';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName: item.fullName.trim(),
          role: 'LECTURER',
          passwordHash,
        },
      });

      await this.prisma.lecturer.create({
        data: {
          userId: user.id,
          studyProgramId: studyProgram.id,
          feederId: feederId || null,
          nidn: nidn || null,
          nuptk: nuptk || null,
          nip: item.nip?.trim() || null,
          nidk: item.nidk?.trim() || null,
          nik: item.nik?.trim() || null,
          npwp: item.npwp?.trim() || null,
          gender: item.gender || 'MALE',
          birthPlace: item.birthPlace?.trim() || null,
          birthDate: item.birthDate ? new Date(item.birthDate) : null,
          phone: item.phone?.trim() || null,
          officePhone: item.officePhone?.trim() || null,
          functionalPosition: item.functionalPosition?.trim() || null,
          employmentStatus: item.employmentStatus?.trim() || null,
          lastEducation: item.lastEducation?.trim() || null,
          religion: item.religion?.trim() || null,
          motherName: item.motherName?.trim() || null,
          maritalStatus: item.maritalStatus?.trim() || null,
          spouseName: item.spouseName?.trim() || null,
          spouseNip: item.spouseNip?.trim() || null,
          spouseOccupation: item.spouseOccupation?.trim() || null,
          sdmType: item.sdmType?.trim() || null,
          rankGroup: item.rankGroup?.trim() || null,
          salarySource: item.salarySource?.trim() || null,
          skNumber: item.skNumber?.trim() || null,
          skDate: item.skDate ? new Date(item.skDate) : null,
          appointingInstitution: item.appointingInstitution?.trim() || null,
          address: item.address?.trim() || null,
          dusun: item.dusun?.trim() || null,
          rtRw: item.rtRw?.trim() || null,
          kelurahan: item.kelurahan?.trim() || null,
          kecamatan: item.kecamatan?.trim() || null,
          city: item.city?.trim() || null,
          postalCode: item.postalCode?.trim() || null,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'DOSEN_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi dosen dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati (prodi belum dipilih/email bentrok).`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} dosen baru dibuat, ${updated} diperbarui, ${skipped} dilewati.`
          : `Sinkronisasi selesai: ${created} dosen baru dibuat, ${updated} dosen diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /**
   * Daftar tahun angkatan yang bisa dipilih admin sebelum Pull Mahasiswa -- gabungan dari
   * data mahasiswa lokal (yang sudah tersinkron) DAN contoh data Feeder (yang belum pernah
   * ditarik sama sekali), supaya satu angkatan yang sudah ada secara lokal tapi tahun lain
   * masih di Feeder tetap sama-sama muncul. Digabung lewat Set, jadi otomatis tidak dobel.
   */
  async getMahasiswaAngkatanOptions(): Promise<{ success: boolean; message: string; source: 'merged' | 'local' | 'feeder' | 'none'; years: number[] }> {
    const localYears = await this.prisma.student.findMany({
      distinct: ['entryYear'],
      select: { entryYear: true },
    });
    const years = new Set<number>(localYears.map((y) => y.entryYear));

    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    let feederOk = false;
    let feederError: string | null = null;

    if (setting?.baseUrl && setting?.username && setting?.password) {
      try {
        const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password, 8000);
        // Sample tanpa filter angkatan (bukan loop semua halaman -- institusi bisa punya
        // puluhan ribu baris riwayat pendidikan) supaya tetap cepat, tapi cukup besar untuk
        // menangkap sebagian besar tahun angkatan yang pernah ada.
        const { data, errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
          act: 'GetListRiwayatPendidikanMahasiswa',
          token,
          limit: 2000,
          offset: 0,
        });
        if (errorCode === '0' && Array.isArray(data)) {
          feederOk = true;
          for (const r of data) {
            const periode = this.cleanFeederValue(r?.id_periode_masuk);
            if (!periode) continue;
            const y = parseInt(periode.slice(0, 4), 10);
            if (!Number.isNaN(y)) years.add(y);
          }
        } else {
          feederError = errorDesc || 'Feeder menolak permintaan contoh data.';
        }
      } catch (err: any) {
        feederError = err?.message || 'Gagal menghubungi Feeder.';
      }
    } else {
      feederError = 'Konfigurasi Web Service Neo Feeder belum lengkap.';
    }

    const sorted = Array.from(years).sort((a, b) => b - a);
    const source = localYears.length > 0 && feederOk ? 'merged' : localYears.length > 0 ? 'local' : feederOk ? 'feeder' : 'none';

    if (sorted.length === 0) {
      return { success: false, message: feederError || 'Tidak ada data mahasiswa yang ditemukan.', source: 'none', years: [] };
    }

    return {
      success: true,
      message:
        source === 'merged'
          ? `${sorted.length} tahun angkatan ditemukan (gabungan data lokal & contoh data Feeder).`
          : source === 'local'
            ? `${sorted.length} tahun angkatan ditemukan dari data mahasiswa lokal${feederError ? ` (Feeder tidak bisa dihubungi: ${feederError})` : ''}.`
            : `${sorted.length} tahun angkatan ditemukan dari contoh data Feeder (belum ada mahasiswa lokal tersinkron).`,
      source,
      years: sorted,
    };
  }

  /**
   * Menarik daftar mahasiswa dari Web Service Neo Feeder PDDIKTI, berdasarkan riwayat
   * pendidikan (`GetListRiwayatPendidikanMahasiswa`), lalu diperkaya dengan biodata
   * lengkap lewat `GetBiodataMahasiswa` (filter batch `id_mahasiswa IN (...)`, bukan satu
   * per satu seperti dosen -- field ini mendukung filter IN jadi lebih efisien).
   *
   * `angkatan` opsional: kalau diisi (mis. "2023"), filter ke Feeder dibatasi
   * `id_periode_masuk LIKE '2023%'` supaya tidak menarik seluruh riwayat mahasiswa dari
   * awal berdirinya institusi sekaligus. Kalau kosong, semua angkatan ditarik.
   */
  async pullMahasiswaFromFeeder(angkatan?: string): Promise<{ success: boolean; message: string; items: RemoteMahasiswaItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);

      const filterBody = angkatan?.trim()
        ? { filter: `id_periode_masuk LIKE '${this.escapeFeederFilter(angkatan.trim())}%'` }
        : undefined;
      const mhsRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListRiwayatPendidikanMahasiswa', 200, 60000, filterBody);

      if (mhsRows.length === 0) {
        return {
          success: true,
          message: angkatan ? `Tidak ada mahasiswa angkatan ${angkatan} yang ditemukan di Feeder.` : 'Tidak ada data mahasiswa yang ditemukan di Feeder.',
          items: [],
        };
      }

      const prodiIdToCode = new Map<string, string>();
      try {
        const { data: prodiData, errorCode: prodiErr } = await this.callFeeder(setting.baseUrl, { act: 'GetProdi', token });
        if (prodiErr === '0' && Array.isArray(prodiData)) {
          for (const p of prodiData) {
            if (p?.id_prodi && p?.kode_program_studi) {
              prodiIdToCode.set(String(p.id_prodi), String(p.kode_program_studi).trim());
            }
          }
        }
      } catch {
        // non-blocking -- home base jadi kosong, tetap lanjut
      }

      const items: RemoteMahasiswaItem[] = mhsRows
        .filter((r) => r?.nim || r?.nik)
        .map((r) => {
          const idJenisKeluar = r.id_jenis_keluar;
          const statusText = String(r.nama_jenis_keluar || r.id_status_mahasiswa || '').toLowerCase();
          let status: RemoteMahasiswaItem['status'] = 'ACTIVE';
          if (statusText.includes('lulus') || idJenisKeluar === 1) {
            status = 'GRADUATED';
          } else if (statusText.includes('cuti') || statusText === 'c') {
            status = 'LEAVE';
          } else if (
            statusText.includes('drop') ||
            statusText.includes('putus') ||
            statusText.includes('wafat') ||
            statusText.includes('keluar') ||
            statusText.includes('non') ||
            [3, 5, 6].includes(idJenisKeluar)
          ) {
            status = 'DROPOUT';
          }

          const periodeMasuk = this.cleanFeederValue(r.id_periode_masuk);
          const entryYear = periodeMasuk ? parseInt(periodeMasuk.slice(0, 4), 10) : undefined;

          return {
            feederId: this.cleanFeederValue(r.id_mahasiswa),
            feederRegistrationId: this.cleanFeederValue(r.id_registrasi_mahasiswa),
            nim: this.cleanFeederValue(r.nim),
            nik: this.cleanFeederValue(r.nik),
            fullName: String(r.nama_mahasiswa || r.nama_lengkap || '').trim(),
            gender: this.mapFeederGender(r.jenis_kelamin),
            birthPlace: this.cleanFeederValue(r.tempat_lahir),
            birthDate: this.parseFeederDate(r.tanggal_lahir),
            entryYear: entryYear && !Number.isNaN(entryYear) ? entryYear : undefined,
            status,
            motherName: this.cleanFeederValue(r.nama_ibu_kandung),
            prodiCode: r.id_prodi ? prodiIdToCode.get(String(r.id_prodi)) : undefined,
            raw: r,
          };
        });

      // GetListRiwayatPendidikanMahasiswa kadang mengembalikan lebih dari satu baris untuk
      // mahasiswa yang sama (mis. riwayat pindah prodi/her-registrasi) -- dedupe di sini
      // berdasarkan NIM (identitas sungguhan), fallback feederId kalau NIM kosong. Kalau
      // dibiarkan dobel, bukan cuma React key yang bentrok di UI, tapi NIM unique constraint
      // di database juga bisa gagal saat sync.
      const seen = new Set<string>();
      const dedupedItems = items.filter((item) => {
        const dedupeKey = item.nim || item.feederId || '';
        if (!dedupeKey || seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
      });

      // Semester berjalan dihitung dari GetAktivitasKuliahMahasiswa -- JUMLAH baris
      // berstatus "Aktif" (id_status_mahasiswa = 'A', bukan Cuti/Nonaktif) per mahasiswa,
      // ini act GLOBAL yang bisa ditarik tanpa filter (beda dari GetDetailNilaiPerkuliahanKelas
      // yang wajib difilter per kelas) jadi tidak perlu loop per-mahasiswa.
      try {
        const aktivitasRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetAktivitasKuliahMahasiswa', 500, 60000);
        const semesterCountMap = new Map<string, number>();
        for (const r of aktivitasRows) {
          const idMhs = this.cleanFeederValue(r?.id_mahasiswa);
          if (!idMhs) continue;
          const statusId = this.cleanFeederValue(r?.id_status_mahasiswa);
          if (statusId !== 'A') continue;
          semesterCountMap.set(idMhs, (semesterCountMap.get(idMhs) || 0) + 1);
        }
        for (const item of dedupedItems) {
          if (item.feederId && semesterCountMap.has(item.feederId)) {
            item.currentSemester = semesterCountMap.get(item.feederId);
          }
        }
      } catch {
        // non-blocking -- currentSemester dibiarkan kosong, tidak menebak/menimpa nilai lokal
      }

      // GetBiodataMahasiswa mendukung filter IN -- diambil sekaligus per batch 100 id,
      // bukan satu per satu seperti dosen (DetailBiodataDosen tidak mendukung IN).
      const BIODATA_BATCH = 100;
      const idsWithFeederId = dedupedItems.filter((i) => i.feederId);
      const applyBio = (item: RemoteMahasiswaItem, bio: any) => {
        item.email = this.cleanFeederValue(bio.email);
        item.phone = this.cleanFeederValue(bio.handphone) || this.cleanFeederValue(bio.telepon);
        item.religion = this.cleanFeederValue(bio.nama_agama);
        item.birthPlace = this.cleanFeederValue(bio.tempat_lahir) || item.birthPlace;
        item.address = this.cleanFeederValue(bio.jalan);
        item.kecamatan = this.cleanFeederValue(bio.nama_wilayah);
        item.postalCode = this.cleanFeederValue(bio.kodepos);
        item.fatherName = this.cleanFeederValue(bio.nama_ayah);
        item.fatherPhone = this.cleanFeederValue(bio.no_hp_ayah);
        item.fatherJob = this.cleanFeederValue(bio.nama_pekerjaan_ayah);
        item.fatherIncome = this.cleanFeederValue(bio.nama_penghasilan_ayah);
        item.motherName = this.cleanFeederValue(bio.nama_ibu_kandung) || item.motherName;
        item.motherPhone = this.cleanFeederValue(bio.no_hp_ibu);
        item.motherJob = this.cleanFeederValue(bio.nama_pekerjaan_ibu);
        item.motherIncome = this.cleanFeederValue(bio.nama_penghasilan_ibu);
        item.raw = { ...item.raw, biodata: bio };
      };
      for (let i = 0; i < idsWithFeederId.length; i += BIODATA_BATCH) {
        const batch = idsWithFeederId.slice(i, i + BIODATA_BATCH);
        const idsFilter = batch.map((it) => this.escapeFeederFilter(it.feederId!)).join("', '");
        try {
          const { data, errorCode } = await this.callFeeder(
            setting.baseUrl,
            { act: 'GetBiodataMahasiswa', token, filter: `id_mahasiswa IN ('${idsFilter}')`, limit: BIODATA_BATCH, offset: 0 },
            30000
          );
          if (errorCode !== '0' || !Array.isArray(data)) continue;
          const biodataMap = new Map<string, any>();
          for (const b of data) {
            if (b?.id_mahasiswa) biodataMap.set(String(b.id_mahasiswa), b);
          }
          for (const item of batch) {
            const bio = item.feederId ? biodataMap.get(item.feederId) : undefined;
            if (bio) applyBio(item, bio);
          }
        } catch {
          // non-blocking -- batch ini tetap disertakan dengan data ringkasan saja
        }
      }

      // Filter IN bisa tidak andal di beberapa versi Feeder (batch dikembalikan kosong/kurang,
      // dan tanpa error) -- yang biodatanya belum terambil dicari ulang satu per satu supaya
      // email, HP, dan alamat tidak diam-diam kosong.
      const withoutBio = idsWithFeederId.filter((it) => !it.raw?.biodata);
      await this.runWithConcurrency(withoutBio, 5, async (item) => {
        try {
          const { data, errorCode } = await this.callFeeder(
            setting.baseUrl,
            {
              act: 'GetBiodataMahasiswa',
              token,
              filter: `id_mahasiswa = '${this.escapeFeederFilter(item.feederId!)}'`,
              limit: 1,
              offset: 0,
            },
            30000
          );
          const bio = errorCode === '0' && Array.isArray(data) ? data[0] : null;
          if (bio) applyBio(item, bio);
        } catch {
          // non-blocking
        }
      });

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return {
        success: true,
        message: `Berhasil menarik ${dedupedItems.length} mahasiswa dari Web Service Neo Feeder.`,
        items: dedupedItems,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data mahasiswa: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /**
   * Sinkronkan hasil pull mahasiswa ke database lokal. Sama seperti dosen: dicocokkan
   * lewat feederId dulu (kunci paling stabil), baru fallback ke NIM. Akun baru dibuat
   * otomatis dengan password default = tanggal lahir format DDMMYYYY (fallback ke NIM
   * kalau tanggal lahir tidak ada), supaya setiap mahasiswa dapat password awal yang
   * berbeda, bukan satu string statis dibagi rame-rame.
   */
  async syncMahasiswaFromFeeder(items: RemoteMahasiswaItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, message: 'Tidak ada data mahasiswa untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const nim = item.nim?.trim();
      const feederId = item.feederId?.trim();
      if (!nim || !item.fullName?.trim()) {
        skipped += 1;
        continue;
      }

      const existing = await this.prisma.student.findFirst({
        where: { OR: [...(feederId ? [{ feederId }] : []), { nim }] },
      });

      if (existing) {
        await this.prisma.student.update({
          where: { id: existing.id },
          data: {
            feederId: feederId || existing.feederId,
            feederRegistrationId: item.feederRegistrationId?.trim() || existing.feederRegistrationId,
            nik: item.nik?.trim() || existing.nik,
            gender: item.gender || existing.gender,
            birthPlace: item.birthPlace?.trim() || existing.birthPlace,
            birthDate: item.birthDate ? new Date(item.birthDate) : existing.birthDate,
            entryYear: item.entryYear || existing.entryYear,
            currentSemester: item.currentSemester ?? existing.currentSemester,
            status: item.status || existing.status,
            phone: item.phone?.trim() || existing.phone,
            religion: item.religion?.trim() || existing.religion,
            address: item.address?.trim() || existing.address,
            kecamatan: item.kecamatan?.trim() || existing.kecamatan,
            postalCode: item.postalCode?.trim() || existing.postalCode,
            fatherName: item.fatherName?.trim() || existing.fatherName,
            fatherPhone: item.fatherPhone?.trim() || existing.fatherPhone,
            fatherJob: item.fatherJob?.trim() || existing.fatherJob,
            fatherIncome: item.fatherIncome?.trim() || existing.fatherIncome,
            motherName: item.motherName?.trim() || existing.motherName,
            motherPhone: item.motherPhone?.trim() || existing.motherPhone,
            motherJob: item.motherJob?.trim() || existing.motherJob,
            motherIncome: item.motherIncome?.trim() || existing.motherIncome,
          },
        });
        // Email dari Feeder dianggap sumber kebenaran saat Pull: menggantikan email lokal
        // yang berbeda, kecuali sudah dipakai akun lain (unik) -- tidak ditimpa diam-diam.
        const feederEmail = item.email?.trim().toLowerCase();
        if (feederEmail && existing.userId) {
          const currentUser = await this.prisma.user.findUnique({ where: { id: existing.userId } });
          if (currentUser && currentUser.email.toLowerCase() !== feederEmail) {
            const emailTaken = await this.prisma.user.findUnique({ where: { email: feederEmail } });
            if (!emailTaken) {
              await this.prisma.user.update({ where: { id: existing.userId }, data: { email: feederEmail } });
            }
          }
        }
        await this.prisma.user.update({
          where: { id: existing.userId },
          data: { fullName: item.fullName.trim() },
        });
        updated += 1;
        continue;
      }

      if (!item.studyProgramId?.trim()) {
        skipped += 1;
        continue;
      }

      const studyProgram = await this.prisma.studyProgram.findUnique({ where: { id: item.studyProgramId.trim() } });
      if (!studyProgram) {
        skipped += 1;
        continue;
      }

      const email = item.email?.trim() || `${nim}@mahasiswa.itn.ac.id`;
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        skipped += 1;
        continue;
      }

      const defaultPassword = item.birthDate
        ? (() => {
            const d = new Date(item.birthDate!);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            return `${dd}${mm}${d.getFullYear()}`;
          })()
        : nim;
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          fullName: item.fullName.trim(),
          role: 'STUDENT',
          passwordHash,
        },
      });

      await this.prisma.student.create({
        data: {
          userId: user.id,
          studyProgramId: studyProgram.id,
          feederId: feederId || null,
          feederRegistrationId: item.feederRegistrationId?.trim() || null,
          nim,
          nik: item.nik?.trim() || null,
          gender: item.gender || 'MALE',
          birthPlace: item.birthPlace?.trim() || null,
          birthDate: item.birthDate ? new Date(item.birthDate) : null,
          entryYear: item.entryYear || new Date().getFullYear(),
          currentSemester: item.currentSemester || 1,
          status: item.status || 'ACTIVE',
          phone: item.phone?.trim() || null,
          religion: item.religion?.trim() || null,
          address: item.address?.trim() || null,
          kecamatan: item.kecamatan?.trim() || null,
          postalCode: item.postalCode?.trim() || null,
          fatherName: item.fatherName?.trim() || null,
          fatherPhone: item.fatherPhone?.trim() || null,
          fatherJob: item.fatherJob?.trim() || null,
          fatherIncome: item.fatherIncome?.trim() || null,
          motherName: item.motherName?.trim() || null,
          motherPhone: item.motherPhone?.trim() || null,
          motherJob: item.motherJob?.trim() || null,
          motherIncome: item.motherIncome?.trim() || null,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'MAHASISWA_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi mahasiswa dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} mahasiswa baru dibuat, ${updated} diperbarui, ${skipped} dilewati.`
          : `Sinkronisasi selesai: ${created} mahasiswa baru dibuat, ${updated} mahasiswa diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /** id_agama Feeder (GetAgama) dari teks agama lokal; default 1 (Islam) kalau kosong/tidak dikenali -- Feeder mewajibkan field ini. */
  private agamaToFeederId(religion?: string | null): number {
    const r = (religion || '').toLowerCase();
    if (r.includes('protestan') || r.includes('kristen')) return 2;
    if (r.includes('katolik')) return 3;
    if (r.includes('hindu')) return 4;
    if (r.includes('budha') || r.includes('buddha')) return 5;
    if (r.includes('khong') || r.includes('konghucu')) return 6;
    return 1;
  }

  /**
   * Cari id_wilayah (level 3 = kecamatan) di Feeder dari nama kecamatan + kabupaten/kota lokal.
   * Hanya membaca (GetWilayah). Tidak menebak -- kalau tidak ketemu atau ambigu, dikembalikan
   * alasan gagal supaya admin tahu persis harus melengkapi data apa, bukan silent-wrong-match.
   */
  // ---- Pencarian perguruan tinggi / program studi asal untuk formulir PMB (membaca referensi Feeder, di-cache) ----
  private originCache = new Map<string, { data: any[]; expiresAt: number }>();
  private originToken: { token: string; expiresAt: number } | null = null;

  private readonly originLogger = new Logger('OriginSearch');
  // Neo Feeder kampus sering lambat membalas; sama dengan batas waktu sinkronisasi lain, bukan 8 detik.
  private static readonly ORIGIN_TIMEOUT_MS = 20000;

  private async getOriginSession(forceNew = false): Promise<{ baseUrl: string; token: string } | null> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) return null;
    if (!forceNew && this.originToken && this.originToken.expiresAt > Date.now()) {
      return { baseUrl: setting.baseUrl, token: this.originToken.token };
    }
    const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password, IntegrationSettingsService.ORIGIN_TIMEOUT_MS);
    this.originToken = { token, expiresAt: Date.now() + 10 * 60 * 1000 };
    return { baseUrl: setting.baseUrl, token };
  }

  /**
   * Pencarian ke referensi Feeder dengan cache. Mengembalikan status agar klien bisa membedakan "tidak ada hasil"
   * dari "daftar tidak dapat dimuat" (Feeder belum dikonfigurasi / lambat / menolak). Penyebab dicatat di log server.
   */
  private async cachedOriginLookup(
    key: string,
    act: string,
    filter: string,
    limit: number,
    map: (r: any) => any,
  ): Promise<{ items: any[]; status: 'OK' | 'NOT_CONFIGURED' | 'UNAVAILABLE' }> {
    const hit = this.originCache.get(key);
    if (hit && hit.expiresAt > Date.now()) return { items: hit.data, status: 'OK' };
    const started = Date.now();
    try {
      let session = await this.getOriginSession();
      if (!session) {
        this.originLogger.warn(`${act}: pengaturan Web Service Neo Feeder belum lengkap (Pengaturan DIKTI).`);
        return { items: [], status: 'NOT_CONFIGURED' };
      }
      const timeout = IntegrationSettingsService.ORIGIN_TIMEOUT_MS;
      let res = await this.callFeeder(session.baseUrl, { act, token: session.token, filter, limit, offset: 0 }, timeout);
      if (res.errorCode !== '0') {
        // token mungkin kedaluwarsa: ambil token baru sekali lalu ulangi
        session = await this.getOriginSession(true);
        if (!session) return { items: [], status: 'NOT_CONFIGURED' };
        res = await this.callFeeder(session.baseUrl, { act, token: session.token, filter, limit, offset: 0 }, timeout);
      }
      if (res.errorCode !== '0' || !Array.isArray(res.data)) {
        this.originLogger.warn(`${act} ditolak Feeder (kode ${res.errorCode ?? '-'}): ${res.errorDesc || 'tanpa keterangan'} -- filter: ${filter}`);
        return { items: [], status: 'UNAVAILABLE' };
      }
      const data = res.data.map(map).filter((r: any) => r.id && r.name);
      if (data.length === 0 && res.data.length > 0) {
        this.originLogger.warn(`${act}: ${res.data.length} baris diterima tetapi tidak ada yang berisi id dan nama; nama kolom Feeder mungkin berbeda. Contoh baris: ${JSON.stringify(res.data[0]).slice(0, 300)}`);
      }
      if (this.originCache.size > 500) this.originCache.clear();
      this.originCache.set(key, { data, expiresAt: Date.now() + 10 * 60 * 1000 });
      return { items: data, status: 'OK' };
    } catch (err: any) {
      this.originLogger.warn(`${act} gagal setelah ${Date.now() - started} ms: ${err?.message || err}`);
      return { items: [], status: 'UNAVAILABLE' };
    }
  }

  /** Cari perguruan tinggi di referensi Feeder (min. 3 huruf). */
  async searchOriginUniversities(query: string) {
    const q = String(query ?? '').trim();
    if (q.length < 3) return { items: [], status: 'OK' as const };
    return this.cachedOriginLookup(
      `pt:${q.toLowerCase()}`,
      'GetAllPT',
      `nama_perguruan_tinggi ilike '%${this.escapeFeederFilter(q)}%'`,
      15,
      (r) => ({ id: String(r.id_perguruan_tinggi ?? ''), code: String(r.kode_perguruan_tinggi ?? ''), name: String(r.nama_perguruan_tinggi ?? '').trim() }),
    );
  }

  /** Cari program studi pada satu perguruan tinggi di referensi Feeder. `query` boleh kosong untuk menampilkan daftar awal. */
  async searchOriginStudyPrograms(universityId: string, query?: string) {
    const uid = String(universityId ?? '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(uid)) return { items: [], status: 'OK' as const };
    const q = String(query ?? '').trim();
    const filter = `id_perguruan_tinggi = '${uid}'` + (q ? ` and nama_program_studi ilike '%${this.escapeFeederFilter(q)}%'` : '');
    return this.cachedOriginLookup(`prodi:${uid}:${q.toLowerCase()}`, 'GetAllProdi', filter, 30, (r) => {
      const jenjang = String(r.nama_jenjang_pendidikan ?? '').trim();
      const nama = String(r.nama_program_studi ?? '').trim();
      return { id: String(r.id_prodi ?? ''), code: String(r.kode_program_studi ?? ''), jenjang, name: nama, label: jenjang ? `${jenjang} ${nama}` : nama };
    });
  }

  /** Normalisasi nama untuk pencocokan: huruf kecil, tanpa tanda baca dan spasi ganda. */
  private normalizeName(v: string): string {
    return v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  /**
   * Memetakan kategori mahasiswa SIAKAD ke id_jenis_daftar Feeder dengan membaca referensi Feeder sendiri
   * (act GetJenisPendaftaran) dan mencocokkan NAMA jenisnya, bukan angka tetap, karena daftar tiap versi
   * Neo Feeder bisa berbeda. Kategori yang namanya tidak ditemukan bernilai null.
   */
  private async resolveJenisDaftar(baseUrl: string, token: string): Promise<Record<string, string | null>> {
    const patterns: Record<string, RegExp> = {
      BARU: /^peserta didik baru$/i,
      TRANSFER: /^pindahan$/i,
      RPL: /rpl\s+perolehan\s+sks/i,
      RPL_PEROLEHAN: /rpl\s+perolehan\s+sks/i,
      RPL_TRANSFER: /rpl\s+transfer\s+sks/i,
      NON_GELAR: /non\s+gelar/i,
      FAST_TRACK: /fast\s*track/i,
      PPG_PGP: /^ppg\s+pgp/i,
      PPG_NON_PGP: /^ppg\s+non\s+pgp/i,
      DOUBLE_DEGREE: /double\s+degree/i,
      JOIN_DEGREE: /jo(i)?n\s+degree/i,
    };
    const out: Record<string, string | null> = {};
    for (const k of Object.keys(patterns)) out[k] = null;
    try {
      const { data, errorCode } = await this.callFeeder(baseUrl, { act: 'GetJenisPendaftaran', token });
      if (errorCode === '0' && Array.isArray(data)) {
        const rows = data.map((r: any) => ({ id: String(r.id_jenis_daftar ?? ''), name: String(r.nama_jenis_daftar ?? '').trim() }));
        for (const [kind, re] of Object.entries(patterns)) {
          out[kind] = rows.find((r) => r.id && re.test(r.name))?.id ?? null;
        }
      }
    } catch {
      // jatuh ke bawaan di bawah
    }
    // Bawaan bila referensi Feeder tidak terbaca (kode tetap Neo Feeder): 1 Peserta didik baru, 2 Pindahan
    if (!out.BARU) out.BARU = '1';
    if (!out.TRANSFER) out.TRANSFER = '2';
    return out;
  }

  /**
   * Mencari id_perguruan_tinggi dan id_prodi asal di referensi Feeder dari data yang diisi pendaftar.
   * Perguruan tinggi dicocokkan lewat KODE (pasti) bila ada, selain itu lewat nama; program studi dicocokkan lewat nama
   * resmi dan jenjang. Gagal dengan alasan yang jelas bila tidak ada atau lebih dari satu kecocokan, supaya BAAK bisa memperbaikinya.
   */
  private async resolveFeederOrigin(
    baseUrl: string,
    token: string,
    origin: { institution: string; institutionCode?: string; program: string; level?: string },
  ): Promise<{ idPt?: string; idProdi?: string; reason?: string }> {
    const institution = origin.institution;
    const program = origin.program;
    const exactOrAll = (rows: any[], nameKey: string, wanted: string) => {
      const target = this.normalizeName(wanted);
      const exact = rows.filter((r) => this.normalizeName(String(r[nameKey] ?? '')) === target);
      return exact.length > 0 ? exact : rows;
    };
    try {
      const byCode = String(origin.institutionCode ?? '').trim();
      const pt = await this.callFeeder(baseUrl, {
        act: 'GetAllPT',
        token,
        filter: byCode && /^[0-9A-Za-z]+$/.test(byCode)
          ? `kode_perguruan_tinggi = '${this.escapeFeederFilter(byCode)}'`
          : `nama_perguruan_tinggi ilike '%${this.escapeFeederFilter(institution.trim())}%'`,
        limit: 20,
        offset: 0,
      });
      if (pt.errorCode !== '0') return { reason: pt.errorDesc || 'Gagal mencari perguruan tinggi asal di Feeder' };
      const ptRows: any[] = Array.isArray(pt.data) ? pt.data : [];
      const ptCandidates = byCode ? ptRows : exactOrAll(ptRows, 'nama_perguruan_tinggi', institution);
      if (ptCandidates.length === 0) {
        return { reason: byCode
          ? `Perguruan tinggi asal '${institution}' (kode ${byCode}) tidak ditemukan di referensi Feeder.`
          : `Perguruan tinggi asal '${institution}' tidak ditemukan di referensi Feeder. Periksa penulisan namanya.` };
      }
      if (ptCandidates.length > 1) {
        return { reason: `Perguruan tinggi asal '${institution}' cocok dengan ${ptCandidates.length} perguruan tinggi di Feeder. Pilih dari daftar pencarian agar kodenya tepat.` };
      }
      const idPt = String(ptCandidates[0].id_perguruan_tinggi);

      // Ambil seluruh prodi perguruan tinggi itu lalu cocokkan nama (dan jenjang) secara lokal; jumlahnya kecil.
      const prodi = await this.callFeeder(baseUrl, {
        act: 'GetAllProdi',
        token,
        filter: `id_perguruan_tinggi = '${this.escapeFeederFilter(idPt)}'`,
        limit: 500,
        offset: 0,
      });
      if (prodi.errorCode !== '0') return { reason: prodi.errorDesc || 'Gagal mencari program studi asal di Feeder' };
      const rows: any[] = Array.isArray(prodi.data) ? prodi.data : [];
      // label di formulir berbentuk "S1 PENDIDIKAN EKONOMI"; pisahkan jenjang di depan bila tidak diberikan terpisah
      let wantedName = program.trim();
      let wantedLevel = String(origin.level ?? '').trim();
      const m = /^(D[1-4]|S[1-3]|Sp-?[12]|Profesi)\s+(.+)$/i.exec(wantedName);
      if (m) {
        if (!wantedLevel) wantedLevel = m[1];
        wantedName = m[2];
      }
      const nameTarget = this.normalizeName(wantedName);
      let candidates = rows.filter((r) => this.normalizeName(String(r.nama_program_studi ?? '')) === nameTarget);
      if (candidates.length === 0) {
        candidates = rows.filter((r) => this.normalizeName(String(r.nama_program_studi ?? '')).includes(nameTarget));
      }
      if (wantedLevel && candidates.length > 1) {
        const level = this.normalizeName(wantedLevel);
        const sameLevel = candidates.filter((r) => this.normalizeName(String(r.nama_jenjang_pendidikan ?? '')) === level);
        if (sameLevel.length > 0) candidates = sameLevel;
      }
      if (candidates.length === 0) {
        return { reason: `Program studi asal '${program}' tidak ditemukan pada perguruan tinggi asal di Feeder.` };
      }
      if (candidates.length > 1) {
        return { reason: `Program studi asal '${program}' cocok dengan ${candidates.length} program studi di perguruan tinggi asal (beda jenjang?). Pilih dari daftar pencarian beserta jenjangnya.` };
      }
      return { idPt, idProdi: String(candidates[0].id_prodi) };
    } catch (err: any) {
      return { reason: `Gagal mencari data asal di Feeder: ${err?.message || 'Unknown error'}` };
    }
  }

  private async resolveFeederWilayah(
    baseUrl: string,
    token: string,
    kecamatan?: string | null,
    kota?: string | null
  ): Promise<{ idWilayah: string | null; reason: string | null }> {
    const kec = (kecamatan || '').replace(/^kec\.?\s+/i, '').trim();
    const kab = (kota || '').replace(/^(kabupaten|kab\.?|kota)\s+/i, '').trim();
    if (!kec) return { idWilayah: null, reason: 'Kecamatan belum diisi di biodata mahasiswa' };

    try {
      const { data, errorCode, errorDesc } = await this.callFeeder(baseUrl, {
        act: 'GetWilayah',
        token,
        filter: `id_level_wilayah = 3 and nama_wilayah ilike '%${this.escapeFeederFilter(kec)}%'`,
      });
      if (errorCode !== '0') return { idWilayah: null, reason: errorDesc || 'Gagal mencari wilayah di Feeder' };
      let candidates: any[] = Array.isArray(data) ? data : [];

      const exact = candidates.filter(
        (w) => String(w.nama_wilayah || '').replace(/^kec\.?\s*/i, '').trim().toLowerCase() === kec.toLowerCase()
      );
      if (exact.length > 0) candidates = exact;

      if (candidates.length > 1 && kab) {
        const parentsRes = await this.callFeeder(baseUrl, {
          act: 'GetWilayah',
          token,
          filter: `id_level_wilayah = 2 and nama_wilayah ilike '%${this.escapeFeederFilter(kab)}%'`,
        });
        const parentIds = new Set((Array.isArray(parentsRes.data) ? parentsRes.data : []).map((w: any) => String(w.id_wilayah || '').trim()));
        candidates = candidates.filter((w) => parentIds.has(String(w.id_induk_wilayah || '').trim()));
      }

      if (candidates.length === 1) return { idWilayah: String(candidates[0].id_wilayah), reason: null };
      return {
        idWilayah: null,
        reason:
          candidates.length === 0
            ? `Kecamatan '${kec}' tidak ditemukan di data wilayah Feeder`
            : `Kecamatan '${kec}' cocok dengan lebih dari satu wilayah di Feeder, lengkapi kabupaten/kota untuk membedakan`,
      };
    } catch (err: any) {
      return { idWilayah: null, reason: `Gagal mencari wilayah di Feeder: ${err?.message || 'Unknown error'}` };
    }
  }

  /**
   * Push mahasiswa aktif lokal yang BELUM terdaftar di Feeder (feederRegistrationId kosong)
   * ke Web Service Neo Feeder PDDIKTI -- 2 tahap sesuai protokol Feeder: InsertBiodataMahasiswa
   * dulu (kalau belum punya id_mahasiswa), baru InsertRiwayatPendidikanMahasiswa (pendaftaran).
   *
   * PENTING: ini menulis ke basis data resmi Dikti, bukan basis data lokal -- jadi SETIAP
   * mahasiswa dicek dulu ke Feeder (lewat NIM, lalu NIK) sebelum insert, supaya tidak
   * membuat data duplikat di PDDIKTI kalau mahasiswa itu ternyata sudah pernah didaftarkan
   * lewat jalur lain (mis. Feeder client resmi Dikti).
   *
   * `studentIds` opsional -- kalau diisi, cuma mahasiswa dengan id itu yang diproses (dipilih
   * manual dari UI). Kalau kosong, semua mahasiswa aktif yang belum terdaftar diproses
   * (dibatasi `LIMIT_PER_RUN` per pemanggilan supaya tidak timeout).
   */
  async pushMahasiswaBaruToFeeder(studentIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {} as Record<string, number>,
      };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);

      // Profil PT (id_perguruan_tinggi) wajib ada di setiap InsertRiwayatPendidikanMahasiswa.
      const { data: ptData, errorCode: ptErr, errorDesc: ptErrDesc } = await this.callFeeder(setting.baseUrl, { act: 'GetProfilPT', token });
      const idPerguruanTinggi = ptErr === '0' && Array.isArray(ptData) ? ptData[0]?.id_perguruan_tinggi : null;
      if (!idPerguruanTinggi) {
        return {
          success: false,
          message: `Gagal mengambil profil perguruan tinggi dari Feeder (GetProfilPT): ${ptErrDesc || 'data kosong'}.`,
          processed: 0,
          created: 0,
          linked: 0,
          failed: 0,
          skipped: 0,
          failReasons: {},
        };
      }

      // Peta kode_program_studi -> id_prodi Feeder (dibutuhkan InsertRiwayatPendidikanMahasiswa,
      // yang minta id_prodi mentah, BUKAN kode_program_studi yang kita simpan di diktiCode).
      const prodiCodeToFeederId = new Map<string, string>();
      try {
        const { data: prodiData, errorCode: prodiErr } = await this.callFeeder(setting.baseUrl, { act: 'GetProdi', token });
        if (prodiErr === '0' && Array.isArray(prodiData)) {
          for (const p of prodiData) {
            if (p?.id_prodi && p?.kode_program_studi) {
              prodiCodeToFeederId.set(String(p.kode_program_studi).trim(), String(p.id_prodi));
            }
          }
        }
      } catch {
        // ditangani per-mahasiswa di bawah (gagal kalau prodi tidak ketemu)
      }

      const jenisDaftar = await this.resolveJenisDaftar(setting.baseUrl, token);

      const eligible = await this.prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          feederRegistrationId: null,
          ...(studentIds && studentIds.length > 0 ? { id: { in: studentIds } } : {}),
        },
        include: { user: true, studyProgram: true, track: { select: { kind: true, name: true } } },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let processed = 0;
      let created = 0;
      let linked = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = async (studentId: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.student
          .update({ where: { id: studentId }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } })
          .catch(() => null);
      };

      for (const student of eligible) {
        processed += 1;
        const nim = student.nim;

        const idProdiFeeder = student.studyProgram?.diktiCode ? prodiCodeToFeederId.get(student.studyProgram.diktiCode.trim()) : undefined;
        if (!idProdiFeeder) {
          skipped += 1;
          continue;
        }

        let idMahasiswaFeeder = student.feederId || undefined;

        // 1. Cek dulu ke Feeder lewat NIM -- kalau sudah terdaftar, cukup tautkan ID-nya,
        // jangan insert lagi (hindari duplikat di PDDIKTI).
        try {
          const { data: regData, errorCode: regErr, errorDesc: regErrDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetListRiwayatPendidikanMahasiswa',
            token,
            filter: `nim = '${this.escapeFeederFilter(nim)}'`,
            limit: 1,
            offset: 0,
          });
          if (regErr !== '0') throw new Error(regErrDesc || 'Respon Feeder tidak valid');
          const found = Array.isArray(regData) ? regData[0] : null;
          if (found?.id_registrasi_mahasiswa) {
            await this.prisma.student.update({
              where: { id: student.id },
              data: {
                feederId: found.id_mahasiswa || idMahasiswaFeeder || null,
                feederRegistrationId: found.id_registrasi_mahasiswa,
                feederSyncError: null,
                feederSyncErrorAt: null,
              },
            });
            linked += 1;
            continue;
          }

          // Belum terdaftar -- cek juga lewat NIK (biodata mungkin sudah pernah di-insert
          // tapi registrasinya belum, mis. percobaan push sebelumnya gagal di tahap 2).
          const nik = student.nik || '';
          if (!idMahasiswaFeeder && /^\d{16}$/.test(nik) && !/^0+$/.test(nik)) {
            const { data: bioData, errorCode: bioErr } = await this.callFeeder(setting.baseUrl, {
              act: 'GetBiodataMahasiswa',
              token,
              filter: `nik = '${this.escapeFeederFilter(nik)}'`,
              limit: 1,
              offset: 0,
            });
            const bio = bioErr === '0' && Array.isArray(bioData) ? bioData[0] : null;
            if (bio?.id_mahasiswa) {
              idMahasiswaFeeder = bio.id_mahasiswa;
              await this.prisma.student.update({ where: { id: student.id }, data: { feederId: idMahasiswaFeeder } });
            }
          }
        } catch (err: any) {
          await markFailed(student.id, `Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
          continue;
        }

        // 2. Tahap 1: InsertBiodataMahasiswa (dilewati kalau id_mahasiswa sudah ada).
        if (!idMahasiswaFeeder) {
          const { idWilayah, reason: wilayahReason } = await this.resolveFeederWilayah(
            setting.baseUrl,
            token,
            student.kecamatan,
            student.city
          );
          if (!idWilayah) {
            await markFailed(student.id, wilayahReason || 'Kecamatan/kabupaten tidak bisa dicocokkan ke data wilayah Feeder');
            continue;
          }

          const [rt, rw] = (student.rtRw || '').split('/').map((v) => v.trim());
          const handphone = (student.phone || '').replace(/\D/g, '').replace(/^62/, '0');

          const record: Record<string, any> = {
            nama_mahasiswa: student.user.fullName,
            jenis_kelamin: student.gender === 'FEMALE' ? 'P' : 'L',
            tempat_lahir: student.birthPlace || 'Majenang',
            tanggal_lahir: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : '2000-01-01',
            id_agama: this.agamaToFeederId(student.religion),
            nik: student.nik || '0000000000000000',
            nama_ibu_kandung: student.motherName || 'Ibu Kandung',
            kewarganegaraan: 'ID',
            handphone,
            email: this.realStudentEmail(student.user.email),
            jalan: (student.streetAddress || student.address || '-').slice(0, 80),
            id_wilayah: idWilayah,
          };
          if (student.dusun) record.dusun = student.dusun.slice(0, 60);
          if (rt && /^\d+$/.test(rt)) record.rt = parseInt(rt, 10);
          if (rw && /^\d+$/.test(rw)) record.rw = parseInt(rw, 10);
          if (student.nisn) record.nisn = student.nisn;
          if (student.kelurahan) record.kelurahan = student.kelurahan.slice(0, 60);
          if (student.postalCode && /^\d{5}$/.test(student.postalCode)) record.kode_pos = student.postalCode;

          const { data: insertBioData, errorCode: insertBioErr, errorDesc: insertBioErrDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'InsertBiodataMahasiswa',
            token,
            record,
          });
          if (insertBioErr !== '0') {
            await markFailed(student.id, `Insert biodata ditolak Feeder: ${insertBioErrDesc || 'tanpa keterangan'}`);
            continue;
          }
          idMahasiswaFeeder = insertBioData?.id_mahasiswa;
          if (!idMahasiswaFeeder) {
            await markFailed(student.id, 'Insert biodata berhasil tapi Feeder tidak mengembalikan id_mahasiswa');
            continue;
          }
          await this.prisma.student.update({
            where: { id: student.id },
            data: { feederId: idMahasiswaFeeder, feederSyncError: null, feederSyncErrorAt: null },
          });
        }

        // 3. Tahap 2: InsertRiwayatPendidikanMahasiswa (pendaftaran/registrasi).
        // Jenis daftar mengikuti label jenis mahasiswa (BARU / TRANSFER / RPL). Selain mahasiswa baru, Feeder
        // meminta perguruan tinggi dan program studi asal.
        const trackKind = (student as any).track?.kind as string | undefined;
        let idJenisDaftar = jenisDaftar.BARU || '1'; // Peserta didik baru
        let originFields: Record<string, any> = {};
        if (trackKind && trackKind !== 'BARU') {
          const mapped = jenisDaftar[trackKind];
          if (!mapped) {
            await markFailed(student.id, `Jenis daftar untuk '${(student as any).track?.name}' (${trackKind}) tidak ditemukan di referensi Feeder`);
            continue;
          }
          idJenisDaftar = mapped;
          const instName = String((student as any).originInstitution || '').trim();
          const progName = String((student as any).originStudyProgram || '').trim();
          const hasOrigin = !!instName && !!progName;
          if ((trackKind === 'TRANSFER' || trackKind === 'RPL_TRANSFER') && !hasOrigin) {
            await markFailed(student.id, 'Perguruan tinggi asal dan program studi asal belum diisi (wajib untuk mahasiswa pindahan / RPL Transfer SKS)');
            continue;
          }
          // Dipilih dari pencarian referensi Feeder: ID sudah pasti, tidak perlu menebak dari nama
          const pickedPt = String((student as any).originInstitutionId || '').trim();
          const pickedProdi = String((student as any).originStudyProgramId || '').trim();
          // Kategori lain boleh tanpa asal (mis. RPL Perolehan SKS dari pengalaman kerja); bila diisi tetap harus cocok dengan referensi Feeder
          if (pickedPt && pickedProdi) {
            originFields = { id_perguruan_tinggi_asal: pickedPt, id_prodi_asal: pickedProdi };
          } else if (hasOrigin) {
            const origin = await this.resolveFeederOrigin(setting.baseUrl, token, {
              institution: instName,
              institutionCode: (student as any).originInstitutionCode,
              program: progName,
              level: (student as any).originStudyProgramLevel,
            });
            if (!origin.idPt || !origin.idProdi) {
              await markFailed(student.id, origin.reason || 'Perguruan tinggi/program studi asal tidak dapat dicocokkan ke Feeder');
              continue;
            }
            originFields = {
              id_perguruan_tinggi_asal: origin.idPt,
              id_prodi_asal: origin.idProdi,
            };
          }
        }

        const recordReg: Record<string, any> = {
          id_mahasiswa: idMahasiswaFeeder,
          nim,
          id_jenis_daftar: idJenisDaftar,
          ...originFields,
          id_jalur_daftar: 12, // Seleksi Mandiri -- default kebijakan kampus, SIAKAD belum menyimpan jalur nasional
          biaya_masuk: '4000000.00',
          id_pembiayaan: '1', // Mandiri -- SIAKAD belum melacak status KIP/beasiswa di Student
          tanggal_daftar: new Date().toISOString().slice(0, 10),
          id_perguruan_tinggi: idPerguruanTinggi,
          id_prodi: idProdiFeeder,
          id_periode_masuk: `${student.entryYear}1`,
          sks_diakui: Number((student as any).originCredits ?? 0),
        };

        const { data: insertRegData, errorCode: insertRegErr, errorDesc: insertRegErrDesc } = await this.callFeeder(setting.baseUrl, {
          act: 'InsertRiwayatPendidikanMahasiswa',
          token,
          record: recordReg,
        });
        if (insertRegErr !== '0' || !insertRegData?.id_registrasi_mahasiswa) {
          await markFailed(student.id, `Insert registrasi ditolak Feeder: ${insertRegErrDesc || 'tanpa keterangan'}`);
          continue;
        }

        await this.prisma.student.update({
          where: { id: student.id },
          data: { feederRegistrationId: insertRegData.id_registrasi_mahasiswa, feederSyncError: null, feederSyncErrorAt: null },
        });
        created += 1;
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'MAHASISWA_PUSH_TO_FEEDER',
            detail: `Push mahasiswa ke Feeder: ${processed} diproses, ${created} baru didaftarkan, ${linked} sudah ada (ditautkan), ${failed} gagal, ${skipped} dilewati (prodi belum sinkron).`,
          },
        });
      } catch {
        // non-blocking
      }

      const remaining = await this.prisma.student.count({ where: { status: 'ACTIVE', feederRegistrationId: null } });
      const failReasonText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';

      return {
        success: true,
        message:
          `Push selesai: ${processed} diproses, ${created} mahasiswa baru didaftarkan ke Feeder, ${linked} sudah ada di Feeder (ditautkan), ` +
          `${failed} gagal, ${skipped} dilewati (prodi belum sinkron ke Feeder).` +
          (remaining > 0 ? ` Masih ada ${remaining} mahasiswa aktif belum terdaftar -- jalankan Push lagi untuk lanjut.` : '') +
          failReasonText,
        processed,
        created,
        linked,
        failed,
        skipped,
        failReasons,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal push data mahasiswa: ${err?.message || 'Unknown error'}`,
        processed: 0,
        created: 0,
        linked: 0,
        failed: 0,
        skipped: 0,
        failReasons: {},
      };
    }
  }

  // Daftar mahasiswa lokal yang SUDAH punya id_mahasiswa Feeder -- kandidat tab "Update ke Feeder".
  async getLinkedMahasiswaForUpdate() {
    const students = await this.prisma.student.findMany({
      where: { feederId: { not: null } },
      include: { user: { select: { fullName: true } }, studyProgram: { select: { name: true } } },
      orderBy: [{ feederSyncErrorAt: 'desc' }, { nim: 'asc' }],
    });
    return students.map((s) => ({
      id: s.id,
      nim: s.nim,
      fullName: s.user.fullName,
      studyProgram: s.studyProgram?.name ?? null,
      lastError: s.feederSyncError,
      lastErrorAt: s.feederSyncErrorAt,
    }));
  }

  /**
   * Bandingkan biodata lokal vs Feeder untuk mahasiswa yang sudah tertaut (`feederId`).
   * Hanya membaca (GetBiodataMahasiswa, filter IN, satu batch maks 100 id). Perbedaan
   * dihitung dengan aturan yang sama dengan Update: field yang kosong di lokal tidak
   * dianggap beda, karena memang tidak akan dikirim.
   */
  async compareMahasiswaWithFeeder(studentIds: string[]) {
    const BATCH = 100;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: true, message: 'Tidak ada mahasiswa untuk dibandingkan.', items: [] as any[] };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'Konfigurasi Web Service Neo Feeder belum lengkap.', items: [] as any[] };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds.slice(0, BATCH) }, feederId: { not: null } },
        include: { user: true },
      });
      const idsFilter = students.map((s) => this.escapeFeederFilter(s.feederId!)).join("', '");
      const { data, errorCode, errorDesc } = await this.callFeeder(
        setting.baseUrl,
        { act: 'GetBiodataMahasiswa', token, filter: `id_mahasiswa IN ('${idsFilter}')`, limit: BATCH, offset: 0 },
        30000
      );
      if (errorCode !== '0' || !Array.isArray(data)) {
        return { success: false, message: errorDesc || 'Feeder menolak permintaan GetBiodataMahasiswa.', items: [] as any[] };
      }
      const bioMap = new Map<string, any>();
      for (const b of data) if (b?.id_mahasiswa) bioMap.set(String(b.id_mahasiswa), b);

      // Mahasiswa yang id_mahasiswa lokalnya tidak ada di Feeder: coba cari lewat NIM
      // (GetListRiwayatPendidikanMahasiswa) -- id lokal bisa basi/salah tertaut. Kalau
      // ketemu, tautan lokal diperbaiki ke id_mahasiswa yang benar supaya Update juga jalan.
      const relinked = new Map<string, string>(); // student.id -> id_mahasiswa benar
      const missing = students.filter((s) => !bioMap.has(s.feederId!));
      // Dicari satu per satu (filter `=`, bukan IN) karena filter IN bisa tidak andal di
      // beberapa versi Feeder: 1) ulang lewat id_mahasiswa lokal, 2) lewat NIM.
      const lookupBio = async (idMahasiswa: string) => {
        const { data: d, errorCode: ec } = await this.callFeeder(
          setting.baseUrl,
          { act: 'GetBiodataMahasiswa', token, filter: `id_mahasiswa = '${this.escapeFeederFilter(idMahasiswa)}'`, limit: 1, offset: 0 },
          30000
        );
        return ec === '0' && Array.isArray(d) ? d[0] : null;
      };
      await this.runWithConcurrency(missing, 5, async (s) => {
        try {
          const byId = await lookupBio(s.feederId!);
          if (byId?.id_mahasiswa) {
            bioMap.set(s.feederId!, byId);
            return;
          }
          if (!s.nim) return;
          const { data: regData, errorCode: regErr } = await this.callFeeder(
            setting.baseUrl,
            {
              act: 'GetListRiwayatPendidikanMahasiswa',
              token,
              filter: `nim = '${this.escapeFeederFilter(s.nim)}'`,
              limit: 1,
              offset: 0,
            },
            30000
          );
          const reg = regErr === '0' && Array.isArray(regData) ? regData[0] : null;
          const realId = this.cleanFeederValue(reg?.id_mahasiswa);
          if (!realId) return;
          const bio = bioMap.get(realId) || (await lookupBio(realId));
          if (bio?.id_mahasiswa) {
            bioMap.set(realId, bio);
            relinked.set(s.id, realId);
          }
        } catch {
          // non-blocking -- yang tidak ketemu tetap dilaporkan "tidak ditemukan"
        }
      });
      for (const [studentId, id] of relinked) {
        await this.prisma.student.update({ where: { id: studentId }, data: { feederId: id } }).catch(() => null);
      }

      const norm = (v?: string | null) => (v ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
      const phone = (v?: string | null) => (v ?? '').replace(/\D/g, '').replace(/^62/, '0');

      const items = students.map((s) => {
        const bio = bioMap.get(relinked.get(s.id) || s.feederId!);
        if (!bio) return { id: s.id, foundInFeeder: false, relinked: false, diffs: [] as any[] };

        const pairs: { field: string; label: string; local: string; feeder: string; cmp: (v: string) => string }[] = [
          { field: 'nama', label: 'Nama', local: s.user.fullName || '', feeder: this.cleanFeederValue(bio.nama_mahasiswa) || '', cmp: norm },
          { field: 'nik', label: 'NIK', local: s.nik || '', feeder: this.cleanFeederValue(bio.nik) || '', cmp: norm },
          {
            field: 'tanggalLahir',
            label: 'Tanggal Lahir',
            local: s.birthDate ? s.birthDate.toISOString().slice(0, 10) : '',
            feeder: this.parseFeederDate(this.cleanFeederValue(bio.tanggal_lahir) || '') || '',
            cmp: norm,
          },
          { field: 'tempatLahir', label: 'Tempat Lahir', local: s.birthPlace || '', feeder: this.cleanFeederValue(bio.tempat_lahir) || '', cmp: norm },
          {
            field: 'jenisKelamin',
            label: 'Jenis Kelamin',
            local: s.gender ? (s.gender === 'FEMALE' ? 'P' : 'L') : '',
            feeder: this.cleanFeederValue(bio.jenis_kelamin) || '',
            cmp: norm,
          },
          { field: 'ibuKandung', label: 'Nama Ibu', local: s.motherName || '', feeder: this.cleanFeederValue(bio.nama_ibu_kandung) || '', cmp: norm },
          { field: 'nisn', label: 'NISN', local: s.nisn || '', feeder: this.cleanFeederValue(bio.nisn) || '', cmp: norm },
          { field: 'handphone', label: 'No. HP', local: s.phone || '', feeder: this.cleanFeederValue(bio.handphone) || '', cmp: phone },
          { field: 'email', label: 'Email', local: this.realStudentEmail(s.user.email), feeder: this.cleanFeederValue(bio.email) || '', cmp: norm },
        ];

        const diffs = pairs
          .filter((p) => p.local.trim() !== '' && p.cmp(p.local) !== p.cmp(p.feeder))
          .map((p) => ({ field: p.field, label: p.label, local: p.local, feeder: p.feeder }));
        return { id: s.id, foundInFeeder: true, relinked: relinked.has(s.id), diffs };
      });

      return { success: true, message: `${items.length} mahasiswa dibandingkan.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal membandingkan data: ${err?.message || 'Unknown error'}`, items: [] as any[] };
    }
  }

  /**
   * Update biodata mahasiswa yang SUDAH ada di Feeder (`UpdateBiodataMahasiswa`, key
   * `id_mahasiswa`) dari data lokal. Menulis ke basis data resmi Dikti, jadi `studentIds`
   * WAJIB diisi (dipilih manual dari UI) dan dibatasi per pemanggilan.
   *
   * Beda dari Insert, di sini TIDAK ada nilai default pengganti (mis. "Ibu Kandung",
   * tanggal lahir 2000-01-01): field yang kosong di lokal sengaja tidak dikirim, supaya
   * data yang sudah benar di Feeder tidak tertimpa nilai karangan.
   */
  async updateMahasiswaBiodataToFeeder(studentIds: string[]) {
    const empty = { processed: 0, updated: 0, failed: 0, skipped: 0, failReasons: {} as Record<string, number> };
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return { success: false, message: 'Pilih minimal satu mahasiswa yang akan diupdate.', ...empty };
    }
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        ...empty,
      };
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const students = await this.prisma.student.findMany({
        where: { id: { in: studentIds.slice(0, LIMIT_PER_RUN) }, feederId: { not: null } },
        include: { user: true },
      });

      let processed = 0;
      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = async (studentId: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.student
          .update({ where: { id: studentId }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } })
          .catch(() => null);
      };

      for (const student of students) {
        processed += 1;
        const record: Record<string, any> = {};
        if (student.user.fullName) record.nama_mahasiswa = student.user.fullName;
        if (student.gender) record.jenis_kelamin = student.gender === 'FEMALE' ? 'P' : 'L';
        if (student.birthPlace) record.tempat_lahir = student.birthPlace;
        if (student.birthDate) record.tanggal_lahir = student.birthDate.toISOString().slice(0, 10);
        if (student.religion) record.id_agama = this.agamaToFeederId(student.religion);
        if (student.nik && /^\d{16}$/.test(student.nik) && !/^0+$/.test(student.nik)) record.nik = student.nik;
        if (student.motherName) record.nama_ibu_kandung = student.motherName;
        const handphone = (student.phone || '').replace(/\D/g, '').replace(/^62/, '0');
        if (handphone) record.handphone = handphone;
        const realEmail = this.realStudentEmail(student.user.email);
        if (realEmail) record.email = realEmail;
        const jalan = student.streetAddress || student.address;
        if (jalan) record.jalan = jalan.slice(0, 80);
        if (student.nisn) record.nisn = student.nisn;
        if (student.dusun) record.dusun = student.dusun.slice(0, 60);
        if (student.kelurahan) record.kelurahan = student.kelurahan.slice(0, 60);
        if (student.postalCode && /^\d{5}$/.test(student.postalCode)) record.kode_pos = student.postalCode;
        const [rt, rw] = (student.rtRw || '').split('/').map((v) => v.trim());
        if (rt && /^\d+$/.test(rt)) record.rt = parseInt(rt, 10);
        if (rw && /^\d+$/.test(rw)) record.rw = parseInt(rw, 10);

        if (student.kecamatan) {
          const { idWilayah } = await this.resolveFeederWilayah(setting.baseUrl, token, student.kecamatan, student.city);
          if (idWilayah) record.id_wilayah = idWilayah;
        }

        if (Object.keys(record).length === 0) {
          skipped += 1;
          continue;
        }

        try {
          const { errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'UpdateBiodataMahasiswa',
            token,
            key: { id_mahasiswa: student.feederId },
            record,
          });
          if (errorCode !== '0') {
            await markFailed(student.id, `Update biodata ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`);
            continue;
          }
          await this.prisma.student.update({
            where: { id: student.id },
            data: { feederSyncError: null, feederSyncErrorAt: null },
          });
          updated += 1;
        } catch (err: any) {
          await markFailed(student.id, `Gagal menghubungi Feeder: ${err?.message || 'Unknown error'}`);
        }
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'MAHASISWA_UPDATE_TO_FEEDER',
            detail: `Update biodata mahasiswa ke Feeder: ${processed} diproses, ${updated} berhasil, ${failed} gagal, ${skipped} dilewati.`,
          },
        });
      } catch {
        // non-blocking
      }

      const failReasonText = Object.keys(failReasons).length
        ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
        : '';
      const overLimit = studentIds.length > LIMIT_PER_RUN ? ` Dibatasi ${LIMIT_PER_RUN} per proses -- jalankan lagi untuk sisanya.` : '';
      return {
        success: true,
        message: `Update selesai: ${processed} diproses, ${updated} berhasil diupdate di Feeder, ${failed} gagal, ${skipped} dilewati (tidak ada data untuk dikirim).${overLimit}${failReasonText}`,
        processed,
        updated,
        failed,
        skipped,
        failReasons,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal update data mahasiswa: ${err?.message || 'Unknown error'}`, ...empty };
    }
  }

  /**
   * Menarik daftar periode semester (`GetSemester`) dari Web Service Neo Feeder PDDIKTI --
   * TAPI dipersempit cuma ke periode yang BENAR-BENAR punya data KRS (bukan seluruh
   * semester yang pernah di-generate Feeder, termasuk yang spekulatif/belum pernah
   * dipakai -- lihat catatan di bawah).
   *
   * CATATAN JUJUR: GetSemester TERBUKTI mengembalikan SEMUA kode semester yang pernah
   * di-generate sistem Feeder, termasuk periode masa depan yang institusi belum pernah
   * pakai sama sekali (mis. 2035/2036 pernah muncul di sini walau data asli institusi
   * cuma sampai 2026). Makanya di sini id_semester-nya dipersempit dulu lewat
   * `GetListNilaiPerkuliahanKelas` (field `jumlah_mahasiswa_krs` -- jumlah mahasiswa yang
   * benar-benar mengambil KRS di kelas itu) sebelum dicocokkan balik ke `GetSemester`
   * untuk ambil tanggal mulai/selesainya -- cuma semester yang punya minimal 1 kelas
   * dengan `jumlah_mahasiswa_krs > 0` yang ikut ditarik.
   */
  async pullTahunAkademikFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteAcademicYearItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);

      // GetSemester kecil & cepat -- ambil dulu, persempit ke semester yang sudah mulai.
      const rows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetSemester', 500, 60000);
      const now = new Date();
      const candidates = rows.filter(
        (r) => r?.id_semester && r?.tanggal_mulai && r?.tanggal_selesai && new Date(r.tanggal_mulai) <= now
      );

      // Daripada menarik SELURUH GetListNilaiPerkuliahanKelas (ribuan baris, lambat & rawan
      // timeout Cloudflare), cek per semester kandidat dengan filter id_smt dan berhenti
      // di halaman pertama yang memuat minimal 1 kelas ber-KRS. Dijalankan paralel.
      const semestersWithKrs = new Set<string>();
      const candidateIds = Array.from(new Set(candidates.map((r) => this.cleanFeederValue(r.id_semester)!).filter(Boolean)));
      await this.runWithConcurrency(candidateIds, 6, async (idSmt) => {
        const pageSize = 200;
        for (let offset = 0, guard = 0; guard < 50; guard += 1, offset += pageSize) {
          const { data, errorCode } = await this.callFeeder(
            setting.baseUrl,
            {
              act: 'GetListNilaiPerkuliahanKelas',
              token,
              limit: pageSize,
              offset,
              filter: `id_smt = '${this.escapeFeederFilter(idSmt)}'`,
            },
            30000
          );
          if (errorCode !== '0') return;
          const page: any[] = Array.isArray(data) ? data : [];
          if (
            page.some((r) => {
              const n = parseInt(String(r?.jumlah_mahasiswa_krs ?? ''), 10);
              return !Number.isNaN(n) && n > 0;
            })
          ) {
            semestersWithKrs.add(idSmt);
            return;
          }
          if (page.length < pageSize) return;
        }
      });

      const items: RemoteAcademicYearItem[] = candidates
        .filter((r) => semestersWithKrs.has(this.cleanFeederValue(r.id_semester) || ''))
        .map((r) => {
          const idTahunAjaran = this.cleanFeederValue(r.id_tahun_ajaran);
          const startYear = idTahunAjaran ? parseInt(idTahunAjaran, 10) : undefined;
          const semesterNum = this.cleanFeederValue(r.semester);
          return {
            code: this.cleanFeederValue(r.id_semester)!,
            name: startYear && !Number.isNaN(startYear) ? `${startYear}/${startYear + 1}` : this.cleanFeederValue(r.nama_semester) || '',
            semesterType: (semesterNum === '2' ? 'EVEN' : semesterNum === '1' ? 'ODD' : 'SHORT') as 'ODD' | 'EVEN' | 'SHORT',
            startDate: new Date(r.tanggal_mulai).toISOString(),
            endDate: new Date(r.tanggal_selesai).toISOString(),
            isActiveAtFeeder: this.cleanFeederValue(r.a_periode_aktif) === '1',
          };
        })
        .filter((i) => i.code && i.name);

      return { success: true, message: `Berhasil menarik ${items.length} periode semester dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data tahun akademik: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /**
   * Cocokkan/buat ulang AcademicYear lokal dari hasil pull Feeder -- dicocokkan lewat
   * `code` (sudah sama dengan `id_semester` Feeder, lihat `pullTahunAkademikFromFeeder`).
   * `isActive`, `status`, `isKrsOpen`, `isGradeLocked`, dan periode KRS/PMB SENGAJA tidak
   * pernah ditimpa pada baris yang sudah ada -- itu keputusan administratif lokal, bukan
   * data yang dilaporkan Feeder, jadi sync berkali-kali tidak boleh mengubahnya diam-diam.
   */
  async syncTahunAkademikFromFeeder(items: RemoteAcademicYearItem[]) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, message: 'Tidak ada data tahun akademik untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const now = new Date();

    for (const item of items) {
      if (!item.code?.trim() || !item.name?.trim()) {
        skipped += 1;
        continue;
      }

      const existing = await this.prisma.academicYear.findUnique({ where: { code: item.code.trim() } });
      const startDate = new Date(item.startDate);
      const endDate = new Date(item.endDate);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        skipped += 1;
        continue;
      }

      if (existing) {
        await this.prisma.academicYear.update({
          where: { id: existing.id },
          data: { name: item.name.trim(), semesterType: item.semesterType, startDate, endDate },
        });
        updated += 1;
        continue;
      }

      const status = endDate < now ? 'Arsip' : startDate > now ? 'Mendatang' : 'Aktif';
      await this.prisma.academicYear.create({
        data: {
          code: item.code.trim(),
          name: item.name.trim(),
          semesterType: item.semesterType,
          startDate,
          endDate,
          isActive: false,
          status,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'TAHUN_AKADEMIK_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi tahun akademik dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message: `Sinkronisasi selesai: ${created} periode baru dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
      created,
      updated,
      skipped,
    };
  }

  /**
   * Menarik daftar kelas perkuliahan dari Web Service Neo Feeder PDDIKTI
   * (`GetListKelasKuliah`), diperkaya dosen pengampu lewat `GetDosenPengajarKelasKuliah`
   * (act terpisah -- GetListKelasKuliah sendiri tidak punya kolom dosen).
   *
   * CATATAN JUJUR: `jumlah_mahasiswa` dari Feeder itu JUMLAH PESERTA SAAT INI, bukan
   * kuota/kapasitas kelas -- sengaja TIDAK dipetakan ke `CourseClass.quota` (field itu
   * artinya kapasitas maksimal) supaya tidak salah tafsir, cuma dibawa sebagai info
   * `studentCount` untuk ditampilkan di frontend.
   *
   * `id_semester` di Feeder formatnya SAMA dengan `AcademicYear.code` lokal (mis.
   * "20261") -- bukan ID internal terpisah -- jadi dicocokkan langsung tanpa perlu
   * panggilan `GetSemester` lagi, konsisten dengan cara `pullKurikulumFromFeeder`
   * menurunkan `startYear` dari `id_semester`.
   */
  async pullKelasKuliahFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteCourseClassItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiCodeMap = await this.getProdiCodeMap(setting.baseUrl, token);
      const kelasRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListKelasKuliah', 500, 60000);

      // GetListKelasKuliah SUDAH menyertakan id_dosen + nama_dosen langsung (terverifikasi
      // dari respons live), tapi tidak ada NIDN-nya -- GetDosenPengajarKelasKuliah dipanggil
      // terpisah untuk melengkapi NIDN. Satu kelas BISA punya lebih dari satu dosen pengampu
      // (team teaching), tapi CourseClass lokal cuma punya 1 lecturerId -- dipakai kemunculan
      // PERTAMA per id_kelas_kuliah supaya hasilnya konsisten, sama seperti pola first-wins
      // di pullMataKuliahFromFeeder.
      const dosenPengampuMap = new Map<string, { feederId?: string; nidn?: string; name?: string }>();
      try {
        const pengampuRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetDosenPengajarKelasKuliah', 500, 60000);
        for (const r of pengampuRows) {
          const idKelas = this.cleanFeederValue(r?.id_kelas_kuliah);
          if (!idKelas || dosenPengampuMap.has(idKelas)) continue;
          dosenPengampuMap.set(idKelas, {
            feederId: this.cleanFeederValue(r?.id_dosen),
            nidn: this.cleanFeederValue(r?.nidn),
            name: this.cleanFeederValue(r?.nama_dosen),
          });
        }
      } catch {
        // non-blocking -- dosen pengampu jadi kosong, kelasnya tetap bisa ditarik
      }

      // Course & dosen lokal dicocokkan lewat feederId -- diambil sekaligus (bukan per
      // baris) supaya tidak query database ratusan kali untuk ratusan kelas.
      const courseFeederIds = Array.from(
        new Set(kelasRows.map((r) => this.cleanFeederValue(r?.id_matkul)).filter((v): v is string => Boolean(v)))
      );
      const courses = courseFeederIds.length
        ? await this.prisma.course.findMany({ where: { feederId: { in: courseFeederIds } } })
        : [];
      const courseMap = new Map(courses.map((c) => [c.feederId as string, c]));

      const items: RemoteCourseClassItem[] = kelasRows
        .filter((r) => r?.id_kelas_kuliah && r?.nama_kelas_kuliah)
        .map((r) => {
          const idKelas = this.cleanFeederValue(r.id_kelas_kuliah)!;
          const courseFeederId = this.cleanFeederValue(r.id_matkul);
          const course = courseFeederId ? courseMap.get(courseFeederId) : undefined;
          const pengampu = dosenPengampuMap.get(idKelas);
          // sks dari Feeder datang sebagai string desimal (mis. "1.00") -- parseFloat,
          // bukan parseInt, supaya bobot pecahan (mis. 0.5) tidak terpotong jadi 0.
          const sks = parseFloat(String(r.sks ?? ''));
          const studentCount = parseInt(String(r.jumlah_mahasiswa ?? ''), 10);
          return {
            feederId: idKelas,
            className: this.cleanFeederValue(r.nama_kelas_kuliah) || '',
            courseFeederId,
            courseCode: course?.code,
            courseName: course?.name,
            academicYearCode: this.cleanFeederValue(r.id_semester),
            sks: !Number.isNaN(sks) && sks > 0 ? sks : undefined,
            studentCount: !Number.isNaN(studentCount) ? studentCount : undefined,
            prodiCode: r.id_prodi ? prodiCodeMap.get(String(r.id_prodi)) : undefined,
            // GetListKelasKuliah sudah bawa id_dosen + nama_dosen langsung -- dipakai sebagai
            // fallback kalau kelasnya tidak ketemu di GetDosenPengajarKelasKuliah (mis. karena
            // aktivitas mengajarnya belum/tidak dilaporkan terpisah), supaya info dosen tidak
            // hilang percuma padahal sebenarnya ada di baris List-nya.
            lecturerFeederId: pengampu?.feederId || this.cleanFeederValue(r.id_dosen),
            lecturerNidn: pengampu?.nidn,
            lecturerName: pengampu?.name || this.cleanFeederValue(r.nama_dosen),
          };
        })
        .filter((i) => i.className);

      try {
        await this.prisma.pddiktiSetting.update({ where: { id: PDDIKTI_SETTING_ID }, data: { lastSyncAt: new Date() } });
      } catch {
        // non-blocking
      }

      return { success: true, message: `Berhasil menarik ${items.length} kelas perkuliahan dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data kelas perkuliahan: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /**
   * Cocokkan/buat ulang CourseClass lokal dari hasil pull Feeder -- dicocokkan lewat
   * feederId. Mata kuliah & tahun akademiknya WAJIB sudah ada lokal (dicocokkan lewat
   * Course.feederId dan AcademicYear.code) -- kalau belum ada, baris dilewati (bukan
   * ditebak) supaya admin sinkronkan Mata Kuliah & Tahun Akademik dulu. Dosen pengampu
   * sifatnya opsional -- kalau dosennya belum ketemu lokal, kelasnya tetap dibuat tanpa
   * dosen, tidak sampai dilewati seluruhnya.
   */
  async syncKelasKuliahFromFeeder(rawItems: RemoteCourseClassItem[]) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { success: true, message: 'Tidak ada data kelas perkuliahan untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    const seenKeys = new Set<string>();
    let duplicatesSkipped = 0;
    const items = rawItems.filter((item) => {
      const dedupeKey = item.feederId;
      if (!dedupeKey) return true;
      if (seenKeys.has(dedupeKey)) {
        duplicatesSkipped += 1;
        return false;
      }
      seenKeys.add(dedupeKey);
      return true;
    });

    let created = 0;
    let updated = 0;
    let skipped = duplicatesSkipped;

    for (const item of items) {
      const className = item.className?.trim();
      if (!className || !item.courseFeederId || !item.academicYearCode) {
        skipped += 1;
        continue;
      }

      const course = await this.prisma.course.findUnique({ where: { feederId: item.courseFeederId } });
      const academicYear = await this.prisma.academicYear.findUnique({ where: { code: item.academicYearCode } });
      if (!course || !academicYear) {
        skipped += 1;
        continue;
      }

      let lecturerId: string | undefined;
      if (item.lecturerFeederId) {
        const lecturer = await this.prisma.lecturer.findUnique({ where: { feederId: item.lecturerFeederId } });
        if (lecturer) lecturerId = lecturer.id;
      }
      if (!lecturerId && item.lecturerNidn) {
        const lecturer = await this.prisma.lecturer.findUnique({ where: { nidn: item.lecturerNidn } });
        if (lecturer) lecturerId = lecturer.id;
      }

      const existing = await this.prisma.courseClass.findFirst({
        where: {
          OR: [
            ...(item.feederId ? [{ feederId: item.feederId }] : []),
            { courseId: course.id, academicYearId: academicYear.id, className },
          ],
        },
      });

      if (existing) {
        await this.prisma.courseClass.update({
          where: { id: existing.id },
          data: {
            feederId: item.feederId || existing.feederId,
            courseId: course.id,
            academicYearId: academicYear.id,
            className,
            ...(lecturerId ? { lecturerId } : {}),
          },
        });
        updated += 1;
        continue;
      }

      await this.prisma.courseClass.create({
        data: {
          feederId: item.feederId || null,
          courseId: course.id,
          academicYearId: academicYear.id,
          className,
          lecturerId: lecturerId || null,
        },
      });
      created += 1;
    }

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'KELAS_KULIAH_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi kelas perkuliahan dari Feeder: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} kelas baru dibuat, ${updated} diperbarui, ${skipped} dilewati (mata kuliah/tahun akademik belum tersinkron).`
          : `Sinkronisasi selesai: ${created} kelas baru dibuat, ${updated} kelas diperbarui.`,
      created,
      updated,
      skipped,
    };
  }

  /**
   * Menarik daftar peserta KRS (`GetPesertaKelasKuliah`) dari Web Service Neo Feeder
   * PDDIKTI -- 1 baris = 1 mahasiswa terdaftar di 1 kelas perkuliahan, persis seperti
   * KRS/rencana studi lokal (`CourseEnrollment`).
   *
   * CATATAN JUJUR: act ini TIDAK menyertakan id_semester langsung -- tahun akademiknya
   * diturunkan dari CourseClass lokal yang sudah dikaitkan ke semester (hasil sync Kelas
   * Perkuliahan), bukan ditebak dari field lain. Dataset ini bisa sangat besar (ribuan
   * baris per kelas x ribuan kelas) -- ditarik apa adanya tanpa filter tahun, konsisten
   * dengan entitas lain yang menarik seluruh riwayat.
   */
  async pullKrsFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteEnrollmentItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiCodeMap = await this.getProdiCodeMap(setting.baseUrl, token);
      const rows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetPesertaKelasKuliah', 500, 60000);

      const items: RemoteEnrollmentItem[] = rows
        .filter((r) => r?.id_kelas_kuliah && r?.id_mahasiswa)
        .map((r) => ({
          classFeederId: this.cleanFeederValue(r.id_kelas_kuliah)!,
          className: this.cleanFeederValue(r.nama_kelas_kuliah),
          studentFeederId: this.cleanFeederValue(r.id_mahasiswa),
          nim: this.cleanFeederValue(r.nim),
          studentName: this.cleanFeederValue(r.nama_mahasiswa),
          courseCode: this.cleanFeederValue(r.kode_mata_kuliah),
          courseName: this.cleanFeederValue(r.nama_mata_kuliah),
          prodiCode: r.id_prodi ? prodiCodeMap.get(String(r.id_prodi)) : undefined,
        }));

      return { success: true, message: `Berhasil menarik ${items.length} peserta KRS dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data KRS: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /** Memecah array jadi potongan-potongan kecil -- dipakai supaya query `IN (...)` / `createMany` ke Postgres tidak melebihi batas jumlah parameter saat datanya puluhan ribu baris. */
  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }

  /**
   * Cocokkan/buat ulang CourseEnrollment (KRS) lokal dari hasil pull Feeder. Kelas
   * perkuliahannya WAJIB sudah tersinkron lokal (dicocokkan lewat CourseClass.feederId) --
   * courseId & academicYearId KRS diturunkan dari CourseClass yang ditemukan, bukan
   * ditebak ulang, supaya selalu konsisten dengan kelasnya. Mahasiswa yang belum ketemu
   * lokal (feederId atau NIM) dilewati, bukan dibuatkan data mahasiswa baru di sini --
   * sinkronkan Mahasiswa dulu lewat kartu Mahasiswa.
   *
   * CATATAN: dataset ini bisa puluhan ribu baris (1 mahasiswa x N kelas) -- query
   * dilakukan PER-BATCH (findMany + createMany), bukan satu query per baris seperti
   * entitas lain, karena versi per-baris sebelumnya bikin request timeout (>100 detik
   * untuk ~70rb baris). Konsekuensinya: baris yang sudah terdaftar TIDAK dibedakan dari
   * baris baru lewat `findUnique` satu-satu lagi -- `createMany({ skipDuplicates: true })`
   * yang menangani itu di level database sekaligus, jadi "updated" di sini artinya "sudah
   * terdaftar sebelumnya (dilewati otomatis oleh constraint unik)", bukan ada field yang
   * benar-benar diperbarui.
   */
  async syncKrsFromFeeder(rawItems: RemoteEnrollmentItem[]) {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { success: true, message: 'Tidak ada data KRS untuk disinkronkan.', created: 0, updated: 0, skipped: 0 };
    }

    const seenKeys = new Set<string>();
    let duplicatesSkipped = 0;
    const items = rawItems.filter((item) => {
      if (!item.classFeederId || (!item.studentFeederId && !item.nim)) return false;
      const dedupeKey = `${item.classFeederId}|${item.studentFeederId || item.nim}`;
      if (seenKeys.has(dedupeKey)) {
        duplicatesSkipped += 1;
        return false;
      }
      seenKeys.add(dedupeKey);
      return true;
    });
    const unmatchedBeforeLookup = rawItems.length - items.length - duplicatesSkipped;

    const classFeederIds = Array.from(new Set(items.map((i) => i.classFeederId)));
    const studentFeederIds = Array.from(new Set(items.map((i) => i.studentFeederId).filter((v): v is string => Boolean(v))));
    const nims = Array.from(new Set(items.map((i) => i.nim).filter((v): v is string => Boolean(v))));

    const classMap = new Map<string, { id: string; courseId: string; academicYearId: string }>();
    for (const chunk of this.chunkArray(classFeederIds, 2000)) {
      const rows = await this.prisma.courseClass.findMany({
        where: { feederId: { in: chunk } },
        select: { id: true, feederId: true, courseId: true, academicYearId: true },
      });
      for (const r of rows) classMap.set(r.feederId as string, r);
    }

    const studentByFeederId = new Map<string, string>();
    for (const chunk of this.chunkArray(studentFeederIds, 2000)) {
      const rows = await this.prisma.student.findMany({ where: { feederId: { in: chunk } }, select: { id: true, feederId: true } });
      for (const r of rows) studentByFeederId.set(r.feederId as string, r.id);
    }
    const studentByNim = new Map<string, string>();
    for (const chunk of this.chunkArray(nims, 2000)) {
      const rows = await this.prisma.student.findMany({ where: { nim: { in: chunk } }, select: { id: true, nim: true } });
      for (const r of rows) studentByNim.set(r.nim, r.id);
    }

    let skipped = duplicatesSkipped + unmatchedBeforeLookup;
    const toCreate: { studentId: string; courseId: string; courseClassId: string; academicYearId: string; status: 'APPROVED' }[] = [];

    for (const item of items) {
      const courseClass = classMap.get(item.classFeederId);
      const studentId = (item.studentFeederId && studentByFeederId.get(item.studentFeederId)) || (item.nim && studentByNim.get(item.nim));
      if (!courseClass || !studentId) {
        skipped += 1;
        continue;
      }
      // Status langsung APPROVED -- KRS yang ditarik dari Feeder itu sudah final/resmi
      // dilaporkan ke Dikti (proses validasi dosen PA-nya sudah kelar di masa lalu, bukan
      // pengajuan baru yang masih menunggu review lokal), jadi tidak ditaruh di status
      // default SUBMITTED yang berarti "menunggu verifikasi".
      toCreate.push({
        studentId,
        courseId: courseClass.courseId,
        courseClassId: courseClass.id,
        academicYearId: courseClass.academicYearId,
        status: 'APPROVED' as const,
      });
    }

    let created = 0;
    for (const chunk of this.chunkArray(toCreate, 3000)) {
      const result = await this.prisma.courseEnrollment.createMany({ data: chunk, skipDuplicates: true });
      created += result.count;
    }
    const updated = toCreate.length - created; // sudah terdaftar sebelumnya -- dilewati oleh skipDuplicates

    // Tandai SEMUA baris yang cocok dengan data Feeder (baru maupun yang sudah ada) sebagai
    // sinkron -- dikelompokkan per kelas supaya cukup satu updateMany per kelas.
    const studentsByClass = new Map<string, string[]>();
    for (const row of toCreate) {
      const list = studentsByClass.get(row.courseClassId);
      if (list) list.push(row.studentId);
      else studentsByClass.set(row.courseClassId, [row.studentId]);
    }
    const syncedAt = new Date();
    await this.runWithConcurrency(Array.from(studentsByClass.entries()), 5, async ([courseClassId, studentIds]) => {
      for (const chunk of this.chunkArray(studentIds, 2000)) {
        await this.prisma.courseEnrollment.updateMany({
          where: { courseClassId, studentId: { in: chunk } },
          data: { feederSyncedAt: syncedAt },
        });
      }
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'KRS_SYNC_FROM_FEEDER',
          detail: `Sinkronisasi KRS dari Feeder: ${created} dibuat, ${updated} sudah terdaftar, ${skipped} dilewati.`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message:
        skipped > 0
          ? `Sinkronisasi selesai: ${created} KRS baru dibuat, ${updated} sudah terdaftar sebelumnya, ${skipped} dilewati (kelas/mahasiswa belum tersinkron).`
          : `Sinkronisasi selesai: ${created} KRS baru dibuat, ${updated} sudah terdaftar sebelumnya.`,
      created,
      updated,
      skipped,
    };
  }

  /** Menjalankan `worker` atas tiap elemen `items` dengan batas jumlah proses paralel -- dipakai supaya panggilan ke Feeder per-kelas tidak membanjiri servernya sekaligus (2000+ kelas) tapi tetap lebih cepat dari sekuensial murni. */
  // =====================================================================================
  // PUSH KELAS PERKULIAHAN, KRS (PESERTA KELAS) & NILAI KE FEEDER
  //
  // Field & act mengikuti GetDictionary resmi Feeder: InsertKelasKuliah,
  // InsertDosenPengajarKelasKuliah, InsertPesertaKelasKuliah, UpdateNilaiPerkuliahanKelas.
  // Semua MENULIS ke basis data Feeder -- hanya Super Admin (lihat controller). Setiap data dicek
  // dulu ke Feeder supaya tidak membuat duplikat; yang sudah ada hanya ditautkan.
  // =====================================================================================

  private pushEmptyResult(message: string) {
    return { success: false, message, processed: 0, created: 0, linked: 0, failed: 0, skipped: 0, failReasons: {} as Record<string, number> };
  }

  private pushReasonText(failReasons: Record<string, number>) {
    return Object.keys(failReasons).length
      ? ` Alasan gagal: ${Object.entries(failReasons).map(([r, n]) => `${r} (${n})`).join('; ')}.`
      : '';
  }

  /** Ringkasan Push KRS/Nilai: berapa yang siap dikirim dan berapa yang tertahan (beserta penyebabnya). */
  async getPendingKrsNilaiPush() {
    const [krsReady, krsNoClass, krsNoStudent, nilaiReady, nilaiWaitingKrs] = await Promise.all([
      this.prisma.courseEnrollment.count({
        where: { status: 'APPROVED', feederSyncedAt: null, courseClass: { feederId: { not: null } }, student: { feederRegistrationId: { not: null } } },
      }),
      this.prisma.courseEnrollment.count({
        where: { status: 'APPROVED', feederSyncedAt: null, OR: [{ courseClassId: null }, { courseClass: { feederId: null } }] },
      }),
      this.prisma.courseEnrollment.count({
        where: { status: 'APPROVED', feederSyncedAt: null, courseClass: { feederId: { not: null } }, student: { feederRegistrationId: null } },
      }),
      this.prisma.courseEnrollment.count({
        where: { gradeStatus: 'FINAL', gradeLetter: { not: null }, feederSyncedAt: { not: null }, feederGradeSyncedAt: null },
      }),
      this.prisma.courseEnrollment.count({
        where: { gradeStatus: 'FINAL', gradeLetter: { not: null }, feederSyncedAt: null },
      }),
    ]);
    return {
      krs: { ready: krsReady, blockedClassNotInFeeder: krsNoClass, blockedStudentNotInFeeder: krsNoStudent },
      nilai: { ready: nilaiReady, blockedKrsNotInFeeder: nilaiWaitingKrs },
    };
  }

  /**
   * Push kelas perkuliahan lokal yang belum punya feederId (`InsertKelasKuliah`), lalu -- bila dosen
   * pengampu punya ID Feeder dan penugasannya di tahun itu ditemukan -- mengirim dosen pengajarnya
   * (`InsertDosenPengajarKelasKuliah`). Kegagalan dosen pengajar TIDAK membatalkan kelas; dicatat
   * sebagai peringatan pada baris kelas.
   */
  async pushKelasKuliahBaruToFeeder(classIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return this.pushEmptyResult('Konfigurasi Web Service Neo Feeder belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.');
    }

    const LIMIT_PER_RUN = 50;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const prodiFeederIdByCode = await this.getProdiFeederIdByCode(setting.baseUrl, token);

      const eligible = await this.prisma.courseClass.findMany({
        where: { feederId: null, ...(classIds && classIds.length > 0 ? { id: { in: classIds } } : {}) },
        include: {
          course: { include: { studyProgram: true } },
          academicYear: { select: { code: true } },
          lecturer: { select: { feederId: true } },
        },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let processed = 0;
      let created = 0;
      let linked = 0;
      let failed = 0;
      let skipped = 0;
      let lecturersSent = 0;
      let lecturersPending = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = async (id: string, reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
        await this.prisma.courseClass.update({ where: { id }, data: { feederSyncError: reason, feederSyncErrorAt: new Date() } }).catch(() => null);
      };

      for (const cls of eligible) {
        processed += 1;
        const diktiCode = cls.course.studyProgram?.diktiCode?.trim();
        const idProdi = diktiCode ? prodiFeederIdByCode.get(diktiCode) : undefined;
        if (!idProdi) {
          skipped += 1;
          await this.prisma.courseClass
            .update({ where: { id: cls.id }, data: { feederSyncError: 'Program studi belum tersinkron ke Feeder (kode PDDIKTI tidak cocok).', feederSyncErrorAt: new Date() } })
            .catch(() => null);
          continue;
        }
        if (!cls.course.feederId) {
          await markFailed(cls.id, 'Mata kuliah belum terdaftar di Feeder -- Push mata kuliah lebih dulu.');
          continue;
        }
        const semesterId = cls.academicYear?.code;
        if (!semesterId || semesterId.length !== 5) {
          await markFailed(cls.id, 'Kode tahun akademik tidak berformat ID semester Feeder (5 karakter, mis. 20261).');
          continue;
        }
        const name = (cls.className || '').trim();
        if (!name || name.length > 5) {
          await markFailed(cls.id, `Nama kelas "${name}" melebihi batas Feeder (maksimal 5 karakter).`);
          continue;
        }

        let idKelas: string | null = null;
        try {
          const { data: found, errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetListKelasKuliah',
            token,
            filter:
              `id_prodi = '${this.escapeFeederFilter(idProdi)}' and id_semester = '${this.escapeFeederFilter(semesterId)}' ` +
              `and id_matkul = '${this.escapeFeederFilter(cls.course.feederId)}' and nama_kelas_kuliah = '${this.escapeFeederFilter(name)}'`,
            limit: 1,
            offset: 0,
          });
          if (errorCode !== '0') throw new Error(errorDesc || 'Respon Feeder tidak valid');
          const hit = Array.isArray(found) ? found[0] : null;
          if (hit?.id_kelas_kuliah) {
            idKelas = String(hit.id_kelas_kuliah);
            await this.prisma.courseClass.update({ where: { id: cls.id }, data: { feederId: idKelas, feederSyncError: null, feederSyncErrorAt: null } });
            linked += 1;
          }
        } catch (err: any) {
          await markFailed(cls.id, `Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
          continue;
        }

        if (!idKelas) {
          const { data: ins, errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'InsertKelasKuliah',
            token,
            record: {
              id_prodi: idProdi,
              id_semester: semesterId,
              id_matkul: cls.course.feederId,
              nama_kelas_kuliah: name,
              kapasitas: cls.quota,
            },
          });
          if (errorCode !== '0' || !ins?.id_kelas_kuliah) {
            await markFailed(cls.id, `Insert kelas ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`);
            continue;
          }
          idKelas = String(ins.id_kelas_kuliah);
          await this.prisma.courseClass.update({ where: { id: cls.id }, data: { feederId: idKelas, feederSyncError: null, feederSyncErrorAt: null } });
          created += 1;
        }

        // ---- dosen pengajar (opsional, tidak membatalkan kelas bila gagal)
        let warning: string | null = null;
        if (!cls.lecturer?.feederId) {
          warning = 'Kelas terdaftar, tetapi dosen pengajar belum dikirim: dosen pengampu belum punya ID Feeder (atau belum ditetapkan).';
        } else {
          try {
            const { data: pen, errorCode: penErr } = await this.callFeeder(setting.baseUrl, {
              act: 'GetListPenugasanDosen',
              token,
              filter: `id_dosen = '${this.escapeFeederFilter(cls.lecturer.feederId)}' and id_prodi = '${this.escapeFeederFilter(idProdi)}' and id_tahun_ajaran = '${this.escapeFeederFilter(semesterId.slice(0, 4))}'`,
              limit: 1,
              offset: 0,
            });
            const idReg = penErr === '0' && Array.isArray(pen) ? pen[0]?.id_registrasi_dosen : null;
            if (!idReg) {
              warning = `Kelas terdaftar, tetapi dosen pengajar belum dikirim: penugasan dosen tahun ${semesterId.slice(0, 4)} di prodi ini tidak ditemukan di Feeder.`;
            } else {
              const { errorCode: dErr, errorDesc: dDesc } = await this.callFeeder(setting.baseUrl, {
                act: 'InsertDosenPengajarKelasKuliah',
                token,
                record: {
                  id_registrasi_dosen: idReg,
                  id_kelas_kuliah: idKelas,
                  sks_substansi_total: cls.course.sks,
                  rencana_minggu_pertemuan: 16,
                  id_jenis_evaluasi: 1,
                },
              });
              if (dErr === '0' || dErr === '1192') lecturersSent += 1; // 1192 = "Data Dosen Pengajar sudah ada"
              else warning = `Kelas terdaftar, tetapi dosen pengajar ditolak Feeder: ${dDesc || 'tanpa keterangan'}`;
            }
          } catch (err: any) {
            warning = `Kelas terdaftar, tetapi dosen pengajar gagal dikirim: ${err?.message || 'Unknown error'}`;
          }
        }
        if (warning) {
          lecturersPending += 1;
          await this.prisma.courseClass.update({ where: { id: cls.id }, data: { feederSyncError: warning, feederSyncErrorAt: new Date() } }).catch(() => null);
        }
      }

      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'KELAS_PUSH_TO_FEEDER',
            detail: `Push kelas ke Feeder: ${processed} diproses, ${created} dibuat, ${linked} ditautkan, ${failed} gagal, ${skipped} dilewati; dosen pengajar terkirim ${lecturersSent}, tertunda ${lecturersPending}.`,
          },
        });
      } catch {
        // non-blocking
      }

      const remaining = await this.prisma.courseClass.count({ where: { feederId: null } });
      return {
        success: true,
        message:
          `Push selesai: ${processed} diproses, ${created} kelas baru dibuat di Feeder, ${linked} sudah ada (ditautkan), ${failed} gagal, ${skipped} dilewati. ` +
          `Dosen pengajar terkirim: ${lecturersSent}; tertunda: ${lecturersPending}.` +
          (remaining > 0 ? ` Masih ada ${remaining} kelas belum terdaftar -- jalankan Push lagi untuk lanjut.` : '') +
          this.pushReasonText(failReasons),
        processed,
        created,
        linked,
        failed,
        skipped,
        failReasons,
      };
    } catch (err: any) {
      return this.pushEmptyResult(`Gagal push data kelas: ${err?.message || 'Unknown error'}`);
    }
  }

  /**
   * Push KRS = mendaftarkan mahasiswa sebagai peserta kelas (`InsertPesertaKelasKuliah`). Hanya KRS
   * berstatus APPROVED yang kelasnya sudah ber-ID Feeder dan mahasiswanya sudah punya
   * id_registrasi_mahasiswa. Dicek dulu via GetDetailNilaiPerkuliahanKelas agar tidak dobel.
   */
  async pushKrsToFeeder(enrollmentIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return this.pushEmptyResult('Konfigurasi Web Service Neo Feeder belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.');
    }
    const LIMIT_PER_RUN = 200;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const eligible = await this.prisma.courseEnrollment.findMany({
        where: {
          status: 'APPROVED',
          feederSyncedAt: null,
          courseClass: { feederId: { not: null } },
          student: { feederRegistrationId: { not: null } },
          ...(enrollmentIds && enrollmentIds.length > 0 ? { id: { in: enrollmentIds } } : {}),
        },
        select: { id: true, courseClass: { select: { feederId: true } }, student: { select: { feederRegistrationId: true } } },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let created = 0;
      let linked = 0;
      let failed = 0;
      const failReasons: Record<string, number> = {};
      await this.runWithConcurrency(eligible, 5, async (e) => {
        const idKelas = e.courseClass!.feederId!;
        const idReg = e.student.feederRegistrationId!;
        const fail = async (reason: string) => {
          failed += 1;
          failReasons[reason] = (failReasons[reason] || 0) + 1;
          await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederSyncError: reason } }).catch(() => null);
        };
        try {
          const { data: found, errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'GetDetailNilaiPerkuliahanKelas',
            token,
            filter: `id_kelas_kuliah = '${this.escapeFeederFilter(idKelas)}' and id_registrasi_mahasiswa = '${this.escapeFeederFilter(idReg)}'`,
            limit: 1,
            offset: 0,
          });
          if (errorCode !== '0') throw new Error(errorDesc || 'Respon Feeder tidak valid');
          if (Array.isArray(found) && found.length > 0) {
            await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederSyncedAt: new Date(), feederSyncError: null } });
            linked += 1;
            return;
          }
          const { errorCode: insErr, errorDesc: insDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'InsertPesertaKelasKuliah',
            token,
            record: { id_kelas_kuliah: idKelas, id_registrasi_mahasiswa: idReg },
          });
          if (insErr === '119') {
            // "Data yang akan ditambahkan sudah ada" -- peserta sudah terdaftar di Feeder: cukup ditautkan.
            await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederSyncedAt: new Date(), feederSyncError: null } });
            linked += 1;
            return;
          }
          if (insErr !== '0') {
            await fail(`Insert peserta kelas ditolak Feeder: ${insDesc || 'tanpa keterangan'}`);
            return;
          }
          await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederSyncedAt: new Date(), feederSyncError: null } });
          created += 1;
        } catch (err: any) {
          await fail(`Gagal memproses: ${err?.message || 'Unknown error'}`);
        }
      });

      try {
        await this.prisma.systemAuditLog.create({
          data: { action: 'KRS_PUSH_TO_FEEDER', detail: `Push KRS ke Feeder: ${eligible.length} diproses, ${created} terdaftar baru, ${linked} sudah ada, ${failed} gagal.` },
        });
      } catch {
        // non-blocking
      }

      const pending = await this.getPendingKrsNilaiPush();
      return {
        success: true,
        message:
          `Push KRS selesai: ${eligible.length} diproses, ${created} peserta baru didaftarkan di Feeder, ${linked} sudah ada (ditautkan), ${failed} gagal.` +
          (pending.krs.ready > 0 ? ` Masih ada ${pending.krs.ready} KRS siap kirim -- jalankan Push lagi untuk lanjut.` : '') +
          (pending.krs.blockedClassNotInFeeder + pending.krs.blockedStudentNotInFeeder > 0
            ? ` Tertahan: ${pending.krs.blockedClassNotInFeeder} (kelas belum di Feeder), ${pending.krs.blockedStudentNotInFeeder} (mahasiswa belum punya registrasi di Feeder).`
            : '') +
          this.pushReasonText(failReasons),
        processed: eligible.length,
        created,
        linked,
        failed,
        skipped: 0,
        failReasons,
      };
    } catch (err: any) {
      return this.pushEmptyResult(`Gagal push KRS: ${err?.message || 'Unknown error'}`);
    }
  }

  /**
   * Push nilai (`UpdateNilaiPerkuliahanKelas`) untuk peserta yang sudah terdaftar di kelas Feeder.
   * Hanya nilai berstatus FINAL yang punya huruf nilai.
   */
  async pushNilaiToFeeder(enrollmentIds?: string[]) {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return this.pushEmptyResult('Konfigurasi Web Service Neo Feeder belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.');
    }
    const LIMIT_PER_RUN = 200;
    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const eligible = await this.prisma.courseEnrollment.findMany({
        where: {
          gradeStatus: 'FINAL',
          gradeLetter: { not: null },
          feederSyncedAt: { not: null },
          feederGradeSyncedAt: null,
          courseClass: { feederId: { not: null } },
          student: { feederRegistrationId: { not: null } },
          ...(enrollmentIds && enrollmentIds.length > 0 ? { id: { in: enrollmentIds } } : {}),
        },
        select: {
          id: true,
          totalScore: true,
          gradeLetter: true,
          gradePoint: true,
          courseClass: { select: { feederId: true } },
          student: { select: { feederRegistrationId: true } },
        },
        take: LIMIT_PER_RUN,
        orderBy: { updatedAt: 'asc' },
      });

      let updated = 0;
      let failed = 0;
      const failReasons: Record<string, number> = {};
      await this.runWithConcurrency(eligible, 5, async (e) => {
        try {
          // Nilai HARUS dikirim sebagai string: bila berupa angka JSON, Feeder menjawab 1178
          // ("Data Nilai Perkuliahan Kelas ... tidak ditemukan") walau pesertanya ada (terverifikasi di Feeder).
          const record: Record<string, string> = { nilai_huruf: String(e.gradeLetter) };
          if (e.totalScore != null) record.nilai_angka = (Math.round(e.totalScore * 10) / 10).toFixed(1);
          if (e.gradePoint != null) record.nilai_indeks = e.gradePoint.toFixed(2);
          const { errorCode, errorDesc } = await this.callFeeder(setting.baseUrl, {
            act: 'UpdateNilaiPerkuliahanKelas',
            token,
            key: { id_registrasi_mahasiswa: e.student.feederRegistrationId, id_kelas_kuliah: e.courseClass!.feederId },
            record,
          });
          if (errorCode !== '0') {
            const reason = `Update nilai ditolak Feeder: ${errorDesc || 'tanpa keterangan'}`;
            failed += 1;
            failReasons[reason] = (failReasons[reason] || 0) + 1;
            await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederGradeSyncError: reason } }).catch(() => null);
            return;
          }
          await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederGradeSyncedAt: new Date(), feederGradeSyncError: null } });
          updated += 1;
        } catch (err: any) {
          const reason = `Gagal memproses: ${err?.message || 'Unknown error'}`;
          failed += 1;
          failReasons[reason] = (failReasons[reason] || 0) + 1;
          await this.prisma.courseEnrollment.update({ where: { id: e.id }, data: { feederGradeSyncError: reason } }).catch(() => null);
        }
      });

      try {
        await this.prisma.systemAuditLog.create({
          data: { action: 'NILAI_PUSH_TO_FEEDER', detail: `Push nilai ke Feeder: ${eligible.length} diproses, ${updated} berhasil, ${failed} gagal.` },
        });
      } catch {
        // non-blocking
      }

      const pending = await this.getPendingKrsNilaiPush();
      return {
        success: true,
        message:
          `Push nilai selesai: ${eligible.length} diproses, ${updated} nilai terkirim, ${failed} gagal.` +
          (pending.nilai.ready > 0 ? ` Masih ada ${pending.nilai.ready} nilai siap kirim -- jalankan Push lagi untuk lanjut.` : '') +
          (pending.nilai.blockedKrsNotInFeeder > 0
            ? ` Tertahan: ${pending.nilai.blockedKrsNotInFeeder} nilai karena peserta belum terdaftar di kelas Feeder (Push KRS dulu).`
            : '') +
          this.pushReasonText(failReasons),
        processed: eligible.length,
        created: updated,
        linked: 0,
        failed,
        skipped: 0,
        failReasons,
      };
    } catch (err: any) {
      return this.pushEmptyResult(`Gagal push nilai: ${err?.message || 'Unknown error'}`);
    }
  }

  private async runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
    let index = 0;
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (index < items.length) {
        const current = items[index];
        index += 1;
        await worker(current);
      }
    });
    await Promise.all(runners);
  }

  /** Status job background Pull+Sync Nilai Perkuliahan yang sedang/terakhir berjalan -- dipoll berkala oleh frontend. */
  getNilaiSyncJobStatus(): NilaiSyncJobStatus {
    return { ...this.nilaiSyncJob };
  }

  /**
   * Memulai Pull+Sync Nilai Perkuliahan Semester di BACKGROUND (tidak menunggu selesai
   * di request HTTP ini) -- lihat `runNilaiPerkuliahanSyncJob` untuk alasannya: Feeder
   * cuma mau memberi nilai per-kelas lewat `GetDetailNilaiPerkuliahanKelas` (tidak ada
   * versi tanpa filter yang jalan), jadi untuk ~2500 kelas butuh ribuan panggilan Feeder
   * terpisah yang pasti melebihi batas waktu satu request HTTP biasa kalau ditunggu.
   */
  async startNilaiPerkuliahanSync(): Promise<{ success: boolean; message: string }> {
    if (this.nilaiSyncJob.status === 'running') {
      return { success: false, message: 'Sinkronisasi nilai perkuliahan sedang berjalan -- tunggu sampai selesai dulu.' };
    }

    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
      };
    }

    this.nilaiSyncJob = {
      status: 'running',
      totalClasses: 0,
      processedClasses: 0,
      updatedGrades: 0,
      skippedGrades: 0,
      startedAt: new Date().toISOString(),
    };

    // Sengaja TIDAK di-await -- berjalan di background, status dipoll lewat getNilaiSyncJobStatus().
    this.runNilaiPerkuliahanSyncJob(setting.baseUrl, setting.username, setting.password).catch((err) => {
      this.nilaiSyncJob = {
        ...this.nilaiSyncJob,
        status: 'error',
        finishedAt: new Date().toISOString(),
        message: `Gagal: ${err?.message || 'Unknown error'}`,
      };
    });

    return { success: true, message: 'Sinkronisasi nilai perkuliahan dimulai di background. Cek progressnya lewat status job.' };
  }

  /**
   * Proses sesungguhnya: ambil daftar kelas yang punya nilai (`GetListNilaiPerkuliahanKelas`,
   * field `jumlah_mahasiswa_dapat_nilai`), lalu untuk tiap kelas tarik detail nilai per
   * mahasiswa (`GetDetailNilaiPerkuliahanKelas`, difilter `id_kelas_kuliah`) dan simpan
   * ke `CourseEnrollment` yang SUDAH ADA (hasil sync KRS) -- nilai TIDAK membuat baris KRS
   * baru, cuma mengisi nilai pada pendaftaran yang sudah tercatat. Mahasiswa yang belum
   * ter-KRS lokal otomatis dilewati (dihitung di `skippedGrades`), bukan dibuatkan KRS
   * baru di sini.
   */
  private async runNilaiPerkuliahanSyncJob(baseUrl: string, username: string, password: string): Promise<void> {
    const token = await this.getFeederToken(baseUrl, username, password);

    // GetListNilaiPerkuliahanKelas tanpa filter sangat lambat di Feeder (~15 detik per 500
    // baris, makin dalam makin lama -- puluhan ribu baris butuh 30+ menit). Dengan filter
    // `id_smt` satu semester selesai dalam sekejap, jadi ditarik per semester secara
    // paralel (semester yang sudah mulai saja, dari GetSemester yang kecil & cepat).
    this.nilaiSyncJob.phase = 'Mengambil daftar semester dari Feeder';
    const semesterRows = await this.fetchAllFeederPages(baseUrl, token, 'GetSemester', 500, 60000);
    const now = new Date();
    const semesterIds = Array.from(
      new Set(
        semesterRows
          .filter((r) => r?.id_semester && r?.tanggal_mulai && new Date(r.tanggal_mulai) <= now)
          .map((r) => this.cleanFeederValue(r.id_semester)!)
          .filter(Boolean)
      )
    );

    const nilaiRows: any[] = [];
    let semestersDone = 0;
    await this.runWithConcurrency(semesterIds, 5, async (idSmt) => {
      try {
        const rows = await this.fetchAllFeederPages(baseUrl, token, 'GetListNilaiPerkuliahanKelas', 500, 60000, {
          filter: `id_smt = '${this.escapeFeederFilter(idSmt)}'`,
        });
        nilaiRows.push(...rows);
      } catch {
        // non-blocking -- satu semester gagal tidak menghentikan job
      } finally {
        semestersDone += 1;
        this.nilaiSyncJob.phase = `Mengambil daftar kelas dari Feeder (semester ${semestersDone}/${semesterIds.length})`;
      }
    });
    this.nilaiSyncJob.phase = 'Memproses nilai per kelas';

    const classesWithGrades = Array.from(
      new Set(
        nilaiRows
          .filter((r) => {
            const jumlah = parseInt(String(r?.jumlah_mahasiswa_dapat_nilai ?? ''), 10);
            return r?.id_kelas_kuliah && !Number.isNaN(jumlah) && jumlah > 0;
          })
          .map((r) => this.cleanFeederValue(r.id_kelas_kuliah)!)
      )
    );

    this.nilaiSyncJob.totalClasses = classesWithGrades.length;

    // CourseClass yang relevan diambil sekaligus di depan (bukan per-kelas) supaya tidak
    // ribuan query database kecil-kecil menumpuk di atas ribuan panggilan Feeder yang
    // memang sudah lambat.
    const classMap = new Map<string, { id: string }>();
    for (const chunk of this.chunkArray(classesWithGrades, 2000)) {
      const rows = await this.prisma.courseClass.findMany({ where: { feederId: { in: chunk } }, select: { id: true, feederId: true } });
      for (const r of rows) classMap.set(r.feederId as string, { id: r.id });
    }

    await this.runWithConcurrency(classesWithGrades, 5, async (classFeederId) => {
      const courseClass = classMap.get(classFeederId);
      if (!courseClass) {
        this.nilaiSyncJob.processedClasses += 1;
        return;
      }

      try {
        const detailRows = await this.fetchAllFeederPages(baseUrl, token, 'GetDetailNilaiPerkuliahanKelas', 200, 30000, {
          filter: `id_kelas_kuliah='${this.escapeFeederFilter(classFeederId)}'`,
        });

        const studentFeederIds = Array.from(
          new Set(detailRows.map((r) => this.cleanFeederValue(r?.id_mahasiswa)).filter((v): v is string => Boolean(v)))
        );
        const nims = Array.from(new Set(detailRows.map((r) => this.cleanFeederValue(r?.nim)).filter((v): v is string => Boolean(v))));
        const [byFeederId, byNim] = await Promise.all([
          studentFeederIds.length
            ? this.prisma.student.findMany({ where: { feederId: { in: studentFeederIds } }, select: { id: true, feederId: true } })
            : Promise.resolve([]),
          nims.length ? this.prisma.student.findMany({ where: { nim: { in: nims } }, select: { id: true, nim: true } }) : Promise.resolve([]),
        ]);
        const studentByFeederId = new Map(byFeederId.map((s) => [s.feederId as string, s.id]));
        const studentByNim = new Map(byNim.map((s) => [s.nim, s.id]));

        for (const row of detailRows) {
          const studentFeederId = this.cleanFeederValue(row?.id_mahasiswa);
          const nim = this.cleanFeederValue(row?.nim);
          const studentId = (studentFeederId && studentByFeederId.get(studentFeederId)) || (nim && studentByNim.get(nim));
          const nilaiAngka = parseFloat(String(row?.nilai_angka ?? ''));
          const nilaiIndeks = parseFloat(String(row?.nilai_indeks ?? ''));
          const nilaiHuruf = this.cleanFeederValue(row?.nilai_huruf);

          if (!studentId || Number.isNaN(nilaiAngka)) {
            this.nilaiSyncJob.skippedGrades += 1;
            continue;
          }

          const result = await this.prisma.courseEnrollment.updateMany({
            where: { studentId, courseClassId: courseClass.id },
            data: {
              totalScore: nilaiAngka,
              gradePoint: !Number.isNaN(nilaiIndeks) ? nilaiIndeks : undefined,
              gradeLetter: nilaiHuruf,
              gradeStatus: 'FINAL',
              feederGradeSyncedAt: new Date(),
            },
          });

          if (result.count > 0) this.nilaiSyncJob.updatedGrades += 1;
          else this.nilaiSyncJob.skippedGrades += 1;
        }
      } catch {
        // non-blocking -- 1 kelas gagal tidak menghentikan job, cuma tidak nambah updatedGrades untuk kelas itu
      } finally {
        this.nilaiSyncJob.processedClasses += 1;
      }
    });

    this.nilaiSyncJob = {
      ...this.nilaiSyncJob,
      status: 'done',
      finishedAt: new Date().toISOString(),
      message: `Selesai: ${this.nilaiSyncJob.processedClasses}/${this.nilaiSyncJob.totalClasses} kelas diproses, ${this.nilaiSyncJob.updatedGrades} nilai diperbarui, ${this.nilaiSyncJob.skippedGrades} dilewati (mahasiswa belum ter-KRS lokal).`,
    };

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'NILAI_PERKULIAHAN_SYNC_FROM_FEEDER',
          detail: this.nilaiSyncJob.message || '',
        },
      });
    } catch {
      // non-blocking
    }
  }

  /**
   * Menarik skala nilai (`GetListSkalaNilaiProdi`) dari Web Service Neo Feeder PDDIKTI.
   *
   * CATATAN JUJUR: skala nilai ini di Feeder itu PER PROGRAM STUDI (tiap prodi bisa punya
   * pemetaan huruf/bobot sendiri), sedangkan Skala Nilai lokal (`GradeScaleVersion`) itu
   * SATU grup global per tahun akademik yang dipakai menghitung nilai SELURUH mahasiswa
   * tanpa dibedakan prodi -- jadi item hasil pull sengaja dibawa apa adanya per-prodi
   * (tidak digabung/ditebak di sini), biar admin yang pilih mau pakai skala prodi yang
   * mana sebagai grup baru lewat `syncSkalaNilaiFromFeeder`.
   */
  async pullSkalaNilaiFromFeeder(): Promise<{ success: boolean; message: string; items: RemoteGradeScaleItem[] }> {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return {
        success: false,
        message: 'Konfigurasi Web Service Neo Feeder (URL, username, password) belum lengkap. Lengkapi dulu di menu Pengaturan DIKTI.',
        items: [],
      };
    }

    try {
      const token = await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      const rows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListSkalaNilaiProdi', 500, 60000);

      const items: RemoteGradeScaleItem[] = rows
        .filter((r) => r?.nilai_huruf && r?.nama_program_studi)
        .map((r) => ({
          prodiName: this.cleanFeederValue(r.nama_program_studi) || '',
          letter: this.cleanFeederValue(r.nilai_huruf) || '',
          minScore: parseFloat(String(r.bobot_nilai_min ?? '')),
          maxScore: parseFloat(String(r.bobot_nilai_maks ?? '')),
          gradePoint: parseFloat(String(r.nilai_indeks ?? '')),
        }))
        .filter((i) => i.prodiName && i.letter && !Number.isNaN(i.minScore) && !Number.isNaN(i.maxScore) && !Number.isNaN(i.gradePoint));

      return { success: true, message: `Berhasil menarik ${items.length} baris skala nilai dari Web Service Neo Feeder.`, items };
    } catch (err: any) {
      return { success: false, message: `Gagal menarik data skala nilai: ${err?.message || 'Unknown error'}`, items: [] };
    }
  }

  /**
   * Membuat grup Skala Nilai (`GradeScaleVersion`) baru dari skala satu program studi hasil
   * pull Feeder yang dipilih admin di frontend -- TIDAK otomatis menjadikannya aktif/terhubung
   * ke tahun akademik manapun, admin tetap yang menentukan lewat menu Skala Nilai seperti
   * grup manapun lainnya (konsisten dengan `createGradeScaleGroup`).
   */
  async syncSkalaNilaiFromFeeder(items: RemoteGradeScaleItem[], label?: string) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: 'Tidak ada baris skala nilai untuk disinkronkan.', created: 0 };
    }

    // Feeder TERBUKTI bisa mengembalikan lebih dari satu baris dengan huruf mutu yang sama
    // untuk prodi yang sama (mis. dua baris "E" dengan id_bobot_nilai berbeda tapi
    // rentang/bobot identik) -- GradeScale punya constraint unik (versionId, letter), jadi
    // dedupe per huruf dulu (kemunculan pertama menang) sebelum dibuat, bukan dibiarkan
    // gagal di tengah jalan karena baris duplikat.
    const seenLetters = new Set<string>();
    const dedupedItems = items.filter((i) => {
      if (seenLetters.has(i.letter)) return false;
      seenLetters.add(i.letter);
      return true;
    });

    const version = await this.prisma.gradeScaleVersion.create({
      data: {
        label: label?.trim() || `Tarikan Feeder -- ${dedupedItems[0].prodiName}`,
        scales: {
          create: dedupedItems.map((i) => ({
            letter: i.letter,
            minScore: i.minScore,
            maxScore: i.maxScore,
            gradePoint: i.gradePoint,
          })),
        },
      },
      include: { scales: true },
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'SKALA_NILAI_SYNC_FROM_FEEDER',
          detail: `Grup skala nilai baru dibuat dari Feeder: "${version.label}" (${version.scales.length} baris).`,
        },
      });
    } catch {
      // non-blocking
    }

    return {
      success: true,
      message: `Grup skala nilai "${version.label}" berhasil dibuat dari ${version.scales.length} baris hasil tarikan Feeder. Aktifkan lewat menu Skala Nilai kalau mau dipakai.`,
      created: version.scales.length,
      versionId: version.id,
    };
  }

  /**
   * Endpoint live2.php Neo Feeder hanya menerima POST dengan body JSON berisi `act`
   * (GET biasa akan ditolak), jadi uji koneksi sesungguhnya adalah mencoba login
   * (act: GetToken) dengan kredensial tersimpan -- bukan sekadar GET ke URL-nya.
   */
  async testPddiktiConnection() {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'URL, username, dan password Web Service belum lengkap diisi.' };
    }

    try {
      await this.getFeederToken(setting.baseUrl, setting.username, setting.password);
      return { success: true, message: 'Berhasil login ke Web Service Neo Feeder -- URL dan kredensial valid.' };
    } catch (err: any) {
      return { success: false, message: `Gagal menguji koneksi: ${err?.message || 'Unknown error'}` };
    }
  }
}
