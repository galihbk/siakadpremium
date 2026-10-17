'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpFromLine, CheckCircle2, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

interface Pending {
  krs: { ready: number; blockedClassNotInFeeder: number; blockedStudentNotInFeeder: number };
  nilai: { ready: number; blockedKrsNotInFeeder: number };
}

interface PushResult {
  success: boolean;
  message: string;
  failed?: number;
}

const COPY = {
  krs: {
    title: 'Push KRS ke Feeder',
    act: 'InsertPesertaKelasKuliah',
    desc: 'Mendaftarkan mahasiswa sebagai peserta kelas di Feeder. Hanya KRS berstatus Disetujui yang kelasnya sudah punya ID Feeder dan mahasiswanya sudah terdaftar (punya registrasi) di Feeder. Peserta yang ternyata sudah ada di Feeder hanya ditautkan, tidak dobel.',
    endpoint: 'krs/push',
    button: 'Push KRS ke Feeder',
  },
  nilai: {
    title: 'Push Nilai ke Feeder',
    act: 'UpdateNilaiPerkuliahanKelas',
    desc: 'Mengirim nilai akhir (angka, indeks, huruf) yang sudah berstatus Terbit untuk peserta yang sudah terdaftar di kelas Feeder. Lakukan Push Kelas dan Push KRS lebih dulu.',
    endpoint: 'nilai/push',
    button: 'Push Nilai ke Feeder',
  },
} as const;

/** Panel Push KRS / Nilai: menampilkan jumlah yang siap/tertahan, lalu mengirim maksimal 200 baris per proses. */
export function FeederPushPanel({ kind, onDone }: { kind: 'krs' | 'nilai'; onDone?: () => void }) {
  const copy = COPY[kind];
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PushResult | null>(null);
  const isSuperAdmin = getAuthSession().user?.role === 'SUPER_ADMIN';

  const loadPending = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/integration-settings/pddikti/krs-nilai/pending-push`);
      if (!res.ok) return;
      const json = await res.json();
      setPending(json.data ?? json);
    } catch {
      /* abaikan -- ringkasan hanya informasi */
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const ready = kind === 'krs' ? pending?.krs.ready : pending?.nilai.ready;

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/integration-settings/pddikti/${copy.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      const body = json?.data ?? json;
      if (!res.ok) {
        setResult({ success: false, message: body?.message || `Gagal (HTTP ${res.status}).` });
      } else {
        setResult({ success: body?.success !== false, message: body?.message || 'Selesai.', failed: body?.failed });
        onDone?.();
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Gagal terhubung ke server.' });
    } finally {
      setBusy(false);
      void loadPending();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{copy.title}</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          <span className="font-mono">{copy.act}</span> — {copy.desc}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-[11px] font-semibold text-emerald-700">Siap dikirim</p>
          <p className="text-xl font-black text-emerald-800">{pending ? (ready ?? 0).toLocaleString('id-ID') : '-'}</p>
        </div>
        {kind === 'krs' ? (
          <>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-semibold text-amber-700">Tertahan: kelas belum di Feeder</p>
              <p className="text-xl font-black text-amber-800">{pending ? pending.krs.blockedClassNotInFeeder.toLocaleString('id-ID') : '-'}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-semibold text-amber-700">Tertahan: mahasiswa belum di Feeder</p>
              <p className="text-xl font-black text-amber-800">{pending ? pending.krs.blockedStudentNotInFeeder.toLocaleString('id-ID') : '-'}</p>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:col-span-2">
            <p className="text-[11px] font-semibold text-amber-700">Tertahan: peserta belum terdaftar di kelas Feeder</p>
            <p className="text-xl font-black text-amber-800">{pending ? pending.nilai.blockedKrsNotInFeeder.toLocaleString('id-ID') : '-'}</p>
          </div>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-600">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Push menulis ke data resmi Feeder sehingga hanya dapat dijalankan Super Admin.</span>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Feeder hanya menerima perubahan untuk semester yang periodenya aktif; selain itu ditolak dengan pesan
          &ldquo;Periode data di luar periode aktif&rdquo;. Setiap proses mengirim maksimal 200 baris — jalankan lagi untuk melanjutkan.
        </span>
      </div>

      <button
        onClick={run}
        disabled={busy || !isSuperAdmin || (pending !== null && (ready ?? 0) === 0)}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
        <span>{busy ? 'Mengirim...' : copy.button}</span>
      </button>

      {result && (
        <div
          className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
            result.success && !result.failed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {result.success && !result.failed ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="leading-relaxed">{result.message}</span>
        </div>
      )}
    </div>
  );
}
