'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Database,
  Layers,
  Building2,
  GraduationCap,
  Users,
  BookOpen,
  Calendar,
  Award,
  History,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

// ==========================================
// DATA TYPES & INTERFACES
// ==========================================

export interface FeederSyncStatusItem {
  key: string;
  label: string;
  totalLocal: number;
  totalSynced: number;
  totalBelum: number;
  percentage: number;
  totalTerdaftarFeeder?: number;
}

// 7 Entitas Feeder yang punya halaman sinkronisasi tersendiri -- navigasi index ini
// cuma menampilkan ringkasan status, aksi Pull/Sync/Push sungguhan ada di halaman masing-masing.
interface FeederNavEntity {
  href: string;
  title: string;
  code: string;
  description: string;
  icon: React.ReactNode;
}

const FEEDER_NAV_ENTITIES: FeederNavEntity[] = [
  {
    href: '/admin/laporan/sinkronisasi-feeder/tahun-akademik',
    title: 'Tahun Akademik & Periode Semester',
    code: 'tahun_akademik',
    description: 'Periode semester yang benar-benar punya data KRS -- wajib disinkronkan dulu sebelum Kelas Perkuliahan.',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/dosen',
    title: 'Dosen',
    code: 'dosen_pddikti',
    description: 'Biodata, NIDN/NUPTK, jabatan fungsional, dan home base program studi dosen.',
    icon: <Users className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/mahasiswa',
    title: 'Mahasiswa',
    code: 'mahasiswa_pt',
    description: 'Biodata, NIM, riwayat pendidikan, dan home base program studi mahasiswa. Bisa difilter per angkatan.',
    icon: <GraduationCap className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/riwayat-pendidikan',
    title: 'Riwayat Pendidikan Mahasiswa',
    code: 'riwayat_pendidikan',
    description: 'Koreksi NIM, program studi, dan tahun masuk mahasiswa yang sudah terdaftar di Feeder (UpdateRiwayatPendidikanMahasiswa).',
    icon: <History className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/akm',
    title: 'Aktivitas Kuliah Mahasiswa (AKM)',
    code: 'perkuliahan_mahasiswa',
    description: 'SKS semester, IPS, SKS total, dan IPK per semester -- dihitung dari KRS lalu dibandingkan & dikirim ke Feeder.',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/mata-kuliah',
    title: 'Kurikulum & Mata Kuliah',
    code: 'mata_kuliah',
    description: 'Struktur kurikulum dan daftar mata kuliah (kode, SKS, semester) -- kurikulum disinkronkan lebih dulu.',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/kelas-kuliah',
    title: 'Kelas Perkuliahan & Dosen Pengampu',
    code: 'kelas_kuliah',
    description: 'Pembagian kelas semester berjalan dan dosen pengampu. Mata kuliah & tahun akademik wajib sudah tersinkron.',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/krs',
    title: 'KRS & Rencana Studi Mahasiswa',
    code: 'krs_mahasiswa',
    description: 'Daftar pengambilan mata kuliah tiap mahasiswa (peserta kelas) di semester aktif.',
    icon: <Database className="w-5 h-5" />,
  },
  {
    href: '/admin/laporan/sinkronisasi-feeder/nilai',
    title: 'Nilai Perkuliahan Semester',
    code: 'nilai_perkuliahan',
    description: 'Mengisi nilai angka, indeks, dan huruf ke KRS yang sudah tersinkron. Berjalan sebagai job background.',
    icon: <Award className="w-5 h-5" />,
  },
];

const entityIcon: Record<string, React.ReactNode> = {
  dosen: <Users className="w-5 h-5" />,
  mahasiswa: <GraduationCap className="w-5 h-5" />,
  'mata-kuliah': <BookOpen className="w-5 h-5" />,
  kurikulum: <Layers className="w-5 h-5" />,
  'kelas-kuliah': <Building2 className="w-5 h-5" />,
};

export default function SinkronisasiFeederPage() {
  // Real sync-status summary (GET /integration-settings/pddikti/sync-status) --
  // dipakai untuk 5 kartu ringkasan di atas DAN sebagai sumber statistik kunci
  // untuk kartu navigasi Dosen, Mahasiswa, Kurikulum & Mata Kuliah, Kelas Kuliah.
  const [syncStatus, setSyncStatus] = useState<FeederSyncStatusItem[]>([]);
  const [isLoadingSyncStatus, setIsLoadingSyncStatus] = useState<boolean>(true);
  const [syncStatusError, setSyncStatusError] = useState<string | null>(null);

  const [pddiktiStatus, setPddiktiStatus] = useState<{
    isConfigured: boolean;
    isActive: boolean;
    lastSyncAt: string | null;
    isConnected: boolean;
    connectionError: string | null;
  } | null>(null);

  // Jumlah baris lokal per entitas Feeder yang tidak tercakup endpoint sync-status
  // (endpoint itu cuma 5 entitas utama) -- dipakai untuk kartu navigasi KRS & Nilai.
  const [feederLocalCounts, setFeederLocalCounts] = useState<Record<string, number>>({});

  // Jumlah tahun akademik lokal -- entitas "Khusus" yang juga tidak masuk sync-status.
  const [tahunAkademikLocalCount, setTahunAkademikLocalCount] = useState(0);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/integration-settings/pddikti/status`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json?.data && setPddiktiStatus(json.data))
      .catch((err) => console.warn('Gagal memuat status PDDIKTI:', err));
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/feeder-entities`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setFeederLocalCounts(json?.data || json || {}))
      .catch((err) => console.warn('Gagal memuat jumlah data lokal per entitas Feeder:', err));
  }, []);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const { token } = getAuthSession();
    fetch(`${apiBase}/academic/years`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (Array.isArray(result)) setTahunAkademikLocalCount(result.length);
      })
      .catch((err) => console.warn('Gagal memuat jumlah tahun akademik lokal:', err));
  }, []);

  // Rekap NYATA jumlah data lokal yang sudah/belum tersinkron ke Feeder per entitas --
  // dipanggil sekali saat halaman dibuka, dan bisa dimuat ulang manual lewat tombol.
  const fetchSyncStatus = useCallback(async () => {
    setIsLoadingSyncStatus(true);
    setSyncStatusError(null);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBase}/integration-settings/pddikti/sync-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json().catch(() => null);
      const result = json?.data ?? json;
      setSyncStatus(Array.isArray(result) ? result : []);
    } catch (err) {
      setSyncStatusError(err instanceof Error ? err.message : 'Gagal memuat status sinkronisasi Feeder.');
    } finally {
      setIsLoadingSyncStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  const overallSyncTotals = (() => {
    const totalLocal = syncStatus.reduce((acc, e) => acc + e.totalLocal, 0);
    const totalSynced = syncStatus.reduce((acc, e) => acc + e.totalSynced, 0);
    const overallPercentage = totalLocal > 0 ? Math.round((totalSynced / totalLocal) * 1000) / 10 : 0;
    return { totalLocal, totalSynced, overallPercentage };
  })();

  // Statistik kunci per kartu navigasi -- diturunkan dari syncStatus (5 entitas utama)
  // atau feederLocalCounts/tahunAkademikLocalCount untuk entitas yang tidak tercakup.
  const navStat = (code: string): { label: string; value: string } => {
    switch (code) {
      case 'tahun_akademik':
        return { label: 'Total Lokal', value: tahunAkademikLocalCount.toLocaleString('id-ID') };
      case 'dosen_pddikti': {
        const entry = syncStatus.find((e) => e.key === 'dosen');
        return entry
          ? { label: 'Tersinkron', value: `${entry.totalSynced.toLocaleString('id-ID')} / ${entry.totalLocal.toLocaleString('id-ID')}` }
          : { label: 'Tersinkron', value: '-' };
      }
      case 'riwayat_pendidikan': {
        const entry = syncStatus.find((e) => e.key === 'mahasiswa');
        return { label: 'Terdaftar di Feeder', value: (entry?.totalTerdaftarFeeder ?? 0).toLocaleString('id-ID') };
      }
      case 'mahasiswa_pt': {
        const entry = syncStatus.find((e) => e.key === 'mahasiswa');
        return entry
          ? { label: 'Tersinkron', value: `${entry.totalSynced.toLocaleString('id-ID')} / ${entry.totalLocal.toLocaleString('id-ID')}` }
          : { label: 'Tersinkron', value: '-' };
      }
      case 'mata_kuliah': {
        const entry = syncStatus.find((e) => e.key === 'mata-kuliah');
        return entry
          ? { label: 'Tersinkron', value: `${entry.totalSynced.toLocaleString('id-ID')} / ${entry.totalLocal.toLocaleString('id-ID')}` }
          : { label: 'Tersinkron', value: '-' };
      }
      case 'kelas_kuliah': {
        const entry = syncStatus.find((e) => e.key === 'kelas-kuliah');
        return entry
          ? { label: 'Tersinkron', value: `${entry.totalSynced.toLocaleString('id-ID')} / ${entry.totalLocal.toLocaleString('id-ID')}` }
          : { label: 'Tersinkron', value: '-' };
      }
      case 'perkuliahan_mahasiswa':
        return { label: 'KRS Tahun Aktif', value: (feederLocalCounts['perkuliahan_mahasiswa'] ?? 0).toLocaleString('id-ID') };
      case 'krs_mahasiswa':
        return { label: 'Total Lokal', value: (feederLocalCounts['krs_mahasiswa'] ?? 0).toLocaleString('id-ID') };
      case 'nilai_perkuliahan':
        return { label: 'Total Lokal', value: (feederLocalCounts['nilai_perkuliahan'] ?? 0).toLocaleString('id-ID') };
      default:
        return { label: 'Total Lokal', value: '-' };
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
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
              <Link href="/admin" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link href="/admin/laporan" className="hover:text-blue-600 transition-colors">
                Laporan Akademik &amp; PDDIKTI
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-semibold">Sinkronisasi Neo Feeder</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/10 border border-[#D4A017]/30">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    Sinkronisasi Neo Feeder PDDIKTI
                  </h1>
                  {pddiktiStatus && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        pddiktiStatus.isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : pddiktiStatus.isConfigured
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                      title={
                        pddiktiStatus.isConnected
                          ? 'Berhasil login ke Web Service Neo Feeder (dicek langsung, bukan cuma cek kredensial tersimpan).'
                          : pddiktiStatus.isConfigured
                            ? `Gagal terhubung ke Feeder: ${pddiktiStatus.connectionError || 'tidak diketahui'}. Cek ulang di Pengaturan DIKTI > Uji Koneksi.`
                            : 'Hubungi Super Admin untuk mengonfigurasi kredensial Web Service di menu Pengaturan DIKTI'
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pddiktiStatus.isConnected ? 'bg-emerald-500 animate-pulse' : pddiktiStatus.isConfigured ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                      />
                      {pddiktiStatus.isConnected
                        ? 'FEEDER TERHUBUNG'
                        : pddiktiStatus.isConfigured
                          ? 'FEEDER TIDAK TERHUBUNG'
                          : 'FEEDER BELUM DIKONFIGURASI'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tarik, sinkronkan, dan push data Dosen, Mahasiswa, Kurikulum, Mata Kuliah, Kelas Kuliah, KRS &amp; Nilai ke Web Service Neo Feeder.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchSyncStatus}
            disabled={isLoadingSyncStatus}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
            title="Perbarui rekap status sinkronisasi"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoadingSyncStatus ? 'animate-spin' : ''}`} />
            <span>Muat Ulang Status</span>
          </button>
        </div>

        {/* Real Sync Status Banner */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-5 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4A017] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Rekap Nyata Sinkronisasi Data Lokal ke Web Service Neo Feeder</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {overallSyncTotals.overallPercentage}% Data Lokal Tersinkron
              </h2>
              <p className="text-xs text-blue-100 leading-relaxed">
                Dihitung langsung dari basis data (bukan simulasi) berdasarkan apakah setiap baris Dosen, Mahasiswa, Mata
                Kuliah, Kurikulum &amp; Kelas Kuliah lokal sudah punya pasangan ID di Feeder.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-300">Progress Sinkronisasi</span>
                <span className="text-sm font-black text-[#D4A017]">{overallSyncTotals.overallPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-[#D4A017] rounded-full transition-all duration-700"
                  style={{ width: `${overallSyncTotals.overallPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2">
                <span>Tersinkron: {overallSyncTotals.totalSynced.toLocaleString('id-ID')}</span>
                <span>Total Lokal: {overallSyncTotals.totalLocal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Per-Entity Sync Status Cards */}
        {syncStatusError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-4 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{syncStatusError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoadingSyncStatus && syncStatus.length === 0
            ? Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs animate-pulse h-[118px]" />
              ))
            : syncStatus.map((item) => (
                <div
                  key={item.key}
                  className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.label}</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                      {entityIcon[item.key] || <Database className="w-5 h-5" />}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">
                      {item.totalSynced.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-slate-400">
                      dari {item.totalLocal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-[#1E3A8A] to-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {item.percentage}% tersinkron
                    {typeof item.totalTerdaftarFeeder === 'number' ? ` · ${item.totalTerdaftarFeeder.toLocaleString('id-ID')} terdaftar di Feeder` : ''}
                  </p>
                </div>
              ))}
        </div>

        {/* Navigasi ke 7 halaman sinkronisasi per entitas -- aksi Pull/Sync/Push
            sungguhan ada di masing-masing halaman, bukan di sini lagi. */}
        <div>
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Kelola Sinkronisasi per Entitas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FEEDER_NAV_ENTITIES.map((entity) => {
              const stat = navStat(entity.code);
              return (
                <Link
                  key={entity.href}
                  href={entity.href}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                        {entity.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug">{entity.title}</h4>
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                          {entity.code}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] transition-colors shrink-0" />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{entity.description}</p>

                  <div className="flex items-center justify-between py-2.5 border-y border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</p>
                      <p className="font-mono font-bold text-slate-900 text-sm">{stat.value}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E3A8A]">
                      Kelola
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
