'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, ImagePlus, X } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { ArticleData } from './BeritaTable';

const CATEGORIES = ['Pengumuman', 'Akademik', 'Prestasi', 'Beasiswa', 'Kerjasama', 'Kegiatan', 'Lainnya'];

// Ringkasan tampil di kartu berita (dipotong 3 baris) -- dibatasi agar tidak terpotong tak beraturan.
const EXCERPT_MAX = 200;

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

export function BeritaForm({
  article,
  basePath = '/admin/berita',
  allowFeatured = true,
  badge = 'BAAK',
}: {
  article?: ArticleData;
  basePath?: string;
  /** Berita unggulan (sorotan beranda) hanya diatur BAAK/Super Admin. */
  allowFeatured?: boolean;
  badge?: string;
}) {
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
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Berkas gambar harus berformat gambar (JPG, PNG, atau WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5 MB.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const { token } = getAuthSession();
      const body = new FormData();
      body.append('isPrivate', 'false'); // gambar berita tampil di website publik
      body.append('file', file);
      const res = await fetch(`${apiBase}/storage/upload?folder=berita`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
      });
      const json = await res.json().catch(() => null);
      const uploaded = json?.data?.data || json?.data;
      if (!res.ok || !uploaded?.key) throw new Error(json?.message || 'Gagal mengunggah gambar.');
      // Penyimpanan lokal: simpan path relatif agar tidak terikat host API; cloud: URL publik penuh.
      const url = uploaded.driver === 'local' ? `/uploads/${uploaded.key}` : uploaded.url;
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah gambar.');
    } finally {
      setIsUploading(false);
    }
  };

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
      router.push(basePath);
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
          href={basePath}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali
        </Link>
      </div>

      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
          {badge}
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
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>
              Ringkasan Singkat <span className="text-rose-500">*</span>
            </span>
            <span className={`font-medium ${formData.excerpt.length >= EXCERPT_MAX ? 'text-rose-600' : 'text-slate-400'}`}>
              {formData.excerpt.length}/{EXCERPT_MAX}
            </span>
          </label>
          <textarea
            required
            rows={2}
            maxLength={EXCERPT_MAX}
            placeholder="Satu-dua kalimat ringkasan yang muncul di kartu berita (maks. 200 karakter)"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Gambar Berita (opsional)</label>
            {formData.imageUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.imageUrl} alt="Pratinjau gambar berita" className="h-32 w-auto max-w-full rounded-xl border border-slate-200 object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  title="Hapus gambar"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full px-3.5 py-6 text-sm text-slate-500 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] hover:text-[#1E3A8A] cursor-pointer transition-colors">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {isUploading ? 'Mengunggah…' : 'Pilih gambar (JPG/PNG/WEBP, maks. 5 MB)'}
                <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleImageChange} />
              </label>
            )}
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
          {allowFeatured && (
          <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-semibold">Tandai sebagai berita unggulan</span>
          </label>
          )}
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
            href={basePath}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
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
