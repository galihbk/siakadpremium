'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { useServerTable } from '@/lib/useServerTable';
import { FeederPushPanel } from '@/components/feeder/FeederPushPanel';
import { TablePagination } from '@/components/ui/TablePagination';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface NilaiSyncJobStatus {
  status: 'idle' | 'running' | 'done' | 'error';
  totalClasses: number;
  processedClasses: number;
  updatedGrades: number;
  skippedGrades: number;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  phase?: string;
}

export interface LocalNilaiRow {
  id: string;
  nim: string;
  studentName: string;
  courseLabel: string;
  className: string;
  academicYear: string;
  totalScore: number | null;
  gradeLetter: string | null;
  gradePoint: number | null;
  gradeStatus: string;
  feederGradeSyncedAt: string | null;
}

export default function SinkronisasiNilaiPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Jumlah baris lokal (data nyata) untuk Nilai Perkuliahan -- entitas ini tidak tercakup
  // oleh endpoint pddikti/sync-status, jadi dipakai rekap lokal dari /academic/feeder-entities.
  const [feederLocalCounts, setFeederLocalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/feeder-entities`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setFeederLocalCounts(json?.data || json || {}))
      .catch((err) => console.warn('Gagal memuat jumlah data lokal per entitas Feeder:', err));
  }, []);

  // Tabel nilai lokal: pagination, pencarian, urutan, dan filter dihitung di server (hanya
  // satu halaman yang dikirim ke browser, bukan puluhan ribu baris nilai).
  const [activeTab, setActiveTab] = useState<'pull' | 'push'>('pull');
  const [gradeFilter, setGradeFilter] = useState<'graded' | 'unsynced' | 'ungraded' | 'all'>('graded');
  const nilaiTable = useServerTable<LocalNilaiRow, { totalGraded?: number; synced?: number }>({
    endpoint: 'integration-settings/pddikti/nilai-perkuliahan/table',
    defaultSortKey: 'nim',
    params: { grade: gradeFilter },
  });
  const nilaiSortIndicator = (key: string) => (nilaiTable.sortKey === key ? (nilaiTable.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅');

  // Sinkronisasi Nilai Perkuliahan Semester (job background -- dipoll statusnya)
  const [isStartingNilaiJob, setIsStartingNilaiJob] = useState(false);
  const [nilaiJobStatus, setNilaiJobStatus] = useState<NilaiSyncJobStatus | null>(null);

  // Poll status job background Pull+Sync Nilai Perkuliahan -- dicek sekali saat halaman
  // dibuka (mungkin ada job yang masih berjalan dari sesi sebelumnya), lalu tiap 4 detik
  // selama statusnya "running".
  const fetchNilaiJobStatus = useCallback(async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti/nilai-perkuliahan/pull-sync/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (result?.status) setNilaiJobStatus(result);
    } catch {
      // non-blocking -- biarkan polling berikutnya mencoba lagi
    }
  }, []);

  useEffect(() => {
    fetchNilaiJobStatus();
  }, [fetchNilaiJobStatus]);

  // Job selesai -> muat ulang tabel supaya nilai yang baru masuk langsung terlihat.
  const prevJobStatus = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevJobStatus.current === 'running' && nilaiJobStatus?.status === 'done') nilaiTable.reload();
    prevJobStatus.current = nilaiJobStatus?.status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nilaiJobStatus?.status]);

  useEffect(() => {
    if (nilaiJobStatus?.status !== 'running') return;
    const interval = setInterval(fetchNilaiJobStatus, 4000);
    return () => clearInterval(interval);
  }, [nilaiJobStatus?.status, fetchNilaiJobStatus]);

  // Handler: Mulai job background Pull+Sync Nilai Perkuliahan Semester
  const handleStartNilaiJob = async () => {
    setIsStartingNilaiJob(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${apiBase}/integration-settings/pddikti/nilai-perkuliahan/pull-sync/start`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      showToast(result?.message || (res.ok ? 'Sinkronisasi nilai dimulai.' : 'Gagal memulai sinkronisasi nilai.'));
      await fetchNilaiJobStatus();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghubungi server.');
    } finally {
      setIsStartingNilaiJob(false);
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
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>nilai_perkuliahan</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Nilai Perkuliahan Semester</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Mengisi nilai (angka, indeks, huruf) ke KRS yang sudah tersinkron. Feeder cuma kasih nilai per-kelas, jadi
                  ini berjalan sebagai job BACKGROUND (bisa ditinggal, ceknya di sini lagi nanti) -- KRS wajib sudah
                  tersinkron lebih dulu.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Nilai Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{(nilaiTable.extra.totalGraded ?? feederLocalCounts['nilai_perkuliahan'] ?? 0).toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-slate-300 mt-1">Status job: {nilaiJobStatus?.status ?? 'Belum pernah dijalankan'}</p>
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
              onClick={() => {
                setActiveTab(key);
                // Tab Push menyorot nilai lokal yang belum cocok dengan Feeder (kandidat Push).
                setGradeFilter(key === 'push' ? 'unsynced' : 'graded');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === key ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Action Card: Tab Push */}
        {activeTab === 'push' && <FeederPushPanel kind="nilai" onDone={() => nilaiTable.reload()} />}

        {/* Action Card: Tab Pull */}
        {activeTab === 'pull' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          {nilaiJobStatus && nilaiJobStatus.status !== 'idle' ? (
            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                nilaiJobStatus.status === 'error'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : nilaiJobStatus.status === 'done'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {nilaiJobStatus.status === 'running' ? (
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
              ) : nilaiJobStatus.status === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                {nilaiJobStatus.status === 'running' ? (
                  <span>
                    {nilaiJobStatus.totalClasses === 0
                      ? `${nilaiJobStatus.phase || 'Menyiapkan daftar kelas dari Feeder'}...`
                      : `Memproses kelas ${nilaiJobStatus.processedClasses}/${nilaiJobStatus.totalClasses} -- ${nilaiJobStatus.updatedGrades} nilai diperbarui sejauh ini.`}
                  </span>
                ) : (
                  <span>{nilaiJobStatus.message}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Belum pernah dijalankan pada sesi ini.</p>
          )}

          <button
            onClick={handleStartNilaiJob}
            disabled={isStartingNilaiJob || nilaiJobStatus?.status === 'running'}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {nilaiJobStatus?.status === 'running' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
            <span>{nilaiJobStatus?.status === 'running' ? 'Sedang Berjalan...' : 'Mulai Sinkronisasi (Background)'}</span>
          </button>
        </div>
        )}

        {/* Tabel Nilai Lokal (server-side) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Data Nilai Lokal</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nilai yang tersimpan di KRS lokal. &quot;Sinkron Feeder&quot; terisi saat nilai baris ini diambil/dicocokkan
                dari Feeder lewat job sinkronisasi di atas; tabel diperbarui otomatis setelah job selesai.
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {nilaiTable.isLoading
                ? 'Memuat...'
                : `${nilaiTable.total.toLocaleString('id-ID')} baris · ${(nilaiTable.extra.synced ?? 0).toLocaleString('id-ID')} sinkron Feeder`}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="text"
              value={nilaiTable.searchInput}
              onChange={(e) => nilaiTable.setSearchInput(e.target.value)}
              placeholder="Cari NIM, nama mahasiswa, mata kuliah, atau kelas..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value as 'graded' | 'unsynced' | 'ungraded' | 'all')}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
            >
              <option value="graded">Sudah ada nilai</option>
              <option value="unsynced">Nilai belum sinkron Feeder</option>
              <option value="ungraded">Belum ada nilai</option>
              <option value="all">Semua KRS</option>
            </select>
          </div>

          {nilaiTable.error && (
            <div className="flex items-start gap-2 text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Gagal memuat tabel: {nilaiTable.error}</span>
            </div>
          )}

          <div className={`border border-slate-200 rounded-xl max-h-96 overflow-auto ${nilaiTable.isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[1000px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  {(
                    [
                      ['nim', 'NIM', ''],
                      ['studentName', 'Nama Mahasiswa', ''],
                      ['courseLabel', 'Mata Kuliah', ''],
                      ['className', 'Kelas', ''],
                      ['academicYear', 'Tahun Akademik', ''],
                      ['totalScore', 'Nilai Angka', 'text-center'],
                      ['gradeLetter', 'Huruf', 'text-center'],
                      ['gradePoint', 'Indeks', 'text-center'],
                      ['gradeStatus', 'Status', 'text-center'],
                      ['synced', 'Sinkron Feeder', 'text-center'],
                    ] as [string, string, string][]
                  ).map(([key, label, cls]) => (
                    <th
                      key={key}
                      onClick={() => nilaiTable.toggleSort(key)}
                      aria-sort={nilaiTable.sortKey === key ? (nilaiTable.sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`py-2.5 px-3 cursor-pointer select-none hover:text-[#1E3A8A] ${cls}`}
                    >
                      {label}
                      <span className={`text-[9px] ${nilaiTable.sortKey === key ? '' : 'text-slate-300'}`}>{nilaiSortIndicator(key)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!nilaiTable.isLoading && nilaiTable.items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-6 px-3 text-center text-slate-400">
                      {nilaiTable.searchInput ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data untuk filter ini.'}
                    </td>
                  </tr>
                )}
                {nilaiTable.items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{row.nim || '-'}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{row.studentName || '-'}</td>
                    <td className="py-2 px-3 text-slate-600">{row.courseLabel}</td>
                    <td className="py-2 px-3 text-slate-700">{row.className}</td>
                    <td className="py-2 px-3 text-slate-600">{row.academicYear}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">
                      {row.totalScore !== null && row.totalScore !== undefined ? row.totalScore : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-800">{row.gradeLetter || '-'}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">
                      {row.gradePoint !== null && row.gradePoint !== undefined ? row.gradePoint.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          row.gradeStatus === 'FINAL'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {row.gradeStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {row.feederGradeSyncedAt ? (
                        <span
                          title={`Nilai tersinkron ${new Date(row.feederGradeSyncedAt).toLocaleString('id-ID')}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                        >
                          <CheckCircle2 className="w-3 h-3" />
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
            page={nilaiTable.page}
            pageSize={nilaiTable.pageSize}
            total={nilaiTable.total}
            totalPages={nilaiTable.totalPages}
            noun="baris nilai"
            onPageChange={nilaiTable.setPage}
            onPageSizeChange={nilaiTable.setPageSize}
          />
        </div>
      </div>
    </PortalLayout>
  );
}
