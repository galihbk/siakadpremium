'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import {
  Search,
  RefreshCw,
  Download,
  Upload,
  X,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Check,
  CalendarDays,
  CalendarRange,
} from 'lucide-react';

interface MonthlyRow {
  userId: string;
  fullName: string;
  email: string;
  category: 'Dosen' | 'Karyawan';
  studyProgram: string | null;
  shiftName: string | null;
  hadirPagi: number;
  hadirSore: number;
  telatPagi: number;
  telatSore: number;
}

interface YearlyRow {
  userId: string;
  fullName: string;
  email: string;
  category: 'Dosen' | 'Karyawan';
  studyProgram: string | null;
  shiftName: string | null;
  hadirPagi: number;
  hadirSore: number;
  telatPagi: number;
  telatSore: number;
  totalHariHadir: number;
  bulanAktif: number;
}

type Mode = 'bulanan' | 'tahunan';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function RekapAbsensiSdmPage() {
  const now = new Date();
  const [mode, setMode] = useState<Mode>('bulanan');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyRows, setMonthlyRows] = useState<MonthlyRow[]>([]);
  const [yearlyRows, setYearlyRows] = useState<YearlyRow[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Dosen' | 'Karyawan'>('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<{ email: string; date: string; pagi?: string; sore?: string }[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importParsing, setImportParsing] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const activeFilterCount =
    (categoryFilter !== 'Semua' ? 1 : 0) +
    (mode === 'bulanan' && (month !== now.getMonth() + 1 || year !== now.getFullYear()) ? 1 : 0) +
    (mode === 'tahunan' && year !== now.getFullYear() ? 1 : 0);

  const load = useCallback(async (m: Mode, mo: number, y: number) => {
    setLoading(true);
    try {
      if (m === 'bulanan') {
        const res = await fetch(`${getApiBaseUrl()}/attendance/recap?month=${mo}&year=${y}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setMonthlyRows((json.data ?? json).rows ?? []);
      } else {
        const res = await fetch(`${getApiBaseUrl()}/attendance/recap-tahunan?year=${y}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setYearlyRows((json.data ?? json).rows ?? []);
      }
      setError(false);
    } catch (err) {
      console.error('Gagal memuat rekap absensi', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(mode, month, year);
  }, [load, mode, month, year]);

  const filteredMonthly = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthlyRows.filter((r) => {
      const matchSearch = !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'Semua' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [monthlyRows, search, categoryFilter]);

  const filteredYearly = useMemo(() => {
    const q = search.trim().toLowerCase();
    return yearlyRows.filter((r) => {
      const matchSearch = !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'Semua' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [yearlyRows, search, categoryFilter]);

  const monthlyPagination = useSortedPagination<MonthlyRow>(filteredMonthly, 'fullName');
  const yearlyPagination = useSortedPagination<YearlyRow>(filteredYearly, 'fullName');

  const monthlyTotals = useMemo(
    () => ({
      count: filteredMonthly.length,
      totalHadirPagi: filteredMonthly.reduce((a, r) => a + r.hadirPagi, 0),
      totalHadirSore: filteredMonthly.reduce((a, r) => a + r.hadirSore, 0),
      totalTelat: filteredMonthly.reduce((a, r) => a + r.telatPagi + r.telatSore, 0),
    }),
    [filteredMonthly],
  );

  const yearlyTotals = useMemo(
    () => ({
      count: filteredYearly.length,
      totalHadirPagi: filteredYearly.reduce((a, r) => a + r.hadirPagi, 0),
      totalHadirSore: filteredYearly.reduce((a, r) => a + r.hadirSore, 0),
      totalTelat: filteredYearly.reduce((a, r) => a + r.telatPagi + r.telatSore, 0),
      rataBulanAktif:
        filteredYearly.length > 0
          ? Math.round((filteredYearly.reduce((a, r) => a + r.bulanAktif, 0) / filteredYearly.length) * 10) / 10
          : 0,
    }),
    [filteredYearly],
  );

  const exportCsv = () => {
    if (mode === 'bulanan') {
      const header = ['Nama', 'Kategori', 'Shift', 'Hadir Pagi', 'Hadir Sore', 'Telat Pagi', 'Telat Sore'];
      const lines = filteredMonthly.map((r) =>
        [`"${r.fullName}"`, r.category, `"${r.shiftName ?? '-'}"`, r.hadirPagi, r.hadirSore, r.telatPagi, r.telatSore].join(','),
      );
      const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Rekap_Absensi_${MONTH_NAMES[month - 1]}_${year}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      const header = ['Nama', 'Kategori', 'Shift', 'Hadir Pagi', 'Hadir Sore', 'Telat Pagi', 'Telat Sore', 'Total Hari Hadir', 'Bulan Aktif'];
      const lines = filteredYearly.map((r) =>
        [`"${r.fullName}"`, r.category, `"${r.shiftName ?? '-'}"`, r.hadirPagi, r.hadirSore, r.telatPagi, r.telatSore, r.totalHariHadir, r.bulanAktif].join(','),
      );
      const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Rekap_Absensi_Tahunan_${year}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const openImport = () => {
    setImportRows([]);
    setImportFileName('');
    setImportResult(null);
    setImportOpen(true);
  };

  const toDateStr = (v: any): string => {
    if (v instanceof Date) {
      const yy = v.getFullYear();
      const mm = String(v.getMonth() + 1).padStart(2, '0');
      const dd = String(v.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    }
    return String(v ?? '').trim();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportParsing(true);
    setImportResult(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const rows = json
        .map((r) => ({
          email: String(r.Email ?? r.email ?? '').trim(),
          date: toDateStr(r.Tanggal ?? r.tanggal ?? r.Date ?? r.date),
          pagi: String(r.Pagi ?? r.pagi ?? '').trim(),
          sore: String(r.Sore ?? r.sore ?? '').trim(),
        }))
        .filter((r) => r.email && r.date);

      setImportRows(rows);
      setImportFileName(file.name);
    } catch (err) {
      console.error('Gagal membaca file Excel', err);
      alert('Gagal membaca file Excel. Pastikan format file benar (.xlsx).');
    } finally {
      setImportParsing(false);
      e.target.value = '';
    }
  };

  const submitImport = async () => {
    if (importRows.length === 0) return;
    setImportSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/attendance/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importRows }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.data ?? json;
      setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0, errors: data.errors ?? [] });
      await load(mode, month, year);
    } catch (err) {
      console.error('Gagal mengimpor absensi', err);
      alert('Gagal mengimpor data absensi. Coba lagi.');
    } finally {
      setImportSubmitting(false);
    }
  };

  return (
    <PortalLayout role="sdm" userName="Dewi Lestari, S.Psi., M.M." userIdText="Kepala Biro SDM & Kepegawaian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Kehadiran
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Rekap Absensi</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Kehadiran pagi/sore seluruh dosen & karyawan &mdash;{' '}
              {mode === 'bulanan' ? `${MONTH_NAMES[month - 1]} ${year}` : `Tahun ${year}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20">
              <button
                onClick={() => setMode('bulanan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  mode === 'bulanan' ? 'bg-white text-[#1E3A8A]' : 'text-white/80 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Bulanan
              </button>
              <button
                onClick={() => setMode('tahunan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  mode === 'tahunan' ? 'bg-white text-[#1E3A8A]' : 'text-white/80 hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Tahunan
              </button>
            </div>
            <button
              onClick={() => load(mode, month, year)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold border border-white/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </button>
            <button
              onClick={openImport}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] hover:bg-[#b8860b] text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Excel
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs px-4 py-3">
            Gagal memuat rekap absensi dari server.
          </div>
        )}

        {mode === 'bulanan' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Jumlah Pegawai', val: monthlyTotals.count, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
              { label: 'Total Hadir Pagi', val: monthlyTotals.totalHadirPagi, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Total Hadir Sore', val: monthlyTotals.totalHadirSore, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
              { label: 'Total Terlambat', val: monthlyTotals.totalTelat, cls: 'bg-rose-50 border-rose-100 text-rose-700' },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
                <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                <p className="text-2xl font-black">{c.val}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Jumlah Pegawai', val: yearlyTotals.count, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
              { label: 'Total Hadir Pagi', val: yearlyTotals.totalHadirPagi, cls: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Total Hadir Sore', val: yearlyTotals.totalHadirSore, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
              { label: 'Total Terlambat', val: yearlyTotals.totalTelat, cls: 'bg-rose-50 border-rose-100 text-rose-700' },
              { label: 'Rata-rata Bulan Aktif', val: yearlyTotals.rataBulanAktif, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
            ].map((c) => (
              <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
                <p className="text-xs text-slate-500 mb-1">{c.label}</p>
                <p className="text-2xl font-black">{c.val}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
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
                onClick={exportCsv}
                disabled={(mode === 'bulanan' ? filteredMonthly : filteredYearly).length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor CSV
              </button>
            </div>
          </div>

          {mode === 'bulanan' ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <SortableTh<MonthlyRow> label="Nama" column="fullName" sortKey={monthlyPagination.sortKey} sortDir={monthlyPagination.sortDir} onSort={monthlyPagination.handleSort} />
                      <SortableTh<MonthlyRow> label="Kategori" column="category" sortKey={monthlyPagination.sortKey} sortDir={monthlyPagination.sortDir} onSort={monthlyPagination.handleSort} />
                      <SortableTh<MonthlyRow> label="Hadir Pagi" column="hadirPagi" sortKey={monthlyPagination.sortKey} sortDir={monthlyPagination.sortDir} onSort={monthlyPagination.handleSort} align="center" />
                      <SortableTh<MonthlyRow> label="Hadir Sore" column="hadirSore" sortKey={monthlyPagination.sortKey} sortDir={monthlyPagination.sortDir} onSort={monthlyPagination.handleSort} align="center" />
                      <SortableTh<MonthlyRow> label="Telat" column="telatPagi" sortKey={monthlyPagination.sortKey} sortDir={monthlyPagination.sortDir} onSort={monthlyPagination.handleSort} align="center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!loading && monthlyPagination.paginated.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    )}
                    {monthlyPagination.paginated.map((r) => (
                      <tr key={r.userId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{r.fullName}</span>
                          <span className="text-[11px] text-slate-400">{r.studyProgram ?? r.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              r.category === 'Dosen' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{r.hadirPagi}x</td>
                        <td className="px-4 py-3 text-right font-semibold">{r.hadirSore}x</td>
                        <td className="px-4 py-3 text-right">
                          {r.telatPagi + r.telatSore > 0 ? (
                            <span className="font-semibold text-rose-600">{r.telatPagi + r.telatSore}x</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <TablePagination
                  page={monthlyPagination.page}
                  totalPages={monthlyPagination.totalPages}
                  onPageChange={monthlyPagination.setPage}
                  totalItems={filteredMonthly.length}
                  pageSize={monthlyPagination.pageSize}
                  itemLabel="pegawai"
                />
              )}
            </>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <SortableTh<YearlyRow> label="Nama" column="fullName" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} />
                      <SortableTh<YearlyRow> label="Kategori" column="category" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} />
                      <SortableTh<YearlyRow> label="Hadir Pagi" column="hadirPagi" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} align="center" />
                      <SortableTh<YearlyRow> label="Hadir Sore" column="hadirSore" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} align="center" />
                      <SortableTh<YearlyRow> label="Telat" column="telatPagi" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} align="center" />
                      <SortableTh<YearlyRow> label="Total Hari Hadir" column="totalHariHadir" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} align="center" />
                      <SortableTh<YearlyRow> label="Bulan Aktif" column="bulanAktif" sortKey={yearlyPagination.sortKey} sortDir={yearlyPagination.sortDir} onSort={yearlyPagination.handleSort} align="center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!loading && yearlyPagination.paginated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    )}
                    {yearlyPagination.paginated.map((r) => (
                      <tr key={r.userId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{r.fullName}</span>
                          <span className="text-[11px] text-slate-400">{r.studyProgram ?? r.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              r.category === 'Dosen' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{r.hadirPagi}x</td>
                        <td className="px-4 py-3 text-right font-semibold">{r.hadirSore}x</td>
                        <td className="px-4 py-3 text-right">
                          {r.telatPagi + r.telatSore > 0 ? (
                            <span className="font-semibold text-rose-600">{r.telatPagi + r.telatSore}x</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[#1E3A8A]">{r.totalHariHadir} hari</td>
                        <td className="px-4 py-3 text-right text-slate-600">{r.bulanAktif}/12 bulan</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <TablePagination
                  page={yearlyPagination.page}
                  totalPages={yearlyPagination.totalPages}
                  onPageChange={yearlyPagination.setPage}
                  totalItems={filteredYearly.length}
                  pageSize={yearlyPagination.pageSize}
                  itemLabel="pegawai"
                />
              )}
            </>
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            {mode === 'tahunan'
              ? 'Rekap tahunan dipakai sebagai bahan evaluasi kehadiran pegawai setiap tahun.'
              : 'Beralih ke tampilan Tahunan untuk evaluasi kehadiran sepanjang tahun.'}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Rekap Absensi"
        subtitle="Persempit daftar pegawai berdasarkan periode & kategori"
      >
        <div className="space-y-4 text-xs">
          {mode === 'bulanan' ? (
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bulan</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahun</label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | 'Dosen' | 'Karyawan')}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Dosen">Dosen</option>
              <option value="Karyawan">Karyawan</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('Semua');
                setMonth(now.getMonth() + 1);
                setYear(now.getFullYear());
              }}
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

      {importOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-none">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E3A8A]" />
                <h2 className="text-sm font-bold text-slate-800">Import Absensi dari Excel</h2>
              </div>
              <button onClick={() => setImportOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-700">Format kolom file Excel (.xlsx):</p>
                <p><span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">Email</span> — email pegawai/dosen yang terdaftar</p>
                <p><span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">Tanggal</span> — format YYYY-MM-DD, mis. 2026-10-01</p>
                <p><span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">Pagi</span> — jam absen pagi, mis. 07:30 (kosongkan jika tidak hadir)</p>
                <p><span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">Sore</span> — jam absen sore, mis. 16:00 (kosongkan jika tidak hadir)</p>
              </div>

              <div>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#1E3A8A] hover:bg-blue-50/30 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">
                    {importFileName || 'Klik untuk pilih file .xlsx'}
                  </span>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              {importParsing && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca file...
                </div>
              )}

              {!importParsing && importRows.length > 0 && !importResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {importRows.length} baris siap diimpor dari &quot;{importFileName}&quot;
                </div>
              )}

              {importResult && (
                <div className="space-y-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {importResult.imported} data berhasil diimpor, {importResult.skipped} baris dilewati.
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <AlertTriangle className="w-4 h-4" /> {importResult.errors.length} peringatan:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 max-h-28 overflow-y-auto">
                        {importResult.errors.slice(0, 20).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50 flex-none">
              <button
                onClick={() => setImportOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                {importResult ? 'Tutup' : 'Batal'}
              </button>
              {!importResult && (
                <button
                  onClick={submitImport}
                  disabled={importRows.length === 0 || importSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer"
                >
                  {importSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Import {importRows.length > 0 ? `${importRows.length} Baris` : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
