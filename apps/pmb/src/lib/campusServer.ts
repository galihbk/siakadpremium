import { getApiBaseUrl } from './api';
import { EMPTY_CAMPUS, toCampusInfo, type CampusInfo, type CampusProfile } from './campusInfo';

/** Profil kampus di sisi server (SSR/metadata); disimpan 60 detik. Gagal -> data kosong, halaman tetap tampil. */
export async function getCampusServer(): Promise<CampusInfo> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page`, { next: { revalidate: 60 } });
    if (!res.ok) return EMPTY_CAMPUS;
    const json = await res.json();
    return toCampusInfo((json?.data ?? json) as Partial<CampusProfile>);
  } catch {
    return EMPTY_CAMPUS;
  }
}
