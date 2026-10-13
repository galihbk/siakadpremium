'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getAuthSession } from '@/lib/auth';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
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

export interface RemoteCourseClassItem {
  feederId?: string;
  className: string;
  courseFeederId?: string;
  courseCode?: string;
  courseName?: string;
  academicYearCode?: string;
  sks?: number;
  studentCount?: number;
  prodiCode?: string;
  lecturerFeederId?: string;
  lecturerNidn?: string;
  lecturerName?: string;
}

export interface LocalCourseClassItem {
  id: string;
  className: string;
  courseCode: string;
  courseName: string;
  academicYear: string;
  lecturerName: string;
  lecturerNidn: string;
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

export default function SinkronisasiKelasKuliahPage() {
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

  // Daftar kelas kuliah lokal tersimpan -- dipakai untuk kartu "Total Lokal" (via .length)
  // DAN tabel "Data Lokal Tersimpan" di bawah, bukan cuma angka.
  const [kelasLocalItems, setKelasLocalItems] = useState<LocalCourseClassItem[]>([]);
  const [isLoadingLocalItems, setIsLoadingLocalItems] = useState(true);

  const fetchLocalKelas = React.useCallback(() => {
    setIsLoadingLocalItems(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    return fetch(`${apiBase}/academic/schedules`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setKelasLocalItems(result);
      })
      .catch((err) => console.warn('Gagal memuat daftar kelas kuliah lokal:', err))
      .finally(() => setIsLoadingLocalItems(false));
  }, []);

  useEffect(() => {
    fetchLocalKelas();
  }, [fetchLocalKelas]);

  // Tarik & Sinkronkan Kelas Perkuliahan & Dosen Pengampu dari Feeder
  const [isPullingKelas, setIsPullingKelas] = useState(false);
  const [isSyncingKelas, setIsSyncingKelas] = useState(false);
  const [kelasPullMessage, setKelasPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [kelasPullItems, setKelasPullItems] = useState<RemoteCourseClassItem[]>([]);
  const [isKelasResultModalOpen, setIsKelasResultModalOpen] = useState(false);

  const kelasKey = (item: RemoteCourseClassItem) => item.feederId || `${item.courseFeederId}-${item.className}`;

  // Kelas hasil Pull dari Feeder dicocokkan ke kelas lokal lewat kode mata kuliah +
  // nama kelas (Feeder tidak mengembalikan ID lokal) -- dipakai sebagai acuan kolom
  // "Feeder" pada tabel perbandingan, sengaja TIDAK dikosongkan setelah sinkron
  // supaya kolom tersebut tetap akurat (lihat handleSyncKelasKuliah).
  const [hasPulledOnceKelas, setHasPulledOnceKelas] = useState(false);
  const localKelasMatchKey = (item: LocalCourseClassItem) => `${item.courseCode}-${item.className}`;
  const remoteKelasMatchKey = (item: RemoteCourseClassItem) => `${item.courseCode || ''}-${item.className}`;

  interface KelasComparisonRow {
    key: string;
    className: string;
    courseLabel: string;
    academicYear: string;
    lecturerName: string;
    inLocal: boolean;
    inFeeder: boolean | null; // null = belum pernah Pull sama sekali
  }

  const kelasComparisonRows = useMemo<KelasComparisonRow[]>(() => {
    const map = new Map<string, KelasComparisonRow>();
    for (const l of kelasLocalItems) {
      const key = localKelasMatchKey(l);
      map.set(key, {
        key,
        className: l.className,
        courseLabel: `${l.courseCode} -- ${l.courseName}`,
        academicYear: l.academicYear || '-',
        lecturerName:
          l.lecturerName && l.lecturerName !== '-'
            ? `${l.lecturerName}${l.lecturerNidn && l.lecturerNidn !== '-' ? ` (${l.lecturerNidn})` : ''}`
            : '-',
        inLocal: true,
        inFeeder: hasPulledOnceKelas ? false : null,
      });
    }
    for (const r of kelasPullItems) {
      const key = remoteKelasMatchKey(r);
      const existing = map.get(key);
      if (existing) {
        existing.inFeeder = true;
      } else {
        map.set(key, {
          key,
          className: r.className,
          courseLabel: r.courseCode ? `${r.courseCode} -- ${r.courseName}` : 'Belum tersinkron',
          academicYear: r.academicYearCode || '-',
          lecturerName: r.lecturerName ? `${r.lecturerName}${r.lecturerNidn ? ` (${r.lecturerNidn})` : ''}` : '-',
          inLocal: false,
          inFeeder: true,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className));
  }, [kelasLocalItems, kelasPullItems, hasPulledOnceKelas]);

  // Handler: Tarik Kelas Perkuliahan & Dosen Pengampu dari Feeder
  const handlePullKelasKuliah = async () => {
    setIsPullingKelas(true);
    setKelasPullMessage(null);
    setKelasPullItems([]);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${apiBase}/integration-settings/pddikti/kelas-kuliah`, { headers });
      if (res.status === 401 || res.status === 403) {
        setKelasPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result?.success) {
        setKelasPullMessage({ success: false, text: result?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const items: RemoteCourseClassItem[] = Array.isArray(result?.items) ? result.items : [];
      setKelasPullItems(items);
      setHasPulledOnceKelas(true);
      const matched = items.filter((i) => i.courseCode && i.academicYearCode).length;
      setKelasPullMessage({
        success: true,
        text: `${items.length} kelas perkuliahan ditarik dari Feeder. ${matched} kelas sudah cocok dengan mata kuliah & tahun akademik lokal, sisanya dilewati otomatis saat sinkronisasi (mata kuliah/tahun akademiknya belum tersinkron).`,
      });
      if (items.length > 0) setIsKelasResultModalOpen(true);
    } catch (err) {
      setKelasPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKelas(false);
    }
  };

  // Handler: Sinkronkan Kelas Perkuliahan hasil Pull ke data lokal
  const handleSyncKelasKuliah = async () => {
    if (kelasPullItems.length === 0) return;
    setIsSyncingKelas(true);
    const startedAt = Date.now();
    const batchSize = kelasPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const res = await fetch(`${apiBase}/integration-settings/pddikti/kelas-kuliah/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: kelasPullItems }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      setSyncLogs((prev) => [
        {
          id: `log-kelas-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kelas Perkuliahan & Dosen Pengampu (kelas_kuliah)',
          batchSize,
          successCount: (result?.created ?? 0) + (result?.updated ?? 0),
          errorCount: result?.skipped ?? 0,
          status: (result?.skipped ?? 0) > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || '-',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi kelas perkuliahan selesai.');
      // Sengaja TIDAK mengosongkan kelasPullItems -- tabel perbandingan di bawah
      // butuh data hasil Pull ini supaya kolom "Feeder" tetap akurat setelah sinkron.
      setIsKelasResultModalOpen(false);
      fetchLocalKelas();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kelas-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kelas Perkuliahan & Dosen Pengampu (kelas_kuliah)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan kelas perkuliahan.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan kelas perkuliahan.');
    } finally {
      setIsSyncingKelas(false);
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
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>kelas_kuliah</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Kelas Perkuliahan &amp; Dosen Pengampu</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil pembagian kelas semester berjalan &amp; dosen pengampu (NIDN) dari Web Service Neo Feeder. Mata
                  kuliah &amp; tahun akademik wajib sudah tersinkron lebih dulu.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{kelasLocalItems.length.toLocaleString('id-ID')}</p>
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
          {kelasPullMessage && (
            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                kelasPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {kelasPullMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <span>{kelasPullMessage.text}</span>
                {kelasPullItems.length > 0 && (
                  <button
                    onClick={() => setIsKelasResultModalOpen(true)}
                    className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                  >
                    Lihat &amp; Sinkronkan {kelasPullItems.length} Kelas
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handlePullKelasKuliah}
              disabled={isPullingKelas}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPullingKelas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              <span>{isPullingKelas ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
            <button
              disabled
              title="Belum tersedia -- dokumentasi Feeder yang ada cuma mendaftar method pengambilan data untuk kelas_kuliah, belum ada Insert/Update"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Push</span>
            </button>
          </div>
        </div>

        {/* Modal: Hasil Tarikan Kelas Perkuliahan */}
        <Modal
          isOpen={isKelasResultModalOpen}
          onClose={() => setIsKelasResultModalOpen(false)}
          title="Hasil Tarikan Kelas Perkuliahan dari Feeder"
          subtitle={`${kelasPullItems.length} kelas ditarik dari Feeder (dicocokkan ke mata kuliah & tahun akademik lokal lewat kode Feeder)`}
          icon={<Layers className="w-5 h-5" />}
          maxWidth="3xl"
        >
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Kelas yang mata kuliah atau tahun akademiknya belum tersinkron lokal (kolom berwarna merah) akan otomatis
              dilewati saat disinkronkan -- sinkronkan dulu Mata Kuliah & Tahun Akademik terkait, lalu Pull ulang.
            </p>
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Nama Kelas</th>
                    <th className="py-2.5 px-3">Mata Kuliah</th>
                    <th className="py-2.5 px-3">Tahun Akademik</th>
                    <th className="py-2.5 px-3">Dosen Pengampu</th>
                    <th className="py-2.5 px-3">Peserta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kelasPullItems.map((item, idx) => (
                    <tr key={`${kelasKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.className}</td>
                      <td className={`py-2 px-3 ${item.courseCode ? 'text-slate-600' : 'text-rose-600 font-semibold'}`}>
                        {item.courseCode ? `${item.courseCode} -- ${item.courseName}` : 'Belum tersinkron'}
                      </td>
                      <td className={`py-2 px-3 font-mono ${item.academicYearCode ? 'text-slate-600' : 'text-rose-600 font-semibold'}`}>
                        {item.academicYearCode || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {item.lecturerName ? `${item.lecturerName}${item.lecturerNidn ? ` (${item.lecturerNidn})` : ''}` : '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.studentCount ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsKelasResultModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleSyncKelasKuliah}
                disabled={isSyncingKelas}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingKelas ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingKelas ? 'Menyinkronkan...' : 'Sinkronkan Semua'}</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Perbandingan Data Lokal vs Feeder */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Perbandingan Data Lokal vs Feeder</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasPulledOnceKelas
                  ? 'Dicocokkan lewat kode mata kuliah + nama kelas dari hasil Pull terakhir.'
                  : 'Kolom Feeder baru terisi setelah Pull dari Feeder di atas.'}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {isLoadingLocalItems
                ? 'Memuat...'
                : `${kelasLocalItems.length} lokal${hasPulledOnceKelas ? ` · ${kelasPullItems.length} di Feeder` : ''}`}
            </span>
          </div>

          {isLoadingLocalItems ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Memuat data lokal...
            </div>
          ) : kelasComparisonRows.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada kelas kuliah tersimpan lokal. Pull &amp; sinkronkan dari Feeder dulu di atas.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Nama Kelas</th>
                    <th className="py-2.5 px-3">Mata Kuliah</th>
                    <th className="py-2.5 px-3">Tahun Akademik</th>
                    <th className="py-2.5 px-3">Dosen Pengampu</th>
                    <th className="py-2.5 px-3 text-center">Lokal</th>
                    <th className="py-2.5 px-3 text-center">Feeder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kelasComparisonRows.map((item) => (
                    <tr key={item.key} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.className}</td>
                      <td className="py-2 px-3 text-slate-600">{item.courseLabel}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{item.academicYear}</td>
                      <td className="py-2 px-3 text-slate-600">{item.lecturerName}</td>
                      <td className="py-2 px-3 text-center">
                        {item.inLocal ? (
                          <Check className="w-4 h-4 text-emerald-600 inline-block" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 inline-block" />
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.inFeeder === null ? (
                          <span className="text-[10px] text-slate-400">Belum ditarik</span>
                        ) : item.inFeeder ? (
                          <Check className="w-4 h-4 text-emerald-600 inline-block" />
                        ) : (
                          <Minus className="w-4 h-4 text-slate-300 inline-block" />
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
