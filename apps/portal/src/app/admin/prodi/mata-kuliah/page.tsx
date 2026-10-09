'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Check,
  Pencil,
  Trash2,
  SlidersHorizontal,
  X,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface CourseData {
  id: string;
  code: string;
  name: string;
  sks: number;
  totalSks?: number;
  semester: number;
  type: string;
  requiresThesisSupervision?: boolean;
  finalProjectLabel?: string;
  coordinator?: string;
  status: string;
  description?: string;
  curriculumId?: string | null;
  curriculumName?: string | null;
}

interface CurriculumOption {
  id: string;
  code: string;
  name: string;
  studyProgram: string;
}

const FINAL_PROJECT_LABELS = ['Skripsi/TA', 'KKN', 'PLP', 'Kerja Praktik', 'Magang', 'Lainnya'];

const emptyForm = {
  code: '',
  name: '',
  curriculumId: '',
  semester: 1,
  totalSks: 3,
  type: 'Wajib',
  requiresThesisSupervision: false,
  finalProjectLabel: '',
  coordinator: '',
  description: '',
};

export default function AdminProdiMataKuliahPage() {
  const apiBase = getApiBaseUrl();
  const [studyProgramId, setStudyProgramId] = useState<string | null>(null);
  const [prodiName, setProdiName] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [curriculumFilter, setCurriculumFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [jenisFilter, setJenisFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourses = async (prodiId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/courses?studyProgramId=${prodiId}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) setCourses(json.data);
      }
    } catch (err) {
      console.warn('Gagal memuat mata kuliah dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { user } = getAuthSession();
    const prodiId = user?.studyProgramId;
    if (!prodiId) {
      setInitError('Akun ini belum ditautkan ke program studi manapun. Hubungi Super Admin untuk menetapkannya.');
      setLoading(false);
      return;
    }
    setStudyProgramId(prodiId);

    fetch(`${apiBase}/study-programs/${prodiId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || json;
        if (data?.name) setProdiName(data.name);
      })
      .catch(() => {});

    fetch(`${apiBase}/academic/curriculums`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data)) setCurriculums(json.data);
      })
      .catch(() => {});

    fetchCourses(prodiId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prodiCurriculums = curriculums.filter((c) => c.studyProgram === prodiName);

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData(emptyForm);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (d: CourseData) => {
    setEditingCourse(d);
    setFormData({
      code: d.code,
      name: d.name,
      curriculumId: d.curriculumId || '',
      semester: d.semester,
      totalSks: d.totalSks ?? d.sks ?? 3,
      type: d.type,
      requiresThesisSupervision: Boolean(d.requiresThesisSupervision),
      finalProjectLabel: d.finalProjectLabel || '',
      coordinator: d.coordinator || '',
      description: d.description || '',
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCourse(null);
  };

  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Kode dan nama mata kuliah wajib diisi.', 'error');
      return;
    }
    if (!studyProgramId) return;
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingCourse);
      const res = await fetch(`${apiBase}/academic/courses${isEdit ? `/${editingCourse!.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, studyProgram: prodiName, studyProgramId }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Mata kuliah "${formData.name}" berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}.`);
        closeModal();
        await fetchCourses(studyProgramId);
      } else {
        showToast(json?.message || `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} mata kuliah.`, 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (d: CourseData) => {
    if (!studyProgramId) return;
    if (!confirm(`Hapus mata kuliah "${d.name}" (${d.code})? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/academic/courses/${d.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Mata kuliah "${d.name}" berhasil dihapus.`);
        await fetchCourses(studyProgramId);
      } else {
        showToast(json?.message || 'Gagal menghapus mata kuliah.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = courses.filter((d) => {
    if (curriculumFilter === 'ALL') {
      // no-op
    } else if (curriculumFilter === 'NONE') {
      if (d.curriculumId) return false;
    } else if (d.curriculumId !== curriculumFilter) {
      return false;
    }
    if (statusFilter !== 'ALL' && (d.status || 'Aktif') !== statusFilter) return false;
    if (jenisFilter !== 'ALL' && !d.type.toLowerCase().includes(jenisFilter.toLowerCase())) return false;
    if (semesterFilter !== 'ALL' && String(d.semester) !== semesterFilter) return false;
    return d.code.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase());
  });

  const activeFilterCount = [curriculumFilter, statusFilter, jenisFilter, semesterFilter].filter((f) => f !== 'ALL').length;
  const resetFilters = () => {
    setCurriculumFilter('ALL');
    setStatusFilter('ALL');
    setJenisFilter('ALL');
    setSemesterFilter('ALL');
  };

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<CourseData>(filtered, 'code');

  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/prodi"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Dashboard Prodi
          </Link>
        </div>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              {prodiName || 'Program Studi'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Mata Kuliah</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">Katalog mata kuliah program studi Anda</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <p className="text-xs text-blue-200">Total Mata Kuliah</p>
            <p className="text-xl font-black text-white">{courses.length} Mata Kuliah</p>
          </div>
        </div>

        {initError ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{initError}</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode atau nama mata kuliah..."
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
                  onClick={() => studyProgramId && fetchCourses(studyProgramId)}
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
                  Tambah MK
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <SortableTh<CourseData> label="Kode MK" column="code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh<CourseData> label="Nama Mata Kuliah" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh<CourseData> label="Kurikulum" column="curriculumName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh<CourseData> label="SKS" column="sks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                    <SortableTh<CourseData> label="Semester" column="semester" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                    <SortableTh<CourseData> label="Jenis" column="type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh<CourseData> label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-right text-slate-500 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Memuat data kurikulum...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        Belum ada mata kuliah yang cocok.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.code}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {d.name}
                            {d.requiresThesisSupervision && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700"
                                title="Tugas Akhir & Lapangan"
                              >
                                {d.finalProjectLabel || 'TA/Lapangan'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {d.curriculumName ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">{d.curriculumName}</span>
                          ) : (
                            <span className="text-[11px] text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{d.sks || d.totalSks || 3}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{d.semester}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.type.includes('Wajib') ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {d.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            {d.status || 'Aktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(d)}
                              title="Edit mata kuliah"
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(d)}
                              disabled={isDeleting}
                              title="Hapus mata kuliah"
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
              <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="mata kuliah" />
            )}
          </div>
        )}

        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter Mata Kuliah"
          subtitle="Persempit daftar mata kuliah berdasarkan kriteria berikut"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kurikulum</label>
              <select
                value={curriculumFilter}
                onChange={(e) => setCurriculumFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                <option value="ALL">Semua Kurikulum</option>
                <option value="NONE">Belum Ada Kurikulum</option>
                {prodiCurriculums.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                <select
                  value={jenisFilter}
                  onChange={(e) => setJenisFilter(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="Wajib">Wajib</option>
                  <option value="Pilihan">Pilihan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                <option value="ALL">Semua Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
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
          title={editingCourse ? `Edit Mata Kuliah: ${editingCourse.code}` : 'Tambah Mata Kuliah Baru'}
          subtitle={prodiName}
        >
          <form onSubmit={handleSubmitCourse} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode MK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TIF-201"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Mata Kuliah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basis Data Lanjut"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kurikulum</label>
              <select
                value={formData.curriculumId}
                onChange={(e) => setFormData({ ...formData, curriculumId: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                <option value="">Belum ditetapkan</option>
                {prodiCurriculums.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {prodiCurriculums.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">Belum ada kurikulum untuk prodi ini.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SKS</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={formData.totalSks}
                  onChange={(e) => setFormData({ ...formData, totalSks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
                >
                  <option value="Wajib">Wajib</option>
                  <option value="Pilihan">Pilihan</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Tugas Akhir & Lapangan</label>
              <select
                value={formData.finalProjectLabel}
                onChange={(e) =>
                  setFormData({ ...formData, finalProjectLabel: e.target.value, requiresThesisSupervision: Boolean(e.target.value) })
                }
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              >
                <option value="">Bukan Tugas Akhir/Lapangan</option>
                {FINAL_PROJECT_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
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
                <span>{editingCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}</span>
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
    </PortalLayout>
  );
}
