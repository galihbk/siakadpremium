import { notFound } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { BeritaForm } from '../BeritaForm';
import type { ArticleData } from '../BeritaTable';

async function getArticle(id: string): Promise<ArticleData | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/articles/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Gagal memuat berita dari database (SSR):', err);
    return null;
  }
}

export default async function AdminBeritaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <BeritaForm article={article} />
    </PortalLayout>
  );
}
