'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ShieldCheck, Check, X, Eye, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';

interface Trx {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  amount: number;
  paymentMethod: string;
  paymentType?: string;
  semester?: number;
  academicYear?: string;
  paidAt?: string;
  notes?: string;
  status: string;
}

interface PmbPay {
  id: string;
  registrationNumber: string;
  applicantName: string;
  prodi: string;
  type: 'REGISTRATION' | 'RE_REGISTRATION';
  amount: number;
  status: 'PENDING' | 'VERIFYING' | 'PAID';
  proofUrl?: string | null;
}

/** Bukti transfer mahasiswa tersimpan di catatan tagihan: "Bukti transfer diunggah mahasiswa: <url>". */
function proofFromNotes(notes?: string): string | null {
  const m = notes?.match(/diunggah mahasiswa:\s*(\S+)/i);
  return m ? m[1] : null;
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function VerifikasiPage() {
  const [data, setData] = useState<Trx[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'mhs' | 'pmb'>('mhs');
  const [pmbPays, setPmbPays] = useState<PmbPay[]>([]);
  const [proofView, setProofView] = useState<{ url: string; title: string } | null>(null);

  const fetchPmb = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/admissions/admin/pmb/payments`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const list = json?.data ?? json;
        if (Array.isArray(list)) setPmbPays(list);
      }
    } catch {
      // biarkan kosong
    }
  };

  const pmbDecision = async (id: string, name: string, status: 'PAID' | 'PENDING') => {
    setActionLoading(id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/admissions/admin/pmb/payments/${id}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, verifiedBy: 'Biro Keuangan' }),
      });
      if (!res.ok) throw new Error();
      showToast(status === 'PAID' ? `Pembayaran PMB ${name} dinyatakan LUNAS.` : `Bukti PMB ${name} ditolak; pendaftar diminta mengunggah ulang.`);
      await fetchPmb();
    } catch {
      showToast('Gagal memproses pembayaran PMB.');
    } finally {
      setActionLoading(null);
    }
  };

  const rejectMhs = async (id: string, name: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      showToast(`Bukti ${name} ditolak; mahasiswa diminta mengunggah ulang.`);
      await fetchVerifications();
    } catch {
      showToast('Gagal menolak bukti pembayaran.');
    } finally {
      setActionLoading(null);
    }
  };

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
    fetchPmb();
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

  const pmbPending = pmbPays.filter((x) => x.status === 'VERIFYING');
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
              Periksa bukti transfer mahasiswa dan calon mahasiswa baru (PMB), lalu setujui atau tolak.
            </p>
          </div>
          <button
            onClick={() => {
              fetchVerifications();
              fetchPmb();
            }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 flex items-center gap-1">
            {([
              ['mhs', `Pembayaran Mahasiswa (${pendingList.length})`],
              ['pmb', `Pembayaran PMB (${pmbPending.length})`],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                  tab === key ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'pmb' && (
            <div className="divide-y divide-slate-100">
              {pmbPending.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">Tidak ada pembayaran PMB yang menunggu.</p>
                </div>
              ) : (
                pmbPending.map((pp) => (
                  <div key={pp.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">MENUNGGU VERIFIKASI</span>
                        <span className="text-xs font-mono font-bold text-slate-500">{pp.registrationNumber}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{pp.applicantName}</p>
                      <p className="text-xs text-slate-500">
                        {pp.prodi} &middot; {pp.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Biaya Daftar Ulang'}
                      </p>
                      <p className="text-sm font-black text-[#1E3A8A] mt-1">{formatRp(pp.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={!pp.proofUrl}
                        onClick={() => pp.proofUrl && setProofView({ url: pp.proofUrl, title: `Bukti ${pp.applicantName}` })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Bukti
                      </button>
                      <button
                        onClick={() => pmbDecision(pp.id, pp.applicantName, 'PENDING')}
                        disabled={actionLoading === pp.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Tolak
                      </button>
                      <button
                        onClick={() => pmbDecision(pp.id, pp.applicantName, 'PAID')}
                        disabled={actionLoading === pp.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Setujui Lunas
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className={`divide-y divide-slate-100 ${tab === 'pmb' ? 'hidden' : ''}`}>
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
                    <p className="text-xs text-slate-700 mt-1">
                      Pembayaran untuk: <strong>{t.paymentType || 'Tagihan'}</strong>
                      {t.semester ? ` • Semester ${t.semester}` : ''}
                      {t.academicYear ? ` • TA ${t.academicYear}` : ''}
                    </p>
                    <p className="text-sm font-black text-[#1E3A8A] mt-1">{formatRp(t.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={!proofFromNotes(t.notes)}
                      onClick={() => {
                        const u = proofFromNotes(t.notes);
                        if (u) setProofView({ url: u, title: `Bukti ${t.invoiceNo}` });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Bukti
                    </button>
                    <button
                      onClick={() => rejectMhs(t.id, t.studentName)}
                      disabled={actionLoading === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Tolak
                    </button>
                    <button
                      onClick={() => approve(t.id, t.studentName)}
                      disabled={actionLoading === t.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] transition-colors disabled:opacity-50 cursor-pointer"
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

        <Modal isOpen={!!proofView} onClose={() => setProofView(null)} title={proofView?.title || 'Bukti Pembayaran'}>
          {proofView && (
            <div className="space-y-3">
              {/\.pdf($|\?)/i.test(proofView.url) ? (
                <iframe src={proofView.url} className="w-full h-[60vh] rounded-lg border border-slate-200" title="Bukti pembayaran" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofView.url} alt="Bukti pembayaran" className="w-full max-h-[65vh] object-contain rounded-lg border border-slate-200" />
              )}
              <a href={proofView.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#1E3A8A] hover:underline">
                Buka di tab baru
              </a>
            </div>
          )}
        </Modal>

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
