// ==============================================================================
// Domain Constants & Role Types (Node 24 Strip-Safe & Type-Safe)
// ==============================================================================

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_BAAK: 'ADMIN_BAAK',
  ADMIN_KEUANGAN: 'ADMIN_KEUANGAN',
  ADMIN_LP3M: 'ADMIN_LP3M',
  LP3M: 'LP3M',
  LECTURER: 'LECTURER',
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const StudentStatus = {
  ACTIVE: 'ACTIVE',
  LEAVE: 'LEAVE',
  GRADUATED: 'GRADUATED',
  DROPOUT: 'DROPOUT',
  TRANSFERRED: 'TRANSFERRED',
} as const;
export type StudentStatus = (typeof StudentStatus)[keyof typeof StudentStatus];

export const SemesterType = {
  ODD: 'ODD',
  EVEN: 'EVEN',
  SHORT: 'SHORT',
} as const;
export type SemesterType = (typeof SemesterType)[keyof typeof SemesterType];

export const EnrollmentStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus];

export const GradeLetter = {
  A: 'A',
  A_MINUS: 'A-',
  B_PLUS: 'B+',
  B: 'B',
  B_MINUS: 'B-',
  C_PLUS: 'C+',
  C: 'C',
  D: 'D',
  E: 'E',
} as const;
export type GradeLetter = (typeof GradeLetter)[keyof typeof GradeLetter];

export const DegreeLevel = {
  D3: 'D3',
  D4: 'D4',
  S1: 'S1',
  S2: 'S2',
  S3: 'S3',
  PROFESI: 'PROFESI',
} as const;
export type DegreeLevel = (typeof DegreeLevel)[keyof typeof DegreeLevel];

export const AdmissionStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  REGISTERED: 'REGISTERED',
} as const;
export type AdmissionStatus = (typeof AdmissionStatus)[keyof typeof AdmissionStatus];

// ==============================================================================
// Standardized API Response & Pagination
// ==============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

// ==============================================================================
// User & Auth Types
// ==============================================================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  studentId?: string | null;
  lecturerId?: string | null;
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  studentId?: string | null;
  lecturerId?: string | null;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

// ==============================================================================
// Academic Dashboard Metrics
// ==============================================================================

export interface StudentDashboardSummary {
  nim: string;
  nama: string;
  programStudi: string;
  fakultas: string;
  semesterAktif: number;
  ipk: number;
  ipsTerakhir: number;
  totalSksLulus: number;
  dosenPembimbingAkademik: string;
  statusKrs: EnrollmentStatus;
  tagihanSppStatus: 'PAID' | 'UNPAID' | 'PENDING';
}

export interface LecturerDashboardSummary {
  nidn: string;
  nama: string;
  jabatanFungsional: string;
  fakultas: string;
  totalKelasMengajar: number;
  totalMahasiswaBimbingan: number;
  statusInputNilai: 'SELESAI' | 'PROSES' | 'BELUM';
}

export interface AdminDashboardSummary {
  totalMahasiswaAktif: number;
  totalDosen: number;
  totalProgramStudi: number;
  totalFakultas: number;
  persentaseRegistrasiKRS: number;
  mahasiswaBaruTerdaftar: number;
}
