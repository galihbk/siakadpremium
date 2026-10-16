import { getApiBaseUrl } from './api';

/** Bentuk publik dari API: hanya role/unit pengunggah, tanpa nama akun. */
export interface PublicArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl: string | null;
  authorRole: string;
  readTime: string;
  isFeatured: boolean;
  publishedAt: string;
}

export async function loadArticles(): Promise<{ items: PublicArticle[]; failed: boolean }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/articles`, { next: { revalidate: 60 } });
    if (!res.ok) return { items: [], failed: true };
    const json = await res.json();
    const list = json?.data ?? json;
    return { items: Array.isArray(list) ? list : [], failed: false };
  } catch {
    return { items: [], failed: true };
  }
}

export async function loadArticleBySlug(slug: string): Promise<PublicArticle | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page/articles/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as PublicArticle;
  } catch {
    return null;
  }
}

export const fmtArticleDate = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
