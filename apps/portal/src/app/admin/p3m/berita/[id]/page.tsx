import { notFound } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { BeritaForm } from '@/app/admin/berita/BeritaForm';
import type { ArticleData } from '@/app/admin/berita/BeritaTable';

async function getArticle(id: string): Promise<ArticleData | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/articles/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export default async function P3MBeritaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  // Kepemilikan diperiksa API saat menyimpan; Admin LP3M tidak bisa mengubah berita orang lain.
  return (
    <PortalLayout role="lp3m" userName="" userIdText="">
      <BeritaForm article={article} basePath="/admin/p3m/berita" allowFeatured={false} badge="Admin LP3M" />
    </PortalLayout>
  );
}
