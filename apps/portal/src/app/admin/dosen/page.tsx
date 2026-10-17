'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { DosenTable, type LecturerData } from './DosenTable';

async function getLecturers(): Promise<LecturerData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/lecturers`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat dosen dari database (SSR):', err);
    return [];
  }
}

export default function AdminDosenPage() {
  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <ClientLoad load={getLecturers}>
        {(lecturers) => (
        <DosenTable initialLecturers={lecturers} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
