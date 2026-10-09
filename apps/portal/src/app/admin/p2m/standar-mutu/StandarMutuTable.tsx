'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Loader2, Check, Pencil, Trash2, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Modal } from '@/components/ui/Modal';

export interface StandardData {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  indicator?: string | null;
  targetValue?: string | null;
  status: string;
  academicYear: string;
}

const CATEGORIES = ['Akademik', 'Non-Akademik', 'Tata Kelola', 'Penelitian & PkM'];

const emptyForm = {
  code: '',
  name: '',
  category: 'Akademik',
  description: '',
  indicator: '',
  targetValue: '',
  status: 'Aktif',
  academicYear: '2026/2027',
};

export function StandarMutuTable({ initialStandards }: { initialStandards: StandardData[] }) {
  const apiBase = getApiBaseUrl();
  const [standards, setStandards] = useState<StandardData[]>(initialStandards);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<StandardData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStandards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/p2m/standards`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setStandards(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat standar mutu:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingStandard(null);
    setFormData(emptyForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (s: StandardData) => {
    setEditingStandard(s);
    setFormData({
      code: s.code,
      name: s.name,
      category: s.category,
      description: s.description || '',
      indicator: s.indicator || '',
      targetValue: s.targetValue || '',
      status: s.status,
      academicYear: s.academicYear,
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingStandard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Kode dan nama standar wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingStandard);
      const res = await fetch(`${apiBase}/p2m/standards${isEdit ? `/${editingStandard!.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Standar mutu "${formData.name}" berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`);
        closeModal();
        await fetchStandards();
      } else {
        showToast(json?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} standar mutu.`, 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: StandardData) => {
    if (!confirm(`Hapus standar mutu "${s.name}" (${s.code})? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/p2m/standards/${s.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Standar mutu "${s.name}" berhasil dihapus.`);
        await fetchStandards();
      } else {
        showToast(json?.message || 'Gagal menghapus standar mutu.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = standards.filter((d) => {
    if (categoryFilter !== 'Semua' && d.category !== categoryFilter) return false;
    if (statusFilter !== 'Semua' && d.status !== statusFilter) return false;
    return d.code.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeFilterCount = [categoryFilter, statusFilter].filter((f) => f !== 'Semua').length;
  const resetFilters = () => {
    setCategoryFilter('Semua');
    setStatusFilter('Semua');
  };

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<StandardData>(filtered, 'code');

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
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            P2M
          </span>
          <h1 className="text-xl sm:text-2xl font-black">Standar Mutu</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Daftar standar SPMI beserta indikator dan target capaian</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Standar</p>
          <p className="text-xl font-black text-white">{standards.length} Standar</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama standar..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={fetchStandards}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Standar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<StandardData> label="Kode" column="code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StandardData> label="Nama Standar" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<StandardData> label="Kategori" column="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Target Capaian</th>
                <SortableTh<StandardData> label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
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
                    Belum ada standar mutu yang cocok.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{d.name}</div>
                      {d.indicator && <div className="text-[11px] text-slate-400 truncate max-w-xs">{d.indicator}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        {d.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.targetValue || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(d)}
                          title="Edit standar mutu"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={isDeleting}
                          title="Hapus standar mutu"
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
            itemLabel="standar"
          />
        )}
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Standar Mutu"
        subtitle="Persempit daftar standar mutu berdasarkan kriteria berikut"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(false)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Terapkan
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={closeModal}
        title={editingStandard ? `Edit Standar: ${editingStandard.code}` : 'Tambah Standar Mutu Baru'}
        subtitle="Standar SPMI institusi"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode Standar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. STD-01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Standar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Standar Kompetensi Lulusan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Indikator Capaian</label>
              <input
                type="text"
                placeholder="e.g. % lulusan tepat waktu"
                value={formData.indicator}
                onChange={(e) => setFormData({ ...formData, indicator: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Capaian</label>
              <input
                type="text"
                placeholder="e.g. >= 80%"
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
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

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeModal}
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
              <span>{editingStandard ? 'Simpan Perubahan' : 'Tambah Standar'}</span>
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
