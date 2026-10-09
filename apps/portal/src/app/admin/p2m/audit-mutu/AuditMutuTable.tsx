'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Plus, RefreshCw, Loader2, Check, Pencil, Trash2, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Modal } from '@/components/ui/Modal';

export interface AuditData {
  id: string;
  code?: string | null;
  studyProgram: string;
  faculty?: string | null;
  auditDate: string;
  auditorName: string;
  scope?: string | null;
  findingsSummary?: string | null;
  result: string;
  status: string;
  followUpDeadline?: string | null;
  followUpStatus: string;
  notes?: string | null;
}

const RESULTS = ['Sesuai', 'Temuan Minor', 'Temuan Mayor'];
const STATUSES = ['Terjadwal', 'Berlangsung', 'Selesai'];
const FOLLOW_UP_STATUSES = ['Belum Ditindaklanjuti', 'Dalam Proses', 'Selesai'];

const RESULT_STYLE: Record<string, string> = {
  Sesuai: 'bg-emerald-100 text-emerald-700',
  'Temuan Minor': 'bg-amber-100 text-amber-700',
  'Temuan Mayor': 'bg-rose-100 text-rose-700',
};

const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

const emptyForm = {
  code: '',
  studyProgram: '',
  faculty: '',
  auditDate: '',
  auditorName: '',
  scope: '',
  findingsSummary: '',
  result: 'Sesuai',
  status: 'Terjadwal',
  followUpDeadline: '',
  followUpStatus: 'Belum Ditindaklanjuti',
  notes: '',
};

export function AuditMutuTable({ initialAudits }: { initialAudits: AuditData[] }) {
  const apiBase = getApiBaseUrl();
  const [audits, setAudits] = useState<AuditData[]>(initialAudits);
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [resultFilter, setResultFilter] = useState('Semua');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<AuditData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/p2m/audits`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setAudits(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat audit mutu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${apiBase}/study-programs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data)) setStudyPrograms(json.data.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAddModal = () => {
    setEditingAudit(null);
    setFormData(emptyForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (a: AuditData) => {
    setEditingAudit(a);
    setFormData({
      code: a.code || '',
      studyProgram: a.studyProgram,
      faculty: a.faculty || '',
      auditDate: toDateInput(a.auditDate),
      auditorName: a.auditorName,
      scope: a.scope || '',
      findingsSummary: a.findingsSummary || '',
      result: a.result,
      status: a.status,
      followUpDeadline: toDateInput(a.followUpDeadline),
      followUpStatus: a.followUpStatus,
      notes: a.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingAudit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studyProgram.trim() || !formData.auditDate || !formData.auditorName.trim()) {
      showToast('Program studi, tanggal, dan auditor wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingAudit);
      const payload = { ...formData, followUpDeadline: formData.followUpDeadline || null };
      const res = await fetch(`${apiBase}/p2m/audits${isEdit ? `/${editingAudit!.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Data audit mutu ${formData.studyProgram} berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`);
        closeModal();
        await fetchAudits();
      } else {
        showToast(json?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} audit mutu.`, 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (a: AuditData) => {
    if (!confirm(`Hapus data audit mutu "${a.studyProgram}" (${new Date(a.auditDate).toLocaleDateString('id-ID')})? Tindakan ini tidak dapat dibatalkan.`))
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/p2m/audits/${a.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast('Data audit mutu berhasil dihapus.');
        await fetchAudits();
      } else {
        showToast(json?.message || 'Gagal menghapus data audit mutu.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = audits.filter((d) => {
    if (statusFilter !== 'Semua' && d.status !== statusFilter) return false;
    if (resultFilter !== 'Semua' && d.result !== resultFilter) return false;
    return (
      d.studyProgram.toLowerCase().includes(search.toLowerCase()) ||
      d.auditorName.toLowerCase().includes(search.toLowerCase()) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const activeFilterCount = [statusFilter, resultFilter].filter((f) => f !== 'Semua').length;
  const resetFilters = () => {
    setStatusFilter('Semua');
    setResultFilter('Semua');
  };

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<AuditData>(filtered, 'auditDate', 10, 'desc');

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
          <h1 className="text-xl sm:text-2xl font-black">Audit Mutu Internal (AMI)</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Jadwal, hasil, dan tindak lanjut audit mutu per program studi</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Audit</p>
          <p className="text-xl font-black text-white">{audits.length} Audit</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari prodi, auditor, atau kode..."
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
              onClick={fetchAudits}
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
              Jadwalkan Audit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<AuditData> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<AuditData> label="Tanggal" column="auditDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<AuditData> label="Auditor" column="auditorName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Hasil</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-slate-500 font-semibold">Tindak Lanjut</th>
                <th className="px-4 py-3 text-right text-slate-500 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data audit mutu yang cocok.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{d.studyProgram}</div>
                      {d.code && <div className="text-[11px] text-slate-400 font-mono">{d.code}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(d.auditDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.auditorName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RESULT_STYLE[d.result] || 'bg-slate-100 text-slate-600'}`}>
                        {d.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1E3A8A]">{d.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.followUpStatus === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.followUpStatus === 'Dalam Proses'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {d.followUpStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(d)}
                          title="Edit audit mutu"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={isDeleting}
                          title="Hapus audit mutu"
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
            itemLabel="audit"
          />
        )}
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Audit Mutu"
        subtitle="Persempit daftar audit berdasarkan kriteria berikut"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua Status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hasil Audit</label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua Hasil</option>
              {RESULTS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
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
        title={editingAudit ? `Edit Audit: ${editingAudit.studyProgram}` : 'Jadwalkan Audit Mutu Internal'}
        subtitle="Audit Mutu Internal (AMI)"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Program Studi <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.studyProgram}
                onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                <option value="">Pilih program studi</option>
                {studyPrograms.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Audit (opsional)</label>
              <input
                type="text"
                placeholder="e.g. AMI-2026-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Audit <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.auditDate}
                onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Auditor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.auditorName}
                onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ruang Lingkup Audit</label>
            <textarea
              rows={2}
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Temuan</label>
            <textarea
              rows={3}
              value={formData.findingsSummary}
              onChange={(e) => setFormData({ ...formData, findingsSummary: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hasil Audit</label>
              <select
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                {RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Audit</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Tindak Lanjut</label>
              <select
                value={formData.followUpStatus}
                onChange={(e) => setFormData({ ...formData, followUpStatus: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                {FOLLOW_UP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Waktu Tindak Lanjut</label>
              <input
                type="date"
                value={formData.followUpDeadline}
                onChange={(e) => setFormData({ ...formData, followUpDeadline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
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
              <span>{editingAudit ? 'Simpan Perubahan' : 'Simpan Jadwal'}</span>
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
