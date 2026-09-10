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
  fundingSource: 'DIPA Internal' | 'BIMA Kemendikbud' | 'Mandiri / Mitra';
  status: 'Menunggu Verifikasi' | 'Perlu Revisi' | 'Disetujui' | 'Sedang Berjalan' | 'Selesai' | 'Ditolak';
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
  category: 'Panduan' | 'Regulasi & SK' | 'Template' | 'Borang';
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

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [researchList, setResearchList] = useState<ResearchItem[]>([]);
  const [hakiList, setHakiList] = useState<HakiItem[]>([]);
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
    } catch (err) {
      console.warn('Gagal memuat data dashboard LP3M dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const lp3mDocuments: Lp3mDocument[] = [
    {
      id: 'DOC-01',
      title: 'Buku Panduan Penelitian dan Pengabdian kepada Masyarakat Edisi 2026',
      category: 'Panduan',
      version: 'Rev. 3.2',
      updatedAt: '15 Jan 2026',
      fileSize: '4.8 MB',
      downloadsCount: 342,
    },
    {
      id: 'DOC-02',
      title: 'Surat Keputusan Rektor tentang Standar Biaya Masukan (SBM) Riset Internal',
      category: 'Regulasi & SK',
      version: 'SK-014/REK/2026',
      updatedAt: '05 Jan 2026',
      fileSize: '1.2 MB',
      downloadsCount: 189,
    },
    {
      id: 'DOC-03',
      title: 'Template Proposal dan Rencana Anggaran Biaya (RAB) Penelitian DIPA',
      category: 'Template',
      version: 'v2026.1',
      updatedAt: '18 Jan 2026',
      fileSize: '850 KB',
      downloadsCount: 520,
    },
    {
      id: 'DOC-04',
      title: 'Panduan & Format Laporan Akhir Pelaksanaan Pengabdian (PkM)',
      category: 'Panduan',
      version: 'v2026.0',
      updatedAt: '22 Jan 2026',
      fileSize: '1.5 MB',
      downloadsCount: 275,
    },
  ];

  // Modal Review & Detail
  const [selectedItemForReview, setSelectedItemForReview] = useState<ResearchItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ResearchItem['status']>('Disetujui');
  const [reviewNoteInput, setReviewNoteInput] = useState<string>('');

  // Modal Add New Kegiatan
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newForm, setNewForm] = useState({
    type: 'Penelitian' as 'Penelitian' | 'Pengabdian',
    title: '',
    scheme: 'Penelitian Fundamental Internal',
    focusArea: 'Kecerdasan Buatan & Rekayasa Perangkat Lunak',
    leader: 'Dr. Bayu Wicaksono, M.Kom.',
    nidn: '0412088501',
    faculty: 'Fakultas Ilmu Komputer',
    fundingAmount: 30000000,
    fundingSource: 'DIPA Internal' as 'DIPA Internal' | 'BIMA Kemendikbud' | 'Mandiri / Mitra',
    targetOutput: 'Jurnal Nasional Terakreditasi SINTA 2',
    mitraSasaran: '',
  });

  // Calculate Aggregated Metrics
  const stats = useMemo(() => {
    if (apiStats) {
      return apiStats;
    }

    const totalPenelitian = researchList.filter((r) => r.type === 'Penelitian').length;
    const penelitianDisetujui = researchList.filter((r) => r.type === 'Penelitian' && ['Disetujui', 'Sedang Berjalan', 'Selesai'].includes(r.status)).length;
    
    const totalPengabdian = researchList.filter((r) => r.type === 'Pengabdian').length;
    const pengabdianDisetujui = researchList.filter((r) => r.type === 'Pengabdian' && ['Disetujui', 'Sedang Berjalan', 'Selesai'].includes(r.status)).length;

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
      penelitianDisetujui,
      totalPengabdian,
      pengabdianDisetujui,
      totalHaki,
      hakiCertified,
      totalDanaPenelitian,
      totalDanaPengabdian,
      totalDanaKeseluruhan: totalDanaPenelitian + totalDanaPengabdian,
      pendingReviewCount,
    };
  }, [researchList, hakiList, apiStats]);

  // Format Currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered Research List
  const filteredResearch = useMemo(() => {
    return researchList.filter((item) => {
      const matchYear = selectedYear === 'Semua' || item.year.toString() === selectedYear;
      const matchStatus = selectedStatus === 'Semua' || item.status === selectedStatus;
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leader.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scheme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.focusArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.faculty.toLowerCase().includes(searchTerm.toLowerCase());

      return matchYear && matchStatus && matchSearch;
    });
  }, [researchList, selectedYear, selectedStatus, searchTerm]);

  // Handle Review Submission
  const handleSaveReview = async () => {
    if (!selectedItemForReview) return;
    try {
      const res = await fetch(`${apiBase}/lp3m/research/${selectedItemForReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          reviewerNote: reviewNoteInput,
        }),
      });

      if (res.ok) {
        showToast(`Status usulan "${selectedItemForReview.title}" berhasil diperbarui menjadi: ${reviewStatus}`);
        fetchDashboardData();
      } else {
        showToast('Gagal memperbarui status di basis data.');
      }
    } catch (err) {
      showToast('Koneksi database terganggu.');
    }
    setSelectedItemForReview(null);
  };

  // Handle Add New Submission
  const handleAddNewKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;

    try {
      const res = await fetch(`${apiBase}/lp3m/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newForm.type,
          title: newForm.title,
          scheme: newForm.scheme,
          focusArea: newForm.focusArea,
          leader: newForm.leader,
          nidn: newForm.nidn,
          faculty: newForm.faculty,
          membersCount: 2,
          year: 2026,
          fundingAmount: Number(newForm.fundingAmount) || 0,
          fundingSource: newForm.fundingSource,
          targetOutput: newForm.targetOutput,
          mitraSasaran: newForm.mitraSasaran,
        }),
      });

      if (res.ok) {
        showToast(`Usulan kegiatan ${newForm.type} baru berhasil didaftarkan ke basis data LP3M.`);
        setIsAddModalOpen(false);
        setNewForm({
          type: 'Penelitian',
          title: '',
          scheme: 'Penelitian Fundamental Internal',
          focusArea: 'Kecerdasan Buatan & Rekayasa Perangkat Lunak',
          leader: 'Dr. Bayu Wicaksono, M.Kom.',
          nidn: '0412088501',
          faculty: 'Fakultas Ilmu Komputer',
          fundingAmount: 30000000,
          fundingSource: 'DIPA Internal',
          targetOutput: 'Jurnal Nasional Terakreditasi SINTA 2',
          mitraSasaran: '',
        });
        fetchDashboardData();
      } else {
        showToast('Gagal menyimpan usulan ke database.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan.');
    }
  };

  // Handle Delete
  const handleDeleteItem = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data "${title}" dari basis data?`)) {
      try {
        const res = await fetch(`${apiBase}/lp3m/research/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Data "${title}" berhasil dihapus dari database.`);
          fetchDashboardData();
        } else {
          showToast('Gagal menghapus data.');
        }
      } catch (err) {
        showToast('Koneksi database terganggu.');
      }
    }
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
              Pusat monitoring produktivitas riset dosen, tata kelola pendanaan hibah internal/BIMA, 
              evaluasi luaran jurnal terindeks, dan rekapitulasi portofolio borang akreditasi institusi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Usulkan Kegiatan Baru</span>
            </button>
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
                <strong className="text-emerald-700">{stats.penelitianDisetujui}</strong> Didanai / Aktif
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pengabdian (PkM)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalPengabdian}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <strong className="text-emerald-700">{stats.pengabdianDisetujui}</strong> Program Kemitraan
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Anggaran Riset</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900">{formatRupiah(stats.totalDanaKeseluruhan)}</p>
              <p className="text-xs text-slate-500 mt-0.5">DIPA & Kemendikbud</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-semibold">
              <span>Alokasi Terpenuhi 100%</span>
              <span className="text-slate-400 text-[10px]">T.A 2026</span>
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
              <p className="text-xs text-slate-500 mt-0.5">Usulan Baru Masuk</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
              <span>Tugas Tim Reviewer</span>
              <Link href="/admin/p3m/penelitian" className="inline-flex items-center gap-0.5 hover:underline font-bold text-rose-700">
                Review <ChevronRight className="w-3 h-3" />
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

          <button
            onClick={() => handleSwitchTab('penelitian')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'penelitian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Penelitian ({stats.totalPenelitian})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('pengabdian')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pengabdian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengabdian PkM ({stats.totalPengabdian})</span>
          </button>

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
              {/* Box 1: Distribusi Skema & Sumber Dana */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Komposisi Sumber Dana Riset</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">DIPA Internal Perguruan Tinggi</span>
                      <span className="text-[#1E3A8A]">Rp 80.000.000 (42%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">Hibah Nasional BIMA Kemendikbud</span>
                      <span className="text-emerald-700">Rp 90.000.000 (48%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: '48%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-slate-700">Kerjasama Mitra & Industri</span>
                      <span className="text-amber-700">Rp 18.000.000 (10%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Capaian Luaran & Publikasi Ilmiah */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>Target Luaran & Akreditasi SINTA</span>
                </h3>
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Jurnal Internasional Scopus (Q1/Q2)</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1E3A8A] font-bold">4 Terbit</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Jurnal Nasional SINTA 1 & 2</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">9 Terbit</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-700">Sertifikat Paten & Hak Cipta DJKI</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">6 Terbit</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Status Usulan Masuk */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Alur Siklus Usulan Tahun 2026</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">1. Usulan Masuk (Menunggu Verifikasi)</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      {stats.pendingReviewCount} Proposal
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">2. Disetujui & Kontrak Riset</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {researchList.filter((r) => r.status === 'Disetujui' || r.status === 'Sedang Berjalan').length} Proposal
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">3. Laporan Akhir Selesai</span>
                    <span className="font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md">
                      {researchList.filter((r) => r.status === 'Selesai').length} Laporan
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions: Daftar Usulan yang Menunggu Verifikasi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Usulan Masuk Membutuhkan Tindakan Reviewer ({stats.pendingReviewCount})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proposal penelitian & pengabdian dosen yang siap dinilai kelayakannya oleh tim reviewer LP3M
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {researchList
                  .filter((item) => item.status === 'Menunggu Verifikasi')
                  .map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] font-bold">
                            {item.type}
                          </span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="font-semibold text-slate-700">{item.scheme}</span>
                          <span className="text-slate-400">&bull;</span>
                          <span className="text-slate-500">Diajukan: {item.submittedAt}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                          <span>Ketua: <strong>{item.leader}</strong> ({item.nidn})</span>
                          <span>&bull;</span>
                          <span>{item.faculty}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-bold">{formatRupiah(item.fundingAmount)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedItemForReview(item);
                            setReviewStatus('Disetujui');
                            setReviewNoteInput(item.reviewerNote || '');
                          }}
                          className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Verifikasi / Review</span>
                        </button>
                      </div>
                    </div>
                  ))}

                {stats.pendingReviewCount === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">Semua usulan telah diverifikasi!</p>
                    <p className="text-slate-400 mt-0.5">Tidak ada proposal baru yang menunggu evaluasi saat ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 & 3: TABEL PENELITIAN & PENGABDIAN */}
        {(activeTab === 'penelitian' || activeTab === 'pengabdian') && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Cari judul ${activeTab}, nama dosen, skema, atau fakultas...`}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                >
                  <option value="Semua">Semua Tahun</option>
                  <option value="2026">Tahun 2026</option>
                  <option value="2025">Tahun 2025</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Sedang Berjalan">Sedang Berjalan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                </select>

                {(searchTerm || selectedYear !== '2026' || selectedStatus !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedYear('2026');
                      setSelectedStatus('Semua');
                    }}
                    className="px-3 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 min-w-[280px]">Judul & Bidang Fokus</th>
                      <th className="py-3 px-4">Ketua Peneliti / Pengabdi</th>
                      <th className="py-3 px-4">Skema & Sumber Dana</th>
                      <th className="py-3 px-4 text-right">Dana Disetujui</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center min-w-[140px]">Aksi Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResearch
                      .filter((item) => (activeTab === 'penelitian' ? item.type === 'Penelitian' : item.type === 'Pengabdian'))
                      .map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group text-slate-800">
                          <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                                {item.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                  {item.focusArea}
                                </span>
                                {item.mitraSasaran && (
                                  <span className="text-emerald-700 font-medium">Mitra: {item.mitraSasaran}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800">{item.leader}</p>
                            <p className="text-[11px] text-slate-500">NIDN: {item.nidn}</p>
                            <p className="text-[11px] text-slate-400">{item.faculty}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800">{item.scheme}</p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px] font-bold">
                              {item.fundingSource}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatRupiah(item.fundingAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                item.status === 'Disetujui' || item.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'Sedang Berjalan'
                                  ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                                  : item.status === 'Menunggu Verifikasi'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedItemForReview(item);
                                  setReviewStatus(item.status);
                                  setReviewNoteInput(item.reviewerNote || '');
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1E3A8A] text-white hover:bg-[#1e40af] transition-colors cursor-pointer"
                                title="Buka Form Review & Evaluasi"
                              >
                                Review
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.title)}
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
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

        {/* MODAL 1: VERIFIKASI & REVIEW USULAN */}
        {selectedItemForReview && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <FileCheck2 className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Lembar Evaluasi & Verifikasi Reviewer LP3M</h3>
                    <p className="text-xs text-blue-200">Kode Usulan: {selectedItemForReview.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItemForReview(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded bg-[#1E3A8A] text-white font-bold text-[10px]">
                    {selectedItemForReview.type} &bull; {selectedItemForReview.scheme}
                  </span>
                  <h4 className="font-black text-slate-900 text-sm leading-snug">{selectedItemForReview.title}</h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div>Ketua: <strong>{selectedItemForReview.leader}</strong></div>
                    <div>NIDN: <strong>{selectedItemForReview.nidn}</strong></div>
                    <div>Fakultas: <strong>{selectedItemForReview.faculty}</strong></div>
                    <div>Usulan Dana: <strong className="text-emerald-700">{formatRupiah(selectedItemForReview.fundingAmount)}</strong></div>
                  </div>
                  <div className="text-slate-600 pt-1">
                    Target Luaran: <strong className="text-slate-800">{selectedItemForReview.targetOutput}</strong>
                  </div>
                </div>

                {/* Form Verifikasi */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Keputusan Status Reviewer <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Disetujui', 'Perlu Revisi', 'Ditolak'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setReviewStatus(st)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            reviewStatus === st
                              ? st === 'Disetujui'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : st === 'Perlu Revisi'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Catatan Evaluasi / Rekomendasi Reviewer
                    </label>
                    <textarea
                      rows={4}
                      value={reviewNoteInput}
                      onChange={(e) => setReviewNoteInput(e.target.value)}
                      placeholder="Tuliskan catatan substantif, perbaikan metodologi, atau justifikasi anggaran untuk peneliti..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedItemForReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveReview}
                  className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Keputusan Reviewer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: TAMBAH USULAN KEGIATAN BARU */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-gradient-to-r from-[#091a44] to-[#1e3a8a] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">Pendaftaran Usulan Tri Dharma LP3M</h3>
                    <p className="text-xs text-blue-200">SIAKAD &bull; Periode Anggaran 2026</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddNewKegiatan} className="p-6 overflow-y-auto space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewForm({ ...newForm, type: 'Penelitian' })}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newForm.type === 'Penelitian'
                          ? 'border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Penelitian (Riset Ilmiah)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewForm({ ...newForm, type: 'Pengabdian' })}
                      className={`p-3 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newForm.type === 'Pengabdian'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Pengabdian Masyarakat (PkM)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Kegiatan / Proposal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                    placeholder="Contoh: Optimasi Sistem Irigasi Cerdas Berbasis IoT..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Ketua Peneliti / Pelaksana <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.leader}
                      onChange={(e) => setNewForm({ ...newForm, leader: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      NIDN Ketua <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newForm.nidn}
                      onChange={(e) => setNewForm({ ...newForm, nidn: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fakultas Asal</label>
                    <select
                      value={newForm.faculty}
                      onChange={(e) => setNewForm({ ...newForm, faculty: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    >
                      <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                      <option value="Fakultas Teknik">Fakultas Teknik</option>
                      <option value="Fakultas Ekonomi & Bisnis">Fakultas Ekonomi & Bisnis</option>
                      <option value="Fakultas Pertanian & Biosains">Fakultas Pertanian & Biosains</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Skema Usulan</label>
                    <input
                      type="text"
                      value={newForm.scheme}
                      onChange={(e) => setNewForm({ ...newForm, scheme: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Rencana Anggaran (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={newForm.fundingAmount}
                      onChange={(e) => setNewForm({ ...newForm, fundingAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber Pendanaan</label>
                    <select
                      value={newForm.fundingSource}
                      onChange={(e) => setNewForm({ ...newForm, fundingSource: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    >
                      <option value="DIPA Internal">DIPA Internal Perguruan Tinggi</option>
                      <option value="BIMA Kemendikbud">BIMA Kemendikbud</option>
                      <option value="Mandiri / Mitra">Mandiri / Kerjasama Mitra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Luaran Wajib</label>
                  <input
                    type="text"
                    value={newForm.targetOutput}
                    onChange={(e) => setNewForm({ ...newForm, targetOutput: e.target.value })}
                    placeholder="Contoh: Jurnal Terakreditasi SINTA 2 & Prototipe"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                  />
                </div>

                {newForm.type === 'Pengabdian' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Mitra Sasaran & Lokasi</label>
                    <input
                      type="text"
                      value={newForm.mitraSasaran}
                      onChange={(e) => setNewForm({ ...newForm, mitraSasaran: e.target.value })}
                      placeholder="Contoh: Desa Binaan Sukamaju, Kec. Majenang"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Daftarkan Usulan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
