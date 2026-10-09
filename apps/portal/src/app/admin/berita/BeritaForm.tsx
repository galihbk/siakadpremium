'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { ArticleData } from './BeritaTable';

const CATEGORIES = ['Pengumuman', 'Akademik', 'Prestasi', 'Beasiswa', 'Kerjasama', 'Kegiatan', 'Lainnya'];

const emptyForm = {
  title: '',
  category: 'Pengumuman',
  excerpt: '',
  content: '',
  imageUrl: '',
  readTime: '3 min read',
  isFeatured: false,
  isPublished: true,
};

export function BeritaForm({ article }: { article?: ArticleData }) {
  const router = useRouter();
  const apiBase = getApiBaseUrl();
  const isEdit = Boolean(article);
  const [formData, setFormData] = useState(
    article
      ? {
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          content: article.content,
          imageUrl: article.imageUrl || '',
          readTime: article.readTime,
          isFeatured: article.isFeatured,
          isPublished: article.isPublished,
        }
      : emptyForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentIsEmpty = !formData.content.replace(/<[^>]*>/g, '').trim();
    if (!formData.title.trim() || !formData.excerpt.trim() || contentIsEmpty) {
      setError('Judul, ringkasan, dan isi berita wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/landing-page/articles${isEdit ? `/${article!.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} berita.`);
      router.push('/admin/berita');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/berita"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali
        </Link>
      </div>

      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
          BAAK
        </span>
        <h1 className="text-xl sm:text-2xl font-black">{isEdit ? `Edit Berita: ${article!.title}` : 'Tulis Berita / Pengumuman Baru'}</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1">Tampil di halaman Berita Terkini website kampus</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8 space-y-5 text-xs">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Judul <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pengisian KRS Semester Genap Diperpanjang"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full sm:w-64 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Ringkasan Singkat <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={2}
            placeholder="Satu-dua kalimat ringkasan yang muncul di kartu berita"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Isi Lengkap <span className="text-rose-500">*</span>
          </label>
          <RichTextEditor
            value={formData.content}
            onChange={(html) => setFormData((prev) => ({ ...prev, content: html }))}
            placeholder="Tulis isi lengkap berita/pengumuman di sini..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">URL Gambar (opsional)</label>
            <input
              type="text"
              placeholder="/images/berita/nama-file.jpg"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Waktu Baca</label>
            <input
              type="text"
              value={formData.readTime}
              onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3.5">
          <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-semibold">Tandai sebagai berita unggulan</span>
          </label>
          <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-semibold">Langsung publikasikan ke website</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Link
            href="/admin/berita"
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>{isEdit ? 'Simpan Perubahan' : 'Terbitkan Berita'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
