import { Injectable } from '@nestjs/common';
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
      const markFailed = (reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
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
            await this.prisma.course.update({ where: { id: course.id }, data: { feederId: found.id_matkul } });
            linked += 1;
            continue;
          }
        } catch (err: any) {
          markFailed(`Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
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
          markFailed(`Insert mata kuliah ditolak Feeder: ${insertErrDesc || 'tanpa keterangan'}`);
          continue;
        }
        await this.prisma.course.update({ where: { id: course.id }, data: { feederId: insertData.id_matkul } });
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
      const markFailed = (reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
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
          markFailed('Tahun mulai kurikulum tidak valid');
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
            await this.prisma.curriculum.update({ where: { id: curriculum.id }, data: { feederId: found.id_kurikulum } });
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
            markFailed(`Semester ${idSemester} tidak ada di Feeder`);
            continue;
          }
        } catch (err: any) {
          markFailed(`Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
          continue;
        }

        if (curriculum.totalSks <= 0 || curriculum.sksWajib <= 0) {
          markFailed(`Jumlah SKS kurikulum tidak valid (total ${curriculum.totalSks}, wajib ${curriculum.sksWajib})`);
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
          markFailed(`Insert kurikulum ditolak Feeder: ${insertErrDesc || 'tanpa keterangan'}`);
          continue;
        }
        await this.prisma.curriculum.update({ where: { id: curriculum.id }, data: { feederId: insertData.id_kurikulum } });
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
            if (!bio) continue;
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
          }
        } catch {
          // non-blocking -- batch ini tetap disertakan dengan data ringkasan saja
        }
      }

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
        if (item.email?.trim() && existing.userId) {
          const currentUser = await this.prisma.user.findUnique({ where: { id: existing.userId } });
          const looksLikeFallback = currentUser?.email?.endsWith('@mahasiswa.itn.ac.id');
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

      const eligible = await this.prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          feederRegistrationId: null,
          ...(studentIds && studentIds.length > 0 ? { id: { in: studentIds } } : {}),
        },
        include: { user: true, studyProgram: true },
        take: LIMIT_PER_RUN,
        orderBy: { createdAt: 'asc' },
      });

      let processed = 0;
      let created = 0;
      let linked = 0;
      let failed = 0;
      let skipped = 0;
      const failReasons: Record<string, number> = {};
      const markFailed = (reason: string) => {
        failed += 1;
        failReasons[reason] = (failReasons[reason] || 0) + 1;
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
              data: { feederId: found.id_mahasiswa || idMahasiswaFeeder || null, feederRegistrationId: found.id_registrasi_mahasiswa },
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
          markFailed(`Gagal cek data di Feeder: ${err?.message || 'Unknown error'}`);
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
            markFailed(wilayahReason || 'Kecamatan/kabupaten tidak bisa dicocokkan ke data wilayah Feeder');
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
            email: student.user.email,
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
            markFailed(`Insert biodata ditolak Feeder: ${insertBioErrDesc || 'tanpa keterangan'}`);
            continue;
          }
          idMahasiswaFeeder = insertBioData?.id_mahasiswa;
          if (!idMahasiswaFeeder) {
            markFailed('Insert biodata berhasil tapi Feeder tidak mengembalikan id_mahasiswa');
            continue;
          }
          await this.prisma.student.update({ where: { id: student.id }, data: { feederId: idMahasiswaFeeder } });
        }

        // 3. Tahap 2: InsertRiwayatPendidikanMahasiswa (pendaftaran/registrasi).
        const recordReg: Record<string, any> = {
          id_mahasiswa: idMahasiswaFeeder,
          nim,
          id_jenis_daftar: 1, // Peserta didik baru -- SIAKAD belum membedakan RPL/Pindahan/Penyetaraan
          id_jalur_daftar: 12, // Seleksi Mandiri -- default kebijakan kampus, SIAKAD belum menyimpan jalur nasional
          biaya_masuk: '4000000.00',
          id_pembiayaan: '1', // Mandiri -- SIAKAD belum melacak status KIP/beasiswa di Student
          tanggal_daftar: new Date().toISOString().slice(0, 10),
          id_perguruan_tinggi: idPerguruanTinggi,
          id_prodi: idProdiFeeder,
          id_periode_masuk: `${student.entryYear}1`,
          sks_diakui: 0,
        };

        const { data: insertRegData, errorCode: insertRegErr, errorDesc: insertRegErrDesc } = await this.callFeeder(setting.baseUrl, {
          act: 'InsertRiwayatPendidikanMahasiswa',
          token,
          record: recordReg,
        });
        if (insertRegErr !== '0' || !insertRegData?.id_registrasi_mahasiswa) {
          markFailed(`Insert registrasi ditolak Feeder: ${insertRegErrDesc || 'tanpa keterangan'}`);
          continue;
        }

        await this.prisma.student.update({
          where: { id: student.id },
          data: { feederRegistrationId: insertRegData.id_registrasi_mahasiswa },
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

      const nilaiRows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetListNilaiPerkuliahanKelas', 500, 60000);
      const semestersWithKrs = new Set<string>();
      for (const r of nilaiRows) {
        const idSmt = this.cleanFeederValue(r?.id_smt);
        const jumlahKrs = parseInt(String(r?.jumlah_mahasiswa_krs ?? ''), 10);
        if (idSmt && !Number.isNaN(jumlahKrs) && jumlahKrs > 0) semestersWithKrs.add(idSmt);
      }

      const rows = await this.fetchAllFeederPages(setting.baseUrl, token, 'GetSemester', 500, 60000);
      const now = new Date();

      const items: RemoteAcademicYearItem[] = rows
        .filter(
          (r) =>
            r?.id_semester &&
            r?.tanggal_mulai &&
            r?.tanggal_selesai &&
            new Date(r.tanggal_mulai) <= now &&
            semestersWithKrs.has(this.cleanFeederValue(r.id_semester) || '')
        )
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

    const nilaiRows = await this.fetchAllFeederPages(baseUrl, token, 'GetListNilaiPerkuliahanKelas', 500, 60000);
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
