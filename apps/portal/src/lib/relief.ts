import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

// Keringanan pembayaran: pengajuan mahasiswa atas satu tagihan, diputuskan Keuangan

export type ReliefType = 'POTONGAN' | 'PEMBEBASAN' | 'PENUNDAAN';
export type ReliefStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ReliefRequest {
  id: string;
  type: ReliefType;
  reason: string;
  requestedAmount: number | null;
  requestedDueDate: string | null;
  attachmentUrl: string | null;
  invoiceAmountAtRequest: number;
  invoiceDueDateAtRequest: string | null;
  status: ReliefStatus;
  approvedAmount: number | null;
  approvedDueDate: string | null;
  financeNote: string | null;
  decidedAt: string | null;
  decidedByName: string | null;
  createdAt: string;
  invoice?: { id: string; invoiceNo: string; paymentType: string; amount: number; dueDate: string | null; status: string };
}

export interface ReliefQueueItem extends ReliefRequest {
  nim: string;
  studentName: string;
  studyProgram: string;
}

export const RELIEF_TYPE_LABEL: Record<ReliefType, string> = {
  POTONGAN: 'Potongan biaya',
  PEMBEBASAN: 'Pembebasan biaya',
  PENUNDAAN: 'Penundaan jatuh tempo',
};

export const RELIEF_STATUS_LABEL: Record<ReliefStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const reliefStatusTone = (s: ReliefStatus) =>
  s === 'APPROVED'
    ? 'bg-emerald-100 text-emerald-700'
    : s === 'REJECTED'
      ? 'bg-rose-100 text-rose-700'
      : s === 'CANCELLED'
        ? 'bg-slate-100 text-slate-500'
        : 'bg-amber-100 text-amber-700';

export const formatRp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

export const formatDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

/** `YYYY-MM-DD` untuk input tanggal (hari kalender WIB, sama dengan API). */
export const toDateInput = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 10) : '');

/** Panggil API keringanan pembayaran dengan JWT; melempar Error berisi pesan dari server kalau gagal. */
export async function reliefFetch<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/finance/relief-requests${path}`, {
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
