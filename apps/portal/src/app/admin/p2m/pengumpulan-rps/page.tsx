'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';

interface Row {
  classId: string;
  courseCode: string;
  courseName: string;
  studyProgram: string;
  className: string;
  lecturerName: string;
  status: string;
  submittedAt: string | null;
  validatedBy: string | null;
}
interface Summary {
  total: number;
  sudah: number;
  belum: number;
  menunggu: number;
  disahkan: number;
  revisi: number;
}
interface Data {
  year: { id: string; name: string; isActive: boolean } | null;
  years: { id: string; name: string; isActive: boolean }[];
  studyPrograms: string[];
  summary: Summary;
  items: Row[];
}

const STATUS_LABEL: Record<string, string> = {
  BELUM_DIAJUKAN: 'Belum mengumpulkan',
  DIAJUKAN: 'Menunggu pengesahan prodi',
  DISAHKAN: 'Disahkan prodi',
  PERLU_REVISI: 'Perlu revisi',
};
const STATUS_STYLE: Record<string, string> = {
  BELUM_DIAJUKAN: 'bg-rose-50 text-rose-600',
  DIAJUKAN: 'bg-amber-100 text-amber-700',
  DISAHKAN: 'bg-emerald-100 text-emerald-700',
  PERLU_REVISI: 'bg-orange-100 text-orange-700',
};

const selectCls =
  'px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

function Stat({ label, value, tone = 'text-slate-900' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-2xl font-black mt-0.5 ${tone}`}>{value}</p>
    </div>
  );
}

function RpsTable({ rows, loading }: { rows: Row[]; loading: boolean }) {
  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } = useSortedPagination<Row>(rows, 'lecturerName', 15, 'asc');
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <SortableTh<Row> label="Dosen" column="lecturerName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<Row> label="Mata Kuliah" column="courseName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<Row> label="Kelas" column="className" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableTh<Row> label="Program Studi" column="studyProgram" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 text-left text-slate-500 font-semibold">Status RPS</th>
              <SortableTh<Row> label="Diajukan" column="submittedAt" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada kelas yang cocok pada tahun akademik ini.
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.classId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.lecturerName}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{r.courseName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{r.courseCode}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.className}</td>
                  <td className="px-4 py-3 text-slate-600">{r.studyProgram}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={rows.length} pageSize={pageSize} itemLabel="kelas" />}
    </>
  );
}

export default function AdminP2mPengumpulanRpsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [yearId, setYearId] = useState('');
  const [status, setStatus] = useState('Semua');
  const [prodi, setProdi] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (yearId) params.set('academicYearId', yearId);
      if (status !== 'Semua') params.set('status', status);
      if (prodi !== 'Semua') params.set('studyProgram', prodi);
      if (search.trim()) params.set('search', search.trim());
      const { token } = getAuthSession();
      const res = await fetch(`${getApiBaseUrl()}/p2m/rps-submissions?${params.toString()}`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Gagal memuat data pengumpulan RPS.');
      const d: Data = json.data ?? json;
      setData(d);
      if (!yearId && d.year) setYearId(d.year.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data pengumpulan RPS.');
    } finally {
      setLoading(false);
    }
  }, [yearId, status, prodi, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const s = data?.summary;
  const pct = s && s.total > 0 ? Math.round((s.sudah / s.total) * 100) : 0;

  return (
    <PortalLayout role="p2m" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">P2M</span>
            <h1 className="text-xl sm:text-2xl font-black">Pengumpulan RPS</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
              Pantau dosen dan kelas yang sudah mengumpulkan RPS pada satu tahun akademik. Pengesahan RPS dilakukan oleh Program Studi.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <p className="text-xs text-blue-200">Sudah mengumpulkan</p>
            <p className="text-xl font-black text-white">{pct}%</p>
          </div>
        </div>

        {s && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Stat label="Total kelas" value={s.total} />
            <Stat label="Sudah mengumpulkan" value={s.sudah} tone="text-emerald-600" />
            <Stat label="Belum mengumpulkan" value={s.belum} tone="text-rose-600" />
            <Stat label="Menunggu prodi" value={s.menunggu} tone="text-amber-600" />
            <Stat label="Perlu revisi" value={s.revisi} tone="text-orange-600" />
          </div>
        )}

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">{error}</div>}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari dosen atau mata kuliah..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={yearId} onChange={(e) => setYearId(e.target.value)} className={selectCls} aria-label="Tahun akademik">
                {(data?.years ?? []).map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name}
                    {y.isActive ? ' (aktif)' : ''}
                  </option>
                ))}
              </select>
              <select value={prodi} onChange={(e) => setProdi(e.target.value)} className={selectCls} aria-label="Program studi">
                <option value="Semua">Semua program studi</option>
                {(data?.studyPrograms ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls} aria-label="Status">
                <option value="Semua">Semua status</option>
                <option value="SUDAH">Sudah mengumpulkan</option>
                <option value="BELUM_DIAJUKAN">Belum mengumpulkan</option>
                <option value="DIAJUKAN">Menunggu pengesahan prodi</option>
                <option value="DISAHKAN">Disahkan prodi</option>
                <option value="PERLU_REVISI">Perlu revisi</option>
              </select>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </button>
            </div>
          </div>
          <RpsTable rows={data?.items ?? []} loading={loading && !data} />
        </div>
      </div>
    </PortalLayout>
  );
}
