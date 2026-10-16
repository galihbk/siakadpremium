import { getApiBaseUrl } from './api';

export interface Standard {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  indicator: string | null;
  targetValue: string | null;
  academicYear: string;
}

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

export interface UpcomingAudit {
  id: string;
  studyProgram: string;
  faculty: string | null;
  auditDate: string;
  status: string;
}

export interface P2mLanding {
  stats: {
    activeStandards: number;
    totalAudits: number;
    completedAudits: number;
    followUpDone: number;
    publicDocuments: number;
    totalDownloads: number;
  };
  categories: string[];
  standards: Standard[];
  documents: PublicDocument[];
  auditSummary: { result: string; count: number }[];
  upcomingAudits: UpcomingAudit[];
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

const EMPTY: P2mLanding = {
  stats: { activeStandards: 0, totalAudits: 0, completedAudits: 0, followUpDone: 0, publicDocuments: 0, totalDownloads: 0 },
  categories: [],
  standards: [],
  documents: [],
  auditSummary: [],
  upcomingAudits: [],
};

const FALLBACK_CAMPUS: Campus = {
  campusName: 'Institut Teknologi Nusantara',
  campusShortName: 'ITN',
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
export async function loadLanding(): Promise<{ data: P2mLanding; error: boolean }> {
  const data = await getJson<P2mLanding>('/p2m/public/landing');
  return { data: data ?? EMPTY, error: !data };
}

export async function loadCampus(): Promise<Campus> {
  const data = await getJson<Partial<Campus>>('/landing-page');
  return { ...FALLBACK_CAMPUS, ...(data ?? {}) };
}
