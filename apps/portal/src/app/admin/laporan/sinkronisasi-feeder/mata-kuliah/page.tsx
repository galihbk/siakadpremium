'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getAuthSession } from '@/lib/auth';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Terminal,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface RemoteCourseItem {
  feederId?: string;
  code: string;
  name: string;
  sks: number;
  semester: number;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface RemoteCurriculumItem {
  feederId?: string;
  name: string;
  startYear?: number;
  totalSks?: number;
  prodiCode?: string;
  studyProgramId?: string;
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

export interface PendingCodedItem {
  id: string;
  code: string;
  name: string;
  studyProgram: string;
  lastError: string | null;
  lastErrorAt: string | null;
}

export default function SinkronisasiMataKuliahPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pull' | 'push'>('pull');

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

  // Jumlah baris lokal (data nyata) untuk Mata Kuliah -- entitas ini tidak tercakup
  // oleh endpoint pddikti/sync-status (endpoint itu cuma 5 entitas utama), jadi dipakai
  // rekap lokal dari /academic/feeder-entities, sama seperti pada halaman induk sebelumnya.
  const [feederLocalCounts, setFeederLocalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/feeder-entities`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setFeederLocalCounts(json?.data || json || {}))
      .catch((err) => console.warn('Gagal memuat jumlah data lokal per entitas Feeder:', err));
  }, []);

  // Daftar program studi lokal -- dipakai untuk mencocokkan otomatis prodi hasil tarikan
  // Kurikulum & Mata Kuliah dari Feeder ke Program Studi lokal lewat kode prodi.
  const [studyProgramsForDosen, setStudyProgramsForDosen] = useState<{ id: string; code: string; diktiCode: string; name: string }[]>([]);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/study-programs`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = Array.isArray(json) ? json : json?.data || [];
        setStudyProgramsForDosen(
          result.map((p: any) => ({ id: p.id, code: p.code, diktiCode: p.diktiCode || '', name: p.name }))
        );
      })
      .catch((err) => console.warn('Gagal memuat daftar program studi:', err));
  }, []);

  // Tarik & Sinkronkan Kurikulum + Mata Kuliah dari Feeder
  const [isPullingKurikulum, setIsPullingKurikulum] = useState(false);
  const [isSyncingKurikulum, setIsSyncingKurikulum] = useState(false);
  const [isPushingKurikulum, setIsPushingKurikulum] = useState(false);
  const [kurikulumPullMessage, setKurikulumPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [kurikulumPullItems, setKurikulumPullItems] = useState<RemoteCurriculumItem[]>([]);
  const [kurikulumProdiChoice, setKurikulumProdiChoice] = useState<Record<string, string>>({});
  const [matkulPullItems, setMatkulPullItems] = useState<RemoteCourseItem[]>([]);
  const [matkulProdiChoice, setMatkulProdiChoice] = useState<Record<string, string>>({});
  const [isKurikulumResultModalOpen, setIsKurikulumResultModalOpen] = useState(false);

  const kurikulumKey = (item: RemoteCurriculumItem) => item.feederId || item.name;
  const matkulKey = (item: RemoteCourseItem) => item.feederId || item.code;

  // Daftar kurikulum & mata kuliah lokal yang BELUM terdaftar di Feeder (feederId null),
  // dipakai di tab Push supaya kelihatan apa yang belum terpush dan kenapa gagal kalau gagal.
  const [kurikulumPendingItems, setKurikulumPendingItems] = useState<PendingCodedItem[]>([]);
  const [matkulPendingItems, setMatkulPendingItems] = useState<PendingCodedItem[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  const fetchPendingItems = async () => {
    setIsLoadingPending(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [kurRes, mkRes] = await Promise.all([
        fetch(`${apiBase}/integration-settings/pddikti/kurikulum/pending`, { headers }),
        fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah/pending`, { headers }),
      ]);
      const kurJson = await kurRes.json().catch(() => null);
      const mkJson = await mkRes.json().catch(() => null);
      const kurResult = kurJson?.data ?? kurJson;
      const mkResult = mkJson?.data ?? mkJson;
      setKurikulumPendingItems(Array.isArray(kurResult) ? kurResult : []);
      setMatkulPendingItems(Array.isArray(mkResult) ? mkResult : []);
    } catch (err) {
      console.warn('Gagal memuat daftar kurikulum & mata kuliah belum terpush:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'push') fetchPendingItems();
  }, [activeTab]);

  // Handler: Tarik Kurikulum + Mata Kuliah dari Feeder sekaligus
  const handlePullKurikulumMataKuliah = async () => {
    setIsPullingKurikulum(true);
    setKurikulumPullMessage(null);
    setKurikulumPullItems([]);
    setMatkulPullItems([]);
    setKurikulumProdiChoice({});
    setMatkulProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [kurRes, mkRes] = await Promise.all([
        fetch(`${apiBase}/integration-settings/pddikti/kurikulum`, { headers }),
        fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah`, { headers }),
      ]);
      if (kurRes.status === 401 || kurRes.status === 403 || mkRes.status === 401 || mkRes.status === 403) {
        setKurikulumPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const kurJson = await kurRes.json().catch(() => null);
      const mkJson = await mkRes.json().catch(() => null);
      const kurResult = kurJson?.data ?? kurJson;
      const mkResult = mkJson?.data ?? mkJson;

      if (!kurResult?.success && !mkResult?.success) {
        setKurikulumPullMessage({ success: false, text: kurResult?.message || mkResult?.message || 'Gagal menarik data dari server.' });
        return;
      }

      const kurItems: RemoteCurriculumItem[] = Array.isArray(kurResult?.items) ? kurResult.items : [];
      const mkItems: RemoteCourseItem[] = Array.isArray(mkResult?.items) ? mkResult.items : [];

      const autoKur: Record<string, string> = {};
      kurItems.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoKur[kurikulumKey(item)] = match.id;
      });
      const autoMk: Record<string, string> = {};
      mkItems.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoMk[matkulKey(item)] = match.id;
      });

      setKurikulumPullItems(kurItems);
      setMatkulPullItems(mkItems);
      setKurikulumProdiChoice(autoKur);
      setMatkulProdiChoice(autoMk);
      setKurikulumPullMessage({
        success: true,
        text: `${kurItems.length} kurikulum & ${mkItems.length} mata kuliah ditarik dari Feeder. Prodi yang kodenya cocok otomatis terisi, sisanya perlu dipilih manual.`,
      });
      if (kurItems.length > 0 || mkItems.length > 0) setIsKurikulumResultModalOpen(true);
    } catch (err) {
      setKurikulumPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingKurikulum(false);
    }
  };

  // Handler: Sinkronkan Kurikulum + Mata Kuliah hasil Pull ke data lokal
  const handleSyncKurikulumMataKuliah = async () => {
    if (kurikulumPullItems.length === 0 && matkulPullItems.length === 0) return;
    setIsSyncingKurikulum(true);
    const startedAt = Date.now();
    const batchSize = kurikulumPullItems.length + matkulPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const kurItems = kurikulumPullItems.map((i) => ({ ...i, studyProgramId: kurikulumProdiChoice[kurikulumKey(i)] }));
      const mkItems = matkulPullItems.map((i) => ({ ...i, studyProgramId: matkulProdiChoice[matkulKey(i)] }));

      // Kurikulum WAJIB disinkronkan dulu (bukan paralel) -- mata kuliah dikaitkan ke
      // Curriculum lokal lewat feederId-nya, jadi kurikulumnya harus sudah ada duluan
      // supaya tautannya langsung benar di percobaan sync pertama.
      const kurRes = await fetch(`${apiBase}/integration-settings/pddikti/kurikulum/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: kurItems }),
      });
      const kurJson = await kurRes.json().catch(() => null);
      const kurResult = kurJson?.data ?? kurJson;
      if (!kurRes.ok) throw new Error(kurResult?.message || `HTTP ${kurRes.status}`);

      const mkRes = await fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items: mkItems }),
      });
      const mkJson = await mkRes.json().catch(() => null);
      const mkResult = mkJson?.data ?? mkJson;
      if (!mkRes.ok) throw new Error(mkResult?.message || `HTTP ${mkRes.status}`);

      const created = (kurResult?.created ?? 0) + (mkResult?.created ?? 0);
      const updated = (kurResult?.updated ?? 0) + (mkResult?.updated ?? 0);
      const skipped = (kurResult?.skipped ?? 0) + (mkResult?.skipped ?? 0);
      const message = `Kurikulum: ${kurResult?.message || '-'} | Mata Kuliah: ${mkResult?.message || '-'}`;
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message,
        },
        ...prev,
      ]);

      showToast(message);
      setKurikulumPullItems([]);
      setMatkulPullItems([]);
      setKurikulumProdiChoice({});
      setMatkulProdiChoice({});
      setIsKurikulumResultModalOpen(false);
      setFeederLocalCounts((prev) => ({ ...prev, mata_kuliah: (prev['mata_kuliah'] ?? 0) + (mkResult?.created ?? 0) }));
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan kurikulum & mata kuliah.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan kurikulum & mata kuliah.');
    } finally {
      setIsSyncingKurikulum(false);
    }
  };

  // Handler: Push mata kuliah + kurikulum lokal yang belum terdaftar ke Feeder (tulis ke PDDIKTI).
  const handlePushKurikulumMataKuliah = async () => {
    setIsPushingKurikulum(true);
    const startedAt = Date.now();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const [mkRes, kurRes] = await Promise.all([
        fetch(`${apiBase}/integration-settings/pddikti/mata-kuliah/push`, { method: 'POST', headers, body: JSON.stringify({}) }),
        fetch(`${apiBase}/integration-settings/pddikti/kurikulum/push`, { method: 'POST', headers, body: JSON.stringify({}) }),
      ]);
      const mkJson = await mkRes.json().catch(() => null);
      const kurJson = await kurRes.json().catch(() => null);
      const mkResult = mkJson?.data ?? mkJson;
      const kurResult = kurJson?.data ?? kurJson;
      if (!mkRes.ok && !kurRes.ok) throw new Error(mkResult?.message || kurResult?.message || `HTTP ${mkRes.status}`);

      const processed = (mkResult?.processed ?? 0) + (kurResult?.processed ?? 0);
      const createdCount = (mkResult?.created ?? 0) + (kurResult?.created ?? 0);
      const failedCount = (mkResult?.failed ?? 0) + (kurResult?.failed ?? 0);
      const message = `Mata Kuliah: ${mkResult?.message || '-'} | Kurikulum: ${kurResult?.message || '-'}`;
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah) -- Push ke Feeder',
          batchSize: processed,
          successCount: createdCount + (mkResult?.linked ?? 0) + (kurResult?.linked ?? 0),
          errorCount: failedCount,
          status: !mkResult?.success && !kurResult?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message,
        },
        ...prev,
      ]);

      showToast(message);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-kurikulum-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Kurikulum & Mata Kuliah (mata_kuliah) -- Push ke Feeder',
          batchSize: 0,
          successCount: 0,
          errorCount: 0,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal push kurikulum & mata kuliah ke Feeder.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal push kurikulum & mata kuliah ke Feeder.');
    } finally {
      setIsPushingKurikulum(false);
      fetchPendingItems();
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
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>mata_kuliah</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Kurikulum &amp; Bobot Mata Kuliah</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil struktur kurikulum &amp; daftar mata kuliah (kode, nama, bobot SKS, semester) dari Web Service Neo
                  Feeder. Kurikulum disinkronkan lebih dulu sebelum mata kuliah supaya tautannya langsung benar.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{(feederLocalCounts['mata_kuliah'] ?? 0).toLocaleString('id-ID')}</p>
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
          <button
            onClick={() => setActiveTab('pull')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'pull' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tarik dari Feeder
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'push' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Push ke Feeder
          </button>
        </div>

        {/* Action Card: Tab Pull */}
        {activeTab === 'pull' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            {kurikulumPullMessage && (
              <div
                className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                  kurikulumPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {kurikulumPullMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <span>{kurikulumPullMessage.text}</span>
                  {(kurikulumPullItems.length > 0 || matkulPullItems.length > 0) && (
                    <button
                      onClick={() => setIsKurikulumResultModalOpen(true)}
                      className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                    >
                      Lihat &amp; Sinkronkan ({kurikulumPullItems.length} Kurikulum, {matkulPullItems.length} Mata Kuliah)
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handlePullKurikulumMataKuliah}
              disabled={isPullingKurikulum}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPullingKurikulum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              <span>{isPullingKurikulum ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
          </div>
        )}

        {/* Action Card: Tab Push */}
        {activeTab === 'push' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
            <button
              onClick={handlePushKurikulumMataKuliah}
              disabled={isPushingKurikulum}
              title="Kirim mata kuliah & kurikulum lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPushingKurikulum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
              <span>{isPushingKurikulum ? 'Mengirim...' : 'Push ke Feeder'}</span>
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span />
              <button
                onClick={fetchPendingItems}
                disabled={isLoadingPending}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A8A] hover:underline disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingPending ? 'animate-spin' : ''}`} />
                {isLoadingPending ? 'Memuat...' : 'Muat Ulang'}
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Kurikulum Belum Terdaftar</h4>
              {!isLoadingPending && (
                <p className="text-[11px] text-slate-500">
                  {kurikulumPendingItems.length} data belum terpush
                  {kurikulumPendingItems.filter((i) => i.lastError).length > 0 &&
                    `. ${kurikulumPendingItems.filter((i) => i.lastError).length} di antaranya gagal pada percobaan terakhir.`}
                </p>
              )}
              <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Prodi</th>
                      <th className="py-2.5 px-3">Error Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingPending ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3 text-center text-slate-400">
                          Memuat data...
                        </td>
                      </tr>
                    ) : kurikulumPendingItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3 text-center text-slate-400">
                          Semua kurikulum sudah terdaftar di Feeder.
                        </td>
                      </tr>
                    ) : (
                      kurikulumPendingItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.code || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.studyProgram || '-'}</td>
                          <td className="py-2 px-3">
                            {item.lastError ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-start gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span>{item.lastError}</span>
                                </span>
                                {item.lastErrorAt && (
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(item.lastErrorAt).toLocaleString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Belum pernah dicoba</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Mata Kuliah Belum Terdaftar</h4>
              {!isLoadingPending && (
                <p className="text-[11px] text-slate-500">
                  {matkulPendingItems.length} data belum terpush
                  {matkulPendingItems.filter((i) => i.lastError).length > 0 &&
                    `. ${matkulPendingItems.filter((i) => i.lastError).length} di antaranya gagal pada percobaan terakhir.`}
                </p>
              )}
              <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Prodi</th>
                      <th className="py-2.5 px-3">Error Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingPending ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3 text-center text-slate-400">
                          Memuat data...
                        </td>
                      </tr>
                    ) : matkulPendingItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 px-3 text-center text-slate-400">
                          Semua mata kuliah sudah terdaftar di Feeder.
                        </td>
                      </tr>
                    ) : (
                      matkulPendingItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.code || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.studyProgram || '-'}</td>
                          <td className="py-2 px-3">
                            {item.lastError ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-start gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span>{item.lastError}</span>
                                </span>
                                {item.lastErrorAt && (
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(item.lastErrorAt).toLocaleString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">Belum pernah dicoba</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Hasil Tarikan Kurikulum & Mata Kuliah */}
        <Modal
          isOpen={isKurikulumResultModalOpen}
          onClose={() => setIsKurikulumResultModalOpen(false)}
          title="Hasil Tarikan Kurikulum & Mata Kuliah dari Feeder"
          subtitle={`${kurikulumPullItems.length} kurikulum & ${matkulPullItems.length} mata kuliah ditarik dari Feeder`}
          icon={<BookOpen className="w-5 h-5" />}
          maxWidth="3xl"
        >
          <div className="space-y-5">
            <p className="text-[11px] text-slate-500">
              Kurikulum/mata kuliah yang sudah ada lokal akan otomatis diperbarui. Yang baru wajib dipilihkan
              program studi dulu sebelum disinkronkan.
            </p>

            {kurikulumPullItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Kurikulum ({kurikulumPullItems.length})</h4>
                <div className="border border-slate-200 rounded-xl max-h-60 overflow-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Nama Kurikulum</th>
                        <th className="py-2.5 px-3">Tahun Mulai</th>
                        <th className="py-2.5 px-3">Total SKS</th>
                        <th className="py-2.5 px-3">Program Studi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kurikulumPullItems.map((item, idx) => (
                        <tr key={`${kurikulumKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.startYear || '-'}</td>
                          <td className="py-2 px-3 text-slate-600">{item.totalSks || '-'}</td>
                          <td className="py-2 px-3">
                            <select
                              value={kurikulumProdiChoice[kurikulumKey(item)] || ''}
                              onChange={(e) => setKurikulumProdiChoice((prev) => ({ ...prev, [kurikulumKey(item)]: e.target.value }))}
                              className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                kurikulumProdiChoice[kurikulumKey(item)] ? 'border-slate-200' : 'border-amber-300'
                              }`}
                            >
                              <option value="">Pilih prodi...</option>
                              {studyProgramsForDosen.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {matkulPullItems.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Mata Kuliah ({matkulPullItems.length})</h4>
                <div className="border border-slate-200 rounded-xl max-h-60 overflow-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Kode</th>
                        <th className="py-2.5 px-3">Nama Mata Kuliah</th>
                        <th className="py-2.5 px-3">SKS</th>
                        <th className="py-2.5 px-3">Semester</th>
                        <th className="py-2.5 px-3">Program Studi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matkulPullItems.map((item, idx) => (
                        <tr key={`${matkulKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.code}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-2 px-3 text-slate-600">{item.sks}</td>
                          <td className="py-2 px-3 text-slate-600">{item.semester}</td>
                          <td className="py-2 px-3">
                            <select
                              value={matkulProdiChoice[matkulKey(item)] || ''}
                              onChange={(e) => setMatkulProdiChoice((prev) => ({ ...prev, [matkulKey(item)]: e.target.value }))}
                              className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                                matkulProdiChoice[matkulKey(item)] ? 'border-slate-200' : 'border-amber-300'
                              }`}
                            >
                              <option value="">Pilih prodi...</option>
                              {studyProgramsForDosen.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsKurikulumResultModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleSyncKurikulumMataKuliah}
                disabled={isSyncingKurikulum}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingKurikulum ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingKurikulum ? 'Menyinkronkan...' : 'Sinkronkan Semua'}</span>
              </button>
            </div>
          </div>
        </Modal>

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
