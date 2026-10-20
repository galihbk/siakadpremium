import { BadRequestException, ConflictException, NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '@siakad/database';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

/** Status kepegawaian untuk tenaga alih daya (dipekerjakan vendor, bukan yayasan). */
export const OUTSOURCING_STATUS = 'Outsourcing (Alih Daya)';
/** Kategori tenaga penunjang (bukan dosen/tendik): masing-masing kategori sendiri. Statusnya (tetap/kontrak/outsourcing) terpisah. */
export const SUPPORT_CATEGORIES = [
  'Satpam / Petugas Keamanan',
  'Office Boy / Office Girl (OB/OG)',
  'Petugas Kebersihan (Cleaning Service)',
  'Sopir / Pengemudi',
  'Teknisi / Pemeliharaan Gedung',
  'Petugas Taman',
  'Tenaga Penunjang Lainnya',
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
const isKnownCategory = (c: string) => c.includes('Dosen') || c === 'Tenaga Kependidikan' || (SUPPORT_CATEGORIES as readonly string[]).includes(c);
/** Domain placeholder untuk pegawai outsourcing tanpa email -- bukan alamat yang bisa menerima surat. */
const NO_EMAIL_DOMAIN = '@outsourcing.invalid';

export interface PegawaiResponse {
  id: string;
  nip: string;
  nidn?: string;
  nuptk?: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  gender: 'Laki-laki' | 'Perempuan';
  category: 'Dosen Tetap' | 'Dosen Luar Biasa' | 'Tenaga Kependidikan' | SupportCategory;
  employmentStatus: 'PNS / ASN' | 'Tetap Yayasan' | 'Kontrak (PKWT)' | 'Honorer' | 'Outsourcing (Alih Daya)';
  streetAddress?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  educationInstitution?: string;
  educationMajor?: string;
  graduationYear?: string;
  /** Perusahaan penyedia tenaga kerja -- hanya untuk pegawai outsourcing. */
  vendorName?: string;
  /** false = tercatat sebagai data saja (tanpa akses login ke sistem). */
  hasLogin: boolean;
  department: string;
  /** Tampilan gabungan (struktural · fungsional) untuk daftar/kartu. */
  position: string;
  structuralPosition: string;
  functionalPosition: string;
  email: string;
  phone: string;
  education: 'D3' | 'S1' | 'S2' | 'S3' | 'Profesi';
  joinDate: string;
  status: 'Aktif' | 'Cuti' | 'Pensiun' | 'Tugas Belajar';
  avatarUrl?: string;
  shiftId?: string | null;
  shiftName?: string | null;
}

const PT_KEEP_UPPER = new Set([
  'STAI', 'STAIN', 'STKIP', 'STIE', 'STIKES', 'STMIK', 'STIT', 'STIKOM', 'STT', 'STBA', 'STIA', 'STISIP', 'STPI', 'STAB', 'STAKN',
  'AKPER', 'AKBID', 'AKFAR', 'AMIK', 'IAIN', 'UIN', 'IAKN', 'IAHN', 'IKIP', 'PGRI', 'NU', 'ITB', 'ITS', 'ITN', 'UPN', 'UNJ', 'UNS',
  'UGM', 'UI', 'II', 'III', 'IV', 'RI', 'DKI', 'DIY', 'TNI', 'POLRI', 'KESDAM', 'AAL', 'PT', 'SMK', 'SMA', 'YPK', 'BPK', 'LP3I',
]);
const ptCase = (v: string) =>
  v
    .toLowerCase()
    .split(/(\s+|\/|\(|\))/)
    .map((w) => (PT_KEEP_UPPER.has(w.toUpperCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');

@Injectable()
export class EmployeesService {
  private ptCache = new Map<string, { at: number; items: { kode: string; name: string; shortName: string }[] }>();
  /** Gagal sementara (mis. dibatasi PDDikti): jangan diulang terus-menerus. */
  private ptFailedAt = new Map<string, number>();
  private ptLastCallAt = 0;
  /** Antrean panggilan ke PDDikti agar berjarak (API-nya membatasi laju per alamat IP). */
  private ptQueue: Promise<unknown> = Promise.resolve();

  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<PegawaiResponse[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: [
            Role.SUPER_ADMIN,
            Role.ADMIN_BAAK,
            Role.ADMIN_KEUANGAN,
            Role.LECTURER,
            Role.STAFF,
          ],
        },
      },
      include: {
        lecturer: {
          include: {
            studyProgram: {
              include: {
                faculty: true,
              },
            },
          },
        },
        shift: { select: { id: true, name: true } },
        employeeProfile: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users.map((u) => {
      const isLecturer = u.role === Role.LECTURER;
      const lec = u.lecturer;

      // Deterministic nip fallback if not stored
      const nip = lec?.nip || (
        u.role === Role.SUPER_ADMIN ? '19820415 200801 1 003' :
        u.role === Role.ADMIN_BAAK ? '19850620 201202 1 004' :
        u.role === Role.ADMIN_KEUANGAN ? '19901115 201802 2 001' :
        '19930510 202008 1 005'
      );

      // Title & Name parsing
      let titlePrefix = lec?.titlePrefix || '';
      let titleSuffix = lec?.titleSuffix || '';
      let cleanFullName = u.fullName;

      if (!titlePrefix && u.fullName.includes('Prof.')) titlePrefix = 'Prof. Dr. Ir.';
      else if (!titlePrefix && u.fullName.includes('Dr.')) titlePrefix = 'Dr.';

      if (!titleSuffix && u.fullName.includes(',')) {
        const parts = u.fullName.split(',');
        cleanFullName = parts[0].replace(/^(Prof\.|Dr\.|Ir\.|Dr\. Eng\.)\s*/, '').trim();
        titleSuffix = parts.slice(1).join(',').trim();
      }

      // Department & Position
      let department = 'Biro Administrasi Akademik & Kemahasiswaan (BAAK)';
      let position = 'Staf Administrasi Akademik';
      let category: PegawaiResponse['category'] = 'Tenaga Kependidikan';
      let employmentStatus: PegawaiResponse['employmentStatus'] = 'Tetap Yayasan';

      if (isLecturer) {
        category = 'Dosen Tetap';
        department = lec?.studyProgram?.faculty?.name || 'Fakultas Ilmu Komputer';
        if (cleanFullName.includes('Hendra')) {
          position = 'Guru Besar / Dekan Fakultas Teknik';
          department = 'Fakultas Teknik';
          employmentStatus = 'PNS / ASN';
        } else if (cleanFullName.includes('Satria')) {
          position = 'Dekan Fakultas Ilmu Komputer';
          department = 'Fakultas Ilmu Komputer';
        } else if (cleanFullName.includes('Nurul')) {
          position = 'Dekan Fakultas Ekonomi & Bisnis';
          department = 'Fakultas Ekonomi & Bisnis';
          employmentStatus = 'PNS / ASN';
        } else if (cleanFullName.includes('Siti')) {
          position = 'Ketua Program Studi Teknik Informatika';
          department = 'Fakultas Ilmu Komputer';
        } else {
          position = `Dosen Pengajar (${lec?.studyProgram?.name || 'Informatika'})`;
        }
      } else if (u.role === Role.SUPER_ADMIN) {
        position = 'Kepala Bagian Sistem Informasi & BAAK';
        department = 'Biro Administrasi Akademik & Kemahasiswaan (BAAK)';
        category = 'Tenaga Kependidikan';
      } else if (u.role === Role.ADMIN_BAAK) {
        position = 'Kasubag Pelayanan Mahasiswa & Registrasi';
        department = 'Biro Administrasi Akademik & Kemahasiswaan (BAAK)';
        category = 'Tenaga Kependidikan';
      } else if (u.role === Role.ADMIN_KEUANGAN) {
        position = 'Kepala Bagian Verifikasi & Penggajian';
        department = 'Biro Administrasi Keuangan (BAK)';
        category = 'Tenaga Kependidikan';
      } else if (u.role === Role.STAFF) {
        if (cleanFullName.includes('Rizky')) {
          position = 'Network & Cloud Infrastructure Engineer';
          department = 'Direktorat Sistem Teknologi Informasi (DSTI)';
          category = 'Tenaga Kependidikan';
          employmentStatus = 'Kontrak (PKWT)';
        } else {
          position = 'Koordinator Sarana & Pemeliharaan Gedung';
          department = 'Biro Urusan Rumah Tangga & Sarpras (URT)';
          category = 'Tenaga Kependidikan';
          employmentStatus = 'Kontrak (PKWT)';
        }
      }

      // Gender estimate
      const gender: 'Laki-laki' | 'Perempuan' =
        cleanFullName.toLowerCase().includes('dewi') ||
        cleanFullName.toLowerCase().includes('siti') ||
        cleanFullName.toLowerCase().includes('nurul') ||
        cleanFullName.toLowerCase().includes('rahma')
          ? 'Perempuan'
          : 'Laki-laki';

      // Education estimate
      let education: PegawaiResponse['education'] = 'S1';
      if (titlePrefix.includes('Dr') || titlePrefix.includes('Prof')) education = 'S3';
      else if (titleSuffix.includes('M.') || titleSuffix.includes('M.Kom') || titleSuffix.includes('M.Cs') || titleSuffix.includes('M.Ak') || titleSuffix.includes('M.Eng')) education = 'S2';
      else if (titleSuffix.includes('A.Md')) education = 'D3';

      // Jabatan bawaan (belum diisi SDM). Jabatan fungsional hanya untuk dosen (Tenaga Pengajar, Asisten Ahli,
      // Lektor, Lektor Kepala, Profesor); tenaga kependidikan hanya punya jabatan struktural/penugasan.
      let structuralPosition = '';
      let functionalPosition = '';
      if (isLecturer) {
        functionalPosition = lec?.functionalPosition || (position.includes('Guru Besar') ? 'Profesor' : 'Tenaga Pengajar');
        if (/(Dekan|Ketua Program Studi)/i.test(position)) {
          structuralPosition = position.replace(/^Guru Besar \/ /, '');
        }
      } else {
        structuralPosition = position;
      }

      // Profil yang diisi Biro SDM menimpa nilai bawaan
      const prof = u.employeeProfile;
      if (prof) {
        if (prof.structuralPosition !== null || prof.functionalPosition !== null) {
          structuralPosition = prof.structuralPosition ?? '';
          functionalPosition = prof.functionalPosition ?? '';
        }
        // kategori lama (Laboran & IT / Staf Layanan & Umum) dilebur ke Tenaga Kependidikan
        // kategori lama yang sudah tidak dipakai (Laboran & IT, Staf Layanan & Umum, Tenaga Outsourcing) -> Tenaga Kependidikan
        if (prof.category) category = isKnownCategory(prof.category) ? (prof.category as PegawaiResponse['category']) : 'Tenaga Kependidikan';
        if (prof.employmentStatus) employmentStatus = prof.employmentStatus as PegawaiResponse['employmentStatus'];
        if (prof.department) department = prof.department;
      }
      const isOutsourcing = employmentStatus === OUTSOURCING_STATUS;
      if (!category.includes('Dosen')) functionalPosition = '';
      const noLogin = u.email.endsWith(NO_EMAIL_DOMAIN);
      position = [structuralPosition, functionalPosition].filter(Boolean).join(' · ') || '-';

      return {
        id: u.id,
        nip: prof?.nip || (isOutsourcing ? '-' : nip),
        nidn: lec?.nidn || prof?.nidn || undefined,
        nuptk: lec?.nuptk || undefined,
        streetAddress: prof?.streetAddress || lec?.address || undefined,
        rtRw: prof?.rtRw || lec?.rtRw || undefined,
        kelurahan: prof?.kelurahan || lec?.kelurahan || undefined,
        kecamatan: prof?.kecamatan || lec?.kecamatan || undefined,
        city: prof?.city || lec?.city || undefined,
        province: prof?.province || lec?.province || undefined,
        postalCode: prof?.postalCode || lec?.postalCode || undefined,
        educationInstitution: prof?.educationInstitution || undefined,
        educationMajor: prof?.educationMajor || undefined,
        graduationYear: prof?.graduationYear || undefined,
        fullName: cleanFullName,
        titlePrefix: titlePrefix || undefined,
        titleSuffix: titleSuffix || undefined,
        gender: (prof?.gender as PegawaiResponse['gender']) || gender,
        category,
        employmentStatus,
        department,
        position,
        structuralPosition,
        functionalPosition,
        email: noLogin ? prof?.contactEmail || '' : u.email,
        hasLogin: !noLogin,
        vendorName: isOutsourcing ? prof?.vendorName || undefined : undefined,
        phone: prof?.phone || lec?.phone || (isOutsourcing ? '' : '0812-3456-7890'),
        education: (prof?.education as PegawaiResponse['education']) || education,
        joinDate: prof?.joinDate || u.createdAt.toISOString().split('T')[0],
        status: u.isActive ? 'Aktif' : 'Cuti',
        avatarUrl: u.avatarUrl || undefined,
        shiftId: u.shiftId || null,
        shiftName: u.shift?.name || null,
      };
    });
  }

  /**
   * Pencarian perguruan tinggi (data PDDikti Kemdiktisaintek) untuk isian riwayat pendidikan.
   * Diteruskan lewat server agar tidak terkendala CORS dan dibatasi lajunya (hasil disimpan 1 jam).
   */
  async searchUniversities(search: string) {
    const q = String(search ?? '').trim().replace(/\s+/g, ' ');
    if (q.length < 3) return { items: [], unavailable: false };
    const key = q.toLowerCase();
    const hit = this.ptCache.get(key);
    if (hit && Date.now() - hit.at < 60 * 60 * 1000) return { items: hit.items, unavailable: false };

    const failedAt = this.ptFailedAt.get(key);
    if (failedAt && Date.now() - failedAt < 20_000) return { items: [], unavailable: true };

    const run = async () => {
      // jarak minimal antar panggilan ke PDDikti
      const wait = this.ptLastCallAt + 1200 - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      for (let attempt = 0; attempt < 2; attempt++) {
        this.ptLastCallAt = Date.now();
        const res = await fetch(`https://api-pddikti.kemdiktisaintek.go.id/pencarian/pt/${encodeURIComponent(q)}`, {
          signal: AbortSignal.timeout(8000),
          headers: {
            Accept: 'application/json',
            Origin: 'https://pddikti.kemdiktisaintek.go.id',
            Referer: 'https://pddikti.kemdiktisaintek.go.id/',
            'User-Agent': 'Mozilla/5.0 (compatible; SIAKAD-Premium)',
          },
        });
        if (res.status === 429 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        return res;
      }
      return null;
    };

    try {
      // seluruh pencarian diantre satu per satu
      const job = this.ptQueue.then(run, run);
      this.ptQueue = job.catch(() => undefined);
      const res = (await job) as Response | null;
      if (!res || !res.ok) {
        this.ptFailedAt.set(key, Date.now());
        return { items: [], unavailable: true };
      }
      const json: any = await res.json();
      const list: any[] = Array.isArray(json?.data) ? json.data : [];
      const items = list.slice(0, 20).map((x) => ({
        kode: String(x.kode ?? ''),
        name: ptCase(String(x.nama ?? '')),
        shortName: String(x.nama_singkat ?? ''),
      }));
      if (this.ptCache.size > 300) this.ptCache.clear();
      this.ptCache.set(key, { at: Date.now(), items });
      return { items, unavailable: false };
    } catch {
      this.ptFailedAt.set(key, Date.now());
      return { items: [], unavailable: true };
    }
  }

  /** NIP, NIDN, dan NUPTK masing-masing unik di seluruh dosen. */
  private async assertLecturerIdUnique(nidn: string | null, nuptk: string | null, exceptUserId?: string, nip?: string | null) {
    const or: any[] = [];
    if (nidn) or.push({ nidn });
    if (nuptk) or.push({ nuptk });
    if (nip) or.push({ nip });
    if (or.length === 0) return;
    const dup = await this.prisma.lecturer.findFirst({
      where: { OR: or, ...(exceptUserId ? { userId: { not: exceptUserId } } : {}) },
      select: { nidn: true, nuptk: true, nip: true },
    });
    if (dup) {
      const which = nidn && dup.nidn === nidn ? `NIDN ${nidn}` : nuptk && dup.nuptk === nuptk ? `NUPTK ${nuptk}` : `NIP ${nip}`;
      throw new ConflictException(`${which} sudah terdaftar pada dosen lain.`);
    }
  }

  /** Simpan/perbarui profil kepegawaian (jabatan struktural & fungsional terpisah, dll). */
  private async saveProfile(userId: string, data: any, current?: PegawaiResponse) {
    const pick = <T>(key: string, fallback: T | undefined) => (data[key] !== undefined ? data[key] : fallback);
    const text = (v: unknown) => {
      const t = typeof v === 'string' ? v.trim() : '';
      return t ? t : null;
    };
    const rawCategory = text(pick('category', current?.category));
    const category = rawCategory && isKnownCategory(rawCategory) ? rawCategory : rawCategory ? 'Tenaga Kependidikan' : null;
    const employmentStatus = text(pick('employmentStatus', current?.employmentStatus));
    const isOutsourcing = employmentStatus === OUTSOURCING_STATUS;
    const isDosen = !!category && category.includes('Dosen');
    const values = {
      nip: text(pick('nip', current?.nip)),
      nidn: text(pick('nidn', current?.nidn)),
      gender: text(pick('gender', current?.gender)),
      category,
      employmentStatus,
      vendorName: isOutsourcing ? text(pick('vendorName', current?.vendorName)) : null,
      // email kontak hanya dipakai pegawai tanpa akun; tidak diubah bila tidak dikirim
      contactEmail: data.contactEmail !== undefined ? text(data.contactEmail) : undefined,
      department: text(pick('department', current?.department)),
      structuralPosition: text(pick('structuralPosition', current?.structuralPosition)),
      functionalPosition: isDosen ? text(pick('functionalPosition', current?.functionalPosition)) : null,
      education: text(pick('education', current?.education)),
      streetAddress: text(pick('streetAddress', current?.streetAddress)),
      rtRw: text(pick('rtRw', current?.rtRw)),
      kelurahan: text(pick('kelurahan', current?.kelurahan)),
      kecamatan: text(pick('kecamatan', current?.kecamatan)),
      city: text(pick('city', current?.city)),
      province: text(pick('province', current?.province)),
      postalCode: text(pick('postalCode', current?.postalCode)),
      educationInstitution: text(pick('educationInstitution', current?.educationInstitution)),
      educationMajor: text(pick('educationMajor', current?.educationMajor)),
      graduationYear: text(pick('graduationYear', current?.graduationYear)),
      phone: text(pick('phone', current?.phone)),
      joinDate: text(pick('joinDate', current?.joinDate)),
    };
    await this.prisma.employeeProfile.upsert({
      where: { userId },
      update: values,
      create: { userId, ...values },
    });
    return values;
  }

  async create(data: any): Promise<PegawaiResponse> {
    const isOutsourcing = data.employmentStatus === OUTSOURCING_STATUS;
    if (isOutsourcing) {
      if (!String(data.vendorName ?? '').trim()) throw new BadRequestException('Perusahaan penyedia (vendor) wajib diisi untuk pegawai outsourcing.');
    }
    const isDosen = !!data.category?.includes('Dosen');
    if (isDosen && !String(data.email ?? '').trim()) throw new BadRequestException('Email dosen wajib diisi.');
    const nidn = String(data.nidn ?? '').trim() || null;
    const nuptk = String(data.nuptk ?? '').trim() || null;
    if (isDosen) {
      // dosen baru umumnya memakai NUPTK; minimal salah satu dari NIDN / NUPTK wajib ada
      if (!nidn && !nuptk) throw new BadRequestException('Dosen wajib memiliki NIDN atau NUPTK (isi salah satu).');
      await this.assertLecturerIdUnique(nidn, nuptk, undefined, String(data.nip ?? '').trim() || null);
    }

    // Hanya dosen yang diberi akun login. Tenaga kependidikan (termasuk outsourcing) dicatat sebagai data kepegawaian
    // saja: role STAFF biasa (tidak pernah admin), email internal placeholder, dan kata sandi acak yang tidak diketahui siapa pun.
    const role = isDosen ? Role.LECTURER : Role.STAFF;
    const passwordHash = isDosen
      ? '$2b$10$wE99Jb0Z/T7Tq4xR7eY6euT3vE49mG09jO0N4uF7iA8a4m0vKxG7e'
      : await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
    const email = isDosen ? String(data.email).trim() : `pegawai-${crypto.randomUUID()}${NO_EMAIL_DOMAIN}`;
    if (!isDosen) data = { ...data, contactEmail: String(data.email ?? '').trim() };

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: `${data.titlePrefix ? data.titlePrefix + ' ' : ''}${data.fullName}${data.titleSuffix ? ', ' + data.titleSuffix : ''}`,
        role,
        passwordHash,
        isActive: data.status === 'Aktif',
        shiftId: data.shiftId || null,
      },
    });

    if (role === Role.LECTURER) {
      // Find a default study program
      const prodi = await this.prisma.studyProgram.findFirst();
      if (prodi) {
        await this.prisma.lecturer.create({
          data: {
            userId: user.id,
            studyProgramId: prodi.id,
            nidn,
            nuptk,
            nip: data.nip,
            titlePrefix: data.titlePrefix,
            titleSuffix: data.titleSuffix,
            phone: data.phone,
            functionalPosition: data.functionalPosition || null,
          },
        });
      }
    }

    await this.saveProfile(user.id, data);

    const created = await this.findAll();
    return created.find((c) => c.id === user.id) || created[0];
  }

  /** Menetapkan shift untuk banyak pegawai sekaligus; shiftId null = kembali ke shift default. */
  async bulkSetShift(ids: string[], shiftId: string | null) {
    const list = Array.from(new Set((ids || []).filter((x) => typeof x === 'string' && x)));
    if (list.length === 0) throw new BadRequestException('Pilih minimal satu pegawai.');
    if (list.length > 500) throw new BadRequestException('Maksimal 500 pegawai sekali proses.');
    if (shiftId) {
      const shift = await this.prisma.shift.findUnique({ where: { id: shiftId } });
      if (!shift) throw new NotFoundException('Shift tidak ditemukan.');
    }
    const res = await this.prisma.user.updateMany({
      where: { id: { in: list }, role: { in: [Role.SUPER_ADMIN, Role.ADMIN_BAAK, Role.ADMIN_KEUANGAN, Role.LECTURER, Role.STAFF] } },
      data: { shiftId: shiftId || null },
    });
    return { success: true, updated: res.count, message: `${res.count} pegawai diperbarui.` };
  }

  async findOne(id: string): Promise<PegawaiResponse> {
    const found = (await this.findAll()).find((item) => item.id === id);
    if (!found) throw new NotFoundException('Data pegawai tidak ditemukan.');
    return found;
  }

  async update(id: string, data: any): Promise<PegawaiResponse> {
    // Partial update (mis. toggle status aktif saja): yang tidak dikirim dipertahankan dari data existing,
    // supaya nama/email tidak ikut kosong saat caller cuma mengirim satu field.
    const current = (await this.findAll()).find((item) => item.id === id);

    const fullName = data.fullName !== undefined ? data.fullName : current?.fullName;
    const titlePrefix = data.titlePrefix !== undefined ? data.titlePrefix : current?.titlePrefix;
    const titleSuffix = data.titleSuffix !== undefined ? data.titleSuffix : current?.titleSuffix;
    // pegawai tanpa akun: email yang diketik masuk ke email kontak, akun internalnya tidak disentuh
    const noAccount = !!current && !current.hasLogin;
    if (noAccount && data.email !== undefined) data = { ...data, contactEmail: data.email };
    const email = noAccount ? undefined : data.email !== undefined && String(data.email).trim() ? String(data.email).trim() : current?.email;
    const status = data.status !== undefined ? data.status : current?.status;
    const shiftId = data.shiftId !== undefined ? data.shiftId || null : undefined;

    const fullCombinedName = `${titlePrefix ? titlePrefix + ' ' : ''}${fullName}${titleSuffix ? ', ' + titleSuffix : ''}`;

    await this.prisma.user.update({
      where: { id },
      data: {
        fullName: fullCombinedName,
        email,
        isActive: status === 'Aktif',
        ...(shiftId !== undefined ? { shiftId } : {}),
      },
    });

    const lec = await this.prisma.lecturer.findUnique({ where: { userId: id } });
    if (lec) {
      const clean = (v: unknown, fallback: string | null) => (v !== undefined ? String(v ?? '').trim() || null : fallback);
      const nextNidn = clean(data.nidn, lec.nidn);
      const nextNuptk = clean(data.nuptk, lec.nuptk);
      if (!nextNidn && !nextNuptk) throw new BadRequestException('Dosen wajib memiliki NIDN atau NUPTK (isi salah satu).');
      await this.assertLecturerIdUnique(nextNidn, nextNuptk, id, clean(data.nip, lec.nip));
      await this.prisma.lecturer.update({
        where: { userId: id },
        data: {
          nip: data.nip !== undefined ? data.nip : lec.nip,
          nidn: nextNidn,
          nuptk: nextNuptk,
          titlePrefix,
          titleSuffix,
          phone: data.phone !== undefined ? data.phone : lec.phone,
          ...(data.functionalPosition !== undefined ? { functionalPosition: String(data.functionalPosition || '').trim() || null } : {}),
        },
      });
    }

    const profileKeys = ['contactEmail', 'vendorName', 'nip', 'nidn', 'gender', 'category', 'employmentStatus', 'department', 'structuralPosition', 'functionalPosition', 'education', 'phone', 'joinDate', 'streetAddress', 'rtRw', 'kelurahan', 'kecamatan', 'city', 'province', 'postalCode', 'educationInstitution', 'educationMajor', 'graduationYear'];
    // update parsial (mis. toggle status) tidak menyentuh profil
    if (profileKeys.some((k) => data[k] !== undefined)) await this.saveProfile(id, data, current);

    const list = await this.findAll();
    return list.find((item) => item.id === id) || list[0];
  }

  async remove(id: string): Promise<boolean> {
    try {
      await this.prisma.lecturer.deleteMany({ where: { userId: id } });
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
