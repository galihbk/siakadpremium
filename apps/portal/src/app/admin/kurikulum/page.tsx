'use client';

import { PortalLayout } from '@/components/layout/PortalLayout';
import { ClientLoad } from '@/components/common/ClientLoad';
import { getApiBaseUrl } from '@/lib/api';
import { KurikulumTable, type CourseData } from './KurikulumTable';

async function getCourses(): Promise<CourseData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/academic/courses`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat mata kuliah dari database (SSR):', err);
    return [];
  }
}

export default function AdminKurikulumPage() {
  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <ClientLoad load={getCourses}>
        {(courses) => (
        <KurikulumTable initialCourses={courses} />
        )}
      </ClientLoad>
    </PortalLayout>
  );
}
