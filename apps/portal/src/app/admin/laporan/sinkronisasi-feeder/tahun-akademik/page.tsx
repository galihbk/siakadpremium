'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Terminal,
  ArrowLeft,
  ArrowDownToLine,
  X,
  Check,
  Minus,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface RemoteAcademicYearItem {
  code: string;
  name: string;
  semesterType: 'ODD' | 'EVEN' | 'SHORT';
  startDate: string;
  endDate: string;
  isActiveAtFeeder?: boolean;
}

export interface LocalAcademicYearItem {
  id: string;
  code: string;
  name: string;
  semesterType: 'ODD' | 'EVEN' | 'SHORT';
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface SyncLogItem {
  id: string;
  timestamp: string;
  entity: string;
  batchSize: number;
  successCount: number;
  errorCount: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  durationMs: number;
  message: string;
}

export default function SinkronisasiTahunAkademikPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const [pddiktiStatus, setPddiktiStatus] = useState<{
    isConfigured: boolean;
    isActive: boolean;
    lastSyncAt: string | null;
    isConnected: boolean;
    connectionError: string | null;
  } | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.data && setPddiktiStatus(json.data))
      .catch((err) => console.warn('Gagal memuat status PDDIKTI:', err));
  }, []);

  // Tarik & Sinkronkan Tahun Akademik & Periode Semester dari Feeder
  const [isPullingTahunAkademik, setIsPullingTahunAkademik] = useState(false);
  const [isSyncingTahunAkademik, setIsSyncingTahunAkademik] = useState(false);
  const [tahunAkademikPullMessage, setTahunAkademikPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [tahunAkademikPullItems, setTahunAkademikPullItems] = useState<RemoteAcademicYearItem[]>([]);
  const [hasPulledOnce, setHasPulledOnce] = useState(false);
  const [tahunAkademikLocalItems, setTahunAkademikLocalItems] = useState<LocalAcademicYearItem[]>([]);
  const [isLoadingLocalItems, setIsLoadingLocalItems] = useState(true);
  const tahunAkademikLocalCount = tahunAkademikLocalItems.length;

  // Gabungan data lokal + hasil Pull terakhir dari Feeder, dicocokkan lewat kode semester --
  // supaya kelihatan jelas mana yang cuma ada lokal, cuma ada di Feeder, atau sudah dua-duanya.
  interface ComparisonRow {
    key: string;
    code: string;
    name: string;
    semesterType?: string;
    startDate?: string;
    endDate?: string;
    inLocal: boolean;
    isActiveLocal: boolean;
    inFeeder: boolean | null; // null = belum pernah Pull sama sekali
  }

  const comparisonRows = useMemo<ComparisonRow[]>(() => {
    const map = new Map<string, ComparisonRow>();
    for (const l of tahunAkademikLocalItems) {
      map.set(l.code, {
        key: l.code,
        code: l.code,
        name: l.name,
        semesterType: l.semesterType,
        startDate: l.startDate,
        endDate: l.endDate,
        inLocal: true,
        isActiveLocal: l.isActive,
        inFeeder: hasPulledOnce ? false : null,
      });
    }
    for (const r of tahunAkademikPullItems) {
      const existing = map.get(r.code);
      if (existing) {
        existing.inFeeder = true;
      } else {
        map.set(r.code, {
          key: r.code,
          code: r.code,
          name: r.name,
          semesterType: r.semesterType,
          startDate: r.startDate,
          endDate: r.endDate,
          inLocal: false,
          isActiveLocal: false,
          inFeeder: true,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.code.localeCompare(a.code));
  }, [tahunAkademikLocalItems, tahunAkademikPullItems, hasPulledOnce]);

  const fetchLocalTahunAkademik = React.useCallback(() => {
    setIsLoadingLocalItems(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    return fetch(`${apiBase}/academic/years`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setTahunAkademikLocalItems(result);
      })
      .catch((err) => console.warn('Gagal memuat daftar tahun akademik lokal:', err))
      .finally(() => setIsLoadingLocalItems(false));
  }, []);

  useEffect(() => {
    fetchLocalTahunAkademik();
  }, [fetchLocalTahunAkademik]);

  // Handler: Tarik Tahun Akademik & Periode Semester dari Feeder
  const handlePullTahunAkademik = async () => {
    setIsPullingTahunAkademik(true);
    setTahunAkademikPullMessage(null);
    setTahunAkademikPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/tahun-akademik`, { headers });
      if (res.status === 401 || res.status === 403) {
        setTahunAkademikPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setTahunAkademikPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteAcademicYearItem[] = Array.isArray(result?.items) ? result.items : [];
      setTahunAkademikPullItems(items);
      setHasPulledOnce(true);
      setTahunAkademikPullMessage({
        success: true,
        text: `${items.length} periode semester ditarik dari Feeder (seluruh riwayat, bukan cuma yang berjalan).`,
      });
    } catch (err) {
      setTahunAkademikPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingTahunAkademik(false);
    }
  };

  // Handler: Sinkronkan Tahun Akademik hasil Pull ke data lokal
  const handleSyncTahunAkademik = async () => {
    if (tahunAkademikPullItems.length === 0) return;
    setIsSyncingTahunAkademik(true);
    const startedAt = Date.now();
    const batchSize = tahunAkademikPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/tahun-akademik/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: tahunAkademikPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-tahun-akademik-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Tahun Akademik & Periode Semester (tahun_akademik)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi tahun akademik selesai.');
      // Sengaja TIDAK mengosongkan tahunAkademikPullItems -- tabel perbandingan di bawah
      // butuh data hasil Pull ini supaya kolom "Feeder" tetap akurat setelah sinkron.
      setTahunAkademikPullMessage(null);
      fetchLocalTahunAkademik();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-tahun-akademik-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Tahun Akademik & Periode Semester (tahun_akademik)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan tahun akademik.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan tahun akademik.');
    } finally {
      setIsSyncingTahunAkademik(false);
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator & Kepala Biro BAAK"
      activeMenuHref="/admin/laporan/sinkronisasi-feeder"
    >
      <div className="w-full space-y-6 pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Link
          href="/admin/laporan/sinkronisasi-feeder"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Sinkronisasi Feeder
        </Link>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>tahun_akademik</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Tahun Akademik &amp; Periode Semester</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil periode semester yang BENAR-BENAR punya data KRS dari Web Service Neo Feeder (bukan seluruh kode
                  semester yang pernah di-generate Feeder, termasuk yang spekulatif/belum pernah dipakai) -- wajib ditarik
                  &amp; disinkronkan dulu sebelum Pull Kelas Perkuliahan, supaya id_semester-nya ada pasangan lokal.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{tahunAkademikLocalCount}</p>
              <p className="text-[10px] text-slate-300 mt-1">
                Ditarik terakhir:{' '}
                {pddiktiStatus?.lastSyncAt
                  ? new Date(pddiktiStatus.lastSyncAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Belum pernah'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {tahunAkademikPullMessage && (
            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                tahunAkademikPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {tahunAkademikPullMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{tahunAkademikPullMessage.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePullTahunAkademik}
              disabled={isPullingTahunAkademik}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPullingTahunAkademik ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              <span>{isPullingTahunAkademik ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
            {tahunAkademikPullItems.length > 0 && (
              <button
                onClick={handleSyncTahunAkademik}
                disabled={isSyncingTahunAkademik}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingTahunAkademik ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingTahunAkademik ? 'Menyinkronkan...' : `Sinkronkan ${tahunAkademikPullItems.length}`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Perbandingan Data Lokal vs Feeder -- gabungan satu tabel, dicocokkan lewat kode semester */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Perbandingan Data Lokal vs Feeder</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasPulledOnce
                  ? 'Dicocokkan lewat kode semester dari hasil Pull terakhir.'
                  : 'Kolom Feeder baru terisi setelah Pull dari Feeder di atas.'}
              </p>
            </div>
            <span className="text-[11px] text-slate-400">
              {isLoadingLocalItems ? 'Memuat...' : `${tahunAkademikLocalCount} lokal${hasPulledOnce ? ` · ${tahunAkademikPullItems.length} di Feeder` : ''}`}
            </span>
          </div>

          {isLoadingLocalItems ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Memuat data lokal...
            </div>
          ) : comparisonRows.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada tahun akademik tersimpan lokal. Pull &amp; sinkronkan dari Feeder dulu di atas.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Tipe Semester</th>
                    <th className="py-2.5 px-3">Mulai</th>
                    <th className="py-2.5 px-3">Selesai</th>
                    <th className="py-2.5 px-3 text-center">Lokal</th>
                    <th className="py-2.5 px-3 text-center">Feeder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{row.code}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                      <td className="py-2 px-3 text-slate-600">{row.semesterType || '-'}</td>
                      <td className="py-2 px-3 text-slate-600">{row.startDate ? new Date(row.startDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="py-2 px-3 text-slate-600">{row.endDate ? new Date(row.endDate).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="py-2 px-3 text-center">
                        {row.inLocal ? (
                          <Check className="w-4 h-4 text-emerald-600 inline-block" />
                        ) : (
                          <Minus className="w-4 h-4 text-rose-400 inline-block" />
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.inFeeder === null ? (
                          <span className="text-[10px] text-slate-400">Belum ditarik</span>
                        ) : row.inFeeder ? (
                          <Check className="w-4 h-4 text-emerald-600 inline-block" />
                        ) : (
                          <Minus className="w-4 h-4 text-rose-400 inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Log Console */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#1E3A8A]" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Log Riwayat Sinkronisasi</h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {syncLogs.length === 0 ? 'Belum ada riwayat' : `${syncLogs.length} log tercatat`}
            </span>
          </div>

          {syncLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada riwayat aktivitas sinkronisasi pada sesi ini.
            </div>
          ) : (
            <div className="space-y-2">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="font-bold text-slate-900">{log.entity}</span>
                      <span className="text-[11px] text-slate-400">({log.timestamp})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 pl-4">{log.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center font-mono text-[11px]">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{log.successCount} Sukses</span>
                    <span className="text-slate-400">{log.durationMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
