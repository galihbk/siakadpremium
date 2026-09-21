import { PortalLayout } from '@/components/layout/PortalLayout';
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

export default async function AdminTahunAkademikPage() {
  const years = await getAcademicYears();

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <TahunAkademikTable initialYears={years} />
    </PortalLayout>
  );
}
