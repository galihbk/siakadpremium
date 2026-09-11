'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { FileText, Search, Download, Plus, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface InvoiceItem {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  semester: number;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  dueDate?: string;
  status: 'LUNAS' | 'MENUNGGU VERIFIKASI' | 'TERTUNDA';
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function TagihanPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions`);
      if (res.ok) {
        const json = await res.json();
        const trxs = json.data?.transactions;
        if (Array.isArray(trxs)) {
          setInvoices(trxs);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat daftar tagihan dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((d) => {
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'LUNAS' && d.status === 'LUNAS') ||
      (filter === 'MENUNGGU' && (d.status === 'MENUNGGU VERIFIKASI' || (d.status as string) === 'MENUNGGU_VERIFIKASI')) ||
      (filter === 'TERTUNDA' && d.status === 'TERTUNDA');

    const matchSearch =
      d.nim.includes(search) ||
      d.studentName.toLowerCase().includes(search.toLowerCase()) ||
      d.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      d.studyProgram.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
                Manajemen Tagihan
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Daftar Tagihan Mahasiswa</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Kelola tagihan SPP/UKT seluruh mahasiswa aktif secara terintegrasi
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 text-right">
            <p className="text-xs text-blue-200">Total Tagihan Terbit</p>
            <p className="text-xl font-black text-white">{invoices.length} Tagihan</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-slate-100">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari NIM, nama, no invoice..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="ALL">Semua Status</option>
                <option value="LUNAS">Lunas</option>
                <option value="MENUNGGU">Menunggu Verifikasi</option>
                <option value="TERTUNDA">Tertunda / Belum Bayar</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchInvoices}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Buat Tagihan
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
                  {['No Invoice', 'NIM', 'Nama Mahasiswa', 'Prodi', 'Sem', 'Jenis Tagihan', 'Jumlah', 'Jatuh Tempo', 'Status'].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data tagihan perkuliahan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada tagihan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.invoiceNo}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{d.nim}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{d.studyProgram}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{d.semester}</td>
                      <td className="px-4 py-3 text-slate-600">{d.paymentType}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{formatRp(d.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{d.dueDate || '20 Sep 2026'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.status === 'MENUNGGU VERIFIKASI' || (d.status as string) === 'MENUNGGU_VERIFIKASI'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {(d.status as string) === 'MENUNGGU_VERIFIKASI' || d.status === 'MENUNGGU VERIFIKASI'
                            ? 'MENUNGGU VERIFIKASI'
                            : d.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
