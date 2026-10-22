'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from './api';

let yearPromise: Promise<string> | null = null;

/** Tahun akademik penerimaan dari gelombang yang sedang dibuka (utamakan gelombang bawaan); kosong bila belum ada gelombang. */
function loadYear(): Promise<string> {
  if (!yearPromise) {
    yearPromise = fetch(`${getApiBaseUrl()}/admissions/batches`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const d = j?.data ?? j;
        const list: Array<{ status?: string; isDefault?: boolean; academicYear?: string }> = Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d)
            ? d
            : [];
        const open = list.filter((b) => b.status === 'OPEN');
        const chosen = open.find((b) => b.isDefault) || open[0] || list[0];
        return String(chosen?.academicYear ?? '').trim();
      })
      .catch(() => '');
  }
  return yearPromise;
}

export function usePmbYear(): string {
  const [year, setYear] = useState('');
  useEffect(() => {
    let alive = true;
    loadYear().then((y) => alive && setYear(y));
    return () => {
      alive = false;
    };
  }, []);
  return year;
}
