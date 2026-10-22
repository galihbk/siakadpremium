import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
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
import { StorageService } from '../storage/storage.service';
import { MailService } from '../../shared/mail/mail.service';
import { AdmissionStatus } from '@siakad/types';

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
    private storageService: StorageService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  /** Token pendaftar PMB: JWT sungguhan (bukan string tebakan) dengan peran khusus yang hanya boleh ke /admissions/pmb/*. */
  private issueApplicantToken(account: { id: string; email: string }) {
    return this.jwtService.sign({ sub: account.id, email: account.email, role: 'PMB_APPLICANT' }, { expiresIn: '7d' });
  }

  /**
   * Helper konversi file/base64 dokumen PMB ke Storage (Local Server Disk atau Cloudflare R2)
   */
  private async processFileField(
    fileData?: string | null,
    folder: string = 'pmb-docs',
    fileNamePrefix: string = 'doc',
  ): Promise<string | undefined> {
    if (!fileData) return undefined;
    const trimmed = fileData.trim();
    if (!trimmed) return undefined;

    // Jika sudah berupa URL (http/https), biarkan
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // Jika berupa base64 data URI, upload via StorageService (local/cloud)
    if (trimmed.startsWith('data:')) {
      try {
        const uploadRes = await this.storageService.uploadBase64({
          base64Data: trimmed,
          folder,
          fileName: fileNamePrefix,
        });
        return uploadRes.url;
      } catch (err: any) {
        console.warn(`[PMB Upload] Gagal memproses ${fileNamePrefix}:`, err?.message || err);
        return trimmed; // fallback
      }
    }

    return trimmed;
  }

  /**
   * Kirim email pemberitahuan ke pendaftar (diterima / pembayaran disetujui). Tidak pernah menggagalkan proses utama:
   * kegagalan SMTP hanya dicatat. Nama institusi & tautan portal diambil dari Profil Institusi / env.
   */
  private async notifyApplicant(
    appId: string,
    kind: 'PASSED' | 'REGISTRATION_PAID' | 'RE_REGISTRATION_PAID',
    extra?: { nim?: string; initialPassword?: string; amount?: number | string },
  ) {
    try {
      const app = await this.prisma.admissionApplication.findUnique({
        where: { id: appId },
        include: { studyProgram: true },
      });
      if (!app?.email) return;
      const setting: any = await this.prisma.landingPageSetting.findUnique({ where: { id: 'default-setting' } }).catch(() => null);
      const brand = String(setting?.campusName || process.env.MAIL_FROM_NAME || 'SIAKAD Premium');
      const pmbUrl = (process.env.PUBLIC_PMB_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
      const portalUrl = (process.env.PUBLIC_PORTAL_URL || '').replace(/\/+$/, '');
      const prodi = app.studyProgram?.name || '-';
      const rp = (v: any) => `Rp ${Number(v || 0).toLocaleString('id-ID')}`;

      if (kind === 'PASSED') {
        await this.mailService.sendNoticeEmail(app.email, app.fullName, {
          brand,
          subject: `Selamat, Anda Dinyatakan Diterima - ${brand}`,
          heading: 'Selamat! Anda dinyatakan DITERIMA',
          paragraphs: [
            `Berdasarkan hasil seleksi, Anda dinyatakan diterima di ${brand}. Langkah berikutnya adalah menyelesaikan pembayaran daftar ulang melalui dashboard PMB.`,
          ],
          details: [
            ['Nomor Pendaftaran', app.registrationNumber || '-'],
            ['Program Studi', prodi],
          ],
          cta: pmbUrl ? { label: 'Buka Dashboard PMB', url: `${pmbUrl}/dashboard` } : undefined,
        });
      } else if (kind === 'REGISTRATION_PAID') {
        await this.mailService.sendNoticeEmail(app.email, app.fullName, {
          brand,
          subject: `Pembayaran Registrasi Disetujui - ${brand}`,
          heading: 'Pembayaran registrasi Anda telah disetujui',
          paragraphs: ['Pembayaran biaya registrasi telah divalidasi. Pantau tahapan seleksi Anda melalui dashboard PMB.'],
          details: [
            ['Nomor Pendaftaran', app.registrationNumber || '-'],
            ['Nominal', rp(extra?.amount)],
          ],
          cta: pmbUrl ? { label: 'Buka Dashboard PMB', url: `${pmbUrl}/dashboard` } : undefined,
        });
      } else {
        const details: Array<[string, string]> = [
          ['Nomor Pendaftaran', app.registrationNumber || '-'],
          ['Program Studi', prodi],
          ['Pembayaran Daftar Ulang', `${rp(extra?.amount)} (Lunas)`],
        ];
        if (extra?.nim) details.push(['NIM / Username Portal', extra.nim]);
        if (extra?.initialPassword) details.push(['Password Awal Portal', extra.initialPassword]);
        await this.mailService.sendNoticeEmail(app.email, app.fullName, {
          brand,
          subject: `Daftar Ulang Disetujui - Anda Resmi Diterima di ${brand}`,
          heading: 'Daftar ulang disetujui, Anda resmi menjadi mahasiswa',
          paragraphs: [
            `Pembayaran daftar ulang Anda telah disetujui dan Anda resmi diterima sebagai mahasiswa baru ${brand}. Gunakan NIM dan password awal berikut untuk masuk ke portal akademik, lalu segera ganti password Anda.`,
          ],
          details,
          cta: portalUrl ? { label: 'Masuk Portal Akademik', url: `${portalUrl}/login` } : pmbUrl ? { label: 'Buka Dashboard PMB', url: `${pmbUrl}/dashboard` } : undefined,
          footer: `Simpan email ini dengan baik dan jangan bagikan password Anda kepada siapa pun. Dikirim otomatis oleh Panitia PMB ${brand}.`,
        });
      }
    } catch (err: any) {
      console.error(`[PMB] Gagal mengirim email pemberitahuan (${kind}):`, err?.message || err);
    }
  }

  /** Helper generate password awal student berdasarkan Tanggal Lahir (Format DDMMYYYY) */
  private generateBirthDatePassword(birthDateInput?: string | Date | null): string {
    if (!birthDateInput) return '17092005';
    try {
      if (birthDateInput instanceof Date) {
        const d = birthDateInput.getDate().toString().padStart(2, '0');
        const m = (birthDateInput.getMonth() + 1).toString().padStart(2, '0');
        const y = birthDateInput.getFullYear().toString();
        return `${d}${m}${y}`;
      }

      const s = String(birthDateInput).trim();
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parts = s.split('T')[0].split('-');
        return `${parts[2]}${parts[1]}${parts[0]}`;
      }
      // DD-MM-YYYY or DD/MM/YYYY
      if (/^\d{2}[-\/]\d{2}[-\/]\d{4}/.test(s)) {
        const parts = s.split(/[-\/]/);
        return `${parts[0]}${parts[1]}${parts[2]}`;
      }
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        const d = parsed.getDate().toString().padStart(2, '0');
        const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
        const y = parsed.getFullYear().toString();
        return `${d}${m}${y}`;
      }
    } catch (err) {
      console.error('Error parsing birthDate for password:', err);
    }
    return '17092005';
  }


  private parseAddressString(fullAddress?: string | null): Record<string, string> {
    if (!fullAddress) return {};
    const result: Record<string, string> = {};

    const provMatch = fullAddress.match(/Prov\.?\s*([^,]+)/i);
    if (provMatch) result.province = provMatch[1].trim();

    const cityMatch = fullAddress.match(/(Kabupaten|Kota|Kab\.?)\s*([^,]+)/i);
    if (cityMatch) result.city = cityMatch[2].trim();

    const kecMatch = fullAddress.match(/Kec\.?\s*([^,]+)/i);
    if (kecMatch) result.kecamatan = kecMatch[1].trim();

    const kelMatch = fullAddress.match(/(Kel\.\/desa|Kelurahan)\s*([^,]+)/i);
    if (kelMatch) result.kelurahan = kelMatch[2].trim();

    const posMatch = fullAddress.match(/Kode\s*Pos\s*(\d+)/i);
    if (posMatch) result.postalCode = posMatch[1].trim();

    const rtrwMatch = fullAddress.match(/Rt\/rw:\s*([0-9\s\/]+)/i);
    if (rtrwMatch) result.rtRw = rtrwMatch[1].trim();

    const streetMatch = fullAddress.split(/,\s*(Rt\/rw:|Kel\.\/desa|Kelurahan|Kec\.|Kabupaten|Kota|Prov\.|Kode Pos)/i)[0];
    if (streetMatch) result.streetAddress = streetMatch.trim();

    return result;
  }

  // ===========================================================================
  // 1. AKUN PMB (CALON MAHASISWA)
  // ===========================================================================

  /**
   * Pendaftaran Akun PMB baru (Belum membuat nomor pendaftaran atau NIM)
   */
  private roleLabel(role: string): string {
    const map: Record<string, string> = {
      LECTURER: 'dosen',
      STAFF: 'pegawai',
      SUPER_ADMIN: 'administrator',
      ADMIN_BAAK: 'admin BAAK',
      ADMIN_KEUANGAN: 'admin keuangan',
      ADMIN_PMB: 'admin PMB',
    };
    return map[role] ?? 'pegawai';
  }

  async registerAccount(dto: RegisterPmbAccountDto, originUrl?: string) {
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      throw new BadRequestException('Pendaftaran tidak dapat diproses oleh sistem keamanan.');
    }

    const emailTrimmed = dto.email.trim().toLowerCase();
    const whatsappTrimmed = dto.whatsapp.trim();

    // Cek apakah email sudah terdaftar di pmb_accounts atau admission_applicants
    const existing = await this.prisma.pmbAccount.findUnique({
      where: { email: emailTrimmed },
    });

    const existingApplicant = await this.prisma.admissionApplicant.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    });

    if (existing || existingApplicant) {
      const isUnverified = (existing && !existing.isEmailVerified) ||
                           (existingApplicant && !existingApplicant.verifiedAt);

      if (isUnverified) {
        throw new ConflictException({
          statusCode: 409,
          isUnverified: true,
          email: emailTrimmed,
          message: `Email ${dto.email} sudah terdaftar tetapi BELUM DIVERIFIKASI. Silakan cek email Anda atau klik tombol verifikasi di bawah untuk melakukan verifikasi.`,
        });
      }

      throw new ConflictException(`Email ${dto.email} sudah terdaftar. Silakan login ke akun PMB Anda.`);
    }

    // Email yang sudah dipakai akun sistem (dosen, pegawai, admin) tidak boleh dipakai mendaftar sebagai mahasiswa:
    // satu email = satu akun, dan konversi menjadi mahasiswa akan menumpuk peran akun tersebut.
    const systemUser = await this.prisma.user.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
      select: { role: true },
    });
    if (systemUser) {
      throw new ConflictException(
        systemUser.role === 'STUDENT'
          ? `Email ${dto.email} sudah terdaftar sebagai mahasiswa. Silakan login ke portal mahasiswa.`
          : `Email ${dto.email} sudah dipakai sebagai akun ${this.roleLabel(String(systemUser.role))} di sistem. Gunakan email lain untuk pendaftaran mahasiswa baru.`,
      );
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
        isEmailVerified: false,
      },
    });

    // Generate token verifikasi dan entri AdmissionApplicant
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const count = await this.prisma.admissionApplicant.count();
    let regNumber = `PMB2027${String(count + 1).padStart(4, '0')}`;
    const numExists = await this.prisma.admissionApplicant.findUnique({
      where: { registrationNumber: regNumber },
    });
    if (numExists) {
      regNumber = `PMB2027${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const metadata = {
      verificationToken,
      tokenExpiry: tokenExpiry.toISOString(),
      isEmailVerified: false,
      lastResendAt: new Date().toISOString(),
    };

    await this.prisma.admissionApplicant.create({
      data: {
        registrationNumber: regNumber,
        fullName: dto.fullName.trim(),
        email: emailTrimmed,
        phone: whatsappTrimmed,
        highSchool: '-',
        chosenStudyProgram: 'Belum Dipilih',
        jalurPendaftaran: 'Jalur Mandiri Online (CBT)',
        status: AdmissionStatus.PENDING,
        notes: JSON.stringify(metadata),
      },
    });

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl.replace(/\/+$/, '')}/pmb/verifikasi-email?token=${verificationToken}&email=${encodeURIComponent(emailTrimmed)}`;

    // Kirim email verifikasi secara asinkron via MailService
    await this.mailService.sendVerificationEmail(emailTrimmed, account.fullName, verificationUrl);

    return {
      success: true,
      requiresVerification: true,
      message: `Akun pendaftaran PMB berhasil dibuat. Tautan verifikasi telah dikirim ke ${emailTrimmed}. Silakan periksa kotak masuk atau folder spam email Anda.`,
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
    const identifier = String(dto.identifier ?? '').trim();
    // Login PMB hanya memakai email (bukan nomor registrasi / WhatsApp).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(identifier)) {
      throw new BadRequestException('Masuk menggunakan alamat email yang Anda daftarkan.');
    }
    const isEmail = true;

    const account = await this.prisma.pmbAccount.findFirst({
      where: { email: { equals: identifier, mode: 'insensitive' } },
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
            token: this.issueApplicantToken(pmbAcc),
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

      throw new UnauthorizedException('Email tidak terdaftar di sistem PMB.');
    }

    const isValidPassword = await bcrypt.compare(dto.password, account.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Kata sandi yang Anda masukkan salah.');
    }

    if (!account.isEmailVerified) {
      throw new UnauthorizedException({
        statusCode: 401,
        isUnverified: true,
        email: account.email,
        message: 'Akun Anda belum diverifikasi. Silakan periksa email Anda dan klik tautan verifikasi sebelum masuk.',
      });
    }

    const activeApplication = account.applications[0] || null;

    return {
      success: true,
      message: 'Login berhasil.',
      token: this.issueApplicantToken(account),
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
  /** Tautan berkas segar (lihat StorageService.refreshPrivateUrl). */
  freshUrl<T extends string | null | undefined>(value: T): T | string {
    return this.storageService.refreshPrivateUrl(value);
  }

  /** Salinan pendaftaran dengan tautan berkas dan bukti bayar yang segar. */
  private freshenApplication<T extends Record<string, any>>(app: T): T {
    const out: Record<string, any> = { ...app };
    for (const f of ['fileKtp', 'fileKk', 'fileIjazah', 'fileFoto', 'fileKip', 'fileTambahan']) {
      if (out[f]) out[f] = this.freshUrl(out[f]);
    }
    if (Array.isArray(out.payments)) {
      out.payments = out.payments.map((p: any) => (p?.proofUrl ? { ...p, proofUrl: this.freshUrl(p.proofUrl) } : p));
    }
    return out as T;
  }

  async getMyProfile(accountId: string) {
    const account = await this.resolvePmbAccount(accountId);

    if (!account) {
      throw new NotFoundException('Akun PMB tidak ditemukan.');
    }

    if (account.isEmailVerified === false) {
      throw new UnauthorizedException({
        statusCode: 401,
        isUnverified: true,
        email: account.email,
        message: 'Akun Anda belum diverifikasi. Silakan periksa email Anda dan klik tautan verifikasi sebelum mengakses formulir.',
      });
    }

    return {
      account: {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        whatsapp: account.whatsapp,
        isEmailVerified: account.isEmailVerified,
      },
      application: account.applications[0] ? this.freshenApplication(account.applications[0] as any) : null,
    };
  }

  // ===========================================================================
  // 2. FORMULIR PENDAFTARAN (DRAFT & SUBMIT)
  // ===========================================================================

  /**
   * Opsi Form Master (Dinamis dari PostgreSQL: Gelombang, Jenis Pendaftaran, Jenis Mahasiswa, Kelas, Prodi Master Akademik)
   */
  async getFormOptions() {
    const [waves, registrationTypes, tracks, classes, studyPrograms, paymentAccounts] = await Promise.all([
      this.prisma.admissionBatch.findMany({
        where: { status: { in: ['OPEN', 'UPCOMING'] } },
        orderBy: [{ isDefault: 'desc' }, { startDate: 'asc' }],
      }),
      this.prisma.admissionRegistrationType.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      }),
      this.prisma.admissionTrack.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { studyPrograms: { select: { id: true } } },
      }),
      this.prisma.admissionClass.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        include: { studyPrograms: { select: { id: true } } },
      }),
      this.prisma.studyProgram.findMany({
        where: { status: 'Aktif' },
        include: { faculty: true },
        orderBy: [{ degreeLevel: 'asc' }, { name: 'asc' }],
      }),
      // Rekening tujuan pembayaran pendaftar = rekening aktif yang dikelola Keuangan (tanpa saldo).
      this.prisma.financeBankAccount.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true, bankName: true, accountNumber: true, accountName: true, description: true },
      }),
    ]);

    return {
      waves,
      registrationTypes,
      tracks: tracks.map(({ studyPrograms: sp, ...t }) => ({ ...t, studyProgramIds: sp.map((p) => p.id) })),
      classes: classes.map(({ studyPrograms: sp, ...c }) => ({ ...c, studyProgramIds: sp.map((p) => p.id) })),
      paymentAccounts,
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

    // Proses dan upload berkas dokumen ke Storage aktif (Local atau Cloudflare R2)
    const [fileKtp, fileKk, fileIjazah, fileFoto, fileKip, fileTambahan] = await Promise.all([
      this.processFileField(dto.fileKtp, 'pmb-docs/ktp', `ktp_${account.id.slice(0, 8)}`),
      this.processFileField(dto.fileKk, 'pmb-docs/kk', `kk_${account.id.slice(0, 8)}`),
      this.processFileField(dto.fileIjazah, 'pmb-docs/ijazah', `ijazah_${account.id.slice(0, 8)}`),
      this.processFileField(dto.fileFoto, 'pmb-docs/foto', `foto_${account.id.slice(0, 8)}`),
      this.processFileField(dto.fileKip, 'pmb-docs/kip', `kip_${account.id.slice(0, 8)}`),
      this.processFileField(dto.fileTambahan, 'pmb-docs/tambahan', `tambahan_${account.id.slice(0, 8)}`),
    ]);

    const payload = {
      waveId: dto.waveId || undefined,
      registrationTypeId: dto.registrationTypeId || undefined,
      trackId: dto.trackId || undefined,
      classId: dto.classId || undefined,
      studyProgramId: dto.studyProgramId || undefined,
      isKip: dto.isKip ?? false,
      originInstitution: dto.originInstitution?.trim() || undefined,
      originInstitutionCode: dto.originInstitutionCode?.trim() || undefined,
      originInstitutionId: dto.originInstitutionId?.trim() || undefined,
      originStudyProgram: dto.originStudyProgram?.trim() || undefined,
      originStudyProgramLevel: dto.originStudyProgramLevel?.trim() || undefined,
      originStudyProgramId: dto.originStudyProgramId?.trim() || undefined,
      originNim: dto.originNim?.trim() || undefined,
      nik: dto.nik || undefined,
      fullName: toTitleCase(dto.fullName || account.fullName) || (dto.fullName || account.fullName).trim(),
      birthPlace: toTitleCase(dto.birthPlace),
      birthDate: dto.birthDate || undefined,
      gender: dto.gender || undefined,
      religion: dto.religion || undefined,
      phone: (dto.phone || account.whatsapp).trim(),
      email: (dto.email || account.email).trim().toLowerCase(),
      address: toTitleCase(dto.address),
      streetAddress: toTitleCase(dto.streetAddress) || undefined,
      rtRw: dto.rtRw || undefined,
      dusun: toTitleCase(dto.dusun) || undefined,
      kelurahan: toTitleCase(dto.kelurahan) || undefined,
      kecamatan: toTitleCase(dto.kecamatan) || undefined,
      city: toTitleCase(dto.city) || undefined,
      province: toTitleCase(dto.province) || undefined,
      postalCode: dto.postalCode || undefined,
      schoolName: toTitleCase(dto.schoolName),
      npsn: dto.npsn || undefined,
      nisn: dto.nisn || undefined,
      graduationYear: dto.graduationYear || undefined,
      major: toTitleCase(dto.major),
      parentName: toTitleCase(dto.parentName) || toTitleCase(dto.fatherName) || toTitleCase(dto.motherName),
      parentPhone: dto.parentPhone || dto.fatherPhone || dto.motherPhone || undefined,
      parentJob: toTitleCase(dto.parentJob) || toTitleCase(dto.fatherJob) || toTitleCase(dto.motherJob) || undefined,
      parentIncome: dto.parentIncome || dto.fatherIncome || dto.motherIncome || undefined,
      fatherName: toTitleCase(dto.fatherName),
      fatherPhone: dto.fatherPhone || undefined,
      fatherJob: toTitleCase(dto.fatherJob) || undefined,
      fatherIncome: dto.fatherIncome || undefined,
      motherName: toTitleCase(dto.motherName),
      motherPhone: dto.motherPhone || undefined,
      motherJob: toTitleCase(dto.motherJob) || undefined,
      motherIncome: dto.motherIncome || undefined,
      fileKtp: fileKtp || app?.fileKtp || undefined,
      fileKk: fileKk || app?.fileKk || undefined,
      fileIjazah: fileIjazah || app?.fileIjazah || undefined,
      fileFoto: fileFoto || app?.fileFoto || undefined,
      fileKip: fileKip || app?.fileKip || undefined,
      fileTambahan: fileTambahan || app?.fileTambahan || undefined,
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

    // Pindahan dan RPL Transfer SKS: asal perguruan tinggi wajib, karena Feeder meminta data ini saat registrasi.
    // Kategori lain (mis. RPL Perolehan SKS dari pengalaman kerja) tidak selalu punya perguruan tinggi asal, jadi opsional.
    const submittedTrack = await this.prisma.admissionTrack.findUnique({ where: { id: dto.trackId }, select: { kind: true, name: true } });
    if (submittedTrack && ['TRANSFER', 'RPL_TRANSFER'].includes(submittedTrack.kind) && (!dto.originInstitution?.trim() || !dto.originStudyProgram?.trim())) {
      throw new BadRequestException(
        `Untuk jenis mahasiswa "${submittedTrack.name}", nama perguruan tinggi asal dan program studi asal wajib diisi.`,
      );
    }

    const wave = await this.prisma.admissionBatch.findUnique({
      where: { id: dto.waveId },
    });
    if (!wave) {
      throw new NotFoundException('Gelombang pendaftaran yang dipilih tidak valid.');
    }

    // Program studi harus termasuk yang menerima jenis mahasiswa dan kelas kuliah yang dipilih (kosong = semua prodi).
    // Pilihan jenis mahasiswa/kelas hanya relevan untuk jenjang S1 dan D4.
    const chosenProdi = await this.prisma.studyProgram.findUnique({ where: { id: dto.studyProgramId }, select: { degreeLevel: true, name: true } });
    if (chosenProdi && ['S1', 'D4'].includes(chosenProdi.degreeLevel)) {
      const [trk, cls] = await Promise.all([
        this.prisma.admissionTrack.findUnique({ where: { id: dto.trackId }, select: { name: true, studyPrograms: { select: { id: true } } } }),
        dto.classId
          ? this.prisma.admissionClass.findUnique({ where: { id: dto.classId }, select: { name: true, studyPrograms: { select: { id: true } } } })
          : null,
      ]);
      if (trk && trk.studyPrograms.length > 0 && !trk.studyPrograms.some((p) => p.id === dto.studyProgramId)) {
        throw new BadRequestException(`Program studi ${chosenProdi.name} tidak menerima jenis mahasiswa "${trk.name}".`);
      }
      if (cls && cls.studyPrograms.length > 0 && !cls.studyPrograms.some((p) => p.id === dto.studyProgramId)) {
        throw new BadRequestException(`Program studi ${chosenProdi.name} tidak membuka kelas kuliah "${cls.name}".`);
      }
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
      originInstitution: dto.originInstitution?.trim() || undefined,
      originInstitutionCode: dto.originInstitutionCode?.trim() || undefined,
      originInstitutionId: dto.originInstitutionId?.trim() || undefined,
      originStudyProgram: dto.originStudyProgram?.trim() || undefined,
      originStudyProgramLevel: dto.originStudyProgramLevel?.trim() || undefined,
      originStudyProgramId: dto.originStudyProgramId?.trim() || undefined,
      originNim: dto.originNim?.trim() || undefined,
      registrationNumber,
      formStatus: 'SUBMITTED',
      verificationStatus: 'UNVERIFIED',
      verificationNote: null,
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
      streetAddress: toTitleCase(dto.streetAddress) || undefined,
      rtRw: dto.rtRw || undefined,
      dusun: toTitleCase(dto.dusun) || undefined,
      kelurahan: toTitleCase(dto.kelurahan) || undefined,
      kecamatan: toTitleCase(dto.kecamatan) || undefined,
      city: toTitleCase(dto.city) || undefined,
      province: toTitleCase(dto.province) || undefined,
      postalCode: dto.postalCode || undefined,
      schoolName: toTitleCase(dto.schoolName),
      npsn: dto.npsn || undefined,
      nisn: dto.nisn || undefined,
      graduationYear: dto.graduationYear || undefined,
      major: toTitleCase(dto.major),
      parentName: toTitleCase(dto.parentName) || toTitleCase(dto.fatherName) || toTitleCase(dto.motherName),
      parentPhone: dto.parentPhone || dto.fatherPhone || dto.motherPhone || undefined,
      parentJob: toTitleCase(dto.parentJob) || toTitleCase(dto.fatherJob) || toTitleCase(dto.motherJob) || undefined,
      parentIncome: dto.parentIncome || dto.fatherIncome || dto.motherIncome || undefined,
      fatherName: toTitleCase(dto.fatherName),
      fatherPhone: dto.fatherPhone || undefined,
      fatherJob: toTitleCase(dto.fatherJob) || undefined,
      fatherIncome: dto.fatherIncome || undefined,
      motherName: toTitleCase(dto.motherName),
      motherPhone: dto.motherPhone || undefined,
      motherJob: toTitleCase(dto.motherJob) || undefined,
      motherIncome: dto.motherIncome || undefined,
      fileKtp: dto.fileKtp || undefined,
      fileKk: dto.fileKk || undefined,
      fileIjazah: dto.fileIjazah || undefined,
      fileFoto: dto.fileFoto || undefined,
      fileKip: dto.fileKip || undefined,
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
   * Panitia mendaftarkan calon mahasiswa (mis. walk-in di BAAK) memakai formulir yang sama dengan PMB online.
   * Membuat akun PMB (email terverifikasi, kata sandi sementara) lalu mengirim pendaftaran lewat
   * jalur yang sama dengan pendaftar mandiri, sehingga muncul di daftar pendaftar dan alur verifikasi.
   */
  async adminCreateApplication(
    body: Record<string, any>,
    staff?: { fullName?: string },
  ) {
    const fullName = String(body.fullName ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const whatsapp = String(body.phone ?? body.whatsapp ?? '').trim();
    if (fullName.length < 2) throw new BadRequestException('Nama lengkap wajib diisi.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException('Email pendaftar tidak valid.');
    if (!/^(\+?62|0)8\d{7,12}$/.test(whatsapp.replace(/[\s-]/g, ''))) {
      throw new BadRequestException('Nomor WhatsApp pendaftar tidak valid (contoh 081234567890).');
    }
    if (body.nik && !/^\d{16}$/.test(String(body.nik))) throw new BadRequestException('NIK harus 16 digit angka.');

    const [dupAccount, dupLegacy] = await Promise.all([
      this.prisma.pmbAccount.findUnique({ where: { email } }),
      this.prisma.admissionApplicant.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }),
    ]);
    if (dupAccount || dupLegacy) {
      throw new ConflictException(`Email ${email} sudah terdaftar di sistem PMB.`);
    }

    // Kata sandi sementara acak; ditampilkan sekali ke panitia untuk diserahkan ke pendaftar.
    const temporaryPassword = crypto.randomBytes(5).toString('hex');
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const account = await this.prisma.pmbAccount.create({
      data: { fullName, email, whatsapp, passwordHash, isEmailVerified: true },
    });

    try {
      const dto: any = { ...body, fullName, email, phone: whatsapp };
      // simpan sebagai draf dulu agar berkas (base64) diunggah ke penyimpanan, lalu kirim dengan URL berkasnya
      const draft: any = await this.saveDraft(account.id, dto);
      for (const f of ['fileKtp', 'fileKk', 'fileIjazah', 'fileFoto', 'fileKip', 'fileTambahan']) {
        dto[f] = draft.application?.[f] || undefined;
      }
      const result: any = await this.submitApplication(account.id, dto);
      const app = result.application;

      // Pendaftar membayar langsung di loket: tandai tagihan registrasi lunas
      if (body.paidOnSite && !body.isKip) {
        await this.prisma.admissionPayment.updateMany({
          where: { applicationId: app.id, type: 'REGISTRATION', status: 'PENDING' },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paymentMethod: 'Bayar langsung di loket PMB',
            notes: `Dicatat oleh panitia${staff?.fullName ? ` (${staff.fullName})` : ''}`,
          },
        });
      }

      return {
        success: true,
        message: `Calon mahasiswa berhasil didaftarkan. Nomor Pendaftaran: ${app.registrationNumber}`,
        applicationId: app.id,
        registrationNumber: app.registrationNumber,
        email,
        temporaryPassword,
      };
    } catch (err) {
      // batalkan akun yang baru dibuat bila pendaftaran gagal agar email tidak "terpakai"
      await this.prisma.pmbAccount.delete({ where: { id: account.id } }).catch(() => undefined);
      throw err;
    }
  }

  /**
   * Upload bukti pembayaran (Registrasi atau Daftar Ulang)
   */
  async uploadPaymentProof(paymentId: string, dto: UploadPaymentProofDto, accountId?: string) {
    const payment = await this.prisma.admissionPayment.findUnique({
      where: { id: paymentId },
      include: { application: { select: { accountId: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Tagihan pembayaran tidak ditemukan.');
    }
    // Pendaftar hanya boleh mengunggah bukti untuk tagihannya sendiri.
    if (accountId && payment.application?.accountId !== accountId) {
      throw new ForbiddenException('Tagihan ini bukan milik akun Anda.');
    }

    // Wajib memilih rekening kampus tujuan transfer (untuk rekap manual Keuangan)
    const activeAccounts = await this.prisma.financeBankAccount.count({ where: { isActive: true } });
    if (activeAccounts === 0) {
      throw new BadRequestException('Rekening tujuan pembayaran belum diatur. Silakan hubungi panitia PMB.');
    }
    const account = dto.bankAccountId
      ? await this.prisma.financeBankAccount.findFirst({ where: { id: dto.bankAccountId, isActive: true } })
      : null;
    if (!account) {
      throw new BadRequestException('Pilih rekening bank kampus tempat Anda mengirim pembayaran.');
    }
    const methodLabel = `Transfer ke ${account.bankName} ${account.accountNumber} a.n. ${account.accountName}`;

    let proofUrl = dto.proofUrl;
    if (proofUrl) {
      proofUrl = await this.processFileField(
        proofUrl,
        'pmb-payments',
        `payment_${paymentId.slice(0, 8)}`,
      );
    }

    const updated = await this.prisma.admissionPayment.update({
      where: { id: paymentId },
      data: {
        status: 'VERIFYING',
        proofUrl: proofUrl || undefined,
        paymentMethod: methodLabel,
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
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const recentApplicants = recentApps.map((a) => {
      const reRegPayment = a.payments?.find((p) => p.type === 'RE_REGISTRATION');
      const isVerifyingReReg = reRegPayment?.status === 'VERIFYING';
      const isReRegPaid = reRegPayment?.status === 'PAID';
      const st = a.studentId || isReRegPaid
        ? 'REGISTERED'
        : isVerifyingReReg
        ? 'VERIFYING_RE_REGISTRATION'
        : a.selectionStatus === 'PASSED'
        ? 'PASSED'
        : a.selectionStatus === 'FAILED'
        ? 'FAILED'
        : a.verificationStatus === 'REJECTED'
        ? 'REJECTED'
        : a.verificationStatus === 'VERIFIED'
        ? 'VERIFIED'
        : 'PENDING';

      return {
        id: a.id,
        registrationNumber: a.registrationNumber || '-',
        fullName: a.fullName || a.account?.fullName || '-',
        email: a.email || a.account?.email || '-',
        phone: a.phone || a.account?.whatsapp || '-',
        highSchool: a.schoolName || '-',
        chosenStudyProgram: a.studyProgram?.name || '-',
        jalurPendaftaran: a.track?.name || '-',
        status: st,
        createdAt: a.createdAt,
      };
    });

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

    return this.freshenApplication(app as any);
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
        ...(dto.notes ? { notes: dto.notes } : {}),
        verifiedAt: dto.status === 'PAID' ? new Date() : null,
        verifiedBy: dto.verifiedBy || 'Admin PMB',
      },
    });

    const newlyPaid = dto.status === 'PAID' && payment.status !== 'PAID';

    if (dto.status === 'PAID' && payment.type === 'REGISTRATION') {
      await this.prisma.admissionApplication.update({
        where: { id: payment.applicationId },
        data: {
          verificationStatus: 'UNVERIFIED',
        },
      });
      if (newlyPaid) void this.notifyApplicant(payment.applicationId, 'REGISTRATION_PAID', { amount: Number(payment.amount) });
    }

    let studentResult: any = null;
    if (dto.status === 'PAID' && payment.type === 'RE_REGISTRATION') {
      // Pastikan status kelulusan diset PASSED
      await this.prisma.admissionApplication.update({
        where: { id: payment.applicationId },
        data: {
          selectionStatus: 'PASSED',
        },
      });

      // Otomatis terbitkan NIM, Akun Student & Data Mahasiswa Aktif di tabel Student
      try {
        const convertRes = await this.convertToStudent(payment.applicationId);
        studentResult = convertRes?.data || null;
      } catch (err: any) {
        console.error('Otomatis konversi mahasiswa saat verifikasi pembayaran:', err);
      }
      if (newlyPaid) {
        void this.notifyApplicant(payment.applicationId, 'RE_REGISTRATION_PAID', {
          nim: studentResult?.nim,
          initialPassword: studentResult?.portalAccount?.initialPassword,
          amount: Number(payment.amount),
        });
      }
    }

    return {
      success: true,
      message:
        dto.status === 'PAID' && payment.type === 'RE_REGISTRATION'
          ? `Pembayaran Daftar Ulang disetujui LUNAS! Calon mahasiswa resmi dikonversi ke tabel Mahasiswa dengan NIM: ${studentResult?.nim || 'Terbit'}.`
          : dto.status === 'PAID'
          ? 'Pembayaran telah divalidasi LUNAS.'
          : 'Status pembayaran diperbarui.',
      payment: updated,
      student: studentResult,
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
      paymentMethod: p.paymentMethod,
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

    // Pendaftar yang dinyatakan tidak lolos berhak tahu alasannya (tampil di dashboard pendaftar)
    if (dto.selectionStatus === 'FAILED' && String(dto.selectionNotes ?? '').trim().length < 5) {
      throw new BadRequestException('Alasan tidak lolos wajib diisi (minimal 5 karakter); alasan ini ditampilkan kepada pendaftar.');
    }

    const updated = await this.prisma.admissionApplication.update({
      where: { id },
      data: {
        selectionStatus: dto.selectionStatus,
        testScore: dto.testScore !== undefined ? dto.testScore : app.testScore,
        selectionNotes: dto.selectionNotes || undefined,
        selectionDate: new Date(),
        ...(dto.selectionStatus === 'PASSED' && app.verificationStatus !== 'VERIFIED'
          ? { verificationStatus: 'VERIFIED', verifiedAt: app.verifiedAt || new Date() }
          : {}),
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

    if (dto.selectionStatus === 'PASSED' && app.selectionStatus !== 'PASSED') {
      void this.notifyApplicant(id, 'PASSED');
    }

    return {
      success: true,
      message: `Keputusan seleksi berhasil disimpan: ${dto.selectionStatus}.`,
      application: updated,
    };
  }

  /**
   * Generator NIM Dinamis berbasis Konfigurasi Format NIM di Database
   */
  /**
   * Tahun angkatan = tahun awal tahun akademik gelombang pendaftaran (mis. "2027/2028" -> 2027), bukan tahun kalender
   * saat konversi; cadangannya tahun akademik aktif lalu tahun berjalan. Dipakai untuk NIM dan kolom angkatan.
   */
  private async resolveEntryYear(app: any): Promise<number> {
    const fromLabel = (v?: string | null) => {
      const m = String(v ?? '').match(/(20\d{2})/);
      return m ? Number(m[1]) : null;
    };
    const wave = app.wave ?? (app.waveId ? await this.prisma.admissionBatch.findUnique({ where: { id: app.waveId }, select: { academicYear: true } }) : null);
    const active = await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { name: true } });
    return fromLabel(wave?.academicYear) ?? fromLabel(active?.name) ?? new Date().getFullYear();
  }

  private async generateNimForApplication(prodi: any, app: any, entryYear?: number): Promise<string> {
    const currentYear = entryYear ?? (await this.resolveEntryYear(app));
    const year4Digit = String(currentYear);
    const year2Digit = year4Digit.slice(-2);

    // Kode jalur PMB (1: Reguler, 2: Beasiswa/KIP, 3: Pindahan/RPL), dibaca dari label jenis mahasiswa & jenis pendaftaran
    let jalurCode = '1';
    const [appTrack, appRegType, faculties] = await Promise.all([
      app.trackId ? this.prisma.admissionTrack.findUnique({ where: { id: app.trackId }, select: { kind: true } }) : null,
      app.registrationTypeId ? this.prisma.admissionRegistrationType.findUnique({ where: { id: app.registrationTypeId }, select: { isKip: true } }) : null,
      this.prisma.faculty.findMany({ orderBy: { code: 'asc' }, select: { id: true } }),
    ]);
    if (appTrack && appTrack.kind !== 'BARU') jalurCode = '3';
    else if (appRegType?.isKip) jalurCode = '2';

    // Rumus NIM dari Pengaturan > Format NIM
    let template = '';
    try {
      const dbSetting = await this.prisma.landingPageSetting.findUnique({ where: { id: 'default-setting' } });
      template = String(dbSetting?.nimFormat ?? '').trim();
    } catch (err) {
      console.warn('Fallback NIM format pattern:', err);
    }
    // Isi lama berupa contoh angka (bukan rumus) tidak bisa ditafsirkan: pakai rumus bawaan
    if (!template.includes('{')) template = '{ANGKATAN_2DIGIT}{KODE_PRODI}{NO_URUT_4DIGIT}';

    const facultyNo = Math.max(1, faculties.findIndex((f) => f.id === prodi.facultyId) + 1);
    const prodiCode = String(prodi.code || '').trim() || '00';
    const diktiCode = String(prodi.diktiCode || '').trim() || prodiCode;
    const render = (seq: number) =>
      template
        .replace(/{INSTITUSI}/g, '27')
        .replace(/{ANGKATAN_4DIGIT}/g, year4Digit)
        .replace(/{ANGKATAN_2DIGIT}/g, year2Digit)
        .replace(/{KODE_FAKULTAS_1DIGIT}/g, String(facultyNo).slice(-1))
        .replace(/{KODE_FAKULTAS_2DIGIT}/g, String(facultyNo).padStart(2, '0'))
        .replace(/{KODE_FAKULTAS}/g, String(facultyNo).padStart(2, '0'))
        .replace(/{KODE_PRODI_3DIGIT}/g, prodiCode.replace(/\D/g, '').slice(-3).padStart(3, '0'))
        .replace(/{KODE_DIKTI}/g, diktiCode)
        .replace(/{KODE_PRODI}/g, prodiCode)
        .replace(/{KODE_JALUR}/g, jalurCode)
        .replace(/{NO_URUT_(\d)DIGIT}/g, (_m, n) => String(seq).padStart(Number(n), '0'))
        .replace(/{NO_URUT}/g, String(seq).padStart(4, '0'));

    // Nomor urut = jumlah mahasiswa prodi yang sudah memakai rumus yang sama + 1; dinaikkan bila NIM sudah terpakai
    const sameProdi = await this.prisma.student.count({ where: { studyProgramId: prodi.id } });
    let seq = sameProdi + 1;
    for (let guard = 0; guard < 500; guard++, seq++) {
      const candidate = render(seq);
      const taken = await this.prisma.student.findUnique({ where: { nim: candidate }, select: { id: true } });
      if (!taken) return candidate;
    }
    return render(seq);
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

    // Generate NIM resmi berdasarkan format terkonfigurasi di database
    const entryYear = await this.resolveEntryYear(app);
    const nim = app.nim || (await this.generateNimForApplication(prodi, app, entryYear));

    // Cek User akun portal
    let user = await this.prisma.user.findUnique({
      where: { email: app.email },
    });

    // Akun dosen/pegawai/admin TIDAK boleh diubah menjadi mahasiswa (perannya dan kata sandinya akan tertimpa).
    if (user && user.role !== 'STUDENT') {
      throw new BadRequestException(
        `Email ${app.email} sudah dipakai akun ${this.roleLabel(String(user.role))}. Penerbitan NIM dibatalkan agar akun tersebut tidak berubah menjadi mahasiswa. Minta pendaftar memakai email lain.`,
      );
    }

    const initialPassword = this.generateBirthDatePassword(app.birthDate);
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: app.email,
          fullName: app.fullName,
          role: 'STUDENT' as any,
          passwordHash: await bcrypt.hash(initialPassword, 10),
          isActive: true,
        },
      });
    } else {
      // Sudah akun mahasiswa: kata sandi hanya diatur ulang bila belum punya data mahasiswa (penerbitan pertama);
      // ACC berulang tidak boleh menimpa kata sandi yang sudah diganti mahasiswa.
      const hasStudent = await this.prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!hasStudent) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await bcrypt.hash(initialPassword, 10), isActive: true },
        });
      }
    }

    // Buat record Student (biodata lengkap dari PMB dipindahkan seluruhnya)
    const parsedAddr = this.parseAddressString(app.address);
    const resolvedStreet = (app as any).streetAddress || parsedAddr.streetAddress || app.address;
    const resolvedRtRw = (app as any).rtRw || parsedAddr.rtRw;
    const resolvedDusun = (app as any).dusun || parsedAddr.dusun;
    const resolvedKelurahan = (app as any).kelurahan || parsedAddr.kelurahan;
    const resolvedKecamatan = (app as any).kecamatan || parsedAddr.kecamatan;
    const resolvedCity = (app as any).city || parsedAddr.city;
    const resolvedProvince = (app as any).province || parsedAddr.province;
    const resolvedPostalCode = (app as any).postalCode || parsedAddr.postalCode;

    const advisor = await this.prisma.lecturer.findFirst({
      where: { studyProgramId: prodi.id },
    }) || await this.prisma.lecturer.findFirst();

    const isParentAsGuardian = app.parentName && (app.parentName === app.fatherName || app.parentName === app.motherName);
    const resolvedGuardianName = (app as any).guardianName || (isParentAsGuardian ? null : app.parentName) || null;
    const resolvedGuardianPhone = (app as any).guardianPhone || (isParentAsGuardian ? null : app.parentPhone) || null;
    const resolvedGuardianJob = (app as any).guardianJob || (isParentAsGuardian ? null : app.parentJob) || null;

    const student = await this.prisma.student.upsert({
      where: { nim },
      update: {
        advisorLecturerId: advisor?.id || undefined,
        status: 'ACTIVE' as any,
        phone: app.phone,
        nik: app.nik,
        nisn: app.nisn,
        noKk: (app as any).noKk,
        address: app.address,
        streetAddress: resolvedStreet,
        rtRw: resolvedRtRw,
        dusun: resolvedDusun,
        kelurahan: resolvedKelurahan,
        kecamatan: resolvedKecamatan,
        city: resolvedCity,
        province: resolvedProvince,
        postalCode: resolvedPostalCode,
        birthPlace: app.birthPlace,
        birthDate: app.birthDate ? new Date(app.birthDate) : undefined,
        gender: app.gender === 'Perempuan' ? 'FEMALE' : 'MALE',
        religion: app.religion,
        registrationTypeId: app.registrationTypeId,
        trackId: app.trackId,
        classId: app.classId,
        waveId: app.waveId,
        originInstitution: app.originInstitution,
        originInstitutionCode: app.originInstitutionCode,
        originInstitutionId: app.originInstitutionId,
        originStudyProgram: app.originStudyProgram,
        originStudyProgramLevel: app.originStudyProgramLevel,
        originStudyProgramId: app.originStudyProgramId,
        originNim: app.originNim,
        originCredits: app.originCredits,
        // Data Sekolah Asal
        schoolName: app.schoolName,
        npsn: app.npsn,
        graduationYear: app.graduationYear,
        major: app.major,
        // Data Orang Tua / Wali
        fatherName: app.fatherName,
        fatherPhone: app.fatherPhone,
        fatherJob: app.fatherJob,
        fatherIncome: app.fatherIncome,
        motherName: app.motherName,
        motherPhone: app.motherPhone,
        motherJob: app.motherJob,
        motherIncome: app.motherIncome,
        guardianName: resolvedGuardianName,
        guardianPhone: resolvedGuardianPhone,
        guardianJob: resolvedGuardianJob,
      },
      create: {
        userId: user.id,
        studyProgramId: prodi.id,
        advisorLecturerId: advisor?.id || undefined,
        nim,
        entryYear,
        currentSemester: 1,
        status: 'ACTIVE' as any,
        phone: app.phone,
        nik: app.nik,
        nisn: app.nisn,
        noKk: (app as any).noKk,
        address: app.address,
        streetAddress: resolvedStreet,
        rtRw: resolvedRtRw,
        dusun: resolvedDusun,
        kelurahan: resolvedKelurahan,
        kecamatan: resolvedKecamatan,
        city: resolvedCity,
        province: resolvedProvince,
        postalCode: resolvedPostalCode,
        birthPlace: app.birthPlace,
        birthDate: app.birthDate ? new Date(app.birthDate) : undefined,
        gender: app.gender === 'Perempuan' ? 'FEMALE' : 'MALE',
        religion: app.religion,
        registrationTypeId: app.registrationTypeId,
        trackId: app.trackId,
        classId: app.classId,
        waveId: app.waveId,
        originInstitution: app.originInstitution,
        originInstitutionCode: app.originInstitutionCode,
        originInstitutionId: app.originInstitutionId,
        originStudyProgram: app.originStudyProgram,
        originStudyProgramLevel: app.originStudyProgramLevel,
        originStudyProgramId: app.originStudyProgramId,
        originNim: app.originNim,
        originCredits: app.originCredits,
        // Data Sekolah Asal
        schoolName: app.schoolName,
        npsn: app.npsn,
        graduationYear: app.graduationYear,
        major: app.major,
        // Data Orang Tua / Wali
        fatherName: app.fatherName,
        fatherPhone: app.fatherPhone,
        fatherJob: app.fatherJob,
        fatherIncome: app.fatherIncome,
        motherName: app.motherName,
        motherPhone: app.motherPhone,
        motherJob: app.motherJob,
        motherIncome: app.motherIncome,
        guardianName: resolvedGuardianName,
        guardianPhone: resolvedGuardianPhone,
        guardianJob: resolvedGuardianJob,
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
      const waveYear = app.waveId
        ? (await this.prisma.admissionBatch.findUnique({ where: { id: app.waveId }, select: { academicYear: true } }))?.academicYear
        : null;
      const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
      const academicYear = waveYear?.trim() || activeYear?.name || '2026/2027';

      // Hanya menetapkan skema pembiayaan (rule/diskon) mahasiswa. Tagihan UKT semester 1
      // baru diterbitkan otomatis saat mahasiswa mengajukan KRS (lihat StudentsService.submitKrs).
      feeAssignmentResult = await this.feeRulesService.assignStudentFeePolicy({
        studentId: student.id,
        academicYear,
        assignedBy: 'SISTEM_KONVERSI_PMB',
        notes: `Penetapan otomatis jalur PMB: ${app.fullName} (${nim})`,
      });
    } catch (feeError) {
      console.error('Peringatan: Gagal generate aturan pembiayaan otomatis saat konversi:', feeError);
    }

    return {
      success: true,
      message: `Calon mahasiswa berhasil dikonversi menjadi Mahasiswa Resmi dengan NIM ${nim} dan skema pembiayaan telah ditetapkan.`,
      data: {
        id: student.id,
        userId: user.id,
        studentId: student.id,
        nim,
        fullName: app.fullName,
        email: user.email,
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

  /** Tahun akademik gelombang harus sudah ada di master Tahun Akademik (Kalender Akademik); tidak dibuat otomatis. */
  private async assertAcademicYearExists(name: string) {
    const exists = await this.prisma.academicYear.findFirst({ where: { name: name.trim() }, select: { id: true } });
    if (!exists) {
      throw new BadRequestException(
        `Tahun akademik "${name.trim()}" belum ada di master Tahun Akademik. Tambahkan dulu di Kalender Akademik, lalu pilih kembali di sini.`,
      );
    }
  }

  async createWave(dto: CreateWaveDto) {
    await this.assertAcademicYearExists(dto.academicYear);
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
    if (dto.academicYear?.trim()) {
      const current = await this.prisma.admissionBatch.findUnique({ where: { id }, select: { academicYear: true } });
      // gelombang lama yang tahunnya tidak diubah tetap boleh disimpan
      if (current?.academicYear !== dto.academicYear.trim()) await this.assertAcademicYearExists(dto.academicYear);
    }
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
      include: { studyPrograms: { select: { id: true, name: true, code: true } } },
    });
  }

  /** Memastikan semua ID program studi ada; mengembalikan daftar `{ id }` untuk relasi. */
  private async resolveProgramRefs(ids?: string[]): Promise<Array<{ id: string }>> {
    const list = Array.from(new Set((ids ?? []).map((i) => String(i).trim()).filter(Boolean)));
    if (list.length === 0) return [];
    const found = await this.prisma.studyProgram.count({ where: { id: { in: list } } });
    if (found !== list.length) throw new BadRequestException('Ada program studi yang dipilih tidak ditemukan.');
    return list.map((id) => ({ id }));
  }

  async createTrack(dto: CreateTrackDto) {
    const track = await this.prisma.admissionTrack.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description || null,
        kind: dto.kind ?? 'BARU',
        isActive: dto.isActive ?? true,
        studyPrograms: { connect: await this.resolveProgramRefs(dto.studyProgramIds) },
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
        kind: dto.kind,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        studyPrograms: dto.studyProgramIds !== undefined ? { set: await this.resolveProgramRefs(dto.studyProgramIds) } : undefined,
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
      include: { studyPrograms: { select: { id: true, name: true, code: true } } },
    });
  }

  async createClass(dto: CreateClassDto) {
    const admissionClass = await this.prisma.admissionClass.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description || null,
        shift: dto.shift ?? 'PAGI',
        isActive: dto.isActive ?? true,
        studyPrograms: { connect: await this.resolveProgramRefs(dto.studyProgramIds) },
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
        shift: dto.shift,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        studyPrograms: dto.studyProgramIds !== undefined ? { set: await this.resolveProgramRefs(dto.studyProgramIds) } : undefined,
      },
    });
    return { success: true, message: 'Kelas berhasil diperbarui.', admissionClass };
  }

  async deleteClass(id: string) {
    await this.prisma.admissionClass.delete({ where: { id } });
    return { success: true, message: 'Kelas berhasil dihapus.' };
  }
}
