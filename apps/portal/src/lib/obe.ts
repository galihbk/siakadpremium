import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

export interface ObeCplCourse {
  code: string;
  name: string;
  period: string | null;
  achievement: number;
}

export interface ObeCpl {
  code: string;
  description: string;
  category: string;
  achievement: number | null;
  status: 'ACHIEVED' | 'NOT_ACHIEVED' | 'NO_DATA' | string;
  courses: ObeCplCourse[];
}

export interface ObeLevel {
  code: string;
  description: string;
  achievement: number | null;
  status: string;
}

export interface ObeCourse {
  curriculumId: string;
  code: string;
  name: string;
  credits: number;
  period: string | null;
  assessments: { name: string; score: number | null }[];
  subCpmk: ObeLevel[];
  cpmk: ObeLevel[];
  cpl: ObeLevel[];
}

export interface ObeData {
  student: { studentNumber: string; name: string; studyProgram: string };
  primaryCurriculumId: string | null;
  curricula: { id: string; name: string; target: { value: number }; cpl: ObeCpl[]; measuredCount: number }[];
  courses: ObeCourse[];
  generatedAt: string;
}

export type ObeState =
  | { status: 'loading' }
  | { status: 'off' } // kampus ini tidak memakai OBE: tidak ada yang ditampilkan
  | { status: 'unavailable'; reason: 'NOT_IN_OBE' | 'UNREACHABLE' }
  | { status: 'ready'; data: ObeData };

/** Capaian OBE mahasiswa yang login. "off" berarti kampus tidak memakai OBE, jadi bagian ini tidak tampil sama sekali. */
export function useObe(): ObeState {
  const [state, setState] = useState<ObeState>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/students/me/obe`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        const body = json?.data ?? json;
        if (!alive) return;
        if (!res.ok || !body?.enabled) return setState({ status: 'off' });
        if (!body.available) return setState({ status: 'unavailable', reason: body.reason });
        setState({ status: 'ready', data: body.data as ObeData });
      })
      .catch(() => alive && setState({ status: 'off' }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
