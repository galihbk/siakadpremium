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
  GraduationCap,
  Terminal,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface RemoteMahasiswaItem {
  feederId?: string;
  nim?: string;
  nik?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string;
  entryYear?: number;
  status?: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  email?: string;
  phone?: string;
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

export interface PendingMahasiswaItem {
  id: string;
  nim: string;
  fullName: string;
  studyProgram: string;
  hasFeederId: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
}

export default function SinkronisasiMahasiswaPage() {
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

  // Total lokal mahasiswa -- diambil dari rekap sinkronisasi NYATA per entitas.
  const [mhsLocalTotal, setMhsLocalTotal] = useState<number>(0);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/sync-status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        const list = Array.isArray(result) ? result : [];
        const mhsEntry = list.find((e: any) => e.key === 'mahasiswa');
        if (mhsEntry) setMhsLocalTotal(mhsEntry.totalLocal ?? 0);
      })
      .catch((err) => console.warn('Gagal memuat status sinkronisasi mahasiswa:', err));
  }, []);

  // Daftar program studi lokal -- dipakai untuk mencocokkan otomatis "prodi home base"
  // hasil tarikan Mahasiswa dari Feeder ke Program Studi lokal lewat kode prodi.
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

  // Tarik & Sinkronkan Data Mahasiswa dari Feeder
  const [isPullingMhs, setIsPullingMhs] = useState(false);
  const [isSyncingMhs, setIsSyncingMhs] = useState(false);
  const [mhsAngkatan, setMhsAngkatan] = useState('');
  const [mhsAngkatanOptions, setMhsAngkatanOptions] = useState<number[]>([]);
  const [isLoadingMhsAngkatan, setIsLoadingMhsAngkatan] = useState(true);
  const [mhsAngkatanError, setMhsAngkatanError] = useState<string | null>(null);
  const [mhsPullMessage, setMhsPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [mhsPullItems, setMhsPullItems] = useState<RemoteMahasiswaItem[]>([]);
  const [mhsProdiChoice, setMhsProdiChoice] = useState<Record<string, string>>({});
  const [isMhsResultModalOpen, setIsMhsResultModalOpen] = useState(false);
  const [isPushingMhs, setIsPushingMhs] = useState(false);

  // Pilihan tahun angkatan untuk Pull Mahasiswa -- lokal diutamakan, fallback ke contoh
  // data Feeder kalau belum ada mahasiswa lokal sama sekali.
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/angkatan`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result?.years)) setMhsAngkatanOptions(result.years);
        if (!result?.success) setMhsAngkatanError(result?.message || 'Gagal memuat daftar tahun angkatan.');
      })
      .catch((err) => setMhsAngkatanError(err instanceof Error ? err.message : 'Gagal memuat daftar tahun angkatan.'))
      .finally(() => setIsLoadingMhsAngkatan(false));
  }, []);

  // Kunci unik baris mahasiswa hasil tarikan Feeder.
  const mhsKey = (item: RemoteMahasiswaItem) => item.feederId || item.nim || '';

  // Daftar mahasiswa aktif lokal yang BELUM terdaftar di Feeder (feederRegistrationId null),
  // dipakai di tab Push supaya kelihatan apa yang belum terpush dan kenapa gagal kalau gagal.
  const [mhsPendingItems, setMhsPendingItems] = useState<PendingMahasiswaItem[]>([]);
  const [isLoadingMhsPending, setIsLoadingMhsPending] = useState(false);

  const fetchMhsPending = async () => {
    setIsLoadingMhsPending(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      setMhsPendingItems(Array.isArray(result) ? result : []);
    } catch (err) {
      console.warn('Gagal memuat daftar mahasiswa belum terpush:', err);
    } finally {
      setIsLoadingMhsPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'push') fetchMhsPending();
  }, [activeTab]);

  // Handler: Tarik Data Mahasiswa dari Feeder (opsional difilter tahun angkatan)
  const handlePullMahasiswa = async () => {
    setIsPullingMhs(true);
    setMhsPullMessage(null);
    setMhsPullItems([]);
    setMhsProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const qs = mhsAngkatan.trim() ? `?angkatan=${encodeURIComponent(mhsAngkatan.trim())}` : '';
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401 || res.status === 403) {
        setMhsPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result) {
        setMhsPullMessage({ success: false, text: 'Gagal membaca respons server.' });
        return;
      }
      if (!result.success) {
        setMhsPullMessage({ success: false, text: result.message });
        return;
      }

      const items: RemoteMahasiswaItem[] = Array.isArray(result.items) ? result.items : [];
      const autoChoice: Record<string, string> = {};
      items.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoChoice[mhsKey(item)] = match.id;
      });

      setMhsPullItems(items);
      setMhsProdiChoice(autoChoice);
      setMhsPullMessage({
        success: true,
        text:
          items.length > 0
            ? `${items.length} mahasiswa ditarik dari Feeder. ${Object.keys(autoChoice).length} prodi home base otomatis cocok, sisanya perlu dipilih manual.`
            : result.message,
      });
      if (items.length > 0) setIsMhsResultModalOpen(true);
    } catch (err) {
      setMhsPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingMhs(false);
    }
  };

  // Handler: Sinkronkan Mahasiswa hasil Pull ke data lokal
  const handleSyncMahasiswa = async () => {
    if (mhsPullItems.length === 0) return;
    setIsSyncingMhs(true);
    const startedAt = Date.now();
    const batchSize = mhsPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const items = mhsPullItems.map((i) => ({ ...i, studyProgramId: mhsProdiChoice[mhsKey(i)] }));
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ items }),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok) throw new Error(result?.message || `HTTP ${res.status}`);

      const created = result?.created ?? 0;
      const updated = result?.updated ?? 0;
      const skipped = result?.skipped ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-mhs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Sinkronisasi mahasiswa selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi mahasiswa selesai.');
      setMhsPullItems([]);
      setMhsProdiChoice({});
      setIsMhsResultModalOpen(false);
      setMhsLocalTotal((prev) => prev + created);
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-mhs-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan data mahasiswa.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan data mahasiswa.');
    } finally {
      setIsSyncingMhs(false);
    }
  };

  // Handler: Push mahasiswa aktif lokal yang belum terdaftar ke Feeder (tulis ke PDDIKTI).
  // Beda dari Pull/Sync -- ini MENULIS ke sistem resmi Dikti, jadi sengaja tanpa auto-retry
  // dan selalu ditampilkan utuh pesan dari backend (termasuk alasan gagal per mahasiswa).
  const handlePushMahasiswa = async () => {
    setIsPushingMhs(true);
    const startedAt = Date.now();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/mahasiswa/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!res.ok || !result) throw new Error(result?.message || `HTTP ${res.status}`);

      const processed = result?.processed ?? 0;
      const createdCount = result?.created ?? 0;
      const failedCount = result?.failed ?? 0;
      setSyncLogs((prev) => [
        {
          id: `log-mhs-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt) -- Push ke Feeder',
          batchSize: processed,
          successCount: createdCount + (result?.linked ?? 0),
          errorCount: failedCount,
          status: !result?.success ? 'FAILED' : failedCount > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Push mahasiswa ke Feeder selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Push mahasiswa ke Feeder selesai.');
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-mhs-push-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Mahasiswa (mahasiswa_pt) -- Push ke Feeder',
          batchSize: 0,
          successCount: 0,
          errorCount: 0,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal push data mahasiswa ke Feeder.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal push data mahasiswa ke Feeder.');
    } finally {
      setIsPushingMhs(false);
      fetchMhsPending();
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
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>mahasiswa_pt</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Mahasiswa</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil daftar mahasiswa (NIM, biodata, riwayat pendidikan, home base prodi) dari Web Service Neo Feeder,
                  opsional difilter tahun angkatan.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{mhsLocalTotal}</p>
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
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Filter Tahun Angkatan</label>
              <select
                value={mhsAngkatan}
                onChange={(e) => setMhsAngkatan(e.target.value)}
                disabled={isLoadingMhsAngkatan}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                <option value="">{isLoadingMhsAngkatan ? 'Memuat tahun angkatan...' : '-- Semua Angkatan --'}</option>
                {mhsAngkatanOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {!isLoadingMhsAngkatan && mhsAngkatanOptions.length === 0 && mhsAngkatanError && (
                <p className="text-[10px] text-rose-600 mt-1.5">
                  Daftar tahun angkatan tidak termuat: {mhsAngkatanError}. Pull tetap bisa dicoba tanpa filter angkatan.
                </p>
              )}
            </div>

            {mhsPullMessage && (
              <div
                className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                  mhsPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {mhsPullMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <span>{mhsPullMessage.text}</span>
                  {mhsPullItems.length > 0 && (
                    <button
                      onClick={() => setIsMhsResultModalOpen(true)}
                      className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                    >
                      Lihat &amp; Sinkronkan {mhsPullItems.length} Mahasiswa
                    </button>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handlePullMahasiswa}
              disabled={isPullingMhs}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPullingMhs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              <span>{isPullingMhs ? 'Menarik...' : 'Pull dari Feeder'}</span>
            </button>
          </div>
        )}

        {/* Action Card: Tab Push */}
        {activeTab === 'push' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <button
              onClick={handlePushMahasiswa}
              disabled={isPushingMhs}
              title="Kirim mahasiswa aktif lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isPushingMhs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpFromLine className="w-4 h-4" />}
              <span>{isPushingMhs ? 'Mengirim...' : 'Push ke Feeder'}</span>
            </button>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Mahasiswa Belum Terdaftar di Feeder</h4>
                <button
                  onClick={fetchMhsPending}
                  disabled={isLoadingMhsPending}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A8A] hover:underline disabled:opacity-60 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingMhsPending ? 'animate-spin' : ''}`} />
                  {isLoadingMhsPending ? 'Memuat...' : 'Muat Ulang'}
                </button>
              </div>

              {!isLoadingMhsPending && (
                <p className="text-[11px] text-slate-500">
                  {mhsPendingItems.length} data belum terpush
                  {mhsPendingItems.filter((i) => i.lastError).length > 0 &&
                    `. ${mhsPendingItems.filter((i) => i.lastError).length} di antaranya gagal pada percobaan terakhir.`}
                </p>
              )}

              <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">NIM</th>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Prodi</th>
                      <th className="py-2.5 px-3">Status Biodata Feeder</th>
                      <th className="py-2.5 px-3">Error Terakhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingMhsPending ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-3 text-center text-slate-400">
                          Memuat data...
                        </td>
                      </tr>
                    ) : mhsPendingItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-3 text-center text-slate-400">
                          Semua mahasiswa aktif sudah terdaftar di Feeder.
                        </td>
                      </tr>
                    ) : (
                      mhsPendingItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nim || '-'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                          <td className="py-2 px-3 text-slate-600">{item.studyProgram || '-'}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                item.hasFeederId
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {item.hasFeederId ? 'Sudah ada ID' : 'Belum ada ID'}
                            </span>
                          </td>
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

        {/* Modal: Hasil Tarikan Mahasiswa */}
        <Modal
          isOpen={isMhsResultModalOpen}
          onClose={() => setIsMhsResultModalOpen(false)}
          title="Hasil Tarikan Mahasiswa dari Feeder"
          subtitle={`${mhsPullItems.length} mahasiswa ditarik dari Feeder (dicocokkan lewat NIM)`}
          icon={<GraduationCap className="w-5 h-5" />}
          maxWidth="3xl"
        >
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Mahasiswa yang sudah ada lokal akan otomatis diperbarui datanya. Mahasiswa baru wajib dipilihkan
              program studi home base-nya dulu sebelum disinkronkan.
            </p>
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">NIM</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Angkatan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Program Studi Home Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mhsPullItems.map((item, idx) => (
                    <tr key={`${mhsKey(item)}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nim || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.entryYear || '-'}</td>
                      <td className="py-2 px-3 text-slate-600">{item.status || '-'}</td>
                      <td className="py-2 px-3">
                        <select
                          value={mhsProdiChoice[mhsKey(item)] || ''}
                          onChange={(e) => setMhsProdiChoice((prev) => ({ ...prev, [mhsKey(item)]: e.target.value }))}
                          className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                            mhsProdiChoice[mhsKey(item)] ? 'border-slate-200' : 'border-amber-300'
                          }`}
                        >
                          <option value="">Pilih prodi (kalau mahasiswa baru)...</option>
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
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsMhsResultModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleSyncMahasiswa}
                disabled={isSyncingMhs}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingMhs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingMhs ? 'Menyinkronkan...' : `Sinkronkan ${mhsPullItems.length} Mahasiswa`}</span>
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
