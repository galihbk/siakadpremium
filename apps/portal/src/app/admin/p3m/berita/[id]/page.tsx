'use client';

import { BeritaEditLoader } from '@/app/admin/berita/BeritaEditLoader';

export default function BeritaEditPage() {
  return <BeritaEditLoader role="lp3m" basePath="/admin/p3m/berita" allowFeatured={false} badge="Admin LP3M" />;
}
