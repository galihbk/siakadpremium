import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

// ==========================================
// Tipe data & label alur Tugas Akhir / Skripsi
// ==========================================

export type ThesisStage =
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_REJECTED'
  | 'PROPOSAL_GUIDANCE'
  | 'PROPOSAL_APPROVED'
  | 'SEMPRO_REGISTERED'
  | 'SEMPRO_SCHEDULED'
  | 'SKRIPSI_GUIDANCE'
  | 'SKRIPSI_APPROVED'
  | 'UJIAN_REGISTERED'
  | 'UJIAN_SCHEDULED'
  | 'COMPLETED';

export interface ThesisSettings {
  minGuidanceProposal: number;
  minGuidanceSkripsi: number;
  chapters: string[];
  gradeStatus?: 'FINAL' | 'DRAFT';
}

export const DEFAULT_THESIS_SETTINGS: ThesisSettings = {
  minGuidanceProposal: 1,
  minGuidanceSkripsi: 1,
  chapters: ['Bab I', 'Bab II', 'Bab III', 'Bab IV', 'Bab V'],
  gradeStatus: 'FINAL',
};

/** Catatan bimbingan yang dihitung untuk syarat ACC (dicatat dosen, atau catatan lama yang sudah ditanggapi). */
export const guidanceCounts = (g: { status: string }) => g.status === 'RECORDED' || g.status === 'REVIEWED';

export interface ThesisLecturerRef {
  id: string;
  name: string | null;
  nidn: string | null;
}

export interface ThesisGuidance {
  id: string;
  phase: 'PROPOSAL' | 'SKRIPSI';
  lecturerId: string | null;
  lecturerName: string | null;
  chapter?: string | null;
  topic: string;
  notes: string | null;
  fileUrl: string | null;
  meetingDate: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'RECORDED';
  feedback: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ThesisDefenseExaminer {
  lecturerId: string;
  role: 'KETUA' | 'PENGUJI';
  name: string | null;
}

export interface ThesisDefense {
  id: string;
  type: 'SEMPRO' | 'UJIAN';
  status: 'REGISTERED' | 'SCHEDULED' | 'DONE';
  fileUrl: string | null;
  registeredAt: string;
  scheduledAt: string | null;
  location: string | null;
  result: 'LULUS' | 'REVISI' | 'TIDAK_LULUS' | null;
  score: number | null;
  gradeLetter: string | null;
  gradeSyncedAt?: string | null;
  gradeSyncNote?: string | null;
  notes: string | null;
  examiners: ThesisDefenseExaminer[];
}

export interface ThesisProject {
  id: string;
  title: string;
  abstract: string | null;
  proposalFileUrl: string | null;
  stage: ThesisStage;
  adminNote: string | null;
  finalScore: number | null;
  finalGrade: string | null;
  completedAt: string | null;
  submittedAt: string;
  supervisorAssignedAt: string | null;
  student?: { id: string; nim: string; name: string; email: string; studyProgram: string; entryYear: number };
  supervisor1: ThesisLecturerRef | null;
  supervisor2: ThesisLecturerRef | null;
  supervisorIds: string[];
  approvals: { phase: 'PROPOSAL' | 'SKRIPSI'; lecturerId: string; approvedAt: string }[];
  guidances: ThesisGuidance[];
  defenses: ThesisDefense[];
}

export const THESIS_STAGE_ORDER: ThesisStage[] = [
  'PROPOSAL_SUBMITTED',
  'PROPOSAL_GUIDANCE',
  'PROPOSAL_APPROVED',
  'SEMPRO_REGISTERED',
  'SEMPRO_SCHEDULED',
  'SKRIPSI_GUIDANCE',
  'SKRIPSI_APPROVED',
  'UJIAN_REGISTERED',
  'UJIAN_SCHEDULED',
  'COMPLETED',
];

export const THESIS_STAGE_LABEL: Record<ThesisStage, string> = {
  PROPOSAL_SUBMITTED: 'Proposal Diajukan',
  PROPOSAL_REJECTED: 'Proposal Ditolak',
  PROPOSAL_GUIDANCE: 'Bimbingan Proposal',
  PROPOSAL_APPROVED: 'Proposal Di-ACC',
  SEMPRO_REGISTERED: 'Daftar Seminar Proposal',
  SEMPRO_SCHEDULED: 'Seminar Proposal Terjadwal',
  SKRIPSI_GUIDANCE: 'Bimbingan Skripsi',
  SKRIPSI_APPROVED: 'Skripsi Di-ACC',
  UJIAN_REGISTERED: 'Daftar Ujian Skripsi',
  UJIAN_SCHEDULED: 'Ujian Skripsi Terjadwal',
  COMPLETED: 'Selesai',
};

/** Warna badge per tahap (Tailwind). */
export function thesisStageTone(stage: ThesisStage): string {
  switch (stage) {
    case 'PROPOSAL_REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'SEMPRO_REGISTERED':
    case 'UJIAN_REGISTERED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'SEMPRO_SCHEDULED':
    case 'UJIAN_SCHEDULED':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'PROPOSAL_APPROVED':
    case 'SKRIPSI_APPROVED':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'PROPOSAL_SUBMITTED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

export const DEFENSE_TYPE_LABEL = { SEMPRO: 'Seminar Proposal', UJIAN: 'Ujian Skripsi' } as const;
export const DEFENSE_RESULT_LABEL = { LULUS: 'Lulus', REVISI: 'Lulus dengan Revisi', TIDAK_LULUS: 'Tidak Lulus' } as const;

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Panggil API Tugas Akhir dengan JWT; melempar Error berisi pesan dari server kalau gagal. */
export async function thesisFetch<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/thesis${path}`, {
    method: init?.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(message || `Permintaan gagal (HTTP ${res.status}).`);
  }
  return data as T;
}
