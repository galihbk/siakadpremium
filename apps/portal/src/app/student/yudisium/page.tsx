'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { Award, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Send, Clock, X, GraduationCap } from 'lucide-react';

interface Requirement {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

interface Application {
  id: string;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  sksLulus: number;
  sksRequired: number;
  ipk: number | null;
  thesisGrade: string | null;
  predicate: string | null;
  graduationDate: string | null;
  skNumber: string | null;
  adminNote: string | null;
  appliedAt: string;
  decidedAt: string | null;
}

interface GraduationMe {
  requirements: Requirement[];
  eligible: boolean;
  summary: { sksLulus: number; sksRequired: number; ipk: number | null; thesisGrade: string | null; predicate: string };
  application: Application | null;
}

async function api<T>(path: string, init?: { method?: string }): Promise<T> {
  const { token } = getAuthSession();
  const res = await fetch(`${getApiBaseUrl()}/graduation${path}`, {
    method: init?.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const json = await res.json().catch(() => null);
  const data = json?.data ?? json;
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(message || `Permintaan gagal (HTTP ${res.status}).`);
  }
  return data as T;
}

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

export default function StudentYudisiumPage() {
  const user = getAuthSession().user;
  const [data, setData] = useState<GraduationMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<GraduationMe>('/me'));
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat data yudisium.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async () => {
    setBusy(true);
    try {
      await api('/me/apply', { method: 'POST' });
      notify(true, 'Pendaftaran yudisium terkirim. Menunggu verifikasi BAAK.');
      await load();
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal mendaftar yudisium.');
    } finally {
      setBusy(false);
    }
  };

  const app = data?.application || null;
  const canApply = !!data?.eligible && (!app || app.status === 'REJECTED');

  return (
    <PortalLayout
      role="student"
      userName={user?.fullName || 'Mahasiswa'}
      userIdText={user?.nim ? `NIM: ${user.nim}` : 'Portal Mahasiswa'}
    >
      <div className="space-y-6 pb-12">
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${
              toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="max-w-sm">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Yudisium &amp; Kelulusan</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Pastikan seluruh syarat kelulusan terpenuhi, lalu daftar yudisium. BAAK akan memverifikasi dan menetapkan
                kelulusan Anda.
              </p>
            </div>
          </div>
        </div>

        {loading || !data ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : (
          <>
            {/* Hasil kelulusan */}
            {app?.status === 'APPROVED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <GraduationCap className="w-12 h-12 text-emerald-600 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Dinyatakan Lulus</p>
                  <p className="text-xl font-black text-emerald-900">{app.predicate || data.summary.predicate}</p>
                  <p className="text-[13px] text-emerald-800">
                    IPK {app.ipk?.toFixed(2) ?? '-'} · {app.sksLulus} SKS · tanggal kelulusan {fmtDate(app.graduationDate)}
                  </p>
                  <p className="text-[12px] text-emerald-700">No. SK Yudisium: {app.skNumber}</p>
                </div>
              </div>
            )}

            {app?.status === 'SUBMITTED' && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border bg-blue-50 border-blue-200 text-blue-800 text-[13px]">
                <Clock className="w-5 h-5 shrink-0" />
                <span>
                  Pendaftaran yudisium Anda diterima pada {fmtDate(app.appliedAt)} dan sedang <b>menunggu verifikasi BAAK</b>.
                </span>
              </div>
            )}

            {app?.status === 'REJECTED' && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800 text-[13px]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>
                  Pendaftaran yudisium ditolak: <b>{app.adminNote}</b>. Perbaiki syarat yang kurang lalu daftar kembali.
                </span>
              </div>
            )}

            {/* Ringkasan */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SKS Lulus</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {data.summary.sksLulus}{' '}
                  <span className="text-sm font-semibold text-slate-400">/ {data.summary.sksRequired}</span>
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">IPK</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{data.summary.ipk?.toFixed(2) ?? '-'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Perkiraan Predikat</p>
                <p className="text-base font-black text-slate-900 mt-1">{data.summary.predicate}</p>
              </div>
            </div>

            {/* Checklist syarat */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-bold text-sm text-slate-900">Syarat Yudisium</h2>
              <ul className="divide-y divide-slate-100">
                {data.requirements.map((r) => (
                  <li key={r.key} className="py-2.5 flex items-start gap-3">
                    {r.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">{r.label}</p>
                      <p className={`text-[12px] ${r.ok ? 'text-slate-500' : 'text-rose-600'}`}>{r.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {(!app || app.status === 'REJECTED') && (
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={apply}
                    disabled={busy || !canApply}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Daftar Yudisium
                  </button>
                  {!data.eligible && (
                    <span className="text-[12px] text-slate-500">Tombol aktif setelah semua syarat di atas terpenuhi.</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
