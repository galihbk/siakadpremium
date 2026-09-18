// ==============================================================================
// Domain Constants & Role Types (Node 24 Strip-Safe & Type-Safe)
// ==============================================================================

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_BAAK: 'ADMIN_BAAK',
  ADMIN_PMB: 'ADMIN_PMB',
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

// ==============================================================================
// PMB (Admission) Types
// ==============================================================================

export interface PmbAccountItem {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionBatchItem {
  id: string;
  name: string;
  academicYear: string;
  jenjang: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  quota?: number | null;
  description?: string | null;
  registrationFee?: number | null;
  reRegistrationFee?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PmbFeeConfigItem {
  id: string;
  jenjang: string;
  registrationFee: number;
  reRegistrationFee: number;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionRegistrationTypeItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  badge?: string | null;
  isKip: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionTrackItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionClassItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdmissionPaymentItem {
  id: string;
  applicationId: string;
  type: 'REGISTRATION' | 'RE_REGISTRATION';
  amount: number;
  status: 'PENDING' | 'VERIFYING' | 'PAID';
  paymentMethod?: string | null;
  proofUrl?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionApplicationItem {
  id: string;
  accountId: string;
  waveId?: string | null;
  registrationTypeId?: string | null;
  trackId?: string | null;
  classId?: string | null;
  studyProgramId?: string | null;
  isKip: boolean;
  registrationNumber?: string | null;
  formStatus: 'DRAFT' | 'SUBMITTED';
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verificationNote?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  selectionStatus: 'PENDING_SELECTION' | 'PASSED' | 'FAILED' | 'RESERVE';
  testScore?: number | null;
  selectionNotes?: string | null;
  selectionDate?: string | null;
  nik?: string | null;
  fullName: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  religion?: string | null;
  phone: string;
  email: string;
  address?: string | null;
  schoolName?: string | null;
  npsn?: string | null;
  graduationYear?: string | null;
  major?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentJob?: string | null;
  parentIncome?: string | null;
  fileKtp?: string | null;
  fileKk?: string | null;
  fileIjazah?: string | null;
  fileFoto?: string | null;
  fileTambahan?: string | null;
  studentId?: string | null;
  nim?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: PmbAccountItem;
  wave?: AdmissionBatchItem;
  registrationType?: AdmissionRegistrationTypeItem;
  track?: AdmissionTrackItem;
  admissionClass?: AdmissionClassItem;
  studyProgram?: {
    id: string;
    code: string;
    name: string;
    degreeLevel: string;
    faculty?: { name: string };
  };
  payments?: AdmissionPaymentItem[];
}

export interface AdmissionStatsSummary {
  totalApplicants: number;
  pendingCount: number;
  verifiedCount: number;
  registeredCount: number;
  unpaidRegistrationCount?: number;
  paidRegistrationCount?: number;
  unverifiedDocsCount?: number;
  verifiedDocsCount?: number;
  pendingSelectionCount?: number;
  passedCount: number;
  failedCount: number;
  pendingReRegistrationCount?: number;
  paidReRegistrationCount?: number;
  registeredStudentsCount?: number;
  prodiDistribution: { prodi: string; count: number }[];
  jalurDistribution: { jalur: string; count: number }[];
  recentApplicants?: any[];
}

// Backward compatibility item
export interface AdmissionApplicantItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  highSchool: string;
  chosenStudyProgram: string;
  jalurPendaftaran: string;
  status: AdmissionStatus;
  testScore?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  notes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// Fee Rules Engine & Finance Types
// ==============================================================================

export type FeeActionType = 'NORMAL' | 'BEBAS' | 'DISKON_PERSENTASE' | 'DISKON_NOMINAL' | 'TARIF_KHUSUS';

export interface FeeComponentItem {
  id: string;
  code: string;
  name: string;
  defaultAmount: number;
  category: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeeRuleItemDetail {
  id: string;
  feeRuleId: string;
  feeComponentId: string;
  actionType: FeeActionType;
  amountValue?: number | null;
  notes?: string | null;
  feeComponent?: FeeComponentItem;
}

export interface FeeRuleItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priority: number;
  academicYear?: string | null;
  isActive: boolean;
  registrationTypeId?: string | null;
  trackId?: string | null;
  classId?: string | null;
  studyProgramId?: string | null;
  waveId?: string | null;
  registrationType?: AdmissionRegistrationTypeItem | null;
  track?: AdmissionTrackItem | null;
  admissionClass?: AdmissionClassItem | null;
  studyProgram?: { id: string; name: string; code: string } | null;
  wave?: AdmissionBatchItem | null;
  ruleItems: FeeRuleItemDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentFeeAssignmentItem {
  id: string;
  studentId: string;
  feeRuleId?: string | null;
  academicYear: string;
  schemeName: string;
  snapshotData: any;
  notes?: string | null;
  assignedAt: string;
  assignedBy?: string | null;
  student?: {
    id: string;
    nim: string;
    user?: { fullName: string };
    studyProgram?: { name: string };
    registrationType?: { code: string; name: string } | null;
    track?: { code: string; name: string } | null;
    admissionClass?: { code: string; name: string } | null;
  };
  feeRule?: FeeRuleItem | null;
}

export interface PaymentInvoiceItemDetail {
  id: string;
  invoiceId: string;
  feeComponentId?: string | null;
  componentName: string;
  baseAmount: number;
  actionType: FeeActionType;
  actionValue?: number | null;
  discountAmount: number;
  finalAmount: number;
}


