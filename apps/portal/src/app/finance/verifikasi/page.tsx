'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ShieldCheck, Check, X, Eye, RefreshCw, Database } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface Trx {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  amount: number;
  paymentMethod: string;
  paidAt?: string;
  notes?: string;
  status: string;
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function VerifikasiPage() {
  const [data, setData] = useState<Trx[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions`);
      if (res.ok) {
        const json = await res.json();
        const trxs = json.data?.transactions;
        if (Array.isArray(trxs)) {
          setData(trxs);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat transaksi untuk verifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  };

  const approve = async (id: string, studentName: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions/${id}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast(`Pembayaran ${studentName} berhasil diverifikasi LUNAS di database.`);
        await fetchVerifications();
      } else {
        showToast('Gagal memverifikasi di database.');
      }
    } catch (err) {
      showToast(`Error verifikasi: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingList = data.filter(
    (t) => t.status === 'MENUNGGU VERIFIKASI' || t.status === 'MENUNGGU_VERIFIKASI',
  );

  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
                Verifikasi Manual
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">Verifikasi Pembayaran</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Periksa dan setujui bukti konfirmasi pembayaran mahasiswa.
            </p>
          </div>
          <button
            onClick={fetchVerifications}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Menunggu Verifikasi ({pendingList.length})</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Memeriksa antrian verifikasi...</span>
              </div>
            ) : pendingList.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-600">Semua transaksi telah diverifikasi!</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada pembayaran manual yang menunggu verifikasi saat ini.</p>
              </div>
            ) : (
              pendingList.map((t) => (
                <div key={t.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">
                        MENUNGGU VERIFIKASI
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">{t.invoiceNo}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {t.studentName} <span className="font-mono text-slate-500 font-normal">({t.nim})</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.studyProgram} · {t.paymentMethod}
                    </p>
                    {t.notes && <p className="text-xs text-slate-400 italic mt-0.5">Catatan: {t.notes}</p>}
                    <p className="text-sm font-black text-[#1E3A8A] mt-1">{formatRp(t.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => showToast(`Bukti transfer untuk ${t.invoiceNo} siap ditinjau.`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Bukti
                    </button>
                    <button
                      onClick={() => approve(t.id, t.studentName)}
                      disabled={actionLoading === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === t.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Setujui Lunas
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            {toast}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
