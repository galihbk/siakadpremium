import { getApiBaseUrl } from './api';

export interface PublicDocument {
  id: string;
  code: string;
  title: string;
  category: string;
  fileType: string;
  fileSize: string;
  version: string;
  academicYear: string;
  description: string | null;
  fileUrl: string | null;
  downloadsCount: number;
  updatedAt: string;
}

export interface PublicResearch {
  id: string;
  type: 'Penelitian' | 'Pengabdian' | string;
  title: string;
  scheme: string;
  focusArea: string;
  leader: string;
  faculty: string;
  studyProgram: string | null;
  membersCount: number;
  year: number;
  targetOutput: string | null;
  mitraSasaran: string | null;
}

export interface PublicHaki {
  id: string;
  regNumber: string;
  title: string;
  type: string;
  inventor: string;
  faculty: string;
  grantYear: number;
  description: string | null;
}

export interface P3mLanding {
  stats: { penelitian: number; pengabdian: number; haki: number; publicDocuments: number; totalDownloads: number };
  years: number[];
  focusAreas: { name: string; count: number }[];
  researches: PublicResearch[];
  haki: PublicHaki[];
  documents: PublicDocument[];
}

export interface Campus {
  campusName: string;
  campusShortName: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  website: string;
  logoUrl: string | null;
}

const EMPTY: P3mLanding = {
  stats: { penelitian: 0, pengabdian: 0, haki: 0, publicDocuments: 0, totalDownloads: 0 },
  years: [],
  focusAreas: [],
  researches: [],
  haki: [],
  documents: [],
};

const FALLBACK_CAMPUS: Campus = {
  campusName: '',
  campusShortName: '',
  contactAddress: '',
  contactPhone: '',
  contactEmail: '',
  website: '',
  logoUrl: null,
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

/** `error: true` bila API tidak terjangkau, agar halaman tidak menampilkan "data kosong" yang menyesatkan. */
export async function loadLanding(): Promise<{ data: P3mLanding; error: boolean }> {
  const data = await getJson<P3mLanding>('/lp3m/public/landing');
  return { data: data ?? EMPTY, error: !data };
}

export async function loadCampus(): Promise<Campus> {
  const data = await getJson<Partial<Campus>>('/landing-page');
  return { ...FALLBACK_CAMPUS, ...(data ?? {}) };
}
