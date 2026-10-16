import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Newspaper, Building2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { fmtArticleDate, loadArticleBySlug } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await loadArticleBySlug(slug);
  return { title: a ? `${a.title} | Institut Teknologi Nusantara` : 'Berita tidak ditemukan' };
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Link href="/berita" className="flex w-fit items-center gap-1.5 text-sm font-semibold text-[#1E3A8A] hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Semua Berita
          </Link>

          <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] text-xs font-bold">{article.category}</span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight mt-3">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 mt-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
              {fmtArticleDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4A017]" />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D4A017]" />
              Diunggah oleh {article.authorRole}
            </span>
          </div>

          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 mt-8">
            {article.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.imageUrl} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#172554] flex items-center justify-center">
                <Newspaper className="w-14 h-14 text-white/30" />
              </div>
            )}
          </div>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mt-8 font-medium">{article.excerpt}</p>

          {/* Isi berita ditulis staf berwenang lewat editor teks kaya di portal. */}
          <div
            className="mt-6 text-slate-700 leading-relaxed space-y-4 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_a]:text-[#1E3A8A] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#D4A017] [&_blockquote]:pl-4 [&_blockquote]:italic"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
