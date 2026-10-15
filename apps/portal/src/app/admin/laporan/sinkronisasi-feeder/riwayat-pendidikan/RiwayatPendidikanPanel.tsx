'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getAuthSession } from '@/lib/auth';
import { useServerTable } from '@/lib/useServerTable';
import { TablePagination } from '@/components/ui/TablePagination';
import { AlertTriangle, RefreshCw, ArrowUpFromLine } from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface RiwayatRow {
  id: string;
  nim: string;
  name: string;
  studyProgram: string;
  prodiCode: string;
  entryYear: number;
  lastError: string | null;
}

export interface RiwayatDiffResult {
  id: string;
  foundInFeeder: boolean;
  diffs: { field: string; label: string; local: string; feeder: string }[];
}

export interface RiwayatLogEntry {
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

interface RiwayatPendidikanPanelProps {
  showToast: (msg: string) => void;
  addLog: (entry: RiwayatLogEntry) => void;
  /** Dipanggil saat jumlah mahasiswa terdaftar di Feeder diketahui (untuk banner halaman). */
  onTotalAll?: (total: number) => void;
}

const MAX_UPDATE_PER_RUN = 50;

/**
 * Panel tab "Update Riwayat Pendidikan" di halaman Sinkronisasi Mahasiswa: bandingkan dan
 * koreksi riwayat pendidikan (NIM, program studi, tahun masuk) mahasiswa yang sudah
 * terdaftar di Feeder lewat UpdateRiwayatPendidikanMahasiswa. Tabelnya server-side.
 */
export default function RiwayatPendidikanPanel({ showToast, addLog, onTotalAll }: RiwayatPendidikanPanelProps) {
  const table = useServerTable<RiwayatRow, { totalAll?: number }>({
    endpoint: 'integration-settings/pddikti/riwayat-pendidikan/table',
    defaultSortKey: 'nim',
  });
  const totalAll = table.extra.totalAll;
  useEffect(() => {
    if (typeof totalAll === 'number') onTotalAll?.(totalAll);
  }, [totalAll, onTotalAll]);
  const sortIndicator = (key: string) => (table.sortKey === key ? (table.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [diffById, setDiffById] = useState<Record<string, RiwayatDiffResult>>({});
  const [onlyWithDiff, setOnlyWithDiff] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareProgress, setCompareProgress] = useState<{ done: number; total: number } | null>(null);
  const cancelCompareRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const authHeaders = (): Record<string, string> => {
    const { token } = getAuthSession();
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  // Bandingkan riwayat pendidikan lokal vs Feeder (hanya membaca) -- per batch 100.
  // Yang dibandingkan = yang dicentang; kalau tidak ada yang dicentang = SEMUA mahasiswa
  // (sesuai pencarian), bukan hanya halaman yang tampil. Bisa dihentikan di tengah jalan.
  const handleCompare = async () => {
    setIsComparing(true);
    cancelCompareRef.current = false;
    const BATCH = 100;
    let compared = 0;
    try {
      let targets: string[];
      if (selectedIds.size > 0) {
        targets = Array.from(selectedIds);
      } else {
        const params = new URLSearchParams();
        if (table.searchInput.trim()) params.set('search', table.searchInput.trim());
        const res = await fetch(`${apiBase}/integration-settings/pddikti/riwayat-pendidikan/ids?${params.toString()}`, {
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
        const res = await fetch(`${apiBase}/integration-settings/pddikti/riwayat-pendidikan/compare`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ studentIds: targets.slice(i, i + BATCH) }),
        });
        const json = await res.json().catch(() => null);
        const result = json?.data ?? json;
        if (!res.ok || !result?.success) throw new Error(result?.message || `HTTP ${res.status}`);
        setDiffById((prev) => {
          const next = { ...prev };
          for (const it of result.items as RiwayatDiffResult[]) next[it.id] = it;
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
      showToast(err instanceof Error ? err.message : 'Gagal membandingkan data dengan Feeder.');
    } finally {
      setIsComparing(false);
      setCompareProgress(null);
    }
  };

  // Update riwayat pendidikan terpilih di Feeder (MENULIS ke PDDIKTI).
  const handleUpdate = async () => {
    if (selectedIds.size === 0) return;
    setIsUpdating(true);
    const startedAt = Date.now();
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti/riwayat-pendidikan/update`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ studentIds: ids }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok || !result) throw new Error(result?.message || `HTTP ${res.status}`);

      const failedCount = result?.failed ?? 0;
      addLog({
        id: `log-riwayat-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        entity: 'Riwayat Pendidikan Mahasiswa -- Update ke Feeder',
        batchSize: result?.processed ?? 0,
        successCount: result?.updated ?? 0,
        errorCount: failedCount,
        status: !result?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
        durationMs: Date.now() - startedAt,
        message: result?.message || 'Update riwayat pendidikan ke Feeder selesai.',
      });
      showToast(result?.message || 'Update riwayat pendidikan ke Feeder selesai.');
      if (result?.success) {
        setSelectedIds(new Set());
        // Hasil perbandingan untuk baris yang baru diupdate sudah basi -- bandingkan ulang.
        setDiffById((prev) => {
          const next = { ...prev };
          ids.forEach((id) => delete next[id]);
          return next;
        });
      }
    } catch (err) {
      addLog({
        id: `log-riwayat-${Date.now()}`,
        timestamp: new Date().toLocaleString('id-ID'),
        entity: 'Riwayat Pendidikan Mahasiswa -- Update ke Feeder',
        batchSize: 0,
        successCount: 0,
        errorCount: 0,
        status: 'FAILED',
        durationMs: Date.now() - startedAt,
        message: err instanceof Error ? err.message : 'Gagal update riwayat pendidikan ke Feeder.',
      });
      showToast(err instanceof Error ? err.message : 'Gagal update riwayat pendidikan ke Feeder.');
    } finally {
      setIsUpdating(false);
      table.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <p className="text-[11px] text-slate-500">
          Koreksi riwayat pendidikan lewat <b>UpdateRiwayatPendidikanMahasiswa</b>. Yang diperbarui hanya <b>NIM</b>,{' '}
          <b>program studi</b>, dan <b>tahun masuk</b>; semester masuk, jenis/jalur daftar, tanggal daftar, dan pembiayaan
          dipertahankan dari data Feeder saat ini. Maksimal {MAX_UPDATE_PER_RUN} mahasiswa per proses. Jika tidak ada yang
          dicentang, &quot;Bandingkan&quot; membandingkan <b>semua</b> mahasiswa (sesuai kotak pencarian), bertahap 100
          per request.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleCompare}
            disabled={isComparing || table.total === 0}
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
            onClick={handleUpdate}
            disabled={isUpdating || selectedIds.size === 0}
            title="Kirim koreksi riwayat pendidikan mahasiswa yang dicentang ke Web Service Neo Feeder PDDIKTI"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
            <span>
              {isUpdating
                ? 'Mengupdate...'
                : selectedIds.size > 0
                  ? `Update ${selectedIds.size} Riwayat Terpilih ke Feeder`
                  : 'Centang mahasiswa yang akan diupdate'}
            </span>
          </button>
        </div>
      </div>

      {/* Tabel (server-side) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Riwayat Pendidikan Lokal vs Feeder</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Mahasiswa yang sudah punya ID registrasi Feeder. Kolom Perbedaan Data diisi lewat tombol Bandingkan dengan Feeder.
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
          <table className="w-full min-w-[860px] text-left text-xs">
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
                    ['nim', 'NIM'],
                    ['name', 'Nama'],
                    ['studyProgram', 'Program Studi'],
                    ['entryYear', 'Tahun Masuk'],
                    ['lastError', 'Error Terakhir'],
                  ] as [string, string][]
                ).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => table.toggleSort(key)}
                    aria-sort={table.sortKey === key ? (table.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="py-2.5 px-3 cursor-pointer select-none hover:text-[#1E3A8A]"
                  >
                    {label}
                    <span className={`text-[9px] ${table.sortKey === key ? '' : 'text-slate-300'}`}>{sortIndicator(key)}</span>
                  </th>
                ))}
                <th className="py-2.5 px-3 min-w-[280px]">Perbedaan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!table.isLoading && visibleRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 px-3 text-center text-slate-400">
                    {table.searchInput || onlyWithDiff
                      ? 'Tidak ada mahasiswa yang cocok.'
                      : 'Belum ada mahasiswa yang terdaftar di Feeder. Pull mahasiswa dulu.'}
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
                    <td className="py-2 px-3 align-top font-mono font-bold text-[#1E3A8A]">{row.nim || '-'}</td>
                    <td className="py-2 px-3 align-top font-semibold text-slate-800">{row.name}</td>
                    <td className="py-2 px-3 align-top text-slate-600">{row.studyProgram}</td>
                    <td className="py-2 px-3 align-top text-slate-600">{row.entryYear || '-'}</td>
                    <td className="py-2 px-3 align-top">
                      {row.lastError ? (
                        <span className="inline-flex items-start gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                          <span>{row.lastError}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 align-top">
                      {!d ? (
                        <span className="text-[10px] text-slate-400">Belum dibandingkan</span>
                      ) : !d.foundInFeeder ? (
                        <span className="text-[10px] font-semibold text-rose-600">Riwayat tidak ditemukan di Feeder</span>
                      ) : d.diffs.length === 0 ? (
                        <span className="text-[10px] font-semibold text-emerald-600">Sama</span>
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
    </div>
  );
}
