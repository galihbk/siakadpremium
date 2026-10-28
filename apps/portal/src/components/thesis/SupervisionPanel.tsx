'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { CHARGE_STATUS_LABEL, chargeStatusTone } from '@/lib/fieldActivity';
import { Search, RefreshCw, Check, X, UserCheck, FileText, SlidersHorizontal } from 'lucide-react';

interface CourseOption {
  id: string;
  code: string;
  name: string;
}

interface CandidateItem {
  studentId: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  entryYear: number | null;
  isGroup: boolean;
  feeApplicable?: boolean;
  chargeStatus?: 'NONE' | 'UNPAID' | 'VERIFYING' | 'PAID' | null;
  courseId: string;
  courseCode: string;
  courseName: string;
  title: string | null;
  supervisor1Id: string | null;
  supervisor1Name: string | null;
  supervisor2Id: string | null;
  supervisor2Name: string | null;
  notes: string | null;
  assignedAt: string | null;
}

interface LecturerOption {
  id: string;
  nidn: string;
  fullName: string;
}

interface Option {
  id: string;
  name: string;
}

const selectCls =
  'w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/**
 * Daftar mahasiswa yang menunggu/sudah ditetapkan pembimbingnya. Dipakai tab Plotting Pembimbing di Tugas Akhir / Skripsi
 * dan tiap tab di menu Kegiatan Lapangan (`category` = nama jenis).
 */
export function SupervisionPanel({ category, onAcademicYear }: { category?: string; onAcademicYear?: (name: string | null) => void }) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [items, setItems] = useState<CandidateItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [courseFilter, setCourseFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [prodiFilter, setProdiFilter] = useState('');
  const [entryYearFilter, setEntryYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [years, setYears] = useState<(Option & { isActive?: boolean })[]>([]);
  const [prodis, setProdis] = useState<Option[]>([]);

  const [assigning, setAssigning] = useState<CandidateItem | null>(null);
  const [form, setForm] = useState({ title: '', supervisor1Id: '', supervisor2Id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseFilter !== 'Semua') params.set('courseId', courseFilter);
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (yearFilter) params.set('academicYearId', yearFilter);
      if (prodiFilter) params.set('studyProgramId', prodiFilter);
      if (entryYearFilter) params.set('entryYear', entryYearFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${getApiBaseUrl()}/academic/thesis-supervisions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      onAcademicYear?.(json.data?.academicYearName ?? null);
      setCourses(json.data?.courses ?? []);
      setItems(json.data?.items ?? []);
      setLoadError(false);
    } catch (err) {
      console.error('Gagal memuat daftar bimbingan:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, search, category, yearFilter, prodiFilter, entryYearFilter, statusFilter, onAcademicYear]);

  useEffect(() => {
    setCourseFilter('Semua');
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setLecturers(j.data || []))
      .catch(() => {});
    fetch(`${getApiBaseUrl()}/academic/years`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows = j?.data ?? j;
        if (Array.isArray(rows)) setYears(rows);
      })
      .catch(() => {});
    fetch(`${getApiBaseUrl()}/study-programs`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const rows = j?.data ?? j;
        if (Array.isArray(rows)) setProdis(rows);
      })
      .catch(() => {});
  }, []);

  const activeFilterCount = [courseFilter !== 'Semua', yearFilter, prodiFilter, entryYearFilter, statusFilter].filter(Boolean).length;
  const resetFilters = () => {
    setCourseFilter('Semua');
    setYearFilter('');
    setProdiFilter('');
    setEntryYearFilter('');
    setStatusFilter('');
  };
  const thisYear = new Date().getFullYear();
  const showSupervisor2 = items.some((i) => !i.isGroup);
  const showCharge = items.some((i) => i.feeApplicable);

  const openAssign = (item: CandidateItem) => {
    setAssigning(item);
    setForm({
      title: item.title || '',
      supervisor1Id: item.supervisor1Id || '',
      supervisor2Id: item.supervisor2Id || '',
      notes: item.notes || '',
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigning) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/academic/thesis-supervisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: assigning.studentId,
          courseId: assigning.courseId,
          title: form.title || undefined,
          supervisor1Id: form.supervisor1Id || null,
          supervisor2Id: form.supervisor2Id || null,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      showToast(json?.message || 'Pembimbing berhasil ditetapkan.');
      setAssigning(null);
      await load();
      window.dispatchEvent(new Event('siakad:thesis-updated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menetapkan pembimbing.');
    } finally {
      setSaving(false);
    }
  };

  const counts = useMemo(
    () => ({
      total: items.length,
      belum: items.filter((i) => !i.supervisor1Id).length,
      sudah: items.filter((i) => i.supervisor1Id).length,
    }),
    [items],
  );

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3 flex items-center justify-between">
          <span>Gagal memuat data dari server.</span>
          <button onClick={load} className="font-bold underline cursor-pointer">Coba lagi</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-blue-50 text-[#1E3A8A]">
          <p className="text-xs text-slate-500 mb-1">Total Mahasiswa</p>
          <p className="text-2xl font-black">{counts.total}</p>
        </div>
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-amber-50 text-amber-700">
          <p className="text-xs text-slate-500 mb-1">Belum Ada Pembimbing</p>
          <p className="text-2xl font-black">{counts.belum}</p>
        </div>
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-emerald-50 text-emerald-700">
          <p className="text-xs text-slate-500 mb-1">Sudah Ditetapkan</p>
          <p className="text-2xl font-black">{counts.sudah}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIM mahasiswa..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="relative inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold">{activeFilterCount}</span>
            )}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                <th className="px-4 py-3 text-left font-semibold">Mata Kuliah</th>
                <th className="px-4 py-3 text-left font-semibold">Judul</th>
                <th className="px-4 py-3 text-left font-semibold">Pembimbing 1</th>
                {showSupervisor2 && <th className="px-4 py-3 text-left font-semibold">Pembimbing 2</th>}
                {showCharge && <th className="px-4 py-3 text-left font-semibold">Pembayaran</th>}
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5 + (showSupervisor2 ? 1 : 0) + (showCharge ? 1 : 0)} className="px-4 py-10 text-center text-slate-400">
                    {category
                      ? `Belum ada mahasiswa yang mengambil mata kuliah ${category} pada tahun akademik ini.`
                      : 'Belum ada mahasiswa yang mengambil mata kuliah tanpa jadwal tetap (Skripsi/KKN/KP) pada tahun akademik ini.'}
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={`${item.studentId}:${item.courseId}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 block">{item.studentName}</span>
                    <span className="text-[11px] font-mono text-slate-500">{item.nim} &bull; {item.studyProgram}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-700">{item.courseCode}</span>
                    <span className="block text-[11px] text-slate-400">{item.courseName}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate">{item.title || <span className="italic text-slate-400">Belum diisi</span>}</td>
                  <td className="px-4 py-3">
                    {item.supervisor1Name ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> {item.supervisor1Name}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Belum ditetapkan</span>
                    )}
                  </td>
                  {showSupervisor2 && <td className="px-4 py-3 text-slate-600">{item.isGroup ? '-' : item.supervisor2Name || '-'}</td>}
                  {showCharge && (
                    <td className="px-4 py-3">
                      {item.feeApplicable && item.chargeStatus ? (
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${chargeStatusTone(item.chargeStatus)}`}>{CHARGE_STATUS_LABEL[item.chargeStatus]}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openAssign(item)}
                      disabled={Boolean(item.feeApplicable && item.chargeStatus !== 'PAID' && !item.supervisor1Id)}
                      title={item.feeApplicable && item.chargeStatus !== 'PAID' && !item.supervisor1Id ? 'Biaya belum lunas' : undefined}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] cursor-pointer"
                    >
                      {item.supervisor1Id ? 'Ubah' : 'Tetapkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Tetapkan Pembimbing</h4>
                <p className="text-[11px] text-slate-500">
                  {assigning.studentName} ({assigning.nim}) &bull; {assigning.courseCode}
                </p>
              </div>
              <button type="button" onClick={() => setAssigning(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Judul Skripsi/Kegiatan (opsional)
                </label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pembimbing 1</label>
                <SearchableSelect
                  value={form.supervisor1Id}
                  onChange={(id) => setForm({ ...form, supervisor1Id: id })}
                  emptyLabel="Belum ditentukan"
                  placeholder="Belum ditentukan"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  options={lecturers.map((l) => ({ value: l.id, label: `${l.fullName} (NIDN: ${l.nidn})` }))}
                />
              </div>
              {assigning.isGroup && (
                <p className="rounded-lg bg-blue-50 border border-blue-100 text-[11px] text-slate-600 px-3 py-2">
                  Kegiatan berkelompok hanya memiliki satu pembimbing.
                </p>
              )}
              {!assigning.isGroup && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pembimbing 2 (opsional)</label>
                <SearchableSelect
                  value={form.supervisor2Id}
                  onChange={(id) => setForm({ ...form, supervisor2Id: id })}
                  emptyLabel="Tidak ada"
                  placeholder="Tidak ada"
                  searchPlaceholder="Cari nama atau NIDN dosen..."
                  options={lecturers.filter((l) => l.id !== form.supervisor1Id).map((l) => ({ value: l.id, label: `${l.fullName} (NIDN: ${l.nidn})` }))}
                />
              </div>
              )}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan (opsional)</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button type="button" onClick={() => setAssigning(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-60 rounded-xl cursor-pointer">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Daftar Mahasiswa" subtitle="Persempit daftar berdasarkan kriteria berikut">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Akademik</label>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectCls}>
              <option value="">Tahun akademik aktif</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                  {y.isActive ? ' (aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
            <select value={prodiFilter} onChange={(e) => setProdiFilter(e.target.value)} className={selectCls}>
              <option value="">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mata Kuliah</label>
            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectCls}>
              <option value="Semua">Semua Mata Kuliah</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Angkatan</label>
              <select value={entryYearFilter} onChange={(e) => setEntryYearFilter(e.target.value)} className={selectCls}>
                <option value="">Semua Angkatan</option>
                {Array.from({ length: 10 }, (_, i) => thisYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Pembimbing</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectCls}>
                <option value="">Semua</option>
                <option value="belum">Belum ditetapkan</option>
                <option value="sudah">Sudah ditetapkan</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Terapkan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
