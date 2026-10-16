import { BeritaList, type NewsItem } from '@/components/BeritaList';
import { fmtArticleDate, loadArticles } from '@/lib/articles';

// Berita diambil dari database dan diperbarui tim kampus lewat portal -- render di server.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Kabar & Berita Kampus | Institut Teknologi Nusantara' };

export default async function BeritaPage() {
  const { items, failed } = await loadArticles();
  const news: NewsItem[] = items.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    category: a.category,
    date: fmtArticleDate(a.publishedAt),
    author: a.authorRole,
    readTime: a.readTime,
    image: a.imageUrl,
    featured: a.isFeatured,
  }));
  return <BeritaList articles={news} failed={failed} />;
}
