import { loadArticles, fmtArticleDate } from '@/lib/articles';
import Link from 'next/link';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';

export async function BeritaSection() {
  const { items, failed } = await loadArticles();
  const beritaList = items.slice(0, 3).map((a) => ({
    slug: a.slug,
    kategori: a.category,
    tanggal: fmtArticleDate(a.publishedAt),
    judul: a.title,
    ringkasan: a.excerpt,
    image: a.imageUrl,
    oleh: a.authorRole,
  }));

  return (
    <section id="berita" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Kabar Nusantara
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Berita & Informasi Terkini
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Ikuti perkembangan terbaru, pencapaian akademik, riset terobosan, dan aktivitas civitas akademika ITN.
            </p>
          </div>

          <Link
            href="/berita"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#172554] transition-colors"
          >
            <span>Lihat Semua Berita</span>
            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
          </Link>
        </div>

        {/* Grid 3 Berita */}
        {beritaList.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl bg-white">
            {failed ? 'Berita sementara tidak dapat dimuat.' : 'Belum ada berita yang dipublikasikan.'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {beritaList.map((berita) => (
            <article
              key={berita.slug}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                {berita.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={berita.image}
                    alt={berita.judul}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#172554] flex items-center justify-center">
                    <Newspaper className="w-10 h-10 text-white/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-[#1E3A8A]/90 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  {berita.kategori}
                </div>
              </div>

              {/* Text */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
                    <time>{berita.tanggal}</time>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-[#1E3A8A] transition-colors">
                    {berita.judul}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6">
                    {berita.ringkasan}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400 truncate">Diunggah oleh {berita.oleh}</span>
                  <Link
                    href={`/berita/${berita.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-[#D4A017] transition-colors shrink-0"
                  >
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
