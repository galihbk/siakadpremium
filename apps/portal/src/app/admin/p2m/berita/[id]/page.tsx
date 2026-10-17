'use client';

import { BeritaEditLoader } from '@/app/admin/berita/BeritaEditLoader';

export default function BeritaEditPage() {
  return <BeritaEditLoader role="p2m" basePath="/admin/p2m/berita" allowFeatured={false} badge="Admin P2M" />;
}
