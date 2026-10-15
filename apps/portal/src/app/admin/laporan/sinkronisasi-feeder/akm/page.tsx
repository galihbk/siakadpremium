'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ClipboardList,
  Terminal,
  ArrowLeft,
  ArrowUpFromLine,
  X,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface AkmRow {
  id: string;
  nim: string;
  name: string;
  studyProgram: string;
  sksSemester: number;
  ips: number | null;
  sksTotal: number;
  ipk: number | null;
}

export interface AkmDiffResult {
  id: string;
  foundInFeeder: boolean;
  status?: string;
  diffs: { field: string; label: string; local: string; feeder: string }[];
}

interface AcademicYearOption {
  code: string;
  name: string;
  isActive?: boolean;
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

const MAX_SYNC_PER_RUN = 50;

export default function SinkronisasiAkmPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const authHeaders = (): Record<string, string> => {
    const { token } = getAuthSession();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  // Daftar semester (tahun akademik lokal) -- AKM selalu dihitung per semester.
  const [years, setYears] = useState<AcademicYearOption[]>([]);
  const [semester, setSemester] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/academic/years`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (!Array.isArray(result)) return;
        const list: AcademicYearOption[] = result
          .map((y: any) => ({ code: String(y.code), name: String(y.name), isActive: Boolean(y.isActive) }))
          .sort((a: AcademicYearOption, b: AcademicYearOption) => b.code.localeCompare(a.code));
        setYears(list);
        // Default: semester terbaru yang sudah selesai dipakai (bukan semester yang baru dibuka).
        const active = list.find((y) => y.isActive);
        const idx = active ? list.findIndex((y) => y.code === active.code) : 0;
        setSemester((list[idx + 1] || list[idx] || list[0])?.code || '');
      })
      .catch((err) => console.warn('Gagal memuat daftar semester:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tabel AKM lokal: pagination, pencarian, dan urutan dihitung di server.
  const table = useServerTable<AkmRow>({
    endpoint: 'integration-settings/pddikti/akm/table',
    defaultSortKey: 'nim',
    params: { semester },
  });
  const sortIndicator = (key: string) => (table.sortKey === key ? (table.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [diffById, setDiffById] = useState<Record<string, AkmDiffResult>>({});
  const [onlyWithDiff, setOnlyWithDiff] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareProgress, setCompareProgress] = useState<{ done: number; total: number } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const cancelCompareRef = useRef(false);

  // Ganti semester -> hasil perbandingan & pilihan semester sebelumnya tidak berlaku lagi.
  useEffect(() => {
    setSelectedIds(new Set());
    setDiffById({});
  }, [semester]);

  const visibleRows = useMemo(
    () =>
      onlyWithDiff
        ? table.items.filter((r) => (diffById[r.id]?.diffs.length ?? 0) > 0 || diffById[r.id]?.foundInFeeder === false)
        : table.items,
    [table.items, onlyWithDiff, diffById]
  );
  const allSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) visibleRows.forEach((r) => next.delete(r.id));
      else visibleRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  // Bandingkan AKM lokal vs Feeder (hanya membaca) -- per batch 100. Yang dibandingkan =
  // yang dicentang; kalau tidak ada = SEMUA mahasiswa di semester ini (sesuai pencarian).
  const handleCompare = async () => {
    if (!semester) return;
    setIsComparing(true);
    cancelCompareRef.current = false;
    const BATCH = 100;
    let compared = 0;
    try {
      let targets: string[];
      if (selectedIds.size > 0) {
        targets = Array.from(selectedIds);
      } else {
        const params = new URLSearchParams({ semester });
        if (table.searchInput.trim()) params.set('search', table.searchInput.trim());
        const res = await fetch(`${apiBase}/integration-settings/pddikti/akm/ids?${params.toString()}`, {
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const result = json?.data ?? json;
        if (!res.ok || !Array.isArray(result?.ids)) throw new Error(result?.message || `HTTP ${res.status}`);
        targets = result.ids as string[];
      }
      if (targets.length === 0) return;
      setCompareProgress({ done: 0, total: targets.length });

      for (let i = 0; i < targets.length; i += BATCH) {
        if (cancelCompareRef.current) break;
        const res = await fetch(`${apiBase}/integration-settings/pddikti/akm/compare`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ semester, studentIds: targets.slice(i, i + BATCH) }),
        });
        const json = await res.json().catch(() => null);
        const result = json?.data ?? json;
        if (!res.ok || !result?.success) throw new Error(result?.message || `HTTP ${res.status}`);
        setDiffById((prev) => {
          const next = { ...prev };
          for (const it of result.items as AkmDiffResult[]) next[it.id] = it;
          return next;
        });
        compared = Math.min(i + BATCH, targets.length);
        setCompareProgress({ done: compared, total: targets.length });
      }
      showToast(
        cancelCompareRef.current
          ? `Dihentikan: ${compared} mahasiswa sudah dibandingkan.`
          : `${targets.length} mahasiswa selesai dibandingkan dengan Feeder.`
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membandingkan AKM dengan Feeder.');
    } finally {
      setIsComparing(false);
      setCompareProgress(null);
    }
  };

  // Kirim AKM terpilih ke Feeder (MENULIS ke PDDIKTI): Update kalau sudah ada, Insert kalau belum.
  const handleSync = async () => {
    if (selectedIds.size === 0 || !semester) return;
    setIsSyncing(true);
    const startedAt = Date.now();
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti/akm/sync`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ semester, studentIds: ids }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok || !result) throw new Error(result?.message || `HTTP ${res.status}`);

      const failedCount = result?.failed ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-akm-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: `AKM semester ${semester} -- Kirim ke Feeder`,
          batchSize: result?.processed ?? 0,
          successCount: (result?.inserted ?? 0) + (result?.updated ?? 0),
          errorCount: failedCount,
          status: !result?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Kirim AKM ke Feeder selesai.',
        },
        ...prev,
      ]);
      showToast(result?.message || 'Kirim AKM ke Feeder selesai.');
      if (result?.success) {
        setSelectedIds(new Set());
        setDiffById((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
      }
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-akm-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: `AKM semester ${semester} -- Kirim ke Feeder`,
          batchSize: 0,
          successCount: 0,
          errorCount: 0,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal mengirim AKM ke Feeder.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal mengirim AKM ke Feeder.');
    } finally {
      setIsSyncing(false);
    }
  };

  const fmt = (v: number | null) => (v === null || v === undefined ? '-' : v.toFixed(2));

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
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>perkuliahan_mahasiswa</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Aktivitas Kuliah Mahasiswa (AKM)</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  SKS semester, IPS, SKS total, dan IPK per mahasiswa tiap semester, dihitung dari KRS yang disetujui lalu
                  dibandingkan dengan data di Feeder. Yang berbeda atau belum ada bisa dikirim ke Feeder
                  (<b>UpdatePerkuliahanMahasiswa</b> / <b>InsertPerkuliahanMahasiswa</b>).
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Mahasiswa di Semester Ini</p>
              <p className="text-2xl font-black text-white mt-1">{table.total.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-slate-300 mt-1">Punya KRS disetujui &amp; ID registrasi Feeder</p>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="sm:w-72">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                {years.length === 0 && <option value="">Memuat semester...</option>}
                {years.map((y) => (
                  <option key={y.code} value={y.code}>
                    {y.name} ({y.code}){y.isActive ? ' -- aktif' : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 flex-1">
              Dikirim maksimal {MAX_SYNC_PER_RUN} mahasiswa per proses. Yang sudah ada di Feeder di-<b>update</b> (status mahasiswa
              dipertahankan), yang belum ada di-<b>insert</b> dengan status Aktif. Tanpa centang, &quot;Bandingkan&quot;
              membandingkan semua mahasiswa semester ini (sesuai pencarian).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleCompare}
              disabled={isComparing || table.total === 0 || !semester}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
              <span>
                {isComparing && compareProgress
                  ? `Membandingkan ${compareProgress.done} / ${compareProgress.total}...`
                  : selectedIds.size > 0
                    ? `Bandingkan ${selectedIds.size} Terpilih dengan Feeder`
                    : `Bandingkan Semua ${table.total.toLocaleString('id-ID')} Mahasiswa dengan Feeder`}
              </span>
            </button>
            {isComparing && (
              <button
                onClick={() => {
                  cancelCompareRef.current = true;
                }}
                className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer"
              >
                Hentikan
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing || selectedIds.size === 0}
              title="Kirim AKM mahasiswa yang dicentang ke Web Service Neo Feeder PDDIKTI"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
              <span>
                {isSyncing
                  ? 'Mengirim...'
                  : selectedIds.size > 0
                    ? `Kirim ${selectedIds.size} AKM Terpilih ke Feeder`
                    : 'Centang mahasiswa yang akan dikirim'}
              </span>
            </button>
          </div>
        </div>

        {/* Tabel (server-side) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">AKM Lokal vs Feeder</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nilai lokal dihitung dari KRS disetujui. Kolom Perbedaan Data diisi lewat tombol Bandingkan dengan Feeder.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {table.isLoading ? 'Memuat...' : `${table.total.toLocaleString('id-ID')} mahasiswa`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={table.searchInput}
              onChange={(e) => table.setSearchInput(e.target.value)}
              placeholder="Cari NIM, nama, atau program studi..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
            <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer shrink-0">
              <input type="checkbox" checked={onlyWithDiff} onChange={(e) => setOnlyWithDiff(e.target.checked)} />
              Hanya yang berbeda (halaman ini)
            </label>
          </div>

          {table.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {table.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl max-h-96 overflow-auto ${table.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[940px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={visibleRows.length === 0}
                      aria-label="Pilih semua di halaman ini"
                      className="cursor-pointer"
                    />
                  </th>
                  {(
                    [
                      ['nim', 'NIM', ''],
                      ['name', 'Nama', ''],
                      ['studyProgram', 'Program Studi', ''],
                      ['sksSemester', 'SKS Sem.', 'text-center'],
                      ['ips', 'IPS', 'text-center'],
                      ['sksTotal', 'SKS Total', 'text-center'],
                      ['ipk', 'IPK', 'text-center'],
                    ] as [string, string, string][]
                  ).map(([key, label, cls]) => (
                    <th
                      key={key}
                      onClick={() => table.toggleSort(key)}
                      aria-sort={table.sortKey === key ? (table.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`py-2.5 px-3 cursor-pointer select-none hover:text-[#1E3A8A] ${cls}`}
                    >
                      {label}
                      <span className={`text-[9px] ${table.sortKey === key ? '' : 'text-slate-300'}`}>{sortIndicator(key)}</span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 min-w-[260px]">Perbedaan Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!table.isLoading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 px-3 text-center text-slate-400">
                      {table.searchInput || onlyWithDiff
                        ? 'Tidak ada mahasiswa yang cocok.'
                        : 'Tidak ada mahasiswa dengan KRS disetujui pada semester ini.'}
                    </td>
                  </tr>
                )}
                {visibleRows.map((row) => {
                  const d = diffById[row.id];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelected(row.id)}
                          aria-label={`Pilih ${row.name}`}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 align-top font-mono font-bold text-[#1E3A8A]">{row.nim}</td>
                      <td className="py-2 px-3 align-top font-semibold text-slate-800">{row.name}</td>
                      <td className="py-2 px-3 align-top text-slate-600">{row.studyProgram}</td>
                      <td className="py-2 px-3 align-top text-center font-mono text-slate-700">{row.sksSemester}</td>
                      <td className="py-2 px-3 align-top text-center font-mono text-slate-700">{fmt(row.ips)}</td>
                      <td className="py-2 px-3 align-top text-center font-mono text-slate-700">{row.sksTotal}</td>
                      <td className="py-2 px-3 align-top text-center font-mono text-slate-700">{fmt(row.ipk)}</td>
                      <td className="py-2 px-3 align-top">
                        {!d ? (
                          <span className="text-[10px] text-slate-400">Belum dibandingkan</span>
                        ) : !d.foundInFeeder ? (
                          <span className="text-[10px] font-semibold text-rose-600">Belum ada di Feeder (akan di-insert)</span>
                        ) : d.diffs.length === 0 ? (
                          <span className="text-[10px] font-semibold text-emerald-600">
                            Sama{d.status ? ` · ${d.status}` : ''}
                          </span>
                        ) : (
                          <ul className="space-y-1">
                            {d.diffs.map((df) => (
                              <li key={df.field} className="text-[10px] leading-snug">
                                <span className="font-bold text-slate-700">{df.label}:</span>{' '}
                                <span className="text-emerald-700">{df.local || '(kosong)'}</span>
                                <span className="text-slate-400"> (lokal) vs </span>
                                <span className="text-rose-600">{df.feeder || '(kosong)'}</span>
                                <span className="text-slate-400"> (Feeder)</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            totalPages={table.totalPages}
            noun="mahasiswa"
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
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
