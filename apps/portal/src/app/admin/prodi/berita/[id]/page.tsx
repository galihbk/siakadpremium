'use client';

import { BeritaEditLoader } from '@/app/admin/berita/BeritaEditLoader';

export default function BeritaEditPage() {
  return <BeritaEditLoader role="prodi" basePath="/admin/prodi/berita" allowFeatured={false} badge="Admin Prodi" />;
}
