'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { TahunAkademikTable, type AcademicYearItem } from './TahunAkademikTable';

async function getAcademicYears(): Promise<AcademicYearItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/academic/years`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || json;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Gagal memuat tahun akademik dari database (SSR):', err);
    return [];
  }
}

export default function AdminTahunAkademikPage() {
  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <ClientLoad load={getAcademicYears}>
        {(years) => (
        <TahunAkademikTable initialYears={years} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
