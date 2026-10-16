'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Filter,
  Newspaper,
  Search,
  Tag,
  User,
  ArrowRight,
  TrendingUp,
  Share2,
  Bookmark,
} from 'lucide-react';

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string | null;
  featured: boolean;
}

function NewsImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] to-[#172554] flex items-center justify-center">
        <Newspaper className="w-10 h-10 text-white/30" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`absolute inset-0 w-full h-full ${className ?? ''}`} />;
}

export function BeritaList({ articles, failed = false }: { articles: NewsItem[]; failed?: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Semua', ...Array.from(new Set(articles.map((a) => a.category)))];

  const filteredArticles = articles.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featuredNews = articles.find((a) => a.featured) || articles[0] || null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Header Hero Section */}
        <section className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold uppercase tracking-wider mb-3">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>Kanal Informasi Resmi</span>
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Kabar & Berita Kampus
                </h1>
                <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
                  Informasi terkini mengenai prestasi mahasiswa, riset inovatif, agenda akademik, dan kemitraan strategis Institut Teknologi Nusantara.
                </p>
              </div>

              {/* Search Bar */}
              <div className="w-full md:w-80">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berita atau artikel..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200/60 text-sm focus:outline-none focus:bg-white/20 focus:border-[#D4A017] transition-all"
                  />
                  <Search className="w-4 h-4 text-blue-200 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured Headline News (When not filtering by specific search) */}
          {featuredNews && !searchQuery && selectedCategory === 'Semua' && (
            <div className="mb-12">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 group">
                <div className="relative h-64 lg:h-auto lg:col-span-7 bg-slate-100 overflow-hidden">
                  <NewsImage src={featuredNews.image} alt={featuredNews.title} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#D4A017] text-slate-950 shadow-md">
                      <TrendingUp className="w-3 h-3" />
                      BERITA UTAMA
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-10 lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] font-bold">
                        {featuredNews.category}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {featuredNews.date}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug group-hover:text-[#1E3A8A] transition-colors">
                      {featuredNews.title}
                    </h2>

                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {featuredNews.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-[#D4A017]" />
                      <span>{featuredNews.readTime} &bull; Diunggah oleh {featuredNews.author}</span>
                    </div>

                    <Link
                      href={`/berita/${featuredNews.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1E3A8A] hover:text-[#172554] hover:underline"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Articles */}
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">
                {articles.length === 0 ? (failed ? 'Berita sementara tidak dapat dimuat' : 'Belum ada berita') : 'Tidak ada berita yang sesuai'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {articles.length === 0
                  ? 'Berita terbaru akan muncul di sini setelah dipublikasikan.'
                  : 'Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/berita/${article.slug}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all overflow-hidden flex flex-col group"
                >
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <NewsImage src={article.image} alt={article.title} className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#1E3A8A] text-white shadow-xs">
                      {article.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <Calendar className="w-3 h-3" />
                        <span>{article.date}</span>
                        <span>&bull;</span>
                        <span>{article.readTime}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#1E3A8A] transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 text-[11px] font-medium truncate max-w-[170px]">
                        Diunggah oleh: {article.author}
                      </span>
                      <span className="font-bold text-[#1E3A8A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Baca</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
