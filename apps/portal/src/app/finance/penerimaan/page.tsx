'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { CreditCard, TrendingUp, CheckCircle2, Clock, Download, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface Transaction {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  paidAt?: string;
  status: string;
}

interface SummaryData {
  totalPenerimaan: number;
  targetPenerimaan: number;
  persentaseTarget: number;
  totalTunggakan: number;
  jumlahMahasiswaTunggakan: number;
  saldoKasBank: number;
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function PenerimaanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (Array.isArray(json.data.transactions)) {
            setTransactions(json.data.transactions);
          }
          if (json.data.summary) {
            setSummary(json.data.summary);
          }
        }
      }
    } catch (err) {
      console.warn('Gagal memuat penerimaan dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalDiterima = summary?.totalPenerimaan || 14850000000;
  const totalTunggakan = summary?.totalTunggakan || 3150000000;
  const pendingCount = transactions.filter(
    (t) => t.status === 'MENUNGGU VERIFIKASI' || t.status === 'MENUNGGU_VERIFIKASI',
  ).length;
  const lunasCount = transactions.filter((t) => t.status === 'LUNAS').length;

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
                Keuangan Mahasiswa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Penerimaan SPP &amp; UKT</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Monitoring penerimaan pembayaran mahasiswa semester aktif
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Diterima</p>
            <p className="text-lg font-black text-emerald-600">{formatRp(totalDiterima)}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Menunggu Verifikasi</p>
            <p className="text-lg font-black text-amber-600">{pendingCount} Transaksi</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Tertunggak</p>
            <p className="text-lg font-black text-red-600">{formatRp(totalTunggakan)}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Transaksi Lunas</p>
            <p className="text-lg font-black text-blue-700">
              {lunasCount} dari {transactions.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Daftar Transaksi Terbaru</h2>
            <div className="flex gap-2">
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
                  {['No Invoice', 'NIM', 'Nama Mahasiswa', 'Program Studi', 'Jenis', 'Jumlah', 'Tgl Bayar', 'Status', 'Channel'].map(
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
                        <span>Memuat data transaksi penerimaan...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Belum ada transaksi penerimaan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  transactions.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{d.invoiceNo}</td>
                      <td className="px-4 py-3 font-mono text-slate-600">{d.nim}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{d.studyProgram}</td>
                      <td className="px-4 py-3 text-slate-600">{d.paymentType}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{formatRp(d.amount)}</td>
                      <td className="px-4 py-3 text-slate-500">{d.paidAt || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : d.status === 'MENUNGGU VERIFIKASI' || d.status === 'MENUNGGU_VERIFIKASI'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {d.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI' : d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{d.paymentMethod}</td>
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
