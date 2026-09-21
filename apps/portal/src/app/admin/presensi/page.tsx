import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { PresensiTable, type ClassAttendance, type AcademicYearOption } from './PresensiTable';

async function getYears(): Promise<AcademicYearOption[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/academic/years`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json.data || json;
    return Array.isArray(data)
      ? data.map((y: any) => ({ id: y.id, name: y.name, semesterLabel: y.semesterLabel, isActive: y.isActive }))
      : [];
  } catch {
    return [];
  }
}

async function getAttendanceOverview(academicYearId: string): Promise<ClassAttendance[]> {
  try {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const res = await fetch(`${getApiBaseUrl()}/academic/attendance-overview${params}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat presensi dari database (SSR):', err);
    return [];
  }
}

export default async function AdminPresensiPage() {
  const years = await getYears();
  const activeYearId = years.find((y) => y.isActive)?.id || '';
  const attendances = await getAttendanceOverview(activeYearId);

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan" activeMenuHref="/admin/presensi">
      <PresensiTable initialAttendances={attendances} years={years} initialYearId={activeYearId} />
    </PortalLayout>
  );
}
