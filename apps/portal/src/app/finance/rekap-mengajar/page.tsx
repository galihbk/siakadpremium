'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { ChevronDown, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';

interface ClassRow {
  id: string;
  className: string;
  courseCode: string;
  courseName: string;
  sks: number;
  day: string;
  time: string;
  meetings: number;
}

interface LecturerRow {
  lecturerId: string;
  nidn: string;
  name: string;
  studyProgram: string;
  totalClasses: number;
  totalSks: number;
  totalMeetings: number;
  classes: ClassRow[];
}

interface Recap {
  academicYears: { id: string; name: string; semesterType: string; isActive: boolean }[];
  selectedAcademicYearId: string | null;
  lecturers: LecturerRow[];
  totals: { lecturers: number; classes: number; sks: number; meetings: number } | null;
}

const SEMESTER_LABEL: Record<string, string> = { ODD: 'Gasal', EVEN: 'Genap', SHORT: 'Pendek' };

export default function RekapMengajarPage() {
  const [recap, setRecap] = useState<Recap | null>(null);
  const [yearId, setYearId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (id?: string) => {
    setLoading(true);
    try {
      const qs = id ? `?academicYearId=${encodeURIComponent(id)}` : '';
      const res = await fetch(`${getApiBaseUrl()}/finance/teaching-recap${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRecap(json.data);
      setYearId(json.data.selectedAcademicYearId ?? '');
      setError(false);
    } catch (err) {
      console.error('Gagal memuat rekap mengajar', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (recap?.lecturers ?? []).filter(
      (l) => !q || l.name.toLowerCase().includes(q) || l.nidn.includes(q) || l.studyProgram.toLowerCase().includes(q),
    );
  }, [recap, search]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const yearName = recap?.academicYears.find((y) => y.id === yearId);

  const exportCsv = () => {
    const header = ['NIDN', 'Nama Dosen', 'Program Studi', 'Jumlah Kelas', 'Total SKS', 'Pertemuan Terlaksana'];
    const lines = rows.map((l) =>
      [l.nidn, `"${l.name}"`, `"${l.studyProgram}"`, l.totalClasses, l.totalSks, l.totalMeetings].join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Rekap_Mengajar_${(yearName?.name ?? 'semester').replace('/', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const t = recap?.totals;

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Honor &amp; Pengajaran
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Rekapitulasi Mengajar Dosen</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Total kelas, beban SKS, dan pertemuan terlaksana tiap dosen dalam satu semester
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={yearId}
              onChange={(e) => load(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white cursor-pointer"
            >
              {(recap?.academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {SEMESTER_LABEL[y.semesterType] ?? y.semesterType}
                  {y.isActive ? ' (Aktif)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={() => load(yearId)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold border border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3">
            Gagal memuat rekap mengajar dari server.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Dosen Mengajar', val: t?.lecturers ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Total Kelas', val: t?.classes ?? 0, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Total SKS Diampu', val: t?.sks ?? 0, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className="text-2xl font-black">{c.val}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIDN, atau program studi..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <button
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  {['Dosen', 'Program Studi', 'Kelas', 'Total SKS', 'Pertemuan'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 font-semibold ${i >= 2 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Belum ada kelas dengan dosen pengampu pada semester ini.
                    </td>
                  </tr>
                )}
                {rows.map((l) => {
                  const open = expanded.has(l.lecturerId);
                  return (
                    <React.Fragment key={l.lecturerId}>
                      <tr onClick={() => toggle(l.lecturerId)} className="hover:bg-slate-50/70 cursor-pointer">
                        <td className="px-3 py-3 text-slate-400">
                          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{l.name}</span>
                          <span className="font-mono text-[11px] text-slate-400">NIDN {l.nidn}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{l.studyProgram}</td>
                        <td className="px-4 py-3 text-right font-semibold">{l.totalClasses}</td>
                        <td className="px-4 py-3 text-right font-black text-[#1E3A8A]">{l.totalSks} SKS</td>
                        <td className="px-4 py-3 text-right text-slate-500">{l.totalMeetings}</td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/60">
                          <td />
                          <td colSpan={5} className="px-4 py-3">
                            <table className="w-full text-[11px]">
                              <thead className="text-slate-400">
                                <tr>
                                  <th className="text-left py-1 font-semibold">Mata Kuliah</th>
                                  <th className="text-left py-1 font-semibold">Kelas</th>
                                  <th className="text-left py-1 font-semibold">Jadwal</th>
                                  <th className="text-right py-1 font-semibold">SKS</th>
                                  <th className="text-right py-1 font-semibold">Pertemuan</th>
                                </tr>
                              </thead>
                              <tbody className="text-slate-700">
                                {l.classes.map((c) => (
                                  <tr key={c.id} className="border-t border-slate-200/70">
                                    <td className="py-1.5">
                                      <span className="font-semibold">{c.courseName}</span>{' '}
                                      <span className="font-mono text-slate-400">{c.courseCode}</span>
                                    </td>
                                    <td className="py-1.5">{c.className}</td>
                                    <td className="py-1.5">
                                      {c.day}, {c.time}
                                    </td>
                                    <td className="py-1.5 text-right">{c.sks}</td>
                                    <td className="py-1.5 text-right">{c.meetings}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            Total SKS = jumlah SKS mata kuliah dari seluruh kelas yang diampu dosen pada semester ini. Pertemuan terlaksana dihitung dari sesi presensi yang sudah dibuat dosen.
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
