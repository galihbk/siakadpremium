'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Download, Plus, RefreshCw, Loader2, Check } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Modal } from '@/components/ui/Modal';

export interface CourseData {
  id: string;
  code: string;
  name: string;
  studyProgram?: string;
  facultyCode?: string;
  sks: number;
  totalSks?: number;
  semester: number;
  type: string;
  coordinator?: string;
  status: string;
  description?: string;
  curriculumId?: string | null;
  curriculumName?: string | null;
  curriculumCode?: string | null;
}

interface CurriculumOption {
  id: string;
  code: string;
  name: string;
  studyProgram: string;
}

const emptyForm = {
  code: '',
  name: '',
  studyProgram: '',
  curriculumId: '',
  semester: 1,
  totalSks: 3,
  type: 'Wajib',
  coordinator: '',
  description: '',
};

export function KurikulumTable({ initialCourses }: { initialCourses: CourseData[] }) {
  const apiBase = getApiBaseUrl();
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumOption[]>([]);
  const [curriculumFilter, setCurriculumFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/courses`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setCourses(json.data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat mata kuliah dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`${apiBase}/study-programs`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data)) {
          setStudyPrograms(json.data.map((p: any) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
    fetch(`${apiBase}/academic/curriculums`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (Array.isArray(json?.data)) {
          setCurriculums(json.data.map((c: any) => ({ id: c.id, code: c.code, name: c.name, studyProgram: c.studyProgram })));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenAddModal = () => {
    setFormData(emptyForm);
    setIsAddModalOpen(true);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      showToast('Kode dan nama mata kuliah wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(`Mata kuliah "${formData.name}" berhasil ditambahkan.`);
        setIsAddModalOpen(false);
        await fetchCourses();
      } else {
        showToast(json?.message || 'Gagal menambahkan mata kuliah.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSubmitting(false);
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
    return (
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.studyProgram && d.studyProgram.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<CourseData>(filtered, 'code');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
              BAAK
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Kurikulum &amp; Mata Kuliah</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Katalog kurikulum akademik dan struktur mata kuliah institusi
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
          <p className="text-xs text-blue-200">Total Mata Kuliah</p>
          <p className="text-xl font-black text-white">{courses.length} Mata Kuliah</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama mata kuliah, atau prodi..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
          <select
            value={curriculumFilter}
            onChange={(e) => setCurriculumFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <option value="ALL">Semua Kurikulum</option>
            <option value="NONE">Belum Ada Kurikulum</option>
            {curriculums.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={fetchCourses}
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
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Ekspor
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <SortableTh<CourseData> label="Kode MK" column="code" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="Nama Mata Kuliah" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="Kurikulum" column="curriculumName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="SKS" column="sks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh<CourseData> label="Semester" column="semester" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                <SortableTh<CourseData> label="Jenis" column="type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="Koordinator" column="coordinator" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh<CourseData> label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data kurikulum...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada mata kuliah yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{d.name}</div>
                      {d.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{d.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.studyProgram || 'Semua Prodi (MKDU)'}</td>
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
                          d.type.includes('Wajib')
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{d.coordinator || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {d.status || 'Aktif'}
                      </span>
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
            itemLabel="mata kuliah"
          />
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Mata Kuliah Baru"
        subtitle="Katalog mata kuliah institusi"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
            <select
              value={formData.studyProgram}
              onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value, curriculumId: '' })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
            >
              <option value="">Semua Prodi (MKDU)</option>
              {studyPrograms.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Kurikulum</label>
              <Link href="/admin/master-kurikulum" target="_blank" className="text-[11px] font-semibold text-[#1E3A8A] hover:underline">
                + Tambah kurikulum baru
              </Link>
            </div>
            <select
              value={formData.curriculumId}
              onChange={(e) => setFormData({ ...formData, curriculumId: e.target.value })}
              disabled={!formData.studyProgram}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">{formData.studyProgram ? 'Belum ditetapkan' : 'Pilih program studi dulu'}</option>
              {curriculums
                .filter((c) => c.studyProgram === formData.studyProgram)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {formData.studyProgram && curriculums.filter((c) => c.studyProgram === formData.studyProgram).length === 0 && (
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Koordinator Mata Kuliah</label>
            <input
              type="text"
              placeholder="Nama dosen koordinator (opsional)"
              value={formData.coordinator}
              onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              placeholder="Ringkasan materi/topik mata kuliah ini..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            ></textarea>
          </div>

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
              <span>Tambah Mata Kuliah</span>
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
