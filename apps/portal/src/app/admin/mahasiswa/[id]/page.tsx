'use client';

import { useParams } from 'next/navigation';
import { MahasiswaDetailPage } from '@/components/mahasiswa/MahasiswaDetailPage';

export default function Page() {
  const params = useParams();
  return <MahasiswaDetailPage id={params?.id as string} role="admin" basePath="/admin/mahasiswa" />;
}
