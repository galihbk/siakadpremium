'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getApiBaseUrl } from '@/lib/api';
import { GraduationCap, Search, RefreshCw, Check, X, UserCheck, FileText } from 'lucide-react';

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

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

export default function AdminBimbinganTaPage() {
  const [academicYearName, setAcademicYearName] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [items, setItems] = useState<CandidateItem[]>([]);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [courseFilter, setCourseFilter] = useState('Semua');
  const [search, setSearch] = useState('');

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
      const res = await fetch(`${getApiBaseUrl()}/academic/thesis-supervisions?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setAcademicYearName(json.data?.academicYearName ?? null);
      setCourses(json.data?.courses ?? []);
      setItems(json.data?.items ?? []);
      setLoadError(false);
    } catch (err) {
      console.error('Gagal memuat daftar bimbingan tugas akhir:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [courseFilter, search]);

  useEffect(() => {
    load();
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setLecturers(j.data || []))
      .catch(() => {});
  }, [load]);

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
    <PortalLayout role="admin" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Bimbingan Tugas Akhir
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Penetapan Pembimbing Skripsi/TA, KKN & KP</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Mahasiswa yang mengambil mata kuliah tanpa jadwal tetap (Skripsi, KKN, Kerja Praktik) ditetapkan pembimbingnya di sini,
              terpisah dari Dosen Pembimbing Akademik.
              {academicYearName && <> &bull; Tahun akademik {academicYearName}</>}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

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
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="Semua">Semua Mata Kuliah</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                  <th className="px-4 py-3 text-left font-semibold">Mata Kuliah</th>
                  <th className="px-4 py-3 text-left font-semibold">Judul</th>
                  <th className="px-4 py-3 text-left font-semibold">Pembimbing 1</th>
                  <th className="px-4 py-3 text-left font-semibold">Pembimbing 2</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Belum ada mahasiswa yang mengambil mata kuliah tanpa jadwal tetap (Skripsi/KKN/KP) pada tahun akademik ini.
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
                    <td className="px-4 py-3 text-slate-600">{item.supervisor2Name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openAssign(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-[11px] cursor-pointer"
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
      </div>

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
    </PortalLayout>
  );
}
