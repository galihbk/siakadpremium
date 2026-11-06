import { getApiBaseUrl } from './api';

export interface PublicStats {
  students: number;
  lecturers: number;
  studyPrograms: number;
  faculties: number;
}

/** Angka ringkas dari data akademik; null bila API tidak terjangkau sehingga angkanya tidak ditampilkan. */
export async function loadPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data ?? json;
    return typeof d?.students === 'number' ? (d as PublicStats) : null;
  } catch {
    return null;
  }
}

export const fmtCount = (n: number) => n.toLocaleString('id-ID');
