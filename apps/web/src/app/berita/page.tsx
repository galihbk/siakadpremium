import { getInstitutionProfile } from '@/lib/institution';
import { BeritaList, type NewsItem } from '@/components/BeritaList';
import { fmtArticleDate, loadArticles } from '@/lib/articles';

// Berita diambil dari database dan diperbarui tim kampus lewat portal -- render di server.
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const campus = await getInstitutionProfile();
  return { title: `Kabar & Berita Kampus | ${campus.campusName || 'Kampus'}` };
}

export default async function BeritaPage() {
  const { items, failed } = await loadArticles();
  const campus = await getInstitutionProfile();
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
  return <BeritaList articles={news} failed={failed} campusName={campus.campusName || 'kampus kami'} />;
}
