'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { Sunrise, Sunset, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface TodayStatus {
  date: string;
  checkInPagi: string | null;
  checkInSore: string | null;
  ratePagi: number;
  rateSore: number;
  shift: { id: string; name: string; startPagi: string | null; toleransiPagi: number; startSore: string | null; toleransiSore: number } | null;
  isLatePagi: boolean | null;
  isLateSore: boolean | null;
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const authHeaders = () => {
  const { token } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export function AbsensiHarianCard() {
  const [status, setStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<'PAGI' | 'SORE' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/attendance/today`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (err) {
      console.error('Gagal memuat status absensi', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async (session: 'PAGI' | 'SORE') => {
    setSubmitting(session);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/attendance/check-in`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ session }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Gagal mencatat absensi');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Absensi Harian</h3>
          <p className="text-[11px] text-slate-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {error && <div className="mx-5 mt-3 px-3 py-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700">{error}</div>}

      <div className="p-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <Sunrise className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 mb-1">Absen Pagi</p>
          <p className="text-[10px] text-slate-400 mb-1">{formatRupiah(status?.ratePagi ?? 0)}</p>
          {status?.shift?.startPagi && (
            <p className="text-[10px] text-slate-400 mb-2">
              Target {status.shift.startPagi} (+{status.shift.toleransiPagi}m)
            </p>
          )}
          {status?.checkInPagi ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {formatTime(status.checkInPagi)}
              </div>
              {status.isLatePagi === true && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                  <AlertTriangle className="w-3 h-3" /> Terlambat
                </span>
              )}
              {status.isLatePagi === false && (
                <span className="text-[10px] font-semibold text-emerald-600">Tepat Waktu</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleCheckIn('PAGI')}
              disabled={submitting !== null}
              className="w-full px-3 py-2 text-xs font-semibold text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-60 cursor-pointer"
            >
              {submitting === 'PAGI' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Absen Sekarang'}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 text-center">
          <Sunset className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600 mb-1">Absen Sore</p>
          <p className="text-[10px] text-slate-400 mb-1">{formatRupiah(status?.rateSore ?? 0)}</p>
          {status?.shift?.startSore && (
            <p className="text-[10px] text-slate-400 mb-2">
              Target {status.shift.startSore} (+{status.shift.toleransiSore}m)
            </p>
          )}
          {status?.checkInSore ? (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {formatTime(status.checkInSore)}
              </div>
              {status.isLateSore === true && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                  <AlertTriangle className="w-3 h-3" /> Terlambat
                </span>
              )}
              {status.isLateSore === false && (
                <span className="text-[10px] font-semibold text-emerald-600">Tepat Waktu</span>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleCheckIn('SORE')}
              disabled={submitting !== null}
              className="w-full px-3 py-2 text-xs font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-60 cursor-pointer"
            >
              {submitting === 'SORE' ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Absen Sekarang'}
            </button>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 text-[11px] text-slate-400">
        {status?.shift ? `Shift: ${status.shift.name}. ` : ''}
        Uang transport dihitung otomatis dari absen pagi &amp; sore, dan masuk ke Rekap Honor Biro Keuangan.
      </div>
    </div>
  );
}
