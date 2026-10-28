import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

// Tipe data Kegiatan Lapangan (PLP, KKN, Kerja Praktik, Magang)

export type FieldMode = 'REGISTRATION' | 'GROUP' | 'DIRECT';
export type PeriodState = 'NOT_SET' | 'UPCOMING' | 'OPEN' | 'CLOSED';
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
/** Status mahasiswa pada daftar BAAK: NONE = sudah mengambil mata kuliahnya tetapi belum mendaftar. */
export type RosterStatus = RegistrationStatus | 'NONE';

export interface FieldCategory {
  id: string;
  name: string;
  kind: 'TUGAS_AKHIR' | 'LAPANGAN';
  requiresRegistration: boolean;
  hasPartners: boolean;
  allowOwnPartner: boolean;
  feeAmount: number;
  feeLabel: string | null;
  isGroup: boolean;
  minMembers: number;
  maxMembers: number;
  minLogbook: number;
  description: string | null;
  courseCount: number;
}

export const fieldMode = (c: Pick<FieldCategory, 'isGroup' | 'requiresRegistration'>): FieldMode =>
  c.isGroup ? 'GROUP' : c.requiresRegistration ? 'REGISTRATION' : 'DIRECT';

export const REGISTRATION_STATUS_LABEL: Record<RosterStatus, string> = {
  NONE: 'Belum mendaftar',
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

export const registrationStatusTone = (s: RosterStatus) =>
  s === 'NONE'
    ? 'bg-slate-100 text-slate-600 border-slate-200'
    : s === 'APPROVED'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'REJECTED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

export const PERIOD_STATE_LABEL: Record<PeriodState, string> = {
  NOT_SET: 'Belum diatur',
  UPCOMING: 'Belum dibuka',
  OPEN: 'Dibuka',
  CLOSED: 'Ditutup',
};

export const periodStateTone = (s: PeriodState) =>
  s === 'OPEN'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'UPCOMING'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

export type ChargeStatus = 'NONE' | 'UNPAID' | 'VERIFYING' | 'PAID';

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  NONE: 'Belum ditagih',
  UNPAID: 'Belum bayar',
  VERIFYING: 'Menunggu verifikasi',
  PAID: 'Lunas',
};

export const chargeStatusTone = (s: ChargeStatus) =>
  s === 'PAID'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'VERIFYING'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : s === 'UNPAID'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';

export const formatRupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export const formatDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

/** `YYYY-MM-DD` untuk input tanggal (dibaca sebagai hari kalender WIB, sama dengan API). */
export const toDateInput = (iso?: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10) : '';

/** Panggil API Kegiatan Lapangan dengan JWT; melempar Error berisi pesan dari server kalau gagal. */
export async function fieldFetch<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/field-activities${path}`, {
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
