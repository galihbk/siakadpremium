import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

export type ExamType = 'UTS' | 'UAS';

export const EXAM_TYPE_LABEL: Record<ExamType, string> = { UTS: 'Ujian Tengah Semester (UTS)', UAS: 'Ujian Akhir Semester (UAS)' };

export interface ExamScheduleView {
  id: string;
  type: ExamType;
  examDate: string;
  startTime: string;
  endTime: string;
  roomId: string | null;
  location: string | null;
  roomName: string | null;
  roomCapacity?: number | null;
  seatCount?: number;
  seatNo?: number | null;
  proctor1: { id: string; name: string | null } | null;
  proctor2: { id: string; name: string | null } | null;
  notes: string | null;
}

export function formatExamDate(value?: string | null): string {
  if (!value) return '-';
  // examDate disimpan 00:00 UTC -> tampilkan sebagai tanggal kalender UTC agar tidak bergeser zona waktu.
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function formatExamDateShort(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Panggil API Ujian dengan JWT; melempar Error berisi pesan dari server kalau gagal. */
export async function examsFetch<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/exams${path}`, {
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
