import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';

/** Kode galat dari kontrak API SIAKAD standar NextVersa. */
export type ContractErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'ROLE_NOT_SUPPORTED'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED';

const STATUS: Record<ContractErrorCode, number> = {
  VALIDATION_ERROR: 422,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_DISABLED: 403,
  ROLE_NOT_SUPPORTED: 403,
  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 401,
};

export class ContractError extends Error {
  readonly status: number;
  constructor(
    readonly code: ContractErrorCode,
    message: string,
    readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.status = STATUS[code];
  }
}

const STUDENT_STATUS = {
  ACTIVE: 'active',
  LEAVE: 'leave',
  GRADUATED: 'graduated',
  DROPOUT: 'dropped_out',
  // Pindah kampus: tidak lagi mahasiswa di sini, sama seperti keluar.
  TRANSFERRED: 'dropped_out',
} as const;

const TOKEN_SECONDS = 8 * 60 * 60; // token kontrak berlaku 8 jam
const TOKEN_KIND = 'siakad-contract';
const REFRESH_KIND = 'siakad-contract-refresh';
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

// Hash palsu supaya waktu respons sama baik akunnya ada maupun tidak.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Yb1Z6YyQ0e1R5mXr8b7Q0b1cC6ya';

/**
 * Kontrak API SIAKAD standar NextVersa (login + profil mahasiswa, hanya-baca) untuk aplikasi mobile.
 * Hanya akun mahasiswa yang boleh masuk. Token-nya berbeda dari token portal dan hanya berlaku di endpoint kontrak.
 */
@Injectable()
export class SiakadContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: unknown, password: unknown) {
    const details: { field: string; message: string }[] = [];
    if (typeof username !== 'string' || !username.trim() || username.length > 100) details.push({ field: 'username', message: 'Wajib diisi.' });
    if (typeof password !== 'string' || !password || password.length > 200) details.push({ field: 'password', message: 'Wajib diisi.' });
    if (details.length > 0) throw new ContractError('VALIDATION_ERROR', 'Data yang dikirim tidak valid.', details);

    const identifier = (username as string).trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: { equals: identifier, mode: 'insensitive' } }, { student: { nim: identifier } }] },
      include: { student: true },
    });

    const matches = await bcrypt.compare(password as string, user?.passwordHash ?? DUMMY_HASH).catch(() => false);
    if (!user || !matches) throw new ContractError('INVALID_CREDENTIALS', 'NIM/email atau kata sandi salah.');
    if (!user.isActive) throw new ContractError('ACCOUNT_DISABLED', 'Akun dinonaktifkan.');
    if (user.role !== 'STUDENT' || !user.student) throw new ContractError('ROLE_NOT_SUPPORTED', 'Aplikasi ini hanya untuk mahasiswa.');

    return this.session(user, user.student.nim, user.student.id);
  }

  /**
   * Sesi baru dari refresh token, tanpa kata sandi. Refresh token ikut diperbarui (berlaku 30 hari sejak
   * dipakai terakhir) dan mati sendiri bila kata sandi diganti atau akun dinonaktifkan.
   */
  async refresh(refreshToken: unknown) {
    if (typeof refreshToken !== 'string' || !refreshToken || refreshToken.length > 2000) {
      throw new ContractError('VALIDATION_ERROR', 'Data yang dikirim tidak valid.', [{ field: 'refreshToken', message: 'Wajib diisi.' }]);
    }
    let payload: { sub: string; kind?: string; pwv?: string };
    try {
      payload = this.jwt.verify(refreshToken);
    } catch {
      throw new ContractError('UNAUTHORIZED', 'Refresh token tidak valid atau kedaluwarsa.');
    }
    if (payload.kind !== REFRESH_KIND) throw new ContractError('UNAUTHORIZED', 'Refresh token tidak valid atau kedaluwarsa.');

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { student: true } });
    if (!user || !user.student || user.role !== 'STUDENT' || payload.pwv !== this.fingerprint(user.passwordHash)) {
      throw new ContractError('UNAUTHORIZED', 'Refresh token tidak valid atau kedaluwarsa.');
    }
    if (!user.isActive) throw new ContractError('ACCOUNT_DISABLED', 'Akun dinonaktifkan.');
    return this.session(user, user.student.nim, user.student.id);
  }

  private session(user: { id: string; fullName: string; passwordHash: string }, nim: string, studentId: string) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, kind: TOKEN_KIND }, { expiresIn: TOKEN_SECONDS }),
      refreshToken: this.jwt.sign({ sub: user.id, kind: REFRESH_KIND, pwv: this.fingerprint(user.passwordHash) }, { expiresIn: REFRESH_SECONDS }),
      tokenType: 'Bearer',
      expiresIn: TOKEN_SECONDS,
      user: { id: studentId, name: user.fullName, username: nim, role: 'student' },
    };
  }

  /** Sidik kata sandi saat ini: berubah begitu kata sandi diganti, sehingga refresh token lama gugur. */
  private fingerprint(passwordHash: string): string {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
  }

  async profile(authorization: string | undefined) {
    const userId = this.userIdFrom(authorization);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { student: { include: { studyProgram: { include: { faculty: true } }, advisorLecturer: { include: { user: true } } } } },
    });
    if (!user || !user.student) throw new ContractError('UNAUTHORIZED', 'Token tidak valid.');
    if (!user.isActive) throw new ContractError('ACCOUNT_DISABLED', 'Akun dinonaktifkan.');

    const s = user.student;
    return {
      id: s.id,
      nim: s.nim,
      name: user.fullName,
      email: user.email,
      phone: s.phone ?? null,
      gender: s.gender === 'FEMALE' ? 'female' : 'male',
      birthPlace: s.birthPlace ?? null,
      birthDate: s.birthDate ? s.birthDate.toISOString().slice(0, 10) : null,
      photoUrl: null,
      studyProgram: { code: s.studyProgram.code, name: s.studyProgram.name },
      faculty: s.studyProgram.faculty ? { code: s.studyProgram.faculty.code, name: s.studyProgram.faculty.name } : null,
      entryYear: s.entryYear,
      currentSemester: s.currentSemester,
      status: STUDENT_STATUS[s.status],
      academicAdvisor: s.advisorLecturer ? { id: s.advisorLecturer.id, name: s.advisorLecturer.user.fullName } : null,
    };
  }

  /**
   * Seluruh profil mahasiswa yang tersimpan di SIAKAD, untuk halaman Profil di aplikasi. Ekstensi di luar kontrak
   * standar (profil standar tetap /student/profile): Gateway tidak pernah memanggilnya, hanya aplikasi, langsung.
   * Hanya data milik mahasiswa yang sedang login.
   */
  async profileDetail(authorization: string | undefined) {
    const base = await this.profile(authorization);
    const user = await this.prisma.user.findUnique({
      where: { id: this.userIdFrom(authorization) },
      include: { student: { include: { studyProgram: true } } },
    });
    const s = user!.student!;
    const date = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);
    return {
      ...base,
      identity: { nik: s.nik ?? null, nisn: s.nisn ?? null, noKk: s.noKk ?? null, religion: s.religion ?? null },
      address: {
        address: s.address ?? null,
        street: s.streetAddress ?? null,
        rtRw: s.rtRw ?? null,
        hamlet: s.dusun ?? null,
        village: s.kelurahan ?? null,
        district: s.kecamatan ?? null,
        city: s.city ?? null,
        province: s.province ?? null,
        postalCode: s.postalCode ?? null,
      },
      academic: {
        degreeLevel: s.studyProgram.degreeLevel ?? null,
        degreeTitle: s.studyProgram.degreeTitle ?? null,
        accreditation: s.studyProgram.accreditation ?? null,
        registeredAt: date(s.createdAt),
      },
      previousSchool: { name: s.schoolName ?? null, npsn: s.npsn ?? null, graduationYear: s.graduationYear ?? null, major: s.major ?? null },
      transferFrom: {
        institution: s.originInstitution ?? null,
        studyProgram: s.originStudyProgram ?? null,
        nim: s.originNim ?? null,
        recognizedCredits: s.originCredits ?? null,
      },
      parents: {
        father: { name: s.fatherName ?? null, phone: s.fatherPhone ?? null, job: s.fatherJob ?? null },
        mother: { name: s.motherName ?? null, phone: s.motherPhone ?? null, job: s.motherJob ?? null },
        guardian: { name: s.guardianName ?? null, phone: s.guardianPhone ?? null, job: s.guardianJob ?? null },
      },
    };
  }

  private userIdFrom(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) throw new ContractError('UNAUTHORIZED', 'Token tidak ditemukan.');
    let payload: { sub: string; kind?: string };
    try {
      payload = this.jwt.verify<{ sub: string; kind?: string }>(authorization.slice(7));
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') throw new ContractError('TOKEN_EXPIRED', 'Token kedaluwarsa.');
      throw new ContractError('UNAUTHORIZED', 'Token tidak valid.');
    }
    // Token portal (login biasa) tidak boleh dipakai di sini.
    if (payload.kind !== TOKEN_KIND) throw new ContractError('UNAUTHORIZED', 'Token tidak valid.');
    return payload.sub;
  }
}
