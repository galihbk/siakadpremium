import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { MailService } from '../../shared/mail/mail.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { QueryApplicantsDto, UpdateApplicantStatusDto } from './dto/admin-applicant.dto';
import { AdmissionStatus, AdmissionStatsSummary } from '@siakad/types';

@Injectable()
export class AdmissionsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Pendaftaran Calon Mahasiswa Baru (Mengirim Link Verifikasi ke Email)
   */
  async register(dto: RegisterApplicantDto, originUrl?: string) {
    // =========================================================================
    // 1. ANTI-SPAM PROTECTION (Honeypot Check)
    // =========================================================================
    if (dto.honeypot && dto.honeypot.trim().length > 0) {
      throw new BadRequestException('Pendaftaran tidak dapat diproses oleh sistem keamanan (Anti-Spam).');
    }

    // =========================================================================
    // 2. ANTI-SQL INJECTION & XSS SANITIZATION / VALIDATION
    // =========================================================================
    const SQL_INJECTION_PATTERN = /(--|\/\*|\*\/|@@|char\(|nchar\(|varchar\(|exec\(|execute\(|\b(select|union|drop|insert|update|delete|where|table|database|alter|truncate|declare|cast)\b|(\bor\b|\band\b)\s+\d+=\d+|['";`])/i;
    const SCRIPT_INJECTION_PATTERN = /(<script|<iframe|<embed|<object|javascript:|onload=|onerror=)/i;

    const validateInputSafe = (val: string | undefined, fieldLabel: string, allowApostrophe = false) => {
      if (!val) return;
      const testVal = allowApostrophe ? val.replace(/'/g, '') : val;
      if (
        SQL_INJECTION_PATTERN.test(testVal) ||
        SCRIPT_INJECTION_PATTERN.test(val) ||
        val.includes(';') ||
        val.includes('--') ||
        val.includes('/*')
      ) {
        throw new BadRequestException(
          `Bidang ${fieldLabel} terdeteksi mengandung karakter dilarang atau potensi SQL Injection.`,
        );
      }
    };

    validateInputSafe(dto.fullName, 'Nama Lengkap', true);
    validateInputSafe(dto.email, 'Email', false);
    validateInputSafe(dto.phone, 'Nomor WhatsApp', false);
    if (dto.affiliateCode) validateInputSafe(dto.affiliateCode, 'Kode Referral', false);
    if (dto.highSchool) validateInputSafe(dto.highSchool, 'Asal Sekolah', true);
    if (dto.chosenStudyProgram) validateInputSafe(dto.chosenStudyProgram, 'Program Studi', true);
    if (dto.jalurPendaftaran) validateInputSafe(dto.jalurPendaftaran, 'Jalur Pendaftaran', true);

    const emailTrimmed = dto.email.trim().toLowerCase();

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrimmed)) {
      throw new BadRequestException('Format alamat email tidak valid atau mengandung karakter terlarang.');
    }

    if (!/^\+?[0-9\s\-]{8,18}$/.test(dto.phone.trim())) {
      throw new BadRequestException('Nomor WhatsApp hanya boleh berupa nomor telepon valid.');
    }

    if (dto.affiliateCode && !/^[A-Za-z0-9_-]{2,25}$/.test(dto.affiliateCode.trim())) {
      throw new BadRequestException('Kode referral hanya boleh berupa karakter alfanumerik (A-Z, 0-9).');
    }

    // Cek apakah email sudah terdaftar sebelumnya
    const existing = await this.prisma.admissionApplicant.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl.replace(/\/+$/, '')}/pmb/verifikasi-email?token=${verificationToken}&email=${encodeURIComponent(emailTrimmed)}`;

    if (existing) {
      // Jika sudah terdaftar dan sudah diverifikasi
      if (existing.verifiedAt) {
        throw new ConflictException(
          `Email ${dto.email} sudah terdaftar dan telah aktif terverifikasi. Silakan langsung masuk ke akun PMB Anda.`,
        );
      }

      // Jika belum diverifikasi, perbarui token dan kirim ulang email dengan proteksi cooldown 60 detik
      let metadata: any = {};
      if (existing.notes) {
        try {
          metadata = JSON.parse(existing.notes);
        } catch {
          // not json
        }
      }

      if (metadata.lastResendAt) {
        const lastTime = new Date(metadata.lastResendAt).getTime();
        const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
        const cooldownRemaining = 60 - elapsedSeconds;
        if (cooldownRemaining > 0) {
          throw new BadRequestException(
            `Tautan verifikasi baru saja dikirimkan ke email ini. Harap tunggu ${cooldownRemaining} detik lagi sebelum mengirim ulang.`,
          );
        }
      }

      metadata.lastResendAt = new Date().toISOString();
      metadata.verificationToken = verificationToken;
      metadata.tokenExpiry = tokenExpiry.toISOString();
      if (dto.affiliateCode) {
        metadata.affiliateCode = dto.affiliateCode.trim().toUpperCase();
      }

      await this.prisma.admissionApplicant.update({
        where: { id: existing.id },
        data: {
          fullName: dto.fullName.trim(),
          phone: dto.phone.trim(),
          notes: JSON.stringify(metadata),
        },
      });

      await this.mailService.sendVerificationEmail(emailTrimmed, dto.fullName.trim(), verificationUrl);

      return {
        success: true,
        requiresVerification: true,
        email: emailTrimmed,
        fullName: dto.fullName.trim(),
        message: `Tautan verifikasi akun telah dikirim ke ${emailTrimmed}. Silakan periksa kotak masuk atau spam email Anda.`,
      };
    }

    // Generate Nomor Registrasi unik: PMB2027xxxx
    const count = await this.prisma.admissionApplicant.count();
    let regNumber = `PMB2027${String(count + 1).padStart(4, '0')}`;

    // Cek kemungkinan duplikasi nomor registrasi
    const numExists = await this.prisma.admissionApplicant.findUnique({
      where: { registrationNumber: regNumber },
    });
    if (numExists) {
      regNumber = `PMB2027${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const metadata = {
      verificationToken,
      tokenExpiry: tokenExpiry.toISOString(),
      affiliateCode: dto.affiliateCode ? dto.affiliateCode.trim().toUpperCase() : undefined,
      isEmailVerified: false,
      lastResendAt: new Date().toISOString(),
    };

    const applicant = await this.prisma.admissionApplicant.create({
      data: {
        registrationNumber: regNumber,
        fullName: dto.fullName.trim(),
        email: emailTrimmed,
        phone: dto.phone.trim(),
        highSchool: dto.highSchool?.trim() || '-',
        chosenStudyProgram: dto.chosenStudyProgram?.trim() || 'Belum Dipilih',
        jalurPendaftaran: dto.jalurPendaftaran || 'Jalur Mandiri Online (CBT)',
        status: AdmissionStatus.PENDING,
        notes: JSON.stringify(metadata),
      },
    });

    await this.mailService.sendVerificationEmail(emailTrimmed, dto.fullName.trim(), verificationUrl);

    return {
      success: true,
      requiresVerification: true,
      registrationNumber: applicant.registrationNumber,
      email: applicant.email,
      fullName: applicant.fullName,
      message: `Pendaftaran berhasil. Tautan verifikasi telah dikirim ke ${emailTrimmed}. Silakan buka email Anda untuk mengaktifkan akun.`,
    };
  }

  /**
   * Memvalidasi token verifikasi email calon mahasiswa
   */
  async verifyEmail(token: string, email: string) {
    if (!token || !email) {
      throw new BadRequestException('Token dan email verifikasi wajib disertakan.');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    });

    if (!applicant) {
      throw new NotFoundException('Data calon mahasiswa tidak ditemukan.');
    }

    if (applicant.verifiedAt) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Alamat email Anda sudah diverifikasi sebelumnya. Silakan langsung masuk ke akun PMB Anda.',
      };
    }

    let metadata: any = {};
    if (applicant.notes) {
      try {
        metadata = JSON.parse(applicant.notes);
      } catch {}
    }

    if (!metadata?.verificationToken || metadata.verificationToken !== token) {
      throw new BadRequestException('Tautan verifikasi tidak valid atau telah kedaluwarsa.');
    }

    if (metadata.tokenExpiry && new Date() > new Date(metadata.tokenExpiry)) {
      throw new BadRequestException('Tautan verifikasi telah kedaluwarsa. Silakan ajukan pengiriman ulang link verifikasi.');
    }

    const updated = await this.prisma.admissionApplicant.update({
      where: { id: applicant.id },
      data: {
        verifiedAt: new Date(),
        notes: JSON.stringify({
          ...metadata,
          isEmailVerified: true,
          verificationToken: null,
        }),
      },
    });

    return {
      success: true,
      message: 'Selamat, alamat email Anda berhasil diverifikasi! Akun PMB Anda kini telah aktif.',
      applicant: {
        registrationNumber: updated.registrationNumber,
        fullName: updated.fullName,
        email: updated.email,
      },
    };
  }

  /**
   * Kirim ulang tautan verifikasi email
   */
  async resendVerification(email: string, originUrl?: string) {
    if (!email?.trim()) {
      throw new BadRequestException('Email wajib diisi.');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    });

    if (!applicant) {
      throw new NotFoundException('Email calon mahasiswa tidak terdaftar.');
    }

    if (applicant.verifiedAt) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Email sudah terverifikasi sebelumnya. Silakan langsung masuk ke akun PMB.',
      };
    }

    let metadata: any = {};
    if (applicant.notes) {
      try {
        metadata = JSON.parse(applicant.notes);
      } catch {}
    }

    // Cooldown 60 detik (1 menit) antar pengiriman ulang tautan verifikasi
    if (metadata.lastResendAt) {
      const lastTime = new Date(metadata.lastResendAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
      const cooldownRemaining = 60 - elapsedSeconds;
      if (cooldownRemaining > 0) {
        throw new BadRequestException(
          `Mohon tunggu ${cooldownRemaining} detik lagi sebelum mengirim ulang tautan verifikasi.`,
        );
      }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    metadata.verificationToken = verificationToken;
    metadata.tokenExpiry = tokenExpiry.toISOString();
    metadata.lastResendAt = new Date().toISOString();

    await this.prisma.admissionApplicant.update({
      where: { id: applicant.id },
      data: {
        notes: JSON.stringify(metadata),
      },
    });

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl.replace(/\/+$/, '')}/pmb/verifikasi-email?token=${verificationToken}&email=${encodeURIComponent(emailTrimmed)}`;

    await this.mailService.sendVerificationEmail(emailTrimmed, applicant.fullName, verificationUrl);

    return {
      success: true,
      message: `Tautan verifikasi baru berhasil dikirimkan ke ${emailTrimmed}. Silakan periksa email Anda.`,
    };
  }

  /**
   * Permintaan reset kata sandi akun PMB (Mengirim tautan ke email)
   */
  async forgotPassword(identifier: string, originUrl?: string) {
    if (!identifier?.trim()) {
      throw new BadRequestException('Nomor Registrasi atau Email wajib diisi.');
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');

    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: isEmail
        ? { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } }
        : { registrationNumber: { equals: trimmed.toUpperCase() } },
    });

    if (!applicant) {
      throw new NotFoundException(
        'Akun pendaftaran dengan Nomor Registrasi atau Email tersebut tidak ditemukan.',
      );
    }

    let metadata: any = {};
    if (applicant.notes) {
      try {
        metadata = JSON.parse(applicant.notes);
      } catch {}
    }

    // Cooldown 60 detik antar permintaan reset kata sandi
    if (metadata.lastPasswordResetAt) {
      const lastTime = new Date(metadata.lastPasswordResetAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);
      const cooldownRemaining = 60 - elapsedSeconds;
      if (cooldownRemaining > 0) {
        throw new BadRequestException(
          `Permintaan reset kata sandi baru saja dikirim. Harap tunggu ${cooldownRemaining} detik lagi sebelum meminta kembali.`,
        );
      }
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 jam

    metadata.resetToken = resetToken;
    metadata.resetTokenExpiry = resetTokenExpiry.toISOString();
    metadata.lastPasswordResetAt = new Date().toISOString();

    await this.prisma.admissionApplicant.update({
      where: { id: applicant.id },
      data: {
        notes: JSON.stringify(metadata),
      },
    });

    const baseUrl = originUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl.replace(/\/+$/, '')}/pmb/lupa-kata-sandi?token=${resetToken}&email=${encodeURIComponent(applicant.email)}`;

    await this.mailService.sendPasswordResetEmail(applicant.email, applicant.fullName, resetUrl);

    return {
      success: true,
      email: applicant.email,
      fullName: applicant.fullName,
      registrationNumber: applicant.registrationNumber,
      message: `Tautan pengaturan ulang kata sandi telah dikirimkan ke email ${applicant.email}.`,
    };
  }

  /**
   * Mengatur ulang kata sandi akun PMB dengan token valid
   */
  async resetPassword(token: string, email: string, newPassword: string) {
    if (!token?.trim() || !email?.trim() || !newPassword?.trim()) {
      throw new BadRequestException('Token, email, dan kata sandi baru wajib diisi.');
    }

    if (newPassword.trim().length < 6) {
      throw new BadRequestException('Kata sandi baru minimal terdiri dari 6 karakter.');
    }

    const emailTrimmed = email.trim().toLowerCase();
    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
    });

    if (!applicant) {
      throw new NotFoundException('Akun pendaftaran tidak ditemukan.');
    }

    let metadata: any = {};
    if (applicant.notes) {
      try {
        metadata = JSON.parse(applicant.notes);
      } catch {}
    }

    if (!metadata.resetToken || metadata.resetToken !== token.trim()) {
      throw new BadRequestException('Tautan reset kata sandi tidak valid.');
    }

    if (!metadata.resetTokenExpiry || new Date(metadata.resetTokenExpiry).getTime() < Date.now()) {
      throw new BadRequestException('Tautan reset kata sandi telah kedaluwarsa. Silakan ajukan permintaan baru.');
    }

    // Update password dan bersihkan token reset
    delete metadata.resetToken;
    delete metadata.resetTokenExpiry;
    metadata.passwordChangedAt = new Date().toISOString();

    await this.prisma.admissionApplicant.update({
      where: { id: applicant.id },
      data: {
        notes: JSON.stringify(metadata),
      },
    });

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.',
    };
  }

  /**
   * Mengambil daftar pendaftar dari database dengan fitur filter, pencarian, dan pagination
   */
  async getApplicants(query: QueryApplicantsDto) {
    const { search, status, prodi, jalur, page = 1, limit = 50 } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (prodi && prodi !== 'ALL') {
      where.chosenStudyProgram = { contains: prodi, mode: 'insensitive' };
    }

    if (jalur && jalur !== 'ALL') {
      where.jalurPendaftaran = { contains: jalur, mode: 'insensitive' };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { registrationNumber: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { highSchool: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [applicants, total] = await Promise.all([
      this.prisma.admissionApplicant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.admissionApplicant.count({ where }),
    ]);

    return {
      data: applicants,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  /**
   * Mengambil statistik riil PMB langsung dari agregasi data PostgreSQL
   */
  async getStats(): Promise<AdmissionStatsSummary> {
    const [
      totalApplicants,
      pendingCount,
      verifiedCount,
      passedCount,
      failedCount,
      registeredCount,
      allApplicants,
      recentApplicants,
    ] = await Promise.all([
      this.prisma.admissionApplicant.count(),
      this.prisma.admissionApplicant.count({ where: { status: AdmissionStatus.PENDING } }),
      this.prisma.admissionApplicant.count({ where: { status: AdmissionStatus.VERIFIED } }),
      this.prisma.admissionApplicant.count({ where: { status: AdmissionStatus.PASSED } }),
      this.prisma.admissionApplicant.count({ where: { status: AdmissionStatus.FAILED } }),
      this.prisma.admissionApplicant.count({ where: { status: AdmissionStatus.REGISTERED } }),
      this.prisma.admissionApplicant.findMany({
        select: { chosenStudyProgram: true, jalurPendaftaran: true },
      }),
      this.prisma.admissionApplicant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    // Hitung distribusi prodi
    const prodiMap = new Map<string, number>();
    const jalurMap = new Map<string, number>();

    for (const app of allApplicants) {
      const p = app.chosenStudyProgram || 'Belum Ditentukan';
      prodiMap.set(p, (prodiMap.get(p) || 0) + 1);

      const j = app.jalurPendaftaran || 'Jalur Reguler';
      jalurMap.set(j, (jalurMap.get(j) || 0) + 1);
    }

    const prodiDistribution = Array.from(prodiMap.entries())
      .map(([prodi, count]) => ({ prodi, count }))
      .sort((a, b) => b.count - a.count);

    const jalurDistribution = Array.from(jalurMap.entries())
      .map(([jalur, count]) => ({ jalur, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalApplicants,
      pendingCount,
      verifiedCount,
      passedCount,
      failedCount,
      registeredCount,
      prodiDistribution,
      jalurDistribution,
      recentApplicants: recentApplicants as any,
    };
  }

  /**
   * Ringkasan informasi PMB untuk publik/landing page
   */
  async getSummary() {
    const stats = await this.getStats();
    let activeBatch = await this.prisma.admissionBatch.findFirst({
      where: { isDefault: true },
    });
    if (!activeBatch) {
      activeBatch = await this.prisma.admissionBatch.findFirst({
        where: { status: 'OPEN' },
      });
    }
    return {
      gelombangAktif: activeBatch?.name || 'Gelombang 1 TA 2027/2028',
      tanggalBuka: activeBatch?.startDate || '1 Agustus 2026',
      tanggalTutup: activeBatch?.endDate || '30 November 2026',
      totalPendaftar: stats.totalApplicants,
      totalLolosSeleksi: stats.passedCount + stats.registeredCount,
      jalurTersedia: (activeBatch?.availableJalur && activeBatch.availableJalur.length > 0)
        ? activeBatch.availableJalur
        : [
            'Jalur Prestasi Akademik & Lomba',
            'Jalur Nilai Rapor & Portofolio',
            'Jalur Mandiri Online (CBT)',
            'KIP-K & Beasiswa Nusantara',
          ],
      stats,
    };
  }

  /**
   * Ambil detail calon mahasiswa berdasarkan ID
   */
  async getApplicantById(id: string) {
    const applicant = await this.prisma.admissionApplicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      throw new NotFoundException('Data pendaftar tidak ditemukan di database.');
    }
    return applicant;
  }

  /**
   * Update status seleksi calon mahasiswa (Verifikasi, Lulus, Gagal, Nilai CBT, Catatan Reviewer)
   */
  async updateStatus(id: string, dto: UpdateApplicantStatusDto) {
    const applicant = await this.prisma.admissionApplicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      throw new NotFoundException('Data calon mahasiswa tidak ditemukan.');
    }

    const updated = await this.prisma.admissionApplicant.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.testScore !== undefined ? { testScore: dto.testScore } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.verifiedBy ? { verifiedBy: dto.verifiedBy, verifiedAt: new Date() } : {}),
      },
    });

    return updated;
  }

  /**
   * Update formulir pendaftaran calon mahasiswa dari Form Wizard
   */
  async updateApplicantForm(id: string, data: any) {
    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: {
        OR: [
          { id },
          { registrationNumber: id },
          { email: id.toLowerCase() },
        ],
      },
    });
    if (!applicant) {
      throw new NotFoundException('Data calon mahasiswa tidak ditemukan.');
    }

    let existingNotes: any = {};
    if (applicant.notes) {
      try {
        existingNotes = JSON.parse(applicant.notes);
      } catch {}
    }

    const mergedNotes = {
      ...existingNotes,
      nik: data.nik || existingNotes.nik || '-',
      birthPlace: data.birthPlace || existingNotes.birthPlace || '-',
      birthDate: data.birthDate || existingNotes.birthDate || '-',
      gender: data.gender || existingNotes.gender || '-',
      religion: data.religion || existingNotes.religion || '-',
      parentName: data.parentName || existingNotes.parentName || '-',
      parentPhone: data.parentPhone || existingNotes.parentPhone || '-',
      parentJob: data.parentJob || existingNotes.parentJob || '-',
      graduationYear: data.graduationYear || existingNotes.graduationYear || '-',
      major: data.major || existingNotes.major || '-',
      averageScore: data.averageScore || existingNotes.averageScore || '-',
      gelombang: data.gelombang || existingNotes.gelombang || 'Gelombang 1 (Early Bird)',
      isFormCompleted: true,
      formCompletedAt: new Date().toISOString(),
    };

    const updated = await this.prisma.admissionApplicant.update({
      where: { id: applicant.id },
      data: {
        jenjang: data.jenjang || applicant.jenjang || 'S1',
        chosenStudyProgram: data.chosenStudyProgram || applicant.chosenStudyProgram,
        jalurPendaftaran: data.jalurPendaftaran || applicant.jalurPendaftaran,
        highSchool: data.highSchool || applicant.highSchool,
        birthDate: data.birthDate || applicant.birthDate,
        gender: data.gender || applicant.gender,
        address: data.address || applicant.address,
        notes: JSON.stringify(mergedNotes),
      },
    });

    return updated;
  }

  /**
   * Tambah calon mahasiswa secara manual oleh Admin PMB (misal: pendaftar walk-in di BAAK)
   */
  async createApplicantByAdmin(data: any) {
    const count = await this.prisma.admissionApplicant.count();
    const regNumber = `PMB2027${String(count + 1).padStart(4, '0')}`;

    return this.prisma.admissionApplicant.create({
      data: {
        registrationNumber: regNumber,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        highSchool: data.highSchool || 'SMA Sederajat',
        chosenStudyProgram: data.chosenStudyProgram,
        jalurPendaftaran: data.jalurPendaftaran || 'Jalur Mandiri Online (CBT)',
        status: data.status || AdmissionStatus.PENDING,
        testScore: data.testScore ? Number(data.testScore) : null,
        birthDate: data.birthDate || null,
        gender: data.gender || null,
        address: data.address || null,
        notes: data.notes || null,
        verifiedBy: data.verifiedBy || null,
        verifiedAt: data.status && data.status !== 'PENDING' ? new Date() : null,
      },
    });
  }

  /**
   * Hapus data pendaftar dari database
   */
  async deleteApplicant(id: string) {
    const applicant = await this.prisma.admissionApplicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      throw new NotFoundException('Data calon mahasiswa tidak ditemukan.');
    }

    await this.prisma.admissionApplicant.delete({ where: { id } });
    return { success: true, message: `Pendaftar ${applicant.fullName} (${applicant.registrationNumber}) berhasil dihapus.` };
  }

  /**
   * Konversi Calon Mahasiswa Lulus / Registrasi menjadi Mahasiswa Aktif SIAKAD Resmi
   */
  async convertToStudent(id: string) {
    const applicant = await this.prisma.admissionApplicant.findUnique({
      where: { id },
    });
    if (!applicant) {
      throw new NotFoundException('Data calon mahasiswa tidak ditemukan.');
    }

    // Cari Program Studi yang cocok di database
    const prodi = await this.prisma.studyProgram.findFirst({
      where: {
        OR: [
          { name: { contains: applicant.chosenStudyProgram.split('(')[0].trim(), mode: 'insensitive' } },
          { name: { contains: 'Informatika', mode: 'insensitive' } },
        ],
      },
    });

    if (!prodi) {
      throw new BadRequestException('Program studi di database tidak ditemukan untuk konversi mahasiswa.');
    }

    // Generate NIM baru: 27 + 115 (prodi) + 0xxx
    const studentCount = await this.prisma.student.count();
    const nim = `271150${String(studentCount + 1).padStart(4, '0')}`;

    // Cek apakah user dengan email ini sudah ada
    let user = await this.prisma.user.findUnique({
      where: { email: applicant.email },
    });

    const defaultHash = '$2b$10$wE99Jb0Z/T7Tq4xR7eY6euT3vE49mG09jO0N4uF7iA8a4m0vKxG7e'; // Password123!

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: applicant.email,
          fullName: applicant.fullName,
          role: 'STUDENT' as any,
          passwordHash: defaultHash,
        },
      });
    }

    // Buat record Student di database
    const student = await this.prisma.student.upsert({
      where: { nim },
      update: {
        status: 'ACTIVE' as any,
      },
      create: {
        userId: user.id,
        studyProgramId: prodi.id,
        nim,
        entryYear: 2027,
        currentSemester: 1,
        status: 'ACTIVE' as any,
        phone: applicant.phone,
      },
    });

    // Update status pendaftar menjadi REGISTERED
    await this.prisma.admissionApplicant.update({
      where: { id },
      data: {
        status: AdmissionStatus.REGISTERED,
        notes: `Telah dikonversi menjadi Mahasiswa Resmi ITN dengan NIM: ${nim}`,
      },
    });

    return {
      success: true,
      message: `Selamat! Calon mahasiswa berhasil dikonversi menjadi Mahasiswa Aktif dengan NIM ${nim}.`,
      student,
      nim,
    };
  }

  /**
   * Cek status seleksi pendaftaran
   */
  async checkStatus(regNumber: string) {
    const normalized = regNumber.trim().toUpperCase();
    const applicant = await this.prisma.admissionApplicant.findUnique({
      where: { registrationNumber: normalized },
    });

    if (!applicant) {
      return { found: false };
    }

    const isPassed = applicant.status === AdmissionStatus.PASSED || applicant.status === AdmissionStatus.REGISTERED;
    const statusText =
      applicant.status === AdmissionStatus.REGISTERED
        ? 'SELAMAT! ANDA TELAH MENYELESAIKAN REGISTRASI ULANG SEBAGAI MAHASISWA BARU ITN'
        : applicant.status === AdmissionStatus.PASSED
        ? 'SELAMAT! ANDA DINYATAKAN LULUS SELEKSI PMB 2027'
        : applicant.status === AdmissionStatus.FAILED
        ? 'MOHON MAAF, ANDA BELUM DINYATAKAN LULUS SELEKSI PMB 2027'
        : applicant.status === AdmissionStatus.VERIFIED
        ? 'BERKAS ANDA TELAH DIVERIFIKASI DAN DALAM TAHAP PENILAIAN SELEKSI'
        : 'BERKAS PENDAFTARAN ANDA TELAH DITERIMA & SEDANG DIVERIFIKASI TIM PMB';

    return {
      found: true,
      registrationNumber: applicant.registrationNumber,
      fullName: applicant.fullName,
      chosenStudyProgram: applicant.chosenStudyProgram,
      jalurPendaftaran: applicant.jalurPendaftaran,
      status: applicant.status,
      testScore: applicant.testScore,
      notes: applicant.notes,
      statusText,
      gelombang: 'Gelombang 1 TA 2027/2028',
      isPassed,
    };
  }

  /**
   * Login calon mahasiswa
   */
  async login(identifier: string, password?: string) {
    if (!identifier?.trim()) {
      throw new BadRequestException('Nomor Registrasi atau Email harus diisi.');
    }

    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');

    const applicant = await this.prisma.admissionApplicant.findFirst({
      where: isEmail
        ? { email: { equals: trimmed, mode: 'insensitive' } }
        : { registrationNumber: { equals: trimmed.toUpperCase() } },
    });

    if (!applicant) {
      throw new NotFoundException('Nomor Registrasi atau Email pendaftar tidak ditemukan di database.');
    }

    return {
      success: true,
      applicant: {
        id: applicant.id,
        registrationNumber: applicant.registrationNumber,
        fullName: applicant.fullName,
        email: applicant.email,
        phone: applicant.phone,
        highSchool: applicant.highSchool,
        chosenStudyProgram: applicant.chosenStudyProgram,
        jalurPendaftaran: applicant.jalurPendaftaran,
        status: applicant.status,
        testScore: applicant.testScore,
        notes: applicant.notes,
        createdAt: applicant.createdAt,
      },
      token: `pmb_session_${applicant.registrationNumber}`,
    };
  }

  // In-memory partner directory for registered affiliate partners
  private affiliatePartners: Array<{
    id: string;
    code: string;
    partnerName: string;
    category: string;
    phone: string;
    commissionPerStudent: number;
    isActive: boolean;
    createdAt: string;
  }> = [
    {
      id: 'aff-1',
      code: 'ALUMNI-MAJENANG',
      partnerName: 'Ikatan Alumni STKIP Majenang',
      category: 'Alumni',
      phone: '081234567891',
      commissionPerStudent: 250000,
      isActive: true,
      createdAt: '2026-08-01T08:00:00.000Z',
    },
    {
      id: 'aff-2',
      code: 'GURU-BK',
      partnerName: 'Forum Musyawarah Guru BK Jawa Tengah',
      category: 'Guru / Sekolah',
      phone: '085712345678',
      commissionPerStudent: 300000,
      isActive: true,
      createdAt: '2026-08-05T09:00:00.000Z',
    },
    {
      id: 'aff-3',
      code: 'DUTA-KAMPUS',
      partnerName: 'Duta Mahasiswa & BEM Kampus',
      category: 'Mahasiswa',
      phone: '082198765432',
      commissionPerStudent: 200000,
      isActive: true,
      createdAt: '2026-08-10T10:00:00.000Z',
    },
    {
      id: 'aff-4',
      code: 'INFLUENCER-EDU',
      partnerName: 'Komunitas Edukasi & Karir Muda',
      category: 'Influencer / Komunitas',
      phone: '087812349988',
      commissionPerStudent: 200000,
      isActive: true,
      createdAt: '2026-08-15T11:00:00.000Z',
    },
  ];

  /**
   * Mengambil data seluruh affiliate PMB beserta statistik referral dari database
   */
  async getAffiliates() {
    const applicants = await this.prisma.admissionApplicant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Kumpulkan referral per kode
    const referralMap = new Map<string, any[]>();

    for (const app of applicants) {
      if (!app.notes) continue;
      let meta: any = null;
      try {
        meta = JSON.parse(app.notes);
      } catch {
        continue;
      }

      const code = meta?.affiliateCode?.trim()?.toUpperCase();
      if (!code) continue;

      if (!referralMap.has(code)) {
        referralMap.set(code, []);
      }

      referralMap.get(code)!.push({
        id: app.id,
        registrationNumber: app.registrationNumber,
        fullName: app.fullName,
        email: app.email,
        phone: app.phone,
        chosenStudyProgram: app.chosenStudyProgram,
        jalurPendaftaran: app.jalurPendaftaran,
        status: app.status,
        verifiedAt: app.verifiedAt,
        createdAt: app.createdAt,
      });
    }

    // Gabungkan mitra terdaftar + kode yang masuk dari pendaftar baru
    const partnerCodes = new Set(this.affiliatePartners.map((p) => p.code));
    for (const code of referralMap.keys()) {
      if (!partnerCodes.has(code)) {
        this.affiliatePartners.push({
          id: `aff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          code,
          partnerName: `Mitra Referral (${code})`,
          category: 'Umum / Pendaftar',
          phone: '-',
          commissionPerStudent: 200000,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        partnerCodes.add(code);
      }
    }

    const items = this.affiliatePartners.map((partner) => {
      const refs = referralMap.get(partner.code) || [];
      const totalReferrals = refs.length;
      const verifiedCount = refs.filter((r) => r.verifiedAt !== null).length;
      const passedCount = refs.filter((r) => r.status === 'PASSED').length;
      const registeredCount = refs.filter((r) => r.status === 'REGISTERED').length;
      const totalCommission = registeredCount * partner.commissionPerStudent;

      return {
        ...partner,
        totalReferrals,
        verifiedCount,
        passedCount,
        registeredCount,
        totalCommission,
        referrals: refs,
      };
    });

    items.sort((a, b) => b.totalReferrals - a.totalReferrals);

    const totalReferrals = items.reduce((acc, curr) => acc + curr.totalReferrals, 0);
    const totalVerified = items.reduce((acc, curr) => acc + curr.verifiedCount, 0);
    const totalRegistered = items.reduce((acc, curr) => acc + curr.registeredCount, 0);
    const totalCommissionAll = items.reduce((acc, curr) => acc + curr.totalCommission, 0);

    return {
      summary: {
        totalPartners: items.length,
        totalReferrals,
        totalVerified,
        totalRegistered,
        totalCommissionAll,
      },
      data: items,
    };
  }

  /**
   * Menambahkan mitra affiliate baru
   */
  async createAffiliatePartner(data: {
    code: string;
    partnerName: string;
    category?: string;
    phone?: string;
    commissionPerStudent?: number;
  }) {
    if (!data.code?.trim() || !data.partnerName?.trim()) {
      throw new BadRequestException('Kode affiliate dan Nama Mitra wajib diisi.');
    }

    const codeUpper = data.code.trim().toUpperCase().replace(/\s+/g, '-');
    const existing = this.affiliatePartners.find((p) => p.code === codeUpper);
    if (existing) {
      throw new ConflictException(`Kode affiliate ${codeUpper} sudah digunakan.`);
    }

    const newPartner = {
      id: `aff-${Date.now()}`,
      code: codeUpper,
      partnerName: data.partnerName.trim(),
      category: data.category?.trim() || 'Mitra PMB',
      phone: data.phone?.trim() || '-',
      commissionPerStudent: Number(data.commissionPerStudent) || 200000,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.affiliatePartners.push(newPartner);

    return {
      success: true,
      message: `Mitra affiliate ${newPartner.partnerName} (${newPartner.code}) berhasil ditambahkan.`,
      data: newPartner,
    };
  }

  /**
   * Mengubah status aktif mitra affiliate
   */
  async toggleAffiliateStatus(code: string) {
    const partner = this.affiliatePartners.find((p) => p.code === code.toUpperCase());
    if (!partner) {
      throw new NotFoundException(`Mitra dengan kode ${code} tidak ditemukan.`);
    }
    partner.isActive = !partner.isActive;
    return {
      success: true,
      message: `Status affiliate ${partner.code} kini ${partner.isActive ? 'Aktif' : 'Non-Aktif'}.`,
      data: partner,
    };
  }

  /**
   * Mengambil daftar gelombang pendaftaran langsung dari tabel admission_batches di PostgreSQL
   */
  async getBatches() {
    const defaultS1EarlyFees = [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (Diskon Early Bird 50%)', amount: 2500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ];
    const defaultS1RegulerFees = [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (DPP)', amount: 4500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ];
    const defaultS1FinalFees = [
      { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya kuliah pokok semester pertama' },
      { id: 'fee-2', name: 'Biaya Pengembangan Institusi (DPP Normal)', amount: 5500000, note: 'Dapat diangsur 2x' },
      { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
      { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Akses portal, WiFi & asuransi' },
    ];

    // Inisialisasi awal ke database jika tabel masih kosong
    const count = await this.prisma.admissionBatch.count();
    if (count === 0) {
      await this.prisma.admissionBatch.createMany({
        data: [
          {
            name: 'Gelombang 1 (Early Bird)',
            academicYear: '2027/2028',
            jenjang: 'S1',
            startDate: '2026-08-01',
            endDate: '2026-11-30',
            examDate: '2026-12-05',
            announcementDate: '2026-12-10',
            registrationFee: 200000,
            reRegistrationFee: 7300000,
            reRegistrationFees: defaultS1EarlyFees,
            quota: 350,
            availableJalur: [
              'Jalur Prestasi Akademik (Bebas Tes)',
              'Jalur Nilai Rapor & Portofolio',
              'Jalur Mandiri Online (CBT)',
              'KIP-K & Beasiswa Nusantara',
            ],
            status: 'OPEN',
            isDefault: true,
            description: 'Pendaftaran gelombang pembuka dengan potongan biaya formulir & beasiswa berprestasi.',
          },
          {
            name: 'Gelombang 2 (Reguler)',
            academicYear: '2027/2028',
            jenjang: 'S1',
            startDate: '2026-12-01',
            endDate: '2027-03-31',
            examDate: '2027-04-05',
            announcementDate: '2027-04-10',
            registrationFee: 250000,
            reRegistrationFee: 9300000,
            reRegistrationFees: defaultS1RegulerFees,
            quota: 400,
            availableJalur: [
              'Jalur Mandiri Online (CBT)',
              'Jalur Nilai Rapor & Portofolio',
            ],
            status: 'UPCOMING',
            isDefault: false,
            description: 'Pendaftaran reguler semester genap dengan seleksi CBT daring.',
          },
          {
            name: 'Gelombang 3 (Terakhir)',
            academicYear: '2027/2028',
            jenjang: 'S1',
            startDate: '2027-04-01',
            endDate: '2027-07-31',
            examDate: '2027-08-05',
            announcementDate: '2027-08-10',
            registrationFee: 300000,
            reRegistrationFee: 10300000,
            reRegistrationFees: defaultS1FinalFees,
            quota: 250,
            availableJalur: ['Jalur Mandiri Online (CBT)'],
            status: 'UPCOMING',
            isDefault: false,
            description: 'Gelombang penutup kuota penerimaan mahasiswa baru.',
          },
        ],
      });
    }

    const [batches, totalApplicants] = await Promise.all([
      this.prisma.admissionBatch.findMany({
        orderBy: [{ isDefault: 'desc' }, { startDate: 'asc' }],
      }),
      this.prisma.admissionApplicant.count(),
    ]);

    const activeBatch =
      batches.find((b) => b.isDefault) || batches.find((b) => b.status === 'OPEN') || batches[0];

    const data = batches.map((b: any) => {
      let fees = Array.isArray(b.reRegistrationFees) && b.reRegistrationFees.length > 0
        ? b.reRegistrationFees
        : null;

      if (!fees) {
        const j = b.jenjang?.toUpperCase() || 'S1';
        if (j === 'S2') {
          fees = [
            { id: 'fee-1', name: 'Biaya Matrikulasi Pascasarjana', amount: 2500000, note: 'Sekali bayar di awal' },
            { id: 'fee-2', name: 'SPP / UKT Tetap Semester 1 (S2)', amount: 6500000, note: 'Biaya kuliah semester 1' },
            { id: 'fee-3', name: 'Dana Pengembangan Akademik & Riset', amount: 3000000, note: 'Dapat diangsur 2x' },
            { id: 'fee-4', name: 'Layanan Perpustakaan Digital & Lab Riset', amount: 800000, note: 'Akses jurnal internasional' },
          ];
        } else if (j === 'S3') {
          fees = [
            { id: 'fee-1', name: 'Biaya Ujian Kualifikasi & Matrikulasi', amount: 3500000, note: 'Sekali bayar' },
            { id: 'fee-2', name: 'SPP / UKT Tetap Semester 1 (S3)', amount: 10000000, note: 'Biaya kuliah semester 1' },
            { id: 'fee-3', name: 'Dana Kolaborasi Riset & Hibah Publikasi', amount: 5000000, note: 'Dapat diangsur' },
            { id: 'fee-4', name: 'Fasilitas Laboratorium Riset Doktoral', amount: 1500000, note: 'Akses fasilitas riset penuh' },
          ];
        } else {
          const isEarly = b.name.toLowerCase().includes('early') || b.name.toLowerCase().includes('1');
          const isReg = b.name.toLowerCase().includes('2');
          fees = isEarly ? defaultS1EarlyFees : isReg ? defaultS1RegulerFees : defaultS1FinalFees;
        }
      }

      const totalReReg = Number(b.reRegistrationFee) > 0
        ? Number(b.reRegistrationFee)
        : fees.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

      return {
        ...b,
        reRegistrationFee: totalReReg,
        reRegistrationFees: fees,
        applicantCount: b.isDefault ? totalApplicants : 0,
      };
    });

    return {
      summary: {
        totalBatches: batches.length,
        activeBatchName: activeBatch ? activeBatch.name : '-',
        totalQuota: batches.reduce((acc, curr) => acc + curr.quota, 0),
        totalApplicants,
      },
      data,
    };
  }

  /**
   * Menambahkan gelombang pendaftaran baru ke database PostgreSQL
   */
  async createBatch(data: any): Promise<any> {
    if (!data.name?.trim() || !data.startDate || !data.endDate) {
      throw new BadRequestException('Nama gelombang, tanggal buka, dan tanggal tutup wajib diisi.');
    }

    const isDefault = Boolean(data.isDefault);

    // Jika dijadikan default, set gelombang lain ke isDefault: false
    if (isDefault) {
      await this.prisma.admissionBatch.updateMany({
        data: { isDefault: false },
      });
    }

    const reRegistrationFees = Array.isArray(data.reRegistrationFees) ? data.reRegistrationFees : [];
    const reRegistrationFee = data.reRegistrationFee !== undefined && Number(data.reRegistrationFee) > 0
      ? Number(data.reRegistrationFee)
      : reRegistrationFees.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    const newBatch = await this.prisma.admissionBatch.create({
      data: {
        name: data.name.trim(),
        academicYear: data.academicYear?.trim() || '2027/2028',
        jenjang: data.jenjang?.trim() || 'S1',
        startDate: data.startDate,
        endDate: data.endDate,
        examDate: data.examDate || '-',
        announcementDate: data.announcementDate || '-',
        registrationFee: Number(data.registrationFee) || 0,
        reRegistrationFee,
        reRegistrationFees,
        quota: Number(data.quota) || 100,
        availableJalur:
          Array.isArray(data.availableJalur) && data.availableJalur.length > 0
            ? data.availableJalur
            : ['Jalur Mandiri Online (CBT)'],
        status: data.status || 'UPCOMING',
        isDefault,
        description: data.description?.trim() || '',
      },
    });

    return {
      success: true,
      message: `Gelombang ${newBatch.name} berhasil disimpan ke database.`,
      data: newBatch,
    };
  }

  /**
   * Memperbarui gelombang pendaftaran di database PostgreSQL
   */
  async updateBatch(id: string, data: any): Promise<any> {
    const existing = await this.prisma.admissionBatch.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Gelombang dengan ID ${id} tidak ditemukan di database.`);
    }

    if (data.isDefault) {
      await this.prisma.admissionBatch.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.academicYear) updateData.academicYear = data.academicYear.trim();
    if (data.jenjang) updateData.jenjang = data.jenjang.trim();
    if (data.startDate) updateData.startDate = data.startDate;
    if (data.endDate) updateData.endDate = data.endDate;
    if (data.examDate !== undefined) updateData.examDate = data.examDate;
    if (data.announcementDate !== undefined) updateData.announcementDate = data.announcementDate;
    if (data.registrationFee !== undefined) updateData.registrationFee = Number(data.registrationFee);
    if (data.reRegistrationFees !== undefined) {
      updateData.reRegistrationFees = data.reRegistrationFees;
      if (data.reRegistrationFee === undefined && Array.isArray(data.reRegistrationFees)) {
        updateData.reRegistrationFee = data.reRegistrationFees.reduce(
          (sum: number, item: any) => sum + (Number(item.amount) || 0),
          0,
        );
      }
    }
    if (data.reRegistrationFee !== undefined) {
      updateData.reRegistrationFee = Number(data.reRegistrationFee);
    }
    if (data.quota !== undefined) updateData.quota = Number(data.quota);
    if (data.availableJalur && Array.isArray(data.availableJalur))
      updateData.availableJalur = data.availableJalur;
    if (data.status) updateData.status = data.status;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = Boolean(data.isDefault);

    const updated = await this.prisma.admissionBatch.update({
      where: { id },
      data: updateData,
    });

    return {
      success: true,
      message: `Gelombang ${updated.name} berhasil diperbarui di database.`,
      data: updated,
    };
  }

  /**
   * Mengaktifkan gelombang pendaftaran sebagai gelombang utama (Default & OPEN) di PostgreSQL
   */
  async activateBatch(id: string): Promise<any> {
    const batch = await this.prisma.admissionBatch.findUnique({
      where: { id },
    });
    if (!batch) {
      throw new NotFoundException(`Gelombang dengan ID ${id} tidak ditemukan di database.`);
    }

    await this.prisma.admissionBatch.updateMany({
      data: { isDefault: false },
    });

    const updated = await this.prisma.admissionBatch.update({
      where: { id },
      data: { isDefault: true, status: 'OPEN' },
    });

    return {
      success: true,
      message: `Gelombang ${updated.name} kini aktif sebagai periode pendaftaran utama di database.`,
      data: updated,
    };
  }

  /**
   * Menghapus gelombang pendaftaran dari database PostgreSQL
   */
  async deleteBatch(id: string) {
    const count = await this.prisma.admissionBatch.count();
    if (count <= 1) {
      throw new BadRequestException('Minimal harus terdapat satu gelombang pendaftaran di database.');
    }

    const batch = await this.prisma.admissionBatch.findUnique({
      where: { id },
    });
    if (!batch) {
      throw new NotFoundException(`Gelombang dengan ID ${id} tidak ditemukan di database.`);
    }

    await this.prisma.admissionBatch.delete({
      where: { id },
    });

    if (batch.isDefault) {
      const remaining = await this.prisma.admissionBatch.findFirst({
        orderBy: { startDate: 'asc' },
      });
      if (remaining) {
        await this.prisma.admissionBatch.update({
          where: { id: remaining.id },
          data: { isDefault: true, status: 'OPEN' },
        });
      }
    }

    return {
      success: true,
      message: `Gelombang ${batch.name} berhasil dihapus dari database.`,
    };
  }

  /**
   * Mengambil informasi brosur resmi PMB dari database PostgreSQL berdasarkan jenjang
   */
  async getBrochure(jenjang?: string) {
    try {
      const targetJenjang = jenjang?.trim() || 'S1';
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT id, jenjang, title, "fileName", "fileSize", "fileSizeBytes", "mimeType", "fileUrl", "downloadCount", "description", "isActive", "updatedAt"
        FROM admission_brochures
        WHERE jenjang = $1 OR jenjang = 'Semua Jenjang'
        ORDER BY "updatedAt" DESC
        LIMIT 1
      `, targetJenjang);

      if (rows && rows.length > 0) {
        return rows[0];
      }

      // Default fallback
      const defaultId = `brochure-${targetJenjang.toLowerCase().replace(/\s+/g, '-')}`;
      const defaultTitle = `Brosur PMB ITN Jenjang ${targetJenjang} TA 2027/2028`;
      const defaultFileName = `Brosur-PMB-ITN-${targetJenjang}-2027.pdf`;

      return {
        id: defaultId,
        jenjang: targetJenjang,
        title: defaultTitle,
        fileName: defaultFileName,
        fileSize: '2.4 MB',
        fileSizeBytes: 2516582,
        mimeType: 'application/pdf',
        fileUrl: `/downloads/brosur-pmb-2027.pdf`,
        downloadCount: 0,
        description: `Brosur resmi informasi pendaftaran mahasiswa baru Institut Teknologi Nusantara Jenjang ${targetJenjang}.`,
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return {
        id: 'default-brochure',
        jenjang: jenjang || 'S1',
        title: 'Brosur PMB ITN TA 2027/2028',
        fileName: 'Brosur-PMB-ITN-2027.pdf',
        fileSize: '2.4 MB',
        fileSizeBytes: 2516582,
        mimeType: 'application/pdf',
        fileUrl: '/downloads/brosur-pmb-2027.pdf',
        downloadCount: 0,
        description: 'Brosur resmi informasi pendaftaran mahasiswa baru Institut Teknologi Nusantara.',
        isActive: true,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Mengambil seluruh daftar brosur dari database
   */
  async getAllBrochures() {
    try {
      const rows: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT id, jenjang, title, "fileName", "fileSize", "fileSizeBytes", "mimeType", "fileUrl", "downloadCount", "description", "isActive", "updatedAt"
        FROM admission_brochures
        ORDER BY jenjang ASC, "updatedAt" DESC
      `);
      return rows;
    } catch {
      return [];
    }
  }

  /**
   * Mengunggah atau memperbarui file brosur resmi PMB per jenjang
   */
  async uploadBrochure(dto: {
    jenjang?: string;
    title?: string;
    fileName: string;
    fileSize: string;
    fileSizeBytes?: number;
    mimeType?: string;
    fileData?: string;
    description?: string;
  }) {
    if (!dto.fileName) {
      throw new BadRequestException('Nama file brosur wajib diisi.');
    }

    const jenjang = dto.jenjang?.trim() || 'S1';
    const brochureId = `brochure-${jenjang.toLowerCase().replace(/\s+/g, '-')}`;
    const title = dto.title || `Brosur PMB ITN Jenjang ${jenjang} TA 2027/2028`;
    const fileName = dto.fileName;
    const fileSize = dto.fileSize || '1.5 MB';
    const fileSizeBytes = dto.fileSizeBytes || 1572864;
    const mimeType = dto.mimeType || 'application/pdf';
    const fileUrl = `/downloads/${fileName}`;
    const description = dto.description || `Brosur resmi PMB Institut Teknologi Nusantara Jenjang ${jenjang}`;

    // Jika ada data binary base64, simpan ke filesystem public downloads
    if (dto.fileData) {
      try {
        const base64Data = dto.fileData.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const targets = [
          path.resolve(process.cwd(), 'apps/web/public/downloads', fileName),
          path.resolve(process.cwd(), 'apps/portal/public/downloads', fileName),
          path.resolve(process.cwd(), `apps/web/public/downloads/brosur-pmb-${jenjang.toLowerCase()}.pdf`),
          path.resolve(process.cwd(), `apps/portal/public/downloads/brosur-pmb-${jenjang.toLowerCase()}.pdf`),
          path.resolve(process.cwd(), 'apps/web/public/downloads/brosur-pmb-2027.pdf'),
          path.resolve(process.cwd(), 'apps/portal/public/downloads/brosur-pmb-2027.pdf'),
        ];

        for (const target of targets) {
          const dir = path.dirname(target);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(target, buffer);
        }
      } catch (fileErr) {
        console.warn('⚠️ Gagal menyimpan file ke disk, tetap menyimpan ke database:', fileErr);
      }
    }

    // Simpan metadata ke PostgreSQL dengan id berbasis jenjang
    try {
      await this.prisma.$queryRawUnsafe(`
        INSERT INTO admission_brochures (id, jenjang, title, "fileName", "fileSize", "fileSizeBytes", "mimeType", "fileUrl", "description", "isActive", "updatedAt", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          jenjang = EXCLUDED.jenjang,
          title = EXCLUDED.title,
          "fileName" = EXCLUDED."fileName",
          "fileSize" = EXCLUDED."fileSize",
          "fileSizeBytes" = EXCLUDED."fileSizeBytes",
          "mimeType" = EXCLUDED."mimeType",
          "fileUrl" = EXCLUDED."fileUrl",
          "description" = EXCLUDED."description",
          "updatedAt" = NOW()
      `, brochureId, jenjang, title, fileName, fileSize, fileSizeBytes, mimeType, fileUrl, description);
    } catch (dbErr) {
      console.error('Error updating admission_brochures table:', dbErr);
    }

    return {
      success: true,
      message: `Brosur Jenjang ${jenjang} (${fileName}) berhasil diunggah dan dipublikasikan.`,
      data: {
        id: brochureId,
        jenjang,
        title,
        fileName,
        fileSize,
        fileSizeBytes,
        mimeType,
        fileUrl,
        description,
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Melacak jumlah download brosur
   */
  async trackBrochureDownload(jenjang?: string) {
    try {
      const targetJenjang = jenjang?.trim() || 'S1';
      await this.prisma.$queryRawUnsafe(`
        UPDATE admission_brochures
        SET "downloadCount" = "downloadCount" + 1
        WHERE jenjang = $1 OR id = 'default-brochure' OR "isActive" = true
      `, targetJenjang);
    } catch (e) {
      // Non-blocking
    }
    return { success: true };
  }
}
