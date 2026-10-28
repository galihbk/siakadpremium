'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';

const FALLBACK = ['Skripsi/TA', 'Seminar Proposal', 'KKN', 'PLP', 'Kerja Praktik', 'Magang'];

/** Nama jenis tugas akhir & kegiatan lapangan yang aktif (master di Pengaturan Akademik), untuk dropdown kategori mata kuliah. */
export function useCourseCategories(): string[] {
  const [names, setNames] = useState<string[]>(FALLBACK);
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/academic/course-categories?activeOnly=true`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows = j?.data ?? j;
        if (Array.isArray(rows) && rows.length) setNames(rows.map((x: { name: string }) => x.name));
      })
      .catch(() => undefined);
  }, []);
  return names;
}
