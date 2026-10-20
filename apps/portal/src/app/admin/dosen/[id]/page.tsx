'use client';

import { useParams } from 'next/navigation';
import { DosenDetailPage } from '@/components/dosen/DosenDetailPage';

export default function Page() {
  const params = useParams();
  return <DosenDetailPage id={params?.id as string} role="admin" basePath="/admin/dosen" />;
}
