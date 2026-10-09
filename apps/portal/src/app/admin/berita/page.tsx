import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { BeritaTable, type ArticleData } from './BeritaTable';

async function getArticles(): Promise<ArticleData[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/articles/all`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch (err) {
    console.warn('Gagal memuat berita dari database (SSR):', err);
    return [];
  }
}

export default async function AdminBeritaPage() {
  const articles = await getArticles();

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <BeritaTable initialArticles={articles} />
    </PortalLayout>
  );
}
