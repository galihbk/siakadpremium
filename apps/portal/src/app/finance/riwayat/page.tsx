'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { ExportDropdown } from '@/components/common/ExportDropdown';
import { Search, RefreshCw, History } from 'lucide-react';

type Kind = 'MHS' | 'PMB';
type Status = 'LUNAS' | 'MENUNGGU' | 'BELUM';

interface HistoryRow {
  id: string;
  kind: Kind;
  time: number;
  dateLabel: string;
  ref: string;
  name: string;
  idNumber: string;
  purpose: string;
  method: string;
  amount: number;
  status: Status;
  verifier: string;
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

const fmtDate = (v?: string | null) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_LABEL: Record<Status, string> = { LUNAS: 'Lunas', MENUNGGU: 'Menunggu Verifikasi', BELUM: 'Belum Bayar' };
const STATUS_CLASS: Record<Status, string> = {
  LUNAS: 'bg-emerald-100 text-emerald-700',
  MENUNGGU: 'bg-amber-100 text-amber-700',
  BELUM: 'bg-rose-100 text-rose-700',
};

export default function RiwayatPembayaranPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'ALL' | Kind>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL');

  const load = async () => {
    setLoading(true);
    const api = getApiBaseUrl();
    const out: HistoryRow[] = [];
    try {
      const [trxRes, pmbRes] = await Promise.all([
        fetch(`${api}/finance/transactions?limit=all`, { cache: 'no-store' }),
        fetch(`${api}/admissions/admin/pmb/payments`, { cache: 'no-store' }),
      ]);

      if (trxRes.ok) {
        const json = await trxRes.json();
        const list: any[] = json?.data?.transactions ?? [];
        for (const t of list) {
          const raw = String(t.status || '');
          const status: Status = raw === 'LUNAS' ? 'LUNAS' : raw.replace('_', ' ') === 'MENUNGGU VERIFIKASI' ? 'MENUNGGU' : 'BELUM';
          const stamp = t.updatedAt || t.createdAt;
          out.push({
            id: `m-${t.id}`,
            kind: 'MHS',
            time: stamp ? new Date(stamp).getTime() || 0 : 0,
            dateLabel: (status === 'LUNAS' && t.paidAt) || fmtDate(stamp) || '-',
            ref: t.invoiceNo,
            name: t.studentName,
            idNumber: t.nim,
            purpose: [t.paymentType, t.semester ? `Smt ${t.semester}` : '', t.academicYear ? `TA ${t.academicYear}` : ''].filter(Boolean).join(' • '),
            method: t.paymentMethod || '-',
            amount: Number(t.amount) || 0,
            status,
            verifier: status === 'LUNAS' ? t.receiptNo || '' : '',
          });
        }
      }

      if (pmbRes.ok) {
        const json = await pmbRes.json();
        const list: any[] = json?.data ?? json ?? [];
        if (Array.isArray(list)) {
          for (const p of list) {
            const status: Status = p.status === 'PAID' ? 'LUNAS' : p.status === 'VERIFYING' ? 'MENUNGGU' : 'BELUM';
            const stamp = p.verifiedAt || p.paidAt || p.createdAt;
            out.push({
              id: `p-${p.id}`,
              kind: 'PMB',
              time: stamp ? new Date(stamp).getTime() || 0 : 0,
              dateLabel: fmtDate(stamp) || '-',
              ref: p.registrationNumber,
              name: p.applicantName,
              idNumber: p.registrationNumber,
              purpose: `${p.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Biaya Daftar Ulang'}${p.prodi ? ` • ${p.prodi}` : ''}`,
              method: p.paymentMethod || '-',
              amount: Number(p.amount) || 0,
              status,
              verifier: status === 'LUNAS' ? p.verifiedBy || '' : '',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat riwayat pembayaran:', err);
    }
    setRows(out);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter !== 'ALL' && r.kind !== kindFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.ref, r.name, r.idNumber, r.purpose, r.method].some((v) => v.toLowerCase().includes(q));
    });
  }, [rows, search, kindFilter, statusFilter]);

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } = useSortedPagination<HistoryRow>(filtered, 'time', 10, 'desc');

  const totals = useMemo(() => {
    const sum = (s: Status) => rows.filter((r) => r.status === s).reduce((a, r) => a + r.amount, 0);
    const count = (s: Status) => rows.filter((r) => r.status === s).length;
    return { paid: sum('LUNAS'), paidN: count('LUNAS'), waiting: sum('MENUNGGU'), waitingN: count('MENUNGGU'), unpaid: sum('BELUM'), unpaidN: count('BELUM') };
  }, [rows]);

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan" activeMenuHref="/finance/riwayat">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <History className="w-3.5 h-3.5" /> Arsip Keuangan
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Riwayat Pembayaran</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">Seluruh pembayaran mahasiswa dan calon mahasiswa baru (PMB), dari yang lunas sampai yang belum dibayar.</p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white border border-white/20 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sudah Diterima (Lunas)</span>
            <p className="text-2xl font-black text-emerald-700 mt-1">{formatRp(totals.paid)}</p>
            <span className="text-[11px] text-slate-500">{totals.paidN} pembayaran</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{formatRp(totals.waiting)}</p>
            <span className="text-[11px] text-slate-500">{totals.waitingN} pembayaran</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belum Dibayar</span>
            <p className="text-2xl font-black text-rose-700 mt-1">{formatRp(totals.unpaid)}</p>
            <span className="text-[11px] text-slate-500">{totals.unpaidN} tagihan</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor, nama, NIM, atau keterangan..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as 'ALL' | Kind)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="MHS">Mahasiswa</option>
                <option value="PMB">Calon Mahasiswa (PMB)</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | Status)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALL">Semua Status</option>
                <option value="LUNAS">Lunas</option>
                <option value="MENUNGGU">Menunggu Verifikasi</option>
                <option value="BELUM">Belum Bayar</option>
              </select>
            </div>
            <ExportDropdown
              data={filtered}
              filename="riwayat-pembayaran"
              title="Riwayat Pembayaran"
              columns={[
                { header: 'Tanggal', accessor: (r) => r.dateLabel },
                { header: 'Jenis', accessor: (r) => (r.kind === 'MHS' ? 'Mahasiswa' : 'PMB') },
                { header: 'Nomor', accessor: (r) => r.ref },
                { header: 'Nama', accessor: (r) => r.name },
                { header: 'NIM / No. Registrasi', accessor: (r) => r.idNumber },
                { header: 'Keterangan', accessor: (r) => r.purpose },
                { header: 'Metode / Rekening Tujuan', accessor: (r) => r.method },
                { header: 'Jumlah', accessor: (r) => r.amount },
                { header: 'Status', accessor: (r) => STATUS_LABEL[r.status] },
              ]}
              pdfColumns={[
                { header: 'Tanggal', accessor: (r) => r.dateLabel },
                { header: 'Nomor', accessor: (r) => r.ref },
                { header: 'Nama', accessor: (r) => r.name },
                { header: 'Keterangan', accessor: (r) => r.purpose },
                { header: 'Jumlah', accessor: (r) => formatRp(r.amount) },
                { header: 'Status', accessor: (r) => STATUS_LABEL[r.status] },
              ]}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTh<HistoryRow> label="Tanggal" column="time" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-slate-500 font-semibold">Jenis</th>
                  <SortableTh<HistoryRow> label="Nomor" column="ref" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<HistoryRow> label="Nama" column="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-slate-500 font-semibold">Keterangan</th>
                  <th className="px-4 py-3 text-left text-slate-500 font-semibold">Metode / Rekening Tujuan</th>
                  <SortableTh<HistoryRow> label="Jumlah" column="amount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <SortableTh<HistoryRow> label="Status" column="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Memuat riwayat pembayaran...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                      Belum ada riwayat pembayaran yang cocok.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.dateLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.kind === 'MHS' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                          {r.kind === 'MHS' ? 'Mahasiswa' : 'PMB'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{r.ref}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{r.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{r.idNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[16rem]">{r.purpose}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[16rem]">{r.method}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{formatRp(r.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                        {r.verifier && <p className="text-[10px] text-slate-400 mt-0.5">{r.verifier}</p>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="pembayaran" />
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
