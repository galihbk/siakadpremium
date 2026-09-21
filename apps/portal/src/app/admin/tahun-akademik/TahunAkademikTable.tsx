'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Users,
  Layers,
  Check,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react';

export interface AcademicYearItem {
  id: string;
  code: string;
  name: string;
  semesterType: 'ODD' | 'EVEN' | 'SHORT';
  semesterLabel: string;
  startDate: string;
  endDate: string;
  krsStartDate: string | null;
  krsEndDate: string | null;
  isKrsOpen: boolean;
  pmbStartDate: string | null;
  pmbEndDate: string | null;
  skRektor: string;
  gradeDeadline: string;
  isGradeLocked: boolean;
  totalCoursesOffered: number;
  totalCreditsOffered: number;
  studentsCount: number;
  isActive: boolean;
  status: 'Aktif' | 'Arsip' | 'Mendatang';
  notes: string;
}

const toDateInput = (v: string | null) => (v ? v.slice(0, 10) : '');

const emptyForm = {
  code: '',
  name: '',
  semesterType: 'Gasal',
  startDate: '',
  endDate: '',
  krsStartDate: '',
  krsEndDate: '',
  pmbStartDate: '',
  pmbEndDate: '',
  skRektor: '',
  gradeDeadline: '',
  isGradeLocked: true,
  isActive: false,
  status: 'Mendatang',
  notes: '',
};

export function TahunAkademikTable({ initialYears }: { initialYears: AcademicYearItem[] }) {
  const apiBase = getApiBaseUrl();

  const [years, setYears] = useState<AcademicYearItem[]>(initialYears);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYearItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadYears = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/years`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) setYears(data);
      }
    } catch (err) {
      console.error('Koneksi ke sistem tahun akademik terputus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredYears = years.filter((y) => {
    const matchSearch =
      (y.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (y.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (y.skRektor || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || y.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<AcademicYearItem>(filteredYears, 'code');

  const activeYear = years.find((y) => y.isActive);
  const metrics = {
    totalTA: years.length,
    activeStudents: activeYear ? activeYear.studentsCount : 0,
    archiveCount: years.filter((y) => y.status === 'Arsip').length,
  };

  const handleSetActive = async (id: string, name: string) => {
    if (!confirm(`Jadikan "${name}" sebagai tahun akademik AKTIF? Seluruh sistem KRS/nilai akan mengacu pada periode ini.`)) return;
    try {
      const res = await fetch(`${apiBase}/academic/years/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true, status: 'Aktif' }),
      });
      if (res.ok) {
        showToast(`"${name}" sekarang aktif sebagai acuan sistem.`);
        await loadYears();
      } else {
        showToast('Gagal mengaktifkan tahun akademik.');
      }
    } catch {
      showToast('Terjadi gangguan koneksi.');
    }
  };

  const handleToggleKrs = async (y: AcademicYearItem) => {
    try {
      const res = await fetch(`${apiBase}/academic/years/${y.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isKrsOpen: !y.isKrsOpen }),
      });
      if (res.ok) {
        showToast(!y.isKrsOpen ? 'Periode KRS dibuka.' : 'Periode KRS ditutup.');
        await loadYears();
      } else {
        showToast('Gagal mengubah status KRS.');
      }
    } catch {
      showToast('Terjadi gangguan koneksi.');
    }
  };

  const handleToggleGradeLock = async (y: AcademicYearItem) => {
    try {
      const res = await fetch(`${apiBase}/academic/years/${y.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isGradeLocked: !y.isGradeLocked }),
      });
      if (res.ok) {
        showToast(!y.isGradeLocked ? 'Input nilai dikunci.' : 'Input nilai dibuka kembali.');
        await loadYears();
      } else {
        showToast('Gagal mengubah status kunci nilai.');
      }
    } catch {
      showToast('Terjadi gangguan koneksi.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingYear(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (y: AcademicYearItem) => {
    setEditingYear(y);
    setFormData({
      code: y.code,
      name: y.name,
      semesterType: y.semesterLabel,
      startDate: toDateInput(y.startDate),
      endDate: toDateInput(y.endDate),
      krsStartDate: toDateInput(y.krsStartDate),
      krsEndDate: toDateInput(y.krsEndDate),
      pmbStartDate: toDateInput(y.pmbStartDate),
      pmbEndDate: toDateInput(y.pmbEndDate),
      skRektor: y.skRektor,
      gradeDeadline: y.gradeDeadline,
      isGradeLocked: y.isGradeLocked,
      isActive: y.isActive,
      status: y.status,
      notes: y.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = { ...formData, semesterType: formData.semesterType };

    try {
      const url = editingYear ? `${apiBase}/academic/years/${editingYear.id}` : `${apiBase}/academic/years`;
      const res = await fetch(url, {
        method: editingYear ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(editingYear ? `"${formData.name}" berhasil diperbarui.` : `"${formData.name}" berhasil ditambahkan.`);
        await loadYears();
        setIsModalOpen(false);
      } else {
        showToast('Gagal menyimpan tahun akademik.');
      }
    } catch {
      showToast('Terjadi gangguan koneksi saat menyimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const target = years.find((y) => y.id === id);
    if (target?.isActive) {
      alert('Tidak dapat menghapus periode yang sedang AKTIF!');
      return;
    }
    if (!confirm(`Hapus data "${name}"?`)) return;
    try {
      const res = await fetch(`${apiBase}/academic/years/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`"${name}" berhasil dihapus.`);
        await loadYears();
      } else {
        showToast('Gagal menghapus.');
      }
    } catch {
      showToast('Terjadi gangguan koneksi.');
    }
  };

  return (
    <div className="w-full space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-[#1E3A8A] transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Akademik</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#1E3A8A] font-bold">Tahun Akademik</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-[#1E3A8A]" />
            <span>Manajemen Tahun Akademik &amp; Semester</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Satu baris = satu periode semester. Mengatur periode ini juga mengatur buka/tutup KRS dan kunci nilai untuk periode tersebut.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 text-[#D4A017]" />
            <span>Tambah Periode</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Periode Aktif</p>
            <h3 className="text-2xl font-black text-[#1E3A8A] mt-1">{activeYear ? `${activeYear.name} ${activeYear.semesterLabel}` : '-'}</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Acuan Sistem Berjalan
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Periode</p>
            <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalTA} Periode</h3>
            <p className="text-xs text-indigo-600 font-medium mt-0.5">Master data kurun waktu</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mahasiswa Ber-KRS</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.activeStudents.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Di periode aktif berjalan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Arsip Historis</p>
            <h3 className="text-2xl font-black text-slate-700 mt-1">{metrics.archiveCount} Periode</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tersimpan aman di database</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari periode (contoh: 2026/2027) atau nomor SK Rektor..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
        >
          <option value="Semua">Semua Status</option>
          <option value="Aktif">Aktif Saja</option>
          <option value="Arsip">Arsip</option>
          <option value="Mendatang">Mendatang</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                <SortableTh<AcademicYearItem> label="Kode & Periode" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-5" />
                <SortableTh<AcademicYearItem> label="Tanggal Pelaksanaan" column="startDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5" />
                <th className="py-3.5 px-4">Periode KRS</th>
                <SortableTh<AcademicYearItem> label="Mahasiswa Ber-KRS" column="studentsCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3.5" />
                <SortableTh<AcademicYearItem> label="Dasar Hukum (SK Rektor)" column="skRektor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5" />
                <SortableTh<AcademicYearItem> label="Status Sistem" column="isActive" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3.5" />
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
                      <p className="font-semibold text-sm text-slate-700">Memuat data tahun akademik...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Tidak ada periode ditemukan</p>
                  </td>
                </tr>
              ) : (
                paginated.map((y) => (
                  <tr key={y.id} className={`transition-colors ${y.isActive ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/70'}`}>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                            y.isActive ? 'bg-[#1E3A8A] text-white border-[#D4A017] shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {y.code}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{y.name} {y.semesterLabel}</span>
                            {y.isActive && (
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Aktif</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{y.notes}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono text-xs font-bold text-slate-800">
                        {toDateInput(y.startDate)} <span className="text-slate-400 font-normal">s/d</span> {toDateInput(y.endDate)}
                      </div>
                      {(y.pmbStartDate || y.pmbEndDate) && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          PMB: {toDateInput(y.pmbStartDate) || '-'} s/d {toDateInput(y.pmbEndDate) || '-'}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-mono text-[11px] text-slate-600">
                        {toDateInput(y.krsStartDate) || '-'} s/d {toDateInput(y.krsEndDate) || '-'}
                      </div>
                      <button
                        onClick={() => handleToggleKrs(y)}
                        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          y.isKrsOpen ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {y.isKrsOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {y.isKrsOpen ? 'KRS Dibuka' : 'KRS Ditutup'}
                      </button>
                      <button
                        onClick={() => handleToggleGradeLock(y)}
                        className={`mt-1 ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          !y.isGradeLocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        }`}
                      >
                        {!y.isGradeLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {!y.isGradeLocked ? 'Nilai Dibuka' : 'Nilai Dikunci'}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-black text-slate-900 text-sm">{y.studentsCount > 0 ? y.studentsCount.toLocaleString('id-ID') : '-'}</span>
                      {y.studentsCount > 0 && <span className="text-[10px] text-slate-400 block">Mahasiswa</span>}
                    </td>

                    <td className="py-4 px-4">
                      <p className="text-xs font-mono font-medium text-slate-700 line-clamp-1">{y.skRektor || '-'}</p>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {y.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Sedang Berjalan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetActive(y.id, `${y.name} ${y.semesterLabel}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1E3A8A] border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Set Aktif</span>
                        </button>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(y)}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(y.id, `${y.name} ${y.semesterLabel}`)}
                          disabled={y.isActive}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                          title={y.isActive ? 'Tidak dapat menghapus periode aktif' : 'Hapus'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredYears.length} pageSize={pageSize} itemLabel="periode" />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingYear ? 'Edit Periode' : 'Tambah Periode Baru'}
        subtitle="Master tahun ajaran & semester Institut Teknologi Nusantara"
        icon={<Calendar className="w-5 h-5" />}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 20261"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Tahun Ajaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 2026/2027"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold text-[#1E3A8A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={formData.semesterType}
                onChange={(e) => setFormData({ ...formData, semesterType: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                <option value="Gasal">Gasal</option>
                <option value="Genap">Genap</option>
                <option value="Pendek">Pendek</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Berakhir <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Periode KRS</label>
              <input
                type="date"
                value={formData.krsStartDate}
                onChange={(e) => setFormData({ ...formData, krsStartDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selesai Periode KRS</label>
              <input
                type="date"
                value={formData.krsEndDate}
                onChange={(e) => setFormData({ ...formData, krsEndDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Periode PMB</label>
              <input
                type="date"
                value={formData.pmbStartDate}
                onChange={(e) => setFormData({ ...formData, pmbStartDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selesai Periode PMB</label>
              <input
                type="date"
                value={formData.pmbEndDate}
                onChange={(e) => setFormData({ ...formData, pmbEndDate: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor SK Rektor</label>
              <input
                type="text"
                placeholder="e.g. SK Rektor No. 042/ITN/R/2026"
                value={formData.skRektor}
                onChange={(e) => setFormData({ ...formData, skRektor: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Akhir Input Nilai</label>
              <input
                type="date"
                value={formData.gradeDeadline}
                onChange={(e) => setFormData({ ...formData, gradeDeadline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Arsip</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
            >
              <option value="Mendatang">Mendatang</option>
              <option value="Aktif">Aktif</option>
              <option value="Arsip">Arsip</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
            <textarea
              rows={2}
              placeholder="Catatan kebijakan akademik periode ini..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            ></textarea>
          </div>

          <div className="pt-1 space-y-2.5">
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Jadikan Periode Aktif Sistem</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Periode lain otomatis dialihkan menjadi status non-aktif.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isGradeLocked}
                onChange={(e) => setFormData({ ...formData, isGradeLocked: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">Kunci Input Nilai</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Kalau dicentang, dosen tidak bisa menyimpan nilai untuk periode ini.</p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingYear ? 'Simpan Perubahan' : 'Tambah Periode'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
