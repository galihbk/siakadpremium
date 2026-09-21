import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { MahasiswaTable, type StudentData } from './MahasiswaTable';

async function getStudents(): Promise<StudentData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/students/list`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat data mahasiswa dari database (SSR):', err);
    return [];
  }
}

export default async function AdminMahasiswaPage() {
  const students = await getStudents();

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <MahasiswaTable initialStudents={students} />
    </PortalLayout>
  );
}
