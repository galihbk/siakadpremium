'use client';

import { BeritaEditLoader } from '@/app/admin/berita/BeritaEditLoader';

export default function BeritaEditPage() {
  return <BeritaEditLoader role="pmb" basePath="/admin/pmb/berita" allowFeatured={false} badge="Panitia PMB" />;
}
