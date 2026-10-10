'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Search, Download, RefreshCw, Lock, Unlock, Loader2 } from 'lucide-react';

interface HonorRow {
  userId: string;
  fullName: string;
  email: string;
  category: 'Dosen' | 'Karyawan';
  studyProgram: string | null;
  nidn: string | null;
  totalClasses: number;
  totalSks: number;
  baseSalary: number;
  totalTunjangan: number;
  totalPotongan: number;
  honorMengajar: number;
  hadirPagi: number;
  hadirSore: number;
  transportTotal: number;
  totalHonor: number;
  isPaid: boolean;
  paidAt: string | null;
}

interface HonorRecap {
  academicYears: { id: string; name: string; semesterType: string; isActive: boolean }[];
  selectedAcademicYearId: string | null;
  transportRate: { ratePagi: number; rateSore: number };
  periodMonth: number;
  periodYear: number;
  rows: HonorRow[];
  totals: {
    count: number;
    totalBaseSalary: number;
    totalHonorMengajar: number;
    totalTunjangan: number;
    totalPotongan: number;
    totalTransport: number;
    grandTotal: number;
    totalPaid: number;
  } | null;
}

const SEMESTER_LABEL: Record<string, string> = { ODD: 'Gasal', EVEN: 'Genap', SHORT: 'Pendek' };
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

export default function RekapHonorPage() {
  const now = new Date();
  const [recap, setRecap] = useState<HonorRecap | null>(null);
  const [yearId, setYearId] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | 'Dosen' | 'Karyawan'>('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const load = useCallback(async (id?: string, m?: number, y?: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (id) params.set('academicYearId', id);
      params.set('month', String(m ?? month));
      params.set('year', String(y ?? year));
      const res = await fetch(`${getApiBaseUrl()}/finance/honor-recap?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRecap(json.data);
      setYearId(json.data.selectedAcademicYearId ?? '');
      setError(false);
    } catch (err) {
      console.error('Gagal memuat rekap honor', err);
      setError(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(undefined, month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const handleMarkPaid = async (row: HonorRow) => {
    if (!confirm(`Tandai honor ${row.fullName} untuk ${MONTH_NAMES[month - 1]} ${year} sebagai sudah dibayar?\n\nAngka saat ini akan dibekukan -- perubahan data SKS/tarif setelah ini tidak akan mengubah nominal yang sudah ditandai dibayar.`)) {
      return;
    }
    setTogglingUserId(row.userId);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/honor-recap/${row.userId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academicYearId: yearId || undefined, month, year }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load(yearId, month, year);
    } catch (err) {
      console.error('Gagal menandai honor sudah dibayar', err);
      alert('Gagal menandai honor sudah dibayar.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleUnmarkPaid = async (row: HonorRow) => {
    if (!confirm(`Batalkan status sudah dibayar untuk ${row.fullName} di periode ${MONTH_NAMES[month - 1]} ${year}? Nominal akan kembali dihitung live.`)) {
      return;
    }
    setTogglingUserId(row.userId);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/finance/honor-recap/${row.userId}/mark-paid?month=${month}&year=${year}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load(yearId, month, year);
    } catch (err) {
      console.error('Gagal membatalkan status bayar', err);
      alert('Gagal membatalkan status bayar.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (recap?.rows ?? []).filter((r) => {
      const matchSearch =
        !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.nidn ?? '').includes(q);
      const matchCategory = categoryFilter === 'Semua' || r.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [recap, search, categoryFilter]);

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<HonorRow>(filtered, 'fullName');

  const t = recap?.totals;

  const exportCsv = () => {
    const header = ['Nama', 'Kategori', 'Program Studi', 'Total SKS', 'Gaji Pokok', 'Honor Mengajar/Bulan', 'Tunjangan', 'Potongan', 'Hadir Pagi', 'Hadir Sore', 'Uang Transport', 'Total Honor/Bulan', 'Status'];
    const lines = filtered.map((r) =>
      [
        `"${r.fullName}"`,
        r.category,
        `"${r.studyProgram ?? '-'}"`,
        r.totalSks,
        r.baseSalary,
        r.honorMengajar,
        r.totalTunjangan,
        r.totalPotongan,
        r.hadirPagi,
        r.hadirSore,
        r.transportTotal,
        r.totalHonor,
        r.isPaid ? 'Sudah Dibayar' : 'Belum Dibayar',
      ].join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Rekap_Honor_${MONTH_NAMES[month - 1]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Honor &amp; Pengajaran
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Rekap Honor Dosen &amp; Karyawan</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Periode pembayaran {MONTH_NAMES[month - 1]} {year} &mdash; gabungan gaji pokok, honor mengajar, tunjangan, dan transport
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={yearId}
              onChange={(e) => load(e.target.value, month, year)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white cursor-pointer"
            >
              {(recap?.academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {SEMESTER_LABEL[y.semesterType] ?? y.semesterType}
                  {y.isActive ? ' (Aktif)' : ''}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => {
                const m = Number(e.target.value);
                setMonth(m);
                load(yearId, m, year);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white cursor-pointer"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>Bulan Bayar: {m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => {
                const y = Number(e.target.value);
                setYear(y);
                load(yearId, month, y);
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white cursor-pointer"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => load(yearId, month, year)}
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
            Gagal memuat rekap honor dari server.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          {[
            { label: 'Jumlah Pegawai', val: t?.count ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Sudah Dibayar', val: `${t?.totalPaid ?? 0}/${t?.count ?? 0}`, cls: 'bg-teal-50 border-teal-100 text-teal-700' },
            { label: 'Total Gaji Pokok', val: formatRupiah(t?.totalBaseSalary ?? 0), cls: 'bg-indigo-50 border-indigo-100 text-indigo-700', small: true },
            { label: 'Total Honor Mengajar/Bulan', val: formatRupiah(t?.totalHonorMengajar ?? 0), cls: 'bg-amber-50 border-amber-100 text-amber-700', small: true },
            { label: 'Total Uang Transport', val: formatRupiah(t?.totalTransport ?? 0), cls: 'bg-sky-50 border-sky-100 text-sky-700', small: true },
            { label: 'Total Potongan/Bulan', val: formatRupiah(t?.totalPotongan ?? 0), cls: 'bg-rose-50 border-rose-100 text-rose-700', small: true },
            { label: 'Total Rekap Honor/Bulan', val: formatRupiah(t?.grandTotal ?? 0), cls: 'bg-emerald-50 border-emerald-100 text-emerald-700', small: true },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl p-4 border shadow-sm ${c.cls}`}>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={c.small ? 'text-lg font-black' : 'text-2xl font-black'}>{c.val}</p>
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
                placeholder="Cari nama, email, atau NIDN..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {(['Semua', 'Dosen', 'Karyawan'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                      categoryFilter === c ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <SortableTh<HonorRow> label="Nama" column="fullName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<HonorRow> label="Kategori" column="category" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<HonorRow> label="SKS" column="totalSks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Gaji Pokok" column="baseSalary" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Honor Mengajar/Bulan" column="honorMengajar" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Tunjangan" column="totalTunjangan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Potongan" column="totalPotongan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Transport" column="transportTotal" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Total Honor" column="totalHonor" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                  <SortableTh<HonorRow> label="Status" column="isPaid" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      Tidak ada data yang cocok.
                    </td>
                  </tr>
                )}
                {paginated.map((r) => (
                  <tr key={r.userId} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 block">{r.fullName}</span>
                      <span className="text-[11px] text-slate-400">
                        {r.studyProgram ?? r.email}
                        {r.nidn ? ` · NIDN ${r.nidn}` : ''}
                      </span>
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
                    <td className="px-4 py-3 text-right text-slate-600">{r.category === 'Dosen' ? `${r.totalSks} SKS` : '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRupiah(r.baseSalary)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {r.category === 'Dosen' ? formatRupiah(r.honorMengajar) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {r.totalTunjangan > 0 ? `+${formatRupiah(r.totalTunjangan)}` : formatRupiah(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-600">
                      {r.totalPotongan > 0 ? `-${formatRupiah(r.totalPotongan)}` : formatRupiah(0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sky-600">
                      {r.transportTotal > 0 ? (
                        <span title={`${r.hadirPagi}x pagi, ${r.hadirSore}x sore`}>+{formatRupiah(r.transportTotal)}</span>
                      ) : (
                        formatRupiah(0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-[#1E3A8A]">{formatRupiah(r.totalHonor)}</td>
                    <td className="px-4 py-3 text-right">
                      {r.isPaid ? (
                        <button
                          onClick={() => handleUnmarkPaid(r)}
                          disabled={togglingUserId === r.userId}
                          title={r.paidAt ? `Dibayar pada ${new Date(r.paidAt).toLocaleString('id-ID')}` : undefined}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                        >
                          {togglingUserId === r.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                          Sudah Dibayar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkPaid(r)}
                          disabled={togglingUserId === r.userId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
                        >
                          {togglingUserId === r.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                          Tandai Dibayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
              itemLabel="pegawai"
            />
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p>
              Honor Mengajar/Bulan = jumlah dari tiap kelas (SKS &times; Tarif Jenjang Prodi Kelas &times; 14 pertemuan &divide; 6 kali pembayaran). Atur tarif di menu Tarif Honor per Jenjang.
            </p>
            <p>
              Transport = (Jumlah Hadir Pagi &times; Tarif Pagi) + (Jumlah Hadir Sore &times; Tarif Sore), dihitung dari Absensi Harian sepanjang semester ini.
            </p>
            <p>Total Honor/Bulan = Gaji Pokok + Tunjangan &minus; Potongan + Honor Mengajar/Bulan + Transport. Atur tarif di menu Tarif Uang Transport.</p>
            <p>
              Klik &quot;Tandai Dibayar&quot; untuk membekukan nominal periode bulan ini per pegawai. Setelah ditandai, koreksi data SKS/tarif/absensi berikutnya tidak akan mengubah angka yang sudah dibayar itu.
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
