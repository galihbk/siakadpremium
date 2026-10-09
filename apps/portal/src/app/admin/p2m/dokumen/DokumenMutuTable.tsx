'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Loader2, Check, Trash2, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { CompressedFileUpload } from '@/components/common/CompressedFileUpload';
import { Modal } from '@/components/ui/Modal';

export interface QualityDocumentData {
  id: string;
  code: string;
  title: string;
  category: string;
  fileType: string;
  fileSize: string;
  version: string;
  academicYear: string;
  accessLevel: string;
  description: string | null;
  author: string;
  fileUrl: string | null;
  downloadsCount: number;
  createdAt: string;
}

const CATEGORIES = ['Panduan & Renstra', 'Regulasi & SK Rektor', 'Template Borang', 'Instrumen AMI'];
const ACCESS_LEVELS = ['Publik', 'Dosen & Reviewer', 'Khusus Tim P2M'];

const emptyForm = {
  title: '',
  category: 'Panduan & Renstra',
  version: 'v2026.1',
  academicYear: '2026/2027',
  accessLevel: 'Publik',
  description: '',
  author: 'P2M',
};

export function DokumenMutuTable({ initialDocuments }: { initialDocuments: QualityDocumentData[] }) {
  const apiBase = getApiBaseUrl();
  const [documents, setDocuments] = useState<QualityDocumentData[]>(initialDocuments);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/p2m/documents`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setDocuments(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat dokumen mutu:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData(emptyForm);
    setPendingFile(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Judul dokumen wajib diisi.', 'error');
      return;
    }
    if (!pendingFile) {
      showToast('Pilih berkas dokumen terlebih dahulu.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const uploadBody = new FormData();
      uploadBody.append('file', pendingFile);
      const uploadRes = await fetch(`${apiBase}/storage/upload?folder=p2m-documents`, { method: 'POST', body: uploadBody });
      const uploadJson = await uploadRes.json().catch(() => null);
      const uploaded = uploadJson?.data?.data || uploadJson?.data;
      if (!uploadRes.ok || !uploaded?.key) {
        showToast(uploadJson?.message || 'Gagal mengunggah berkas.', 'error');
        return;
      }

      const ext = pendingFile.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeMb = (pendingFile.size / (1024 * 1024)).toFixed(1);

      const res = await fetch(`${apiBase}/p2m/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileType: ext,
          fileSize: `${sizeMb} MB`,
          fileUrl: uploaded.key,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Dokumen "${formData.title}" berhasil ditambahkan.`);
        setIsAddModalOpen(false);
        await fetchDocuments();
      } else {
        showToast(json?.message || 'Gagal menyimpan dokumen.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (d: QualityDocumentData) => {
    if (!confirm(`Hapus dokumen "${d.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/p2m/documents/${d.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Dokumen "${d.title}" berhasil dihapus.`);
        await fetchDocuments();
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || 'Gagal menghapus dokumen.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = documents.filter((d) => {
    if (categoryFilter !== 'Semua' && d.category !== categoryFilter) return false;
    return (
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase())
    );
  });

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<QualityDocumentData>(filtered, 'createdAt', 10, 'desc');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/p2m"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Dashboard P2M
        </Link>
      </div>

      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">P2M</span>
          <h1 className="text-xl sm:text-2xl font-black">Dokumen Mutu</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Panduan, regulasi, template, dan instrumen penjaminan mutu</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Dokumen</p>
          <p className="text-xl font-black text-white">{documents.length} Dokumen</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul, kode, atau penulis..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="Semua">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDocuments}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Unggah Dokumen
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<QualityDocumentData> label="Dokumen" column="title" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<QualityDocumentData> label="Kategori" column="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Versi</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Akses</th>
                <th className="px-4 py-3 text-center text-slate-500 font-semibold">Unduhan</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada dokumen. Klik &quot;Unggah Dokumen&quot; untuk mulai.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{d.title}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {d.code} &middot; {d.fileType} &middot; {d.fileSize}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">{d.category}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.version}</td>
                    <td className="px-4 py-3 text-slate-600">{d.accessLevel}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{d.downloadsCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Lihat berkas"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1E3A8A] transition-colors cursor-pointer inline-flex"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={isDeleting}
                          title="Hapus dokumen"
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
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="dokumen" />
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Unggah Dokumen Mutu" subtitle="Panduan, regulasi, template, atau instrumen">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Dokumen <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Panduan Audit Mutu Internal 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Akses</label>
              <select
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                {ACCESS_LEVELS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Versi</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Akademik</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <CompressedFileUpload
            label="Berkas Dokumen"
            sublabel="Format yang didukung: PDF, Word, Excel."
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            maxSizeBytes={5 * 1024 * 1024}
            onFileReady={(file) => setPendingFile(file)}
            onFileRemoved={() => setPendingFile(null)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Unggah Dokumen</span>
            </button>
          </div>
        </form>
      </Modal>

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
