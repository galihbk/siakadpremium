import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import {
  RegisterPmbAccountDto,
  LoginPmbAccountDto,
  SaveApplicationDraftDto,
  UploadPaymentProofDto,
  VerifyDocumentDto,
  VerifyPaymentDto,
  SelectionDecisionDto,
  CreateWaveDto,
  UpdatePmbFeeConfigDto,
  CreateRegistrationTypeDto,
  CreateTrackDto,
  CreateClassDto,
} from './dto/pmb.dto';
import { FeeRulesService } from '../finance/fee-rules.service';

function toTitleCase(str?: string | null): string | undefined {
  if (!str || typeof str !== 'string') return undefined;
  const trimmed = str.trim();
  if (!trimmed) return undefined;

  const preserveUpper = new Set([
    'RT', 'RW', 'KTP', 'KK', 'SMA', 'SMK', 'MA', 'SMP', 'MTS', 'SD',
    'IPA', 'IPS', 'MIPA', 'D3', 'D4', 'S1', 'S2', 'S3', 'DKI', 'DI', 'DIY', 'RI',
    'PTN', 'PTS', 'NPSN', 'NIK', 'NISN', 'PNS', 'TNI', 'POLRI', 'BUMN', 'BUMD'
  ]);

  return trimmed
    .split(/\s+/)
    .map((word) => {
      const clean = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (preserveUpper.has(clean)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

@Injectable()
export class PmbService {
  constructor(
    private prisma: PrismaService,
    private feeRulesService: FeeRulesService,
  ) {}

  // ===========================================================================
  // 1. AKUN PMB (CALON MAHASISWA)
  // ===========================================================================

  /**
   * Pendaftaran Akun PMB baru (Belum membuat nomor pendaftaran atau NIM)
   */
  async registerAccount(dto: RegisterPmbAccountDto) {
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      throw new BadRequestException('Pendaftaran tidak dapat diproses oleh sistem keamanan.');
    }

    const emailTrimmed = dto.email.trim().toLowerCase();
    const whatsappTrimmed = dto.whatsapp.trim();

    // Cek apakah email sudah terdaftar di pmb_accounts
    const existing = await this.prisma.pmbAccount.findUnique({
      where: { email: emailTrimmed },
    });

    if (existing) {
      throw new ConflictException(`Email ${dto.email} sudah terdaftar. Silakan login ke akun PMB Anda.`);
    }

    // Hash kata sandi
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const account = await this.prisma.pmbAccount.create({
      data: {
        fullName: dto.fullName.trim(),
        email: emailTrimmed,
        whatsapp: whatsappTrimmed,
        passwordHash,
        isEmailVerified: true,
      },
    });

    return {
      success: true,
      message: 'Akun pendaftaran PMB berhasil dibuat. Silakan login untuk melengkapi formulir pendaftaran.',
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
      },
    };
  }

  /**
   * Login Calon Mahasiswa (Email atau WhatsApp)
   */
  async loginAccount(dto: LoginPmbAccountDto) {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');

    const account = await this.prisma.pmbAccount.findFirst({
      where: isEmail
        ? { email: { equals: identifier, mode: 'insensitive' } }
        : { whatsapp: identifier },
      include: {
        applications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            wave: true,
            track: true,
            admissionClass: true,
            studyProgram: {
              include: { faculty: true },
            },
            payments: true,
          },
        },
      },
    });

    if (!account) {
      // Fallback cek di tabel admission_applicants lama jika migrasi
      const legacyApplicant = await this.prisma.admissionApplicant.findFirst({
        where: isEmail
          ? { email: { equals: identifier, mode: 'insensitive' } }
          : { registrationNumber: { equals: identifier.toUpperCase() } },
      });

      if (legacyApplicant) {
        const pmbAcc = await this.resolvePmbAccount(legacyApplicant.id, legacyApplicant.email);
        if (pmbAcc) {
          return {
            success: true,
            message: 'Login berhasil.',
            token: `pmb_token_${pmbAcc.id}`,
            account: {
              id: pmbAcc.id,
              fullName: pmbAcc.fullName,
              email: pmbAcc.email,
              whatsapp: pmbAcc.whatsapp,
            },
            application: pmbAcc.applications[0] || null,
          };
        }
      }

      throw new UnauthorizedException('Email atau nomor WhatsApp tidak terdaftar di sistem PMB.');
    }

    const isValidPassword = await bcrypt.compare(dto.password, account.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Kata sandi yang Anda masukkan salah.');
    }

    const activeApplication = account.applications[0] || null;

    return {
      success: true,
      message: 'Login berhasil.',
      token: `pmb_token_${account.id}`,
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
      },
      application: activeApplication,
    };
  }

  /**
   * Helper menyelesaikan identitas akun PMB.
   * Mendukung UUID akun PMB, UUID akun legacy pendaftar (admissionApplicant), atau alamat email.
   * Jika berasal dari data pendaftar lama, otomatis membuatkan rekaman di pmb_accounts secara transparan.
   */
  async resolvePmbAccount(accountId?: string, fallbackEmail?: string) {
    if (!accountId && !fallbackEmail) {
      return null;
    }

    const trimmedId = accountId?.trim();
    const emailToSearch = (trimmedId && trimmedId.includes('@'))
      ? trimmedId.toLowerCase()
      : fallbackEmail?.trim().toLowerCase();

    // 1. Cari langsung di pmb_accounts berdasarkan ID
    if (trimmedId && !trimmedId.includes('@')) {
      const account = await this.prisma.pmbAccount.findUnique({
        where: { id: trimmedId },
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              wave: true,
              registrationType: true,
              track: true,
              admissionClass: true,
              studyProgram: {
                include: { faculty: true },
              },
              payments: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (account) return account;
    }

    // 2. Cari di pmb_accounts berdasarkan email
    if (emailToSearch) {
      const accountByEmail = await this.prisma.pmbAccount.findUnique({
        where: { email: emailToSearch },
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              wave: true,
              registrationType: true,
              track: true,
              admissionClass: true,
              studyProgram: {
                include: { faculty: true },
              },
              payments: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (accountByEmail) return accountByEmail;
    }

    // 3. Fallback periksa tabel admission_applicants (calon mahasiswa legacy/lama)
    const legacyApplicant = await this.prisma.admissionApplicant.findFirst({
      where: {
        OR: [
          ...(trimmedId ? [{ id: trimmedId }, { registrationNumber: trimmedId }] : []),
          ...(emailToSearch ? [{ email: { equals: emailToSearch, mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    if (legacyApplicant) {
      // Periksa apakah pmb_account dengan email tersebut sudah ada
      let pmbAccount = await this.prisma.pmbAccount.findUnique({
        where: { email: legacyApplicant.email.toLowerCase() },
        include: {
          applications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              wave: true,
              registrationType: true,
              track: true,
              admissionClass: true,
              studyProgram: {
                include: { faculty: true },
              },
              payments: {
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      });

      if (!pmbAccount) {
        // Otomatis buatkan record di pmb_accounts dengan ID yang sama agar sinkron
        pmbAccount = await this.prisma.pmbAccount.create({
          data: {
            id: legacyApplicant.id,
            fullName: legacyApplicant.fullName,
            email: legacyApplicant.email.toLowerCase(),
            whatsapp: legacyApplicant.phone || '081200000000',
            passwordHash: 'legacy_sync_account',
            isEmailVerified: true,
          },
          include: {
            applications: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                wave: true,
                registrationType: true,
                track: true,
                admissionClass: true,
                studyProgram: {
                  include: { faculty: true },
                },
                payments: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        });
      }

      return pmbAccount;
    }

    return null;
  }

  /**
   * Mendapatkan profil dan pendaftaran calon mahasiswa
   */
  async getMyProfile(accountId: string) {
    const account = await this.resolvePmbAccount(accountId);

    if (!account) {
      throw new NotFoundException('Akun PMB tidak ditemukan.');
    }

    return {
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
      },
      application: account.applications[0] || null,
    };
  }

  // ===========================================================================
  // 2. FORMULIR PENDAFTARAN (DRAFT & SUBMIT)
  // ===========================================================================

  /**
   * Opsi Form Master (Dinamis dari PostgreSQL: Gelombang, Jenis Pendaftaran, Jenis Mahasiswa, Kelas, Prodi Master Akademik)
   */
  async getFormOptions() {
    const [waves, registrationTypes, tracks, classes, studyPrograms] = await Promise.all([
      this.prisma.admissionBatch.findMany({
        where: { status: 'OPEN' },
        orderBy: { isDefault: 'desc' },
      }),
      this.prisma.admissionRegistrationType.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.admissionTrack.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.admissionClass.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.studyProgram.findMany({
        where: { status: 'Aktif' },
        include: { faculty: true },
        orderBy: [{ degreeLevel: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      waves,
      registrationTypes,
      tracks,
      classes,
      studyPrograms: studyPrograms.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        degreeLevel: p.degreeLevel,
        facultyName: p.faculty?.name || 'Fakultas Umum',
        accreditation: p.accreditation,
      })),
    };
  }

  // In-memory cache for school search queries (TTL: 1 hour)
  private schoolSearchCache = new Map<string, { data: any[]; expiresAt: number }>();

  /**
   * Cari Data Sekolah di Indonesia (Database Kemendikbud via API Sekolah Indonesia)
   */
  async searchSchools(search: string) {
    const query = (search || '').trim();
    if (!query || query.length < 3) {
      return [];
    }

    const cacheKey = query.toLowerCase();
    const cached = this.schoolSearchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const url = `https://api-sekolah-indonesia.vercel.app/sekolah/s?sekolah=${encodeURIComponent(query)}&page=1&perPage=30`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) return [];

      const json: any = await res.json();
      if (!json || !Array.isArray(json.dataSekolah)) {
        return [];
      }

      // Prioritaskan dan format data sekolah menengah (SMA/SMK/MA) & umum
      const formatted = json.dataSekolah.map((item: any) => ({
        id: item.id || item.npsn,
        npsn: (item.npsn || '').trim(),
        name: toTitleCase(item.sekolah || '') || item.sekolah,
        rawName: (item.sekolah || '').trim(),
        bentuk: (item.bentuk || '').trim(),
        status: item.status === 'N' ? 'Negeri' : 'Swasta',
        province: (item.propinsi || '').replace('Prov. ', '').trim(),
        regency: (item.kabupaten_kota || '').replace('Kab. ', '').replace('Kota ', '').trim(),
        district: (item.kecamatan || '').replace('Kec. ', '').trim(),
        address: (item.alamat_jalan || '').trim(),
      }));

      // Cache selama 1 jam
      this.schoolSearchCache.set(cacheKey, {
        data: formatted,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });

      return formatted;
    } catch (err: any) {
      console.warn('Gagal memuat API sekolah:', err?.message || err);
      return [];
    }
  }

  /**
   * Simpan Formulir sebagai DRAFT (Belum ada nomor pendaftaran)
   */
  async saveDraft(accountId: string, dto: SaveApplicationDraftDto) {
    const account = await this.resolvePmbAccount(accountId, dto.email);

    if (!account) {
      throw new NotFoundException('Akun PMB tidak ditemukan.');
    }

    // Cari pendaftaran existing
    let app = await this.prisma.admissionApplication.findFirst({
      where: { accountId: account.id },
    });

    const payload = {
      waveId: dto.waveId || undefined,
      registrationTypeId: dto.registrationTypeId || undefined,
      trackId: dto.trackId || undefined,
      classId: dto.classId || undefined,
      studyProgramId: dto.studyProgramId || undefined,
      isKip: dto.isKip ?? false,
      nik: dto.nik || undefined,
      fullName: toTitleCase(dto.fullName || account.fullName) || (dto.fullName || account.fullName).trim(),
      birthPlace: toTitleCase(dto.birthPlace),
      birthDate: dto.birthDate || undefined,
      gender: dto.gender || undefined,
      religion: dto.religion || undefined,
      phone: (dto.phone || account.whatsapp).trim(),
      email: (dto.email || account.email).trim().toLowerCase(),
      address: toTitleCase(dto.address),
      schoolName: toTitleCase(dto.schoolName),
      npsn: dto.npsn || undefined,
      nisn: dto.nisn || undefined,
      graduationYear: dto.graduationYear || undefined,
      major: toTitleCase(dto.major),
      parentName: toTitleCase(dto.parentName),
      parentPhone: dto.parentPhone || undefined,
      parentJob: toTitleCase(dto.parentJob),
      parentIncome: dto.parentIncome || undefined,
      fileKtp: dto.fileKtp || undefined,
      fileKk: dto.fileKk || undefined,
      fileIjazah: dto.fileIjazah || undefined,
      fileFoto: dto.fileFoto || undefined,
      fileTambahan: dto.fileTambahan || undefined,
    };

    if (app) {
      if (app.formStatus === 'SUBMITTED') {
        throw new BadRequestException('Formulir sudah disubmit dan tidak dapat diubah menjadi draft.');
      }
      app = await this.prisma.admissionApplication.update({
        where: { id: app.id },
        data: payload,
      });
    } else {
      app = await this.prisma.admissionApplication.create({
        data: {
          accountId: account.id,
          formStatus: 'DRAFT',
          ...payload,
        },
      });
    }

    return {
      success: true,
      message: 'Draf formulir pendaftaran berhasil disimpan.',
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
      },
      application: app,
    };
  }

  /**
   * Submit Formulir Pendaftaran (FINALISASI):
   * 1. Validasi kelengkapan
   * 2. Generate Nomor Pendaftaran resmi: PMB-2027-000123
   * 3. Buat tagihan Biaya Registrasi
   */
  async submitApplication(accountId: string, dto: SaveApplicationDraftDto) {
    const account = await this.resolvePmbAccount(accountId, dto.email);

    if (!account) {
      throw new NotFoundException('Akun PMB tidak ditemukan.');
    }

    // Validasi data penting
    if (!dto.studyProgramId) {
      throw new BadRequestException('Program Studi wajib dipilih sebelum mengirim pendaftaran.');
    }
    if (!dto.waveId) {
      throw new BadRequestException('Gelombang pendaftaran wajib dipilih.');
    }
    if (!dto.trackId) {
      throw new BadRequestException('Jalur pendaftaran wajib dipilih.');
    }

    const wave = await this.prisma.admissionBatch.findUnique({
      where: { id: dto.waveId },
    });
    if (!wave) {
      throw new NotFoundException('Gelombang pendaftaran yang dipilih tidak valid.');
    }

    // Generate Nomor Pendaftaran: format PMB-2027-XXXXXX
    const count = await this.prisma.admissionApplication.count({
      where: { formStatus: 'SUBMITTED' },
    });
    const year = wave.academicYear?.split('/')[0] || new Date().getFullYear().toString();
    const registrationNumber = `PMB-${year}-${String(count + 1).padStart(6, '0')}`;

    let app = await this.prisma.admissionApplication.findFirst({
      where: { accountId: account.id },
    });

    const dataPayload = {
      waveId: dto.waveId,
      registrationTypeId: dto.registrationTypeId || undefined,
      trackId: dto.trackId,
      classId: dto.classId || undefined,
      studyProgramId: dto.studyProgramId,
      isKip: dto.isKip ?? false,
      registrationNumber,
      formStatus: 'SUBMITTED',
      verificationStatus: 'UNVERIFIED',
      selectionStatus: 'PENDING_SELECTION',
      nik: dto.nik || undefined,
      fullName: toTitleCase(dto.fullName || account.fullName) || (dto.fullName || account.fullName).trim(),
      birthPlace: toTitleCase(dto.birthPlace),
      birthDate: dto.birthDate || undefined,
      gender: dto.gender || undefined,
      religion: dto.religion || undefined,
      phone: (dto.phone || account.whatsapp).trim(),
      email: (dto.email || account.email).trim().toLowerCase(),
      address: toTitleCase(dto.address),
      schoolName: toTitleCase(dto.schoolName),
      npsn: dto.npsn || undefined,
      nisn: dto.nisn || undefined,
      graduationYear: dto.graduationYear || undefined,
      major: toTitleCase(dto.major),
      parentName: toTitleCase(dto.parentName),
      parentPhone: dto.parentPhone || undefined,
      parentJob: toTitleCase(dto.parentJob),
      parentIncome: dto.parentIncome || undefined,
      fileKtp: dto.fileKtp || undefined,
      fileKk: dto.fileKk || undefined,
      fileIjazah: dto.fileIjazah || undefined,
      fileFoto: dto.fileFoto || undefined,
      fileTambahan: dto.fileTambahan || undefined,
    };

    if (app) {
      app = await this.prisma.admissionApplication.update({
        where: { id: app.id },
        data: dataPayload,
      });
    } else {
      app = await this.prisma.admissionApplication.create({
        data: {
          accountId: account.id,
          ...dataPayload,
        },
      });
    }

    // Buat Tagihan Biaya Registrasi dari konfigurasi biaya Gelombang PMB
    const feeConfig = await this.getFeeConfig(wave.jenjang);
    const regFee = dto.isKip
      ? 0
      : (wave?.registrationFee !== null && wave?.registrationFee !== undefined && Number(wave.registrationFee) >= 0)
      ? Number(wave.registrationFee)
      : feeConfig?.registrationFee && feeConfig.registrationFee > 0
      ? feeConfig.registrationFee
      : 250000;

    const existingPayment = await this.prisma.admissionPayment.findFirst({
      where: { applicationId: app.id, type: 'REGISTRATION' },
    });

    if (!existingPayment) {
      await this.prisma.admissionPayment.create({
        data: {
          applicationId: app.id,
          type: 'REGISTRATION',
          amount: regFee,
          status: dto.isKip ? 'PAID' : 'PENDING',
          paymentMethod: dto.isKip ? 'Beasiswa KIP-Kuliah (Gratis)' : 'Transfer Bank / Virtual Account',
          paidAt: dto.isKip ? new Date() : undefined,
          notes: dto.isKip ? 'Pendaftar Jalur KIP-Kuliah (Bebas biaya formulir pendaftaran)' : undefined,
        },
      });
    }

    const finalApp = await this.prisma.admissionApplication.findUnique({
      where: { id: app.id },
      include: {
        wave: true,
        track: true,
        studyProgram: true,
        payments: true,
      },
    });

    return {
      success: true,
      message: `Pendaftaran berhasil disubmit! Nomor Pendaftaran Anda: ${registrationNumber}`,
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
      },
      application: finalApp,
    };
  }

  /**
   * Upload bukti pembayaran (Registrasi atau Daftar Ulang)
   */
  async uploadPaymentProof(paymentId: string, dto: UploadPaymentProofDto) {
    const payment = await this.prisma.admissionPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Tagihan pembayaran tidak ditemukan.');
    }

    const updated = await this.prisma.admissionPayment.update({
      where: { id: paymentId },
      data: {
        status: 'VERIFYING',
        proofUrl: dto.proofUrl || undefined,
        paymentMethod: dto.paymentMethod || payment.paymentMethod,
        notes: dto.notes || undefined,
        paidAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi tim keuangan PMB.',
      payment: updated,
    };
  }

  // ===========================================================================
  // 3. ADMIN PMB
  // ===========================================================================

  /**
   * Dashboard Statistik Riil PostgreSQL
   */
  async getDashboardStats() {
    const [
      totalSubmitted,
      unpaidRegistration,
      paidRegistration,
      unverifiedDocs,
      verifiedDocs,
      pendingSelection,
      passed,
      failed,
      pendingReReg,
      paidReReg,
      registeredStudents,
    ] = await Promise.all([
      this.prisma.admissionApplication.count({ where: { formStatus: 'SUBMITTED' } }),
      this.prisma.admissionPayment.count({ where: { type: 'REGISTRATION', status: { not: 'PAID' } } }),
      this.prisma.admissionPayment.count({ where: { type: 'REGISTRATION', status: 'PAID' } }),
      this.prisma.admissionApplication.count({ where: { formStatus: 'SUBMITTED', verificationStatus: 'UNVERIFIED' } }),
      this.prisma.admissionApplication.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.admissionApplication.count({ where: { verificationStatus: 'VERIFIED', selectionStatus: 'PENDING_SELECTION' } }),
      this.prisma.admissionApplication.count({ where: { selectionStatus: 'PASSED' } }),
      this.prisma.admissionApplication.count({ where: { selectionStatus: 'FAILED' } }),
      this.prisma.admissionPayment.count({ where: { type: 'RE_REGISTRATION', status: { not: 'PAID' } } }),
      this.prisma.admissionPayment.count({ where: { type: 'RE_REGISTRATION', status: 'PAID' } }),
      this.prisma.admissionApplication.count({ where: { studentId: { not: null } } }),
    ]);

    // Distribusi Prodi
    const appsWithProdi = await this.prisma.admissionApplication.findMany({
      where: { formStatus: 'SUBMITTED', studyProgramId: { not: null } },
      select: {
        studyProgram: {
          select: { name: true },
        },
      },
    });

    const prodiMap = new Map<string, number>();
    for (const a of appsWithProdi) {
      const name = a.studyProgram?.name || 'Lainnya';
      prodiMap.set(name, (prodiMap.get(name) || 0) + 1);
    }
    const prodiDistribution = Array.from(prodiMap.entries()).map(([prodi, count]) => ({ prodi, count }));

    // Distribusi Jalur
    const appsWithTrack = await this.prisma.admissionApplication.findMany({
      where: { formStatus: 'SUBMITTED', trackId: { not: null } },
      select: {
        track: {
          select: { name: true },
        },
      },
    });

    const trackMap = new Map<string, number>();
    for (const a of appsWithTrack) {
      const name = a.track?.name || 'Lainnya';
      trackMap.set(name, (trackMap.get(name) || 0) + 1);
    }
    const jalurDistribution = Array.from(trackMap.entries()).map(([jalur, count]) => ({ jalur, count }));

    // Recent Applicants
    const recentApps = await this.prisma.admissionApplication.findMany({
      where: { formStatus: 'SUBMITTED' },
      include: {
        account: true,
        studyProgram: true,
        track: true,
        wave: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const recentApplicants = recentApps.map((a) => ({
      id: a.id,
      registrationNumber: a.registrationNumber || '-',
      fullName: a.fullName || a.account?.fullName || '-',
      email: a.email || a.account?.email || '-',
      phone: a.phone || a.account?.whatsapp || '-',
      highSchool: a.schoolName || '-',
      chosenStudyProgram: a.studyProgram?.name || '-',
      jalurPendaftaran: a.track?.name || '-',
      status: a.studentId ? 'REGISTERED' : a.selectionStatus === 'PASSED' ? 'PASSED' : a.selectionStatus === 'FAILED' ? 'FAILED' : a.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      createdAt: a.createdAt,
    }));

    return {
      totalApplicants: totalSubmitted,
      pendingCount: unverifiedDocs,
      verifiedCount: verifiedDocs,
      registeredCount: registeredStudents,
      unpaidRegistrationCount: unpaidRegistration,
      paidRegistrationCount: paidRegistration,
      unverifiedDocsCount: unverifiedDocs,
      verifiedDocsCount: verifiedDocs,
      pendingSelectionCount: pendingSelection,
      passedCount: passed,
      failedCount: failed,
      pendingReRegistrationCount: pendingReReg,
      paidReRegistrationCount: paidReReg,
      registeredStudentsCount: registeredStudents,
      prodiDistribution,
      jalurDistribution,
      recentApplicants,
    };
  }

  /**
   * Ambil daftar pendaftar untuk Admin PMB
   */
  async getAdminApplications(query: {
    search?: string;
    waveId?: string;
    trackId?: string;
    prodiId?: string;
    formStatus?: string;
    verificationStatus?: string;
    selectionStatus?: string;
  }) {
    const where: any = {};

    if (query.formStatus) {
      where.formStatus = query.formStatus;
    }
    if (query.waveId) {
      where.waveId = query.waveId;
    }
    if (query.trackId) {
      where.trackId = query.trackId;
    }
    if (query.prodiId) {
      where.studyProgramId = query.prodiId;
    }
    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }
    if (query.selectionStatus) {
      where.selectionStatus = query.selectionStatus;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { registrationNumber: { contains: s, mode: 'insensitive' } },
        { fullName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
      ];
    }

    return this.prisma.admissionApplication.findMany({
      where,
      include: {
        wave: true,
        track: true,
        admissionClass: true,
        studyProgram: {
          include: { faculty: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Detail Pendaftar
   */
  async getAdminApplicationById(id: string) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
      include: {
        account: true,
        wave: true,
        track: true,
        admissionClass: true,
        studyProgram: {
          include: { faculty: true },
        },
        payments: {
          orderBy: { createdAt: 'asc' },
        },
        student: true,
      },
    });

    if (!app) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    return app;
  }

  /**
   * Verifikasi Berkas (Terverifikasi / Ditolak dengan alasan)
   */
  async verifyDocument(id: string, dto: VerifyDocumentDto) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
    });
    if (!app) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    const updated = await this.prisma.admissionApplication.update({
      where: { id },
      data: {
        verificationStatus: dto.status,
        verificationNote: dto.status === 'REJECTED' ? dto.note || 'Berkas belum memenuhi persyaratan.' : null,
        verifiedAt: new Date(),
        verifiedBy: dto.verifiedBy || 'Admin PMB',
      },
      include: {
        wave: true,
        track: true,
        studyProgram: true,
        payments: true,
      },
    });

    return {
      success: true,
      message: dto.status === 'VERIFIED' ? 'Berkas berhasil diverifikasi.' : 'Berkas ditolak.',
      application: updated,
    };
  }

  /**
   * Verifikasi Pembayaran (Admin Keuangan / PMB)
   */
  async verifyPayment(paymentId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.admissionPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Tagihan tidak ditemukan.');
    }

    const updated = await this.prisma.admissionPayment.update({
      where: { id: paymentId },
      data: {
        status: dto.status,
        verifiedAt: dto.status === 'PAID' ? new Date() : null,
        verifiedBy: dto.verifiedBy || 'Admin PMB',
      },
    });

    return {
      success: true,
      message: dto.status === 'PAID' ? 'Pembayaran telah divalidasi LUNAS.' : 'Status pembayaran diperbarui.',
      payment: updated,
    };
  }

  /**
   * Ambil daftar pembayaran PMB (Registrasi & Daftar Ulang) untuk Admin PMB
   */
  async getAdminPayments(query: { type?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.application = {
        OR: [
          { registrationNumber: { contains: query.search, mode: 'insensitive' } },
          { account: { fullName: { contains: query.search, mode: 'insensitive' } } },
          { account: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      };
    }

    const payments = await this.prisma.admissionPayment.findMany({
      where,
      include: {
        application: {
          include: {
            account: true,
            wave: true,
            track: true,
            studyProgram: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      id: p.id,
      applicationId: p.applicationId,
      registrationNumber: p.application?.registrationNumber || '-',
      applicantName: p.application?.account?.fullName || '-',
      email: p.application?.account?.email || '-',
      phone: p.application?.account?.whatsapp || '-',
      prodi: p.application?.studyProgram?.name || '-',
      wave: p.application?.wave?.name || '-',
      track: p.application?.track?.name || '-',
      type: p.type,
      amount: Number(p.amount),
      status: p.status,
      proofUrl: p.proofUrl,
      paidAt: p.paidAt,
      verifiedAt: p.verifiedAt,
      verifiedBy: p.verifiedBy,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Keputusan Seleksi (LULUS, TIDAK LULUS, CADANGAN)
   * Jika LULUS -> Otomatis terbitkan tagihan Biaya Daftar Ulang
   */
  async setSelectionDecision(id: string, dto: SelectionDecisionDto) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
      include: { wave: true },
    });
    if (!app) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    const updated = await this.prisma.admissionApplication.update({
      where: { id },
      data: {
        selectionStatus: dto.selectionStatus,
        testScore: dto.testScore !== undefined ? dto.testScore : app.testScore,
        selectionNotes: dto.selectionNotes || undefined,
        selectionDate: new Date(),
      },
    });

    // Jika LULUS, pastikan ada tagihan Daftar Ulang dari konfigurasi biaya PMB
    if (dto.selectionStatus === 'PASSED') {
      const existingReReg = await this.prisma.admissionPayment.findFirst({
        where: { applicationId: id, type: 'RE_REGISTRATION' },
      });

      if (!existingReReg) {
        const feeConfig = await this.getFeeConfig(app.wave?.jenjang);
        const amount = (app.wave?.reRegistrationFee !== null && app.wave?.reRegistrationFee !== undefined && Number(app.wave.reRegistrationFee) >= 0)
          ? Number(app.wave.reRegistrationFee)
          : feeConfig?.reRegistrationFee && feeConfig.reRegistrationFee > 0
          ? feeConfig.reRegistrationFee
          : 7300000;

        await this.prisma.admissionPayment.create({
          data: {
            applicationId: id,
            type: 'RE_REGISTRATION',
            amount,
            status: 'PENDING',
            paymentMethod: 'Transfer Bank / Virtual Account',
          },
        });
      }
    }

    return {
      success: true,
      message: `Keputusan seleksi berhasil disimpan: ${dto.selectionStatus}.`,
      application: updated,
    };
  }

  /**
   * Konversi Menjadi Mahasiswa Resmi:
   * Syarat: Seleksi = LULUS dan Biaya Daftar Ulang = PAID
   * 1. Buat record Mahasiswa (Student)
   * 2. Generate NIM unik (Nomor Pendaftaran dan NIM berbeda)
   * 3. Hubungkan dengan data pendaftaran
   * 4. Buat akun Student (User role STUDENT)
   * 5. Generate password awal
   * 6. Aktifkan akun Student
   */
  async convertToStudent(id: string) {
    const app = await this.prisma.admissionApplication.findUnique({
      where: { id },
      include: {
        payments: true,
        studyProgram: true,
      },
    });

    if (!app) {
      throw new NotFoundException('Data pendaftaran tidak ditemukan.');
    }

    if (app.selectionStatus !== 'PASSED') {
      throw new BadRequestException('Calon mahasiswa belum dinyatakan LULUS seleksi.');
    }

    const reRegPayment = app.payments.find((p) => p.type === 'RE_REGISTRATION');
    if (!reRegPayment || reRegPayment.status !== 'PAID') {
      throw new BadRequestException('Biaya Daftar Ulang belum lunas. Konversi hanya dapat dilakukan setelah pelunasan daftar ulang.');
    }

    // Cari Program Studi
    let prodiId = app.studyProgramId;
    if (!prodiId) {
      const firstProdi = await this.prisma.studyProgram.findFirst({ where: { status: 'Aktif' } });
      if (!firstProdi) throw new BadRequestException('Master program studi tidak ditemukan.');
      prodiId = firstProdi.id;
    }

    const prodi = await this.prisma.studyProgram.findUnique({ where: { id: prodiId } });
    if (!prodi) throw new BadRequestException('Program studi tidak ditemukan.');

    // Generate NIM resmi: Tahun (27) + Kode Prodi (e.g. dikti/code) + urutan
    const studentCount = await this.prisma.student.count();
    const cleanCode = (prodi.code || '115').replace(/[^0-9]/g, '').slice(-3).padStart(3, '0');
    const nim = `27${cleanCode}${String(studentCount + 1).padStart(4, '0')}`;

    // Cek User akun portal
    let user = await this.prisma.user.findUnique({
      where: { email: app.email },
    });

    const initialPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: app.email,
          fullName: app.fullName,
          role: 'STUDENT' as any,
          passwordHash,
          isActive: true,
        },
      });
    }

    // Buat record Student (biodata diambil dari PMB tanpa meminta ulang + simpan referensi PMB lengkap)
    const student = await this.prisma.student.upsert({
      where: { nim },
      update: {
        status: 'ACTIVE' as any,
        phone: app.phone,
        nik: app.nik,
        address: app.address,
        registrationTypeId: app.registrationTypeId,
        trackId: app.trackId,
        classId: app.classId,
        waveId: app.waveId,
      },
      create: {
        userId: user.id,
        studyProgramId: prodi.id,
        nim,
        entryYear: 2027,
        currentSemester: 1,
        status: 'ACTIVE' as any,
        phone: app.phone,
        nik: app.nik,
        address: app.address,
        birthPlace: app.birthPlace,
        birthDate: app.birthDate ? new Date(app.birthDate) : undefined,
        gender: app.gender === 'Perempuan' ? 'FEMALE' : 'MALE',
        registrationTypeId: app.registrationTypeId,
        trackId: app.trackId,
        classId: app.classId,
        waveId: app.waveId,
      },
    });

    // Update pendaftaran: hubungkan studentId & NIM
    await this.prisma.admissionApplication.update({
      where: { id },
      data: {
        studentId: student.id,
        nim,
      },
    });

    // Evaluasi aturan pembiayaan dinamis & simpan Snapshot Penetapan Pembiayaan
    let feeAssignmentResult: any = null;
    let semesterInvoiceResult: any = null;
    try {
      feeAssignmentResult = await this.feeRulesService.assignStudentFeePolicy({
        studentId: student.id,
        academicYear: '2027/2028',
        assignedBy: 'SISTEM_KONVERSI_PMB',
        notes: `Penetapan otomatis jalur PMB: ${app.fullName} (${nim})`,
      });

      // Terbitkan tagihan semester 1 resmi berbasis aturan yang telah ditetapkan
      semesterInvoiceResult = await this.feeRulesService.generateStudentSemesterInvoice({
        studentId: student.id,
        semester: 1,
        academicYear: '2027/2028',
        dueDate: '30 September 2027',
      });
    } catch (feeError) {
      console.error('Peringatan: Gagal generate aturan pembiayaan otomatis saat konversi:', feeError);
    }

    return {
      success: true,
      message: `Calon mahasiswa berhasil dikonversi menjadi Mahasiswa Resmi dengan NIM ${nim} dan skema pembiayaan telah ditetapkan.`,
      data: {
        studentId: student.id,
        nim,
        fullName: app.fullName,
        studyProgram: prodi.name,
        feeScheme: feeAssignmentResult?.assignment?.schemeName || 'Reguler Mandiri',
        semesterInvoice: semesterInvoiceResult
          ? {
              invoiceNo: semesterInvoiceResult.invoiceNo,
              totalAmount: semesterInvoiceResult.amount,
              originalAmount: semesterInvoiceResult.originalAmount,
              totalDiscount: semesterInvoiceResult.totalDiscount,
              status: semesterInvoiceResult.status,
            }
          : null,
        portalAccount: {
          username: app.email,
          initialPassword,
        },
      },
    };
  }

  // ===========================================================================
  // 4. CRUD GELOMBANG (ADMISSION BATCH) - MURNI PERIODE PENDAFTARAN
  // ===========================================================================

  async getWaves() {
    return this.prisma.admissionBatch.findMany({
      orderBy: [{ isDefault: 'desc' }, { startDate: 'asc' }],
    });
  }

  async createWave(dto: CreateWaveDto) {
    const wave = await this.prisma.admissionBatch.create({
      data: {
        name: dto.name.trim(),
        academicYear: dto.academicYear.trim(),
        jenjang: dto.jenjang?.trim() || 'S1',
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
        quota: dto.quota ? Number(dto.quota) : 100,
        description: dto.description?.trim() || null,
        isDefault: Boolean(dto.isDefault),
      },
    });

    if (dto.isDefault) {
      await this.prisma.admissionBatch.updateMany({
        where: { id: { not: wave.id } },
        data: { isDefault: false },
      });
    }

    return { success: true, message: 'Gelombang berhasil ditambahkan.', wave };
  }

  async updateWave(id: string, dto: Partial<CreateWaveDto>) {
    const wave = await this.prisma.admissionBatch.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        academicYear: dto.academicYear?.trim(),
        jenjang: dto.jenjang?.trim(),
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
        quota: dto.quota !== undefined ? Number(dto.quota) : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isDefault: dto.isDefault !== undefined ? Boolean(dto.isDefault) : undefined,
      },
    });

    if (dto.isDefault) {
      await this.prisma.admissionBatch.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    return { success: true, message: 'Gelombang berhasil diperbarui.', wave };
  }

  async deleteWave(id: string) {
    await this.prisma.admissionBatch.delete({ where: { id } });
    return { success: true, message: 'Gelombang berhasil dihapus.' };
  }

  // ===========================================================================
  // 4B. KONFIGURASI BIAYA PMB (BIAYA REGISTRASI & BIAYA DAFTAR ULANG)
  // ===========================================================================

  async getFeeConfig(jenjang?: string) {
    let config = null;
    if (jenjang && jenjang !== 'SEMUA') {
      config = await this.prisma.pmbFeeConfig.findFirst({
        where: { jenjang },
      });
    }

    if (!config) {
      config = await this.prisma.pmbFeeConfig.findFirst({
        where: { jenjang: 'SEMUA' },
      });
    }

    if (!config) {
      config = await this.prisma.pmbFeeConfig.findFirst();
    }

    if (!config) {
      config = await this.prisma.pmbFeeConfig.create({
        data: {
          jenjang: 'SEMUA',
          registrationFee: 250000,
          reRegistrationFee: 7300000,
          description: 'Konfigurasi biaya standar PMB ITN',
        },
      });
    }

    return config;
  }

  async updateFeeConfig(dto: UpdatePmbFeeConfigDto) {
    const targetJenjang = dto.jenjang || 'SEMUA';
    const existing = await this.prisma.pmbFeeConfig.findFirst({
      where: { jenjang: targetJenjang },
    });

    if (existing) {
      const updated = await this.prisma.pmbFeeConfig.update({
        where: { id: existing.id },
        data: {
          registrationFee: Number(dto.registrationFee),
          reRegistrationFee: Number(dto.reRegistrationFee),
          description: dto.description !== undefined ? dto.description : existing.description,
        },
      });
      return { success: true, message: 'Konfigurasi biaya PMB berhasil diperbarui.', data: updated };
    } else {
      const created = await this.prisma.pmbFeeConfig.create({
        data: {
          jenjang: targetJenjang,
          registrationFee: Number(dto.registrationFee),
          reRegistrationFee: Number(dto.reRegistrationFee),
          description: dto.description || 'Konfigurasi biaya PMB ITN',
        },
      });
      return { success: true, message: 'Konfigurasi biaya PMB berhasil disimpan.', data: created };
    }
  }

  // ===========================================================================
  // 4C. CRUD JENIS PENDAFTARAN (ADMISSION REGISTRATION TYPE)
  // ===========================================================================

  async getRegistrationTypes() {
    return this.prisma.admissionRegistrationType.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async createRegistrationType(dto: CreateRegistrationTypeDto) {
    const regType = await this.prisma.admissionRegistrationType.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description || null,
        badge: dto.badge?.trim() || null,
        isKip: dto.isKip ?? false,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, message: 'Jenis pendaftaran berhasil ditambahkan.', registrationType: regType };
  }

  async updateRegistrationType(id: string, dto: Partial<CreateRegistrationTypeDto>) {
    const regType = await this.prisma.admissionRegistrationType.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        name: dto.name ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        badge: dto.badge !== undefined ? dto.badge : undefined,
        isKip: dto.isKip !== undefined ? dto.isKip : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
    return { success: true, message: 'Jenis pendaftaran berhasil diperbarui.', registrationType: regType };
  }

  async deleteRegistrationType(id: string) {
    await this.prisma.admissionRegistrationType.delete({ where: { id } });
    return { success: true, message: 'Jenis pendaftaran berhasil dihapus.' };
  }

  // ===========================================================================
  // 5. CRUD JALUR / JENIS MAHASISWA (ADMISSION TRACK)
  // ===========================================================================

  async getTracks() {
    return this.prisma.admissionTrack.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createTrack(dto: CreateTrackDto) {
    const track = await this.prisma.admissionTrack.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description || null,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, message: 'Jalur pendaftaran berhasil ditambahkan.', track };
  }

  async updateTrack(id: string, dto: Partial<CreateTrackDto>) {
    const track = await this.prisma.admissionTrack.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        name: dto.name ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
    return { success: true, message: 'Jalur pendaftaran berhasil diperbarui.', track };
  }

  async deleteTrack(id: string) {
    await this.prisma.admissionTrack.delete({ where: { id } });
    return { success: true, message: 'Jalur pendaftaran berhasil dihapus.' };
  }

  // ===========================================================================
  // 6. CRUD PILIHAN KELAS (ADMISSION CLASS)
  // ===========================================================================

  async getClasses() {
    return this.prisma.admissionClass.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createClass(dto: CreateClassDto) {
    const admissionClass = await this.prisma.admissionClass.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description || null,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, message: 'Kelas berhasil ditambahkan.', admissionClass };
  }

  async updateClass(id: string, dto: Partial<CreateClassDto>) {
    const admissionClass = await this.prisma.admissionClass.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        name: dto.name ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });
    return { success: true, message: 'Kelas berhasil diperbarui.', admissionClass };
  }

  async deleteClass(id: string) {
    await this.prisma.admissionClass.delete({ where: { id } });
    return { success: true, message: 'Kelas berhasil dihapus.' };
  }
}
