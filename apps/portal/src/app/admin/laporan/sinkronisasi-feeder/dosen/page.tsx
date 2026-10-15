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
  Users,
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

export interface RemoteDosenItem {
  // Dosen bisa cuma punya salah satu dari NIDN/NUPTK (terkonfirmasi dari Neo Feeder
  // sungguhan, bukan dua-duanya selalu ada) -- jadi keduanya opsional di sini.
  nidn?: string;
  nuptk?: string;
  nip?: string;
  nidk?: string;
  fullName: string;
  gender?: 'MALE' | 'FEMALE';
  birthPlace?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  functionalPosition?: string;
  employmentStatus?: string;
  lastEducation?: string;
  prodiCode?: string;
  studyProgramId?: string;
}

export interface LocalDosenItem {
  id: string;
  nidn: string;
  nuptk: string;
  fullName: string;
  studyProgramName: string;
  isActive: boolean;
  hasFeederId?: boolean;
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

export default function SinkronisasiDosenPage() {
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

  // Daftar dosen lokal tersimpan -- dipakai untuk kartu "Total Lokal" (via .length)
  // DAN tabel "Data Lokal Tersimpan" di bawah, bukan cuma angka.
  const [dosenLocalItems, setDosenLocalItems] = useState<LocalDosenItem[]>([]);
  const [isLoadingLocalItems, setIsLoadingLocalItems] = useState(true);
  const dosenLocalTotal = dosenLocalItems.length;

  const fetchLocalDosen = React.useCallback(() => {
    setIsLoadingLocalItems(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    return fetch(`${apiBase}/lecturers`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setDosenLocalItems(result);
      })
      .catch((err) => console.warn('Gagal memuat daftar dosen lokal:', err))
      .finally(() => setIsLoadingLocalItems(false));
  }, []);

  useEffect(() => {
    fetchLocalDosen();
  }, [fetchLocalDosen]);

  // Daftar program studi lokal -- dipakai untuk mencocokkan otomatis "prodi home base"
  // hasil tarikan Dosen dari Feeder ke Program Studi lokal lewat kode prodi.
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

  // Tarik & Sinkronkan Data Dosen dari Feeder
  const [isPullingDosen, setIsPullingDosen] = useState(false);
  const [isSyncingDosen, setIsSyncingDosen] = useState(false);
  const [dosenPullMessage, setDosenPullMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [dosenPullItems, setDosenPullItems] = useState<RemoteDosenItem[]>([]);
  const [dosenProdiChoice, setDosenProdiChoice] = useState<Record<string, string>>({});
  const [isDosenResultModalOpen, setIsDosenResultModalOpen] = useState(false);

  // Kunci unik baris dosen hasil tarikan Feeder -- dosen bisa cuma punya NIDN atau
  // cuma NUPTK, jadi tidak bisa pakai nidn mentah sebagai key/identitas tunggal.
  const dosenKey = (item: RemoteDosenItem) => item.nidn || item.nuptk || '';

  // Dosen hasil Pull dari Feeder yang dipakai sebagai acuan kolom "Feeder" pada
  // tabel perbandingan -- sengaja TIDAK dikosongkan setelah sinkron supaya kolom
  // tersebut tetap akurat (lihat handleSyncDosen).
  const [hasPulledOnceDosen, setHasPulledOnceDosen] = useState(false);

  interface DosenComparisonRow {
    key: string;
    nidn?: string;
    nuptk?: string;
    fullName: string;
    studyProgramName?: string;
    isActiveLocal: boolean;
    inLocal: boolean;
    inFeeder: boolean | null; // null = belum pernah Pull sama sekali
  }

  const dosenComparisonRows = useMemo<DosenComparisonRow[]>(() => {
    const map = new Map<string, DosenComparisonRow>();
    for (const l of dosenLocalItems) {
      // API mengembalikan '-' untuk NIDN/NUPTK yang kosong -- jangan dipakai sebagai kunci.
      const nidn = l.nidn && l.nidn !== '-' ? l.nidn : undefined;
      const nuptk = l.nuptk && l.nuptk !== '-' ? l.nuptk : undefined;
      const key = nidn || nuptk || l.id;
      map.set(key, {
        key,
        nidn,
        nuptk,
        fullName: l.fullName,
        studyProgramName: l.studyProgramName,
        isActiveLocal: l.isActive,
        inLocal: true,
        // Punya id_dosen Feeder = sudah pernah ditarik/ditautkan dari Feeder (bertahan
        // setelah halaman dimuat ulang); selain itu baru pasti salah/benar setelah Pull.
        inFeeder: l.hasFeederId ? true : hasPulledOnceDosen ? false : null,
      });
    }
    for (const r of dosenPullItems) {
      const key = dosenKey(r);
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        existing.inFeeder = true;
      } else {
        map.set(key, {
          key,
          nidn: r.nidn,
          nuptk: r.nuptk,
          fullName: r.fullName,
          isActiveLocal: false,
          inLocal: false,
          inFeeder: true,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [dosenLocalItems, dosenPullItems, hasPulledOnceDosen]);

  // Handler: Tarik Data Dosen dari Feeder
  const handlePullDosen = async () => {
    setIsPullingDosen(true);
    setDosenPullMessage(null);
    setDosenPullItems([]);
    setDosenProdiChoice({});
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/dosen`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401 || res.status === 403) {
        setDosenPullMessage({ success: false, text: 'Anda tidak memiliki izin menarik data ini.' });
        return;
      }
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      if (!result) {
        setDosenPullMessage({ success: false, text: 'Gagal membaca respons server.' });
        return;
      }
      if (!result.success) {
        setDosenPullMessage({ success: false, text: result.message });
        return;
      }

      const items: RemoteDosenItem[] = Array.isArray(result.items) ? result.items : [];
      // Pencocokan sungguhan (sudah-ada-atau-belum) dilakukan server-side saat sync
      // berdasarkan NIDN -- di sini semua item ditampilkan dulu, lalu dicoba dicocokkan
      // otomatis ke prodi lokal lewat kode prodi supaya admin tidak perlu pilih manual
      // kalau kodenya sudah sama persis.
      const autoChoice: Record<string, string> = {};
      items.forEach((item) => {
        if (!item.prodiCode) return;
        const match = studyProgramsForDosen.find(
          (p) => p.code.toLowerCase() === item.prodiCode!.toLowerCase() || p.diktiCode.toLowerCase() === item.prodiCode!.toLowerCase()
        );
        if (match) autoChoice[dosenKey(item)] = match.id;
      });

      setDosenPullItems(items);
      setHasPulledOnceDosen(true);
      setDosenProdiChoice(autoChoice);
      setDosenPullMessage({
        success: true,
        text: `${items.length} dosen ditarik dari Feeder. ${Object.keys(autoChoice).length} prodi home base otomatis cocok, sisanya perlu dipilih manual.`,
      });
      if (items.length > 0) setIsDosenResultModalOpen(true);
    } catch (err) {
      setDosenPullMessage({ success: false, text: err instanceof Error ? err.message : 'Gagal menghubungi server.' });
    } finally {
      setIsPullingDosen(false);
    }
  };

  // Handler: Sinkronkan Dosen hasil Pull ke data lokal
  const handleSyncDosen = async () => {
    if (dosenPullItems.length === 0) return;
    setIsSyncingDosen(true);
    const startedAt = Date.now();
    const batchSize = dosenPullItems.length;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const items = dosenPullItems.map((i) => ({ ...i, studyProgramId: dosenProdiChoice[dosenKey(i)] }));
      const res = await fetch(`${apiBase}/integration-settings/pddikti/dosen/sync`, {
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
          id: `log-dosen-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Dosen (dosen_pddikti)',
          batchSize,
          successCount: created + updated,
          errorCount: skipped,
          status: skipped > 0 ? 'WARNING' : 'SUCCESS',
          durationMs: Date.now() - startedAt,
          message: result?.message || 'Sinkronisasi dosen selesai.',
        },
        ...prev,
      ]);

      showToast(result?.message || 'Sinkronisasi dosen selesai.');
      // Sengaja TIDAK mengosongkan dosenPullItems -- tabel perbandingan di bawah
      // butuh data hasil Pull ini supaya kolom "Feeder" tetap akurat setelah sinkron.
      setDosenProdiChoice({});
      setIsDosenResultModalOpen(false);
      fetchLocalDosen();
    } catch (err) {
      setSyncLogs((prev) => [
        {
          id: `log-dosen-${Date.now()}`,
          timestamp: new Date().toLocaleString('id-ID'),
          entity: 'Dosen (dosen_pddikti)',
          batchSize,
          successCount: 0,
          errorCount: batchSize,
          status: 'FAILED',
          durationMs: Date.now() - startedAt,
          message: err instanceof Error ? err.message : 'Gagal menyinkronkan data dosen.',
        },
        ...prev,
      ]);
      showToast(err instanceof Error ? err.message : 'Gagal menyinkronkan data dosen.');
    } finally {
      setIsSyncingDosen(false);
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
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>dosen_pddikti</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Dosen</h1>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Ambil daftar dosen (NIDN, biodata, jabatan fungsional, home base prodi) dari Web Service Neo Feeder, lalu
                  cocokkan dengan data Dosen lokal.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Total Lokal</p>
              <p className="text-2xl font-black text-white mt-1">{dosenLocalTotal}</p>
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
          {dosenPullMessage && (
            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-xl border ${
                dosenPullMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {dosenPullMessage.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <span>{dosenPullMessage.text}</span>
                {dosenPullItems.length > 0 && (
                  <button
                    onClick={() => setIsDosenResultModalOpen(true)}
                    className="block mt-1 font-bold text-[#1E3A8A] underline cursor-pointer"
                  >
                    Lihat &amp; Sinkronkan {dosenPullItems.length} Dosen
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handlePullDosen}
            disabled={isPullingDosen}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {isPullingDosen ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
            <span>{isPullingDosen ? 'Menarik...' : 'Pull dari Feeder'}</span>
          </button>
        </div>

        {/* Modal: Hasil Tarikan Dosen */}
        <Modal
          isOpen={isDosenResultModalOpen}
          onClose={() => setIsDosenResultModalOpen(false)}
          title="Hasil Tarikan Dosen dari Feeder"
          subtitle={`${dosenPullItems.length} dosen ditarik dari Feeder (dicocokkan lewat NIDN atau NUPTK -- sebagian dosen cuma punya salah satu)`}
          icon={<Users className="w-5 h-5" />}
          maxWidth="3xl"
        >
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500">
              Dosen yang sudah ada lokal akan otomatis diperbarui datanya. Dosen baru wajib dipilihkan program studi
              home base-nya dulu sebelum disinkronkan.
            </p>
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">NIDN</th>
                    <th className="py-2.5 px-3">NUPTK</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Jabatan Fungsional</th>
                    <th className="py-2.5 px-3">Program Studi Home Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dosenPullItems.map((item) => (
                    <tr key={dosenKey(item)} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nidn || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{item.nuptk || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.functionalPosition || '-'}</td>
                      <td className="py-2 px-3">
                        <select
                          value={dosenProdiChoice[dosenKey(item)] || ''}
                          onChange={(e) => setDosenProdiChoice((prev) => ({ ...prev, [dosenKey(item)]: e.target.value }))}
                          className={`text-[11px] border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 ${
                            dosenProdiChoice[dosenKey(item)] ? 'border-slate-200' : 'border-amber-300'
                          }`}
                        >
                          <option value="">Pilih prodi (kalau dosen baru)...</option>
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
                onClick={() => setIsDosenResultModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={handleSyncDosen}
                disabled={isSyncingDosen}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSyncingDosen ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSyncingDosen ? 'Menyinkronkan...' : `Sinkronkan ${dosenPullItems.length} Dosen`}</span>
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
                {hasPulledOnceDosen
                  ? 'Dicocokkan lewat NIDN/NUPTK dari hasil Pull terakhir.'
                  : 'Kolom Feeder baru terisi setelah Pull dari Feeder di atas.'}
              </p>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              {isLoadingLocalItems ? 'Memuat...' : `${dosenLocalTotal} lokal${hasPulledOnceDosen ? ` · ${dosenPullItems.length} di Feeder` : ''}`}
            </span>
          </div>

          {isLoadingLocalItems ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Memuat data lokal...
            </div>
          ) : dosenComparisonRows.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Belum ada dosen tersimpan lokal. Pull &amp; sinkronkan dari Feeder dulu di atas.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl max-h-96 overflow-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">NIDN</th>
                    <th className="py-2.5 px-3">NUPTK</th>
                    <th className="py-2.5 px-3">Nama</th>
                    <th className="py-2.5 px-3">Program Studi</th>
                    <th className="py-2.5 px-3 text-center">Lokal</th>
                    <th className="py-2.5 px-3 text-center">Feeder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dosenComparisonRows.map((item) => (
                    <tr key={item.key} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">{item.nidn || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-600">{item.nuptk || '-'}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{item.fullName}</td>
                      <td className="py-2 px-3 text-slate-600">{item.studyProgramName || '-'}</td>
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
