'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FlaskConical,
  Users,
  Award,
  BookOpen,
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2,
  Layers,
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  Sparkles,
  HelpCircle,
  Check,
  Send,
} from 'lucide-react';

// Data Types
export interface ResearchItem {
  id: string;
  type: 'Penelitian' | 'Pengabdian';
  title: string;
  scheme: string;
  focusArea: string;
  leader: string;
  nidn: string;
  faculty: string;
  membersCount: number;
  year: number;
  fundingAmount: number;
  fundingSource: string;
  status: 'Menunggu Verifikasi' | 'Terverifikasi' | 'Perlu Perbaikan';
  targetOutput: string;
  mitraSasaran?: string;
  reviewerNote?: string;
  submittedAt: string;
  documentUrl?: string;
}

export interface HakiItem {
  id: string;
  title: string;
  type: 'Hak Cipta' | 'Paten Sederhana' | 'Paten Biasa' | 'Desain Industri';
  registrationNumber: string;
  inventors: string[];
  faculty: string;
  year: number;
  status: 'Tersertifikasi' | 'Pemeriksaan Substantif' | 'Permohonan Masuk';
  certificateUrl?: string;
}

export interface Lp3mDocument {
  id: string;
  title: string;
  category: string;
  version: string;
  updatedAt: string;
  fileSize: string;
  downloadsCount: number;
}

export default function AdminP3mDashboardPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'penelitian' | 'pengabdian' | 'haki' | 'dokumen'>('ringkasan');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['ringkasan', 'penelitian', 'pengabdian', 'haki', 'dokumen'].includes(tab)) {
          setActiveTab(tab as any);
        } else if (!tab) {
          setActiveTab('ringkasan');
        }
      };

      syncTabFromUrl();
      window.addEventListener('popstate', syncTabFromUrl);
      return () => window.removeEventListener('popstate', syncTabFromUrl);
    }
  }, []);

  const handleSwitchTab = (tab: 'ringkasan' | 'penelitian' | 'pengabdian' | 'haki' | 'dokumen') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const newUrl = tab === 'ringkasan' ? '/admin/p3m' : `/admin/p3m?tab=${tab}`;
      window.history.pushState(null, '', newUrl);
    }
  };

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [hakiList, setHakiList] = useState<HakiItem[]>([]);
  const [lp3mDocuments, setLp3mDocuments] = useState<Lp3mDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiStats, setApiStats] = useState<any>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch overview
      const overRes = await fetch(`${apiBase}/lp3m/overview`);
      if (overRes.ok) {
        const overJson = await overRes.json();
        if (overJson.data?.data) {
          setApiStats(overJson.data.data);
        }
      }

      // 2. Fetch researches
      const resRes = await fetch(`${apiBase}/lp3m/research`);
      if (resRes.ok) {
        const resJson = await resRes.json();
        const data = resJson.data?.data || resJson.data || [];
        setResearchList(data);
      }

      // 3. Fetch HAKI
      const hakiRes = await fetch(`${apiBase}/lp3m/haki`);
      if (hakiRes.ok) {
        const hakiJson = await hakiRes.json();
        const hData = hakiJson.data?.data || hakiJson.data || [];
        setHakiList(
          hData.map((h: any) => ({
            ...h,
            registrationNumber: h.regNumber || h.registrationNumber,
            inventors: Array.isArray(h.inventors) ? h.inventors : [h.inventor || 'Dosen ITN'],
            year: h.grantYear || 2026,
          }))
        );
      }

      // 4. Fetch Documents
      const docRes = await fetch(`${apiBase}/lp3m/documents`);
      if (docRes.ok) {
        const docJson = await docRes.json();
        const dData = docJson.data?.data || docJson.data || [];
        setLp3mDocuments(
          dData.map((d: any) => ({
            id: d.id,
            title: d.title,
            category: d.category,
            version: d.version,
            fileSize: d.fileSize,
            downloadsCount: d.downloadsCount || 0,
            updatedAt: d.updatedAt
              ? new Date(d.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : '-',
          }))
        );
      }
    } catch (err) {
      console.warn('Gagal memuat data dashboard LP3M dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate Aggregated Metrics
  const stats = useMemo(() => {
    if (apiStats) {
      return apiStats;
    }

    const totalPenelitian = researchList.filter((r) => r.type === 'Penelitian').length;
    const penelitianTerverifikasi = researchList.filter((r) => r.type === 'Penelitian' && r.status === 'Terverifikasi').length;
    
    const totalPengabdian = researchList.filter((r) => r.type === 'Pengabdian').length;
    const pengabdianTerverifikasi = researchList.filter((r) => r.type === 'Pengabdian' && r.status === 'Terverifikasi').length;

    const totalHaki = hakiList.length;
    const hakiCertified = hakiList.filter((h) => h.status === 'Tersertifikasi').length;

    const totalDanaPenelitian = researchList
      .filter((r) => r.type === 'Penelitian')
      .reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    const totalDanaPengabdian = researchList
      .filter((r) => r.type === 'Pengabdian')
      .reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    const pendingReviewCount = researchList.filter((r) => r.status === 'Menunggu Verifikasi').length;

    return {
      totalPenelitian,
      penelitianTerverifikasi,
      totalPengabdian,
      pengabdianTerverifikasi,
      totalHaki,
      hakiCertified,
      totalDanaPenelitian,
      totalDanaPengabdian,
      totalDanaKeseluruhan: totalDanaPenelitian + totalDanaPengabdian,
      pendingReviewCount,
    };
  }, [researchList, hakiList, apiStats]);

  // Komposisi sumber dana dari laporan yang tercatat
  const fundingBreakdown = useMemo(() => {
    const bySource = new Map<string, number>();
    for (const r of researchList) {
      if (!r.fundingAmount) continue;
      bySource.set(r.fundingSource, (bySource.get(r.fundingSource) ?? 0) + r.fundingAmount);
    }
    const total = [...bySource.values()].reduce((a, b) => a + b, 0);
    return [...bySource.entries()]
      .map(([source, amount]) => ({ source, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, [researchList]);

  // Format Currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const currentActiveHref =
    activeTab === 'penelitian'
      ? '/admin/p3m?tab=penelitian'
      : activeTab === 'pengabdian'
        ? '/admin/p3m?tab=pengabdian'
        : activeTab === 'haki'
          ? '/admin/p3m?tab=haki'
          : activeTab === 'dokumen'
            ? '/admin/p3m?tab=dokumen'
            : '/admin/p3m';

  return (
    <PortalLayout
      role="lp3m"
      userName="Prof. Dr. Ir. H. Sudirman, M.T."
      userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi"
      activeMenuHref={currentActiveHref}
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner LP3M (Signature Deep Blue with Gold Accents) */}
        <div className="bg-gradient-to-r from-[#091a44] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#D4A017] text-slate-950 uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                SIM-LP3M Terpadu
              </span>
              <span className="text-xs text-blue-200">Tri Dharma Perguruan Tinggi</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              Lembaga Penelitian & Pengabdian kepada Masyarakat (LP3M)
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed">
              Rekap laporan penelitian dan pengabdian dosen yang sudah selesai, verifikasi kelengkapan laporan,
              dan dasar rekapitulasi portofolio borang akreditasi institusi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <Link
              href="/admin/p3m/penelitian"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Laporan Kegiatan</span>
            </Link>
            <Link
              href="/admin/p3m/borang"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rekap Borang Akreditasi</span>
            </Link>
          </div>

          {/* Decorative Background Icon */}
          <FlaskConical className="absolute right-[-20px] bottom-[-30px] w-64 h-64 text-white/5 pointer-events-none" />
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Penelitian */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Laporan Penelitian</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalPenelitian}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-emerald-700">{stats.penelitianTerverifikasi}</strong> Terverifikasi
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#1E3A8A] font-semibold">
              <span>Dana: {formatRupiah(stats.totalDanaPenelitian)}</span>
              <Link href="/admin/p3m/penelitian" className="inline-flex items-center gap-0.5 hover:underline font-bold text-blue-700">
                Kelola <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Pengabdian (PkM) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Laporan Pengabdian (PkM)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalPengabdian}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-emerald-700">{stats.pengabdianTerverifikasi}</strong> Terverifikasi
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
              <span>Dana: {formatRupiah(stats.totalDanaPengabdian)}</span>
              <Link href="/admin/p3m/pengabdian" className="inline-flex items-center gap-0.5 hover:underline font-bold text-emerald-800">
                Kelola <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: HAKI & Paten */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Hak Cipta & Paten</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalHaki}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-purple-700">{stats.hakiCertified}</strong> Bersertifikat DJKI
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-semibold">
              <span>Perlindungan HAKI</span>
              <Link href="/admin/p3m/haki" className="inline-flex items-center gap-0.5 hover:underline font-bold text-purple-800">
                Kelola <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Total Realisasi Dana */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Dana Realisasi</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{formatRupiah(stats.totalDanaKeseluruhan)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Penelitian + PkM</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-semibold">
              <span>Dari laporan tercatat</span>
            </div>
          </div>

          {/* Card 5: Butuh Verifikasi / Review */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Perlu Verifikasi</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-rose-600">{stats.pendingReviewCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Laporan menunggu verifikasi</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
              <span>Tugas Verifikator</span>
              <Link href="/admin/p3m/penelitian" className="inline-flex items-center gap-0.5 hover:underline font-bold text-rose-700">
                Verifikasi <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
          <button
            onClick={() => handleSwitchTab('ringkasan')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'ringkasan'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ringkasan & Analitik</span>
          </button>

          <Link
            href="/admin/p3m/penelitian"
            className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-100"
          >
            <BookOpen className="w-4 h-4" />
            <span>Laporan Penelitian ({stats.totalPenelitian})</span>
          </Link>

          <Link
            href="/admin/p3m/pengabdian"
            className="flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-100"
          >
            <Users className="w-4 h-4" />
            <span>Laporan PkM ({stats.totalPengabdian})</span>
          </Link>

          <button
            onClick={() => handleSwitchTab('haki')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'haki'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>HAKI & Paten ({stats.totalHaki})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('dokumen')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'dokumen'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Regulasi & Panduan ({lp3mDocuments.length})</span>
          </button>
        </div>

        {/* TAB 1: RINGKASAN & ANALITIK */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Box 1: Komposisi sumber dana (dihitung dari laporan) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Komposisi Sumber Dana</span>
                </h3>
                <div className="space-y-3 text-xs">
                  {fundingBreakdown.length === 0 && (
                    <p className="text-slate-400 py-4 text-center">Belum ada laporan dengan dana tercatat.</p>
                  )}
                  {fundingBreakdown.map((f) => (
                    <div key={f.source}>
                      <div className="flex justify-between font-semibold mb-1 gap-2">
                        <span className="text-slate-700 truncate">{f.source}</span>
                        <span className="text-[#1E3A8A] shrink-0">
                          {formatRupiah(f.amount)} ({f.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: `${f.percent}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 2: Kelengkapan laporan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>Kelengkapan Laporan</span>
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Laporan dengan dokumen akhir</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A] font-bold">
                      {researchList.filter((r) => r.documentUrl).length} / {researchList.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Laporan dengan luaran tercatat</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {researchList.filter((r) => r.targetOutput).length} / {researchList.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Sertifikat Paten & Hak Cipta</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                      {stats.hakiCertified} Terbit
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 3: Status verifikasi laporan */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Status Verifikasi Laporan</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Menunggu Verifikasi</span>
                    <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {researchList.filter((r) => r.status === 'Menunggu Verifikasi').length} Laporan
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Perlu Perbaikan</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      {researchList.filter((r) => r.status === 'Perlu Perbaikan').length} Laporan
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">Terverifikasi</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {researchList.filter((r) => r.status === 'Terverifikasi').length} Laporan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Laporan yang menunggu verifikasi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Laporan Menunggu Verifikasi ({stats.pendingReviewCount})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan penelitian & pengabdian yang sudah selesai dan perlu diperiksa kelengkapannya oleh LP3M
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {researchList
                  .filter((item) => item.status === 'Menunggu Verifikasi')
                  .map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] font-bold">{item.type}</span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="text-slate-500">Tahun {item.year}</span>
                          {item.submittedAt && (
                            <>
                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-500">Dicatat: {item.submittedAt}</span>
                            </>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                          <span>Ketua: <strong>{item.leader}</strong></span>
                          <span>&bull;</span>
                          <span>{item.faculty}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-bold">{formatRupiah(item.fundingAmount)}</span>
                        </div>
                      </div>
                      <Link
                        href={item.type === 'Penelitian' ? '/admin/p3m/penelitian' : '/admin/p3m/pengabdian'}
                        className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Verifikasi Laporan</span>
                      </Link>
                    </div>
                  ))}

                {stats.pendingReviewCount === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">Tidak ada laporan yang menunggu verifikasi</p>
                    <p className="text-slate-400 mt-0.5">Semua laporan tercatat sudah diverifikasi.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HAKI & PATEN */}
        {activeTab === 'haki' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sentra Hak Kekayaan Intelektual (Sentra HKI)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inventarisasi paten, hak cipta karya tulis, program komputer, dan desain industri karya dosen & mahasiswa
                </p>
              </div>
              <button
                onClick={() => showToast('Formulir pendaftaran permohonan HKI baru dibuka.')}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Daftarkan HKI Baru</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 min-w-[300px]">Judul Ciptaan / Invensi</th>
                      <th className="py-3 px-4">Jenis HKI</th>
                      <th className="py-3 px-4">Nomor Pendaftaran DJKI</th>
                      <th className="py-3 px-4">Inventor / Pemegang Hak</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {hakiList.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-purple-50/20 transition-colors text-slate-800">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.faculty} &bull; Tahun {item.year}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {item.registrationNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {item.inventors.map((inv, i) => (
                              <p key={i} className="text-[11px] font-medium text-slate-700">
                                &bull; {inv}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.status === 'Tersertifikasi'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => showToast(`Mengunduh sertifikat resmi DJKI untuk: ${item.title}`)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>Sertifikat</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DOKUMEN & PANDUAN */}
        {activeTab === 'dokumen' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bank Dokumen, Regulasi & Panduan Riset</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh template resmi, pedoman evaluasi, serta standar biaya masukan (SBM) untuk proposal Tri Dharma
                </p>
              </div>
              <button
                onClick={() => showToast('Form upload regulasi dokumen LP3M baru dibuka.')}
                className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Unggah Dokumen Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lp3mDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#1E3A8A] transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {doc.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{doc.version}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">{doc.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Ukuran: {doc.fileSize} &bull; Diperbarui: {doc.updatedAt}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{doc.downloadsCount}x diunduh</span>
                    <button
                      onClick={() => showToast(`Mengunduh file: ${doc.title}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Dokumen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
