'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { useServerTable } from '@/lib/useServerTable';
import { TablePagination } from '@/components/ui/TablePagination';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Terminal,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Check,
  Minus,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface RemoteEnrollmentItem {
  classFeederId: string;
  className?: string;
  studentFeederId?: string;
  nim?: string;
  studentName?: string;
  courseCode?: string;
  courseName?: string;
  prodiCode?: string;
}

export interface LocalKrsRow {
  id: string;
  nim: string;
  studentName: string;
  courseLabel: string;
  className: string;
  academicYear: string;
  classInFeeder: boolean;
  studentInFeeder: boolean;
  feederSyncedAt: string | null;
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

export default function SinkronisasiKrsPage() {
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

  // Jumlah baris lokal (data nyata) untuk KRS -- entitas ini tidak tercakup oleh
  // endpoint pddikti/sync-status, jadi dipakai rekap lokal dari /academic/feeder-entities.
  const [feederLocalCounts, setFeederLocalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/feeder-entities`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setFeederLocalCounts(json?.data || json || {}))
      .catch((err) => console.warn('Gagal memuat jumlah data lokal per entitas Feeder:', err));
  }, []);

  const [activeTab, setActiveTab] = useState<'pull' | 'push'>('pull');

  // Tabel KRS lokal: pagination, pencarian, dan urutan dihitung di server (hanya satu
  // halaman yang dikirim ke browser, bukan seluruh ribuan baris KRS).
  const krsTable = useServerTable<LocalKrsRow, { synced?: number; totalAll?: number }>({
    endpoint: 'integration-settings/pddikti/krs/table',
    defaultSortKey: 'nim',
  });
  const krsSortIndicator = (key: string) => (krsTable.sortKey === key ? (krsTable.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅');

  // Tarik & Sinkronkan KRS & Rencana Studi Mahasiswa dari Feeder
  const [isPullingKrs, setIsPullingKrs] = useState(false);
  const [isSyncingKrs, setIsSyncingKrs] = useState(false);
  const [krsPullMessage, setKrsPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [krsPullItems, setKrsPullItems] = useState<RemoteEnrollmentItem[]>([]);

  // Handler: Tarik KRS & Rencana Studi Mahasiswa dari Feeder
  const handlePullKrs = async () => {
    setIsPullingKrs(true);
    setKrsPullMessage(null);
    setKrsPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/krs`, { headers });
      if (res.status === 401 || res.status === 403) {
        setKrsPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setKrsPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteEnrollmentItem[] = Array.isArray(result?.items) ? result.items : [];
      setKrsPullItems(items);
      setKrsPullMessage({
        success: true,
        text: `${items.length} baris KRS ditarik dari Feeder. Kelas & mahasiswa yang belum tersinkron lokal akan otomatis dilewati saat disinkronkan.`,
      });
    } catch (err) {
      setKrsPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKrs(false);
    }
  };

  // Handler: Sinkronkan KRS hasil Pull ke data lokal
  const handleSyncKrs = async () => {
    if (krsPullItems.length === 0) return;
    setIsSyncingKrs(true);
    const startedAt = Date.now();
    const batchSize = krsPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/krs/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: krsPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-krs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'KRS & Rencana Studi Mahasiswa (krs_mahasiswa)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi KRS selesai.');
      setKrsPullItems([]);
      setKrsPullMessage(null);
      krsTable.reload();
      setFeederLocalCounts((prev) => ({ ...prev, krs_mahasiswa: (prev['krs_mahasiswa'] ?? 0) + (result?.created ?? 0) }));
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-krs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'KRS & Rencana Studi Mahasiswa (krs_mahasiswa)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan KRS.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan KRS.');
    } finally {
      setIsSyncingKrs(false);
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
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>krs_mahasiswa</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">KRS &amp; Rencana Studi Mahasiswa</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil daftar pengambilan mata kuliah tiap mahasiswa (peserta kelas) dari Web Service Neo Feeder. Kelas
                  Perkuliahan &amp; Mahasiswa wajib sudah tersinkron lebih dulu.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total KRS Lokal (semua tahun)</p>
              <p className="text-2xl font-black text-white mt-1">{(krsTable.extra.totalAll ?? 0).toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-slate-300 mt-1">
                Tahun aktif: {(feederLocalCounts['krs_mahasiswa'] ?? 0).toLocaleString('id-ID')}
              </p>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 w-fit">
          {(
            [
              ['pull', 'Tarik dari Feeder'],
              ['push', 'Push ke Feeder'],
            ] as ['pull' | 'push', string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === key ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Card: Tab Push */}
        {activeTab === 'push' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Push KRS ke Feeder (mendaftarkan mahasiswa ke kelas lewat <b>InsertPesertaKelasKuliah</b>) belum tersedia. Fitur
                ini bergantung pada Push Kelas Perkuliahan: kelas lokal harus sudah punya ID Feeder dulu, baru peserta kelasnya
                bisa dikirim.
              </span>
            </div>
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Push ke Feeder (belum tersedia)</span>
            </button>
          </div>
        )}

        {/* Action Card: Tab Pull */}
        {activeTab === 'pull' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {krsPullMessage && (
            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                krsPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {krsPullMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{krsPullMessage.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePullKrs}
              disabled={isPullingKrs}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPullingKrs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              <span>{isPullingKrs ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
            {krsPullItems.length > 0 && (
              <button
                onClick={handleSyncKrs}
                disabled={isSyncingKrs}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingKrs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingKrs ? 'Menyinkronkan...' : `Sinkronkan ${krsPullItems.length}`}</span>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Tabel KRS Lokal (server-side) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Data KRS Lokal</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                &quot;Sinkron Feeder&quot; terisi saat baris KRS ini cocok dengan data Feeder (hasil Pull &amp; Sinkronkan). Dua kolom
                sebelumnya adalah prasyaratnya: kelas dan mahasiswa harus sudah punya ID Feeder.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {krsTable.isLoading
                ? 'Memuat...'
                : `${krsTable.total.toLocaleString('id-ID')} baris · ${(krsTable.extra.synced ?? 0).toLocaleString('id-ID')} sinkron Feeder`}
            </span>
          </div>

          <input
            type="text"
            value={krsTable.searchInput}
            onChange={(e) => krsTable.setSearchInput(e.target.value)}
            placeholder="Cari NIM, nama mahasiswa, mata kuliah, atau kelas..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
          />

          {krsTable.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {krsTable.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl max-h-96 overflow-auto ${krsTable.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[940px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  {(
                    [
                      ['nim', 'NIM', ''],
                      ['studentName', 'Nama Mahasiswa', ''],
                      ['courseLabel', 'Mata Kuliah', ''],
                      ['className', 'Kelas', ''],
                      ['academicYear', 'Tahun Akademik', ''],
                      ['classInFeeder', 'Kelas di Feeder', 'text-center'],
                      ['studentInFeeder', 'Mahasiswa di Feeder', 'text-center'],
                      ['synced', 'Sinkron Feeder', 'text-center'],
                    ] as [string, string, string][]
                  ).map(([key, label, cls]) => (
                    <th
                      key={key}
                      onClick={() => krsTable.toggleSort(key)}
                      aria-sort={krsTable.sortKey === key ? (krsTable.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`py-2.5 px-3 cursor-pointer select-none hover:text-[#1E3A8A] ${cls}`}
                    >
                      {label}
                      <span className={`text-[9px] ${krsTable.sortKey === key ? '' : 'text-slate-300'}`}>{krsSortIndicator(key)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!krsTable.isLoading && krsTable.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 px-3 text-center text-slate-400">
                      {krsTable.searchInput ? 'Tidak ada KRS yang cocok dengan pencarian.' : 'Belum ada KRS tersimpan lokal.'}
                    </td>
                  </tr>
                )}
                {krsTable.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{row.nim || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{row.studentName || '-'}</td>
                    <td className="py-2 px-3 text-slate-600">{row.courseLabel}</td>
                    <td className="py-2 px-3 text-slate-700">{row.className || '-'}</td>
                    <td className="py-2 px-3 text-slate-600">{row.academicYear || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      {row.classInFeeder ? (
                        <Check className="w-4 h-4 text-emerald-600 inline-block" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 inline-block" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.studentInFeeder ? (
                        <Check className="w-4 h-4 text-emerald-600 inline-block" />
                      ) : (
                        <Minus className="w-4 h-4 text-slate-300 inline-block" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.feederSyncedAt ? (
                        <span
                          title={`Tersinkron ${new Date(row.feederSyncedAt).toLocaleString('id-ID')}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                        >
                          <Check className="w-3 h-3" />
                          Sinkron
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Belum</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={krsTable.page}
            pageSize={krsTable.pageSize}
            total={krsTable.total}
            totalPages={krsTable.totalPages}
            noun="baris KRS"
            onPageChange={krsTable.setPage}
            onPageSizeChange={krsTable.setPageSize}
          />
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
