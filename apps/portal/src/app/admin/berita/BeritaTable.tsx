'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Pencil, Trash2, Megaphone } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';

export interface ArticleData {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl?: string | null;
  authorName: string;
  readTime: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string;
  createdAt?: string;
}

export function BeritaTable({ initialArticles }: { initialArticles: ArticleData[] }) {
  const apiBase = getApiBaseUrl();
  const [articles, setArticles] = useState<ArticleData[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/landing-page/articles/all`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setArticles(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat berita dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (a: ArticleData) => {
    if (!confirm(`Hapus berita "${a.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/landing-page/articles/${a.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Berita "${a.title}" berhasil dihapus.`);
        await fetchArticles();
      } else {
        showToast(json?.message || 'Gagal menghapus berita.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (a: ArticleData) => {
    const nextPublished = !a.isPublished;
    setTogglingId(a.id);
    setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, isPublished: nextPublished } : x)));
    try {
      const res = await fetch(`${apiBase}/landing-page/articles/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextPublished }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status publikasi.');
    } catch (err) {
      console.warn(err);
      setArticles((prev) => prev.map((x) => (x.id === a.id ? { ...x, isPublished: a.isPublished } : x)));
      showToast('Gagal mengubah status publikasi.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.authorName.toLowerCase().includes(search.toLowerCase()),
  );

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<ArticleData>(filtered, 'publishedAt', 10, 'desc');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
              BAAK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Berita &amp; Pengumuman</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Kelola berita, prestasi, dan pengumuman yang tampil di website kampus
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Berita</p>
          <p className="text-xl font-black text-white">{articles.length} Berita</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, kategori, atau penulis..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchArticles}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <Link
              href="/admin/berita/baru"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tulis Berita Baru
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<ArticleData> label="Judul" column="title" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<ArticleData> label="Kategori" column="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<ArticleData> label="Penulis" column="authorName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<ArticleData>
                  label="Tanggal"
                  column="publishedAt"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data berita...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada berita. Klik &quot;Tulis Berita Baru&quot; untuk mulai menulis.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {a.category === 'Pengumuman' && <Megaphone className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className="truncate">{a.title}</span>
                        {a.isFeatured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 shrink-0">
                            Unggulan
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{a.excerpt}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {a.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.authorName}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.publishedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleTogglePublish(a)}
                        disabled={togglingId === a.id}
                        title={a.isPublished ? 'Klik untuk jadikan draf' : 'Klik untuk publikasikan'}
                        className="inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            a.isPublished ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                              a.isPublished ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span className={`text-[10px] font-bold ${a.isPublished ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {a.isPublished ? 'Terbit' : 'Draf'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/berita/${a.id}`}
                          title="Edit berita"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1E3A8A] transition-colors cursor-pointer inline-flex"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(a)}
                          disabled={isDeleting}
                          title="Hapus berita"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            itemLabel="berita"
          />
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
