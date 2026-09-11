'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  Award,
  GraduationCap,
  BarChart3,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  Check,
  X,
  AlertCircle,
  FileText,
  Building2,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { AdmissionApplicantItem, AdmissionStatsSummary } from '@siakad/types';

export default function AdminPmbDashboardPage() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'pendaftar' | 'verifikasi' | 'seleksi' | 'kelulusan' | 'statistik'>('ringkasan');

  // Live Database States
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [stats, setStats] = useState<AdmissionStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProdi, setFilterProdi] = useState<string>('ALL');
  const [filterJalur, setFilterJalur] = useState<string>('ALL');

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Applicant Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highSchool: '',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Mandiri Online (CBT)',
    testScore: '',
    notes: '',
  });

  // Edit / Status Update State
  const [statusUpdateApplicant, setStatusUpdateApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('VERIFIED');
  const [updateScoreVal, setUpdateScoreVal] = useState<string>('');
  const [updateNotesVal, setUpdateNotesVal] = useState<string>('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const apiBase = getApiBaseUrl();

  // Fetch data directly from backend database API
  const fetchData = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [applicantsRes, statsRes] = await Promise.all([
        fetch(`${apiBase}/admissions/applicants?limit=100`, { cache: 'no-store' }),
        fetch(`${apiBase}/admissions/stats`, { cache: 'no-store' }),
      ]);

      if (applicantsRes.ok) {
        const json = await applicantsRes.json();
        const applicantList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
          ? json.data.data
          : [];
        setApplicants(applicantList);
      } else {
        throw new Error('Gagal mengambil data pendaftar dari server.');
      }

      if (statsRes.ok) {
        const jsonStats = await statsRes.json();
        setStats(jsonStats.data || jsonStats);
      }
    } catch (err: any) {
      console.error('Error loading PMB data from database:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke database API PMB.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check URL query tab parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['ringkasan', 'pendaftar', 'verifikasi', 'seleksi', 'kelulusan', 'statistik'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Filtered applicants list based on active tab and query
  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      // Tab specific filter
      if (activeTab === 'verifikasi' && app.status !== 'PENDING') return false;
      if (activeTab === 'seleksi' && !['VERIFIED', 'PASSED', 'FAILED'].includes(app.status)) return false;
      if (activeTab === 'kelulusan' && !['PASSED', 'REGISTERED'].includes(app.status)) return false;

      // Status dropdown filter
      if (filterStatus !== 'ALL' && app.status !== filterStatus) return false;

      // Prodi filter
      if (filterProdi !== 'ALL' && !app.chosenStudyProgram.toLowerCase().includes(filterProdi.toLowerCase())) return false;

      // Jalur filter
      if (filterJalur !== 'ALL' && !app.jalurPendaftaran.toLowerCase().includes(filterJalur.toLowerCase())) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = app.fullName.toLowerCase().includes(q);
        const matchReg = app.registrationNumber.toLowerCase().includes(q);
        const matchEmail = app.email.toLowerCase().includes(q);
        const matchSchool = app.highSchool.toLowerCase().includes(q);
        const matchPhone = app.phone.includes(q);
        return matchName || matchReg || matchEmail || matchSchool || matchPhone;
      }

      return true;
    });
  }, [applicants, activeTab, filterStatus, filterProdi, filterJalur, searchQuery]);

  // Handle Add New Applicant directly into database
  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Nama, email, dan nomor HP wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          testScore: formData.testScore ? parseFloat(formData.testScore) : null,
          verifiedBy: 'Bagus Wicaksono, S.Kom. (Admin PMB)',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal menambahkan pendaftar ke database.');
      }

      alert('Berhasil mendaftarkan calon mahasiswa ke database!');
      setAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        highSchool: '',
        chosenStudyProgram: 'Teknik Informatika (S1)',
        jalurPendaftaran: 'Jalur Mandiri Online (CBT)',
        testScore: '',
        notes: '',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Status Update Modal
  const openStatusModal = (app: AdmissionApplicantItem) => {
    setStatusUpdateApplicant(app);
    setUpdateStatusVal(app.status);
    setUpdateScoreVal(app.testScore !== null && app.testScore !== undefined ? String(app.testScore) : '');
    setUpdateNotesVal(app.notes || '');
    setStatusModalOpen(true);
  };

  // Save Status Update to Database
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateApplicant) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${statusUpdateApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatusVal,
          testScore: updateScoreVal ? parseFloat(updateScoreVal) : undefined,
          notes: updateNotesVal,
          verifiedBy: 'Bagus Wicaksono, S.Kom. (Admin PMB)',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Gagal memperbarui status pendaftar.');
      }

      alert(`Status pendaftar ${statusUpdateApplicant.fullName} berhasil diperbarui menjadi ${updateStatusVal}!`);
      setStatusModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Action: Verifikasi Berkas (PENDING -> VERIFIED)
  const handleQuickVerify = async (app: AdmissionApplicantItem) => {
    if (!confirm(`Konfirmasi verifikasi kelengkapan berkas pendaftar ${app.fullName} (${app.registrationNumber})?`)) return;

    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${app.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'VERIFIED',
          notes: 'Berkas digital telah diperiksa dan dinyatakan memenuhi syarat administrasi.',
          verifiedBy: 'Bagus Wicaksono, S.Kom. (Admin PMB)',
        }),
      });

      if (!res.ok) throw new Error('Gagal memverifikasi berkas.');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi berkas.');
    }
  };

  // Quick Action: Konversi Menjadi Mahasiswa Aktif SIAKAD
  const handleConvertToStudent = async (app: AdmissionApplicantItem) => {
    if (!confirm(`Terbitkan Nomor Induk Mahasiswa (NIM) resmi dan konversi ${app.fullName} menjadi Mahasiswa Aktif ITN di database?`)) return;

    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${app.id}/convert-to-student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengonversi menjadi mahasiswa.');

      alert(json.message || `Berhasil! Mahasiswa resmi diterbitkan dengan NIM: ${json.nim}`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat konversi mahasiswa.');
    }
  };

  // Delete applicant
  const handleDeleteApplicant = async (app: AdmissionApplicantItem) => {
    if (!confirm(`Peringatan: Anda yakin ingin menghapus data calon mahasiswa ${app.fullName} (${app.registrationNumber}) secara permanen dari database?`)) return;

    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${app.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus data.');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data.');
    }
  };

  // Helper status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>Berkas Terverifikasi</span>
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Lolos Seleksi</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <X className="w-3 h-3 text-rose-600" />
            <span>Tidak Lolos</span>
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
            <GraduationCap className="w-3 h-3 text-purple-700" />
            <span>Registrasi Ulang</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Dashboard Penerimaan Mahasiswa Baru (PMB)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola proses seleksi pendaftar, verifikasi berkas, skor ujian CBT, hingga penetapan kelulusan mahasiswa baru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan Data'}</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Calon Mahasiswa</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Database Error Banner if any */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
            >
              Coba Hubungkan Ulang
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold scrollbar-none">
          {[
            { id: 'ringkasan', label: 'Ringkasan & KPI', icon: LayoutDashboard },
            { id: 'pendaftar', label: `Semua Pendaftar (${applicants.length})`, icon: Users },
            { id: 'verifikasi', label: `Verifikasi Berkas (${stats?.pendingCount ?? 0})`, icon: CheckCircle2 },
            { id: 'seleksi', label: 'Ujian & Skor CBT', icon: Award },
            { id: 'kelulusan', label: `Kelulusan & Registrasi (${(stats?.passedCount ?? 0) + (stats?.registeredCount ?? 0)})`, icon: GraduationCap },
            { id: 'statistik', label: 'Rekapitulasi & Statistik', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D4A017]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: RINGKASAN & KPI STATISTIK UTAMA                                   */}
        {/* ========================================================================= */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            
            {/* 5 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pendaftar</span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {stats?.totalApplicants ?? applicants.length}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">orang</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md self-start border border-blue-100">
                  Gelombang 1 Aktif
                </span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-subtle bg-amber-50/20 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Verifikasi</span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-800">
                    {stats?.pendingCount ?? 0}
                  </span>
                  <span className="text-xs text-amber-600 ml-1">berkas</span>
                </div>
                <button
                  onClick={() => handleTabChange('verifikasi')}
                  className="text-[10px] font-bold text-amber-800 hover:underline flex items-center gap-1"
                >
                  <span>Periksa Sekarang</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-200/80 shadow-subtle bg-blue-50/20 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider">Berkas Lolos</span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#1E3A8A]">
                    {stats?.verifiedCount ?? 0}
                  </span>
                  <span className="text-xs text-blue-600 ml-1">orang</span>
                </div>
                <span className="text-[10px] text-slate-500">Siap Ujian & Penilaian</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-subtle bg-emerald-50/20 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Lulus Seleksi</span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-800">
                    {stats?.passedCount ?? 0}
                  </span>
                  <span className="text-xs text-emerald-600 ml-1">calon</span>
                </div>
                <span className="text-[10px] text-emerald-700">Telah diterbitkan SK</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/80 shadow-subtle bg-purple-50/20 flex flex-col justify-between col-span-2 md:col-span-1">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Registrasi Ulang</span>
                <div className="my-2">
                  <span className="text-2xl sm:text-3xl font-black text-purple-900">
                    {stats?.registeredCount ?? 0}
                  </span>
                  <span className="text-xs text-purple-700 ml-1">resmi NIM</span>
                </div>
                <span className="text-[10px] text-purple-800 font-semibold">Tercatat di SIAKAD</span>
              </div>
            </div>

            {/* Funnel Visualisation */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-900">Progres Seleksi & Pendaftaran Calon Mahasiswa</h3>
                <span className="text-xs text-slate-500 font-medium">
                  {stats?.totalApplicants ? Math.round(((stats.passedCount + stats.registeredCount) / stats.totalApplicants) * 100) : 0}% Diterima
                </span>
              </div>

              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${stats?.totalApplicants ? ((stats.registeredCount) / stats.totalApplicants) * 100 : 0}%` }}
                  className="bg-purple-600 h-full"
                  title="Registrasi Ulang"
                />
                <div
                  style={{ width: `${stats?.totalApplicants ? ((stats.passedCount) / stats.totalApplicants) * 100 : 0}%` }}
                  className="bg-emerald-500 h-full"
                  title="Lolos Seleksi"
                />
                <div
                  style={{ width: `${stats?.totalApplicants ? ((stats.verifiedCount) / stats.totalApplicants) * 100 : 0}%` }}
                  className="bg-blue-500 h-full"
                  title="Berkas Terverifikasi"
                />
                <div
                  style={{ width: `${stats?.totalApplicants ? ((stats.pendingCount) / stats.totalApplicants) * 100 : 0}%` }}
                  className="bg-amber-400 h-full"
                  title="Menunggu Verifikasi"
                />
                <div
                  style={{ width: `${stats?.totalApplicants ? ((stats.failedCount) / stats.totalApplicants) * 100 : 0}%` }}
                  className="bg-rose-400 h-full"
                  title="Tidak Lolos"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-purple-600"></span>
                  <span>Registrasi Ulang ({stats?.registeredCount ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                  <span>Lolos Seleksi ({stats?.passedCount ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
                  <span>Terverifikasi ({stats?.verifiedCount ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400"></span>
                  <span>Menunggu Verifikasi ({stats?.pendingCount ?? 0})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-400"></span>
                  <span>Tidak Lolos ({stats?.failedCount ?? 0})</span>
                </div>
              </div>
            </div>

            {/* Grid 2 Columns: Prodi Breakdown & Jalur Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Distribusi Program Studi Pilihan */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Distribusi Pilihan Program Studi</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Real-time DB</span>
                </div>

                <div className="space-y-3">
                  {stats?.prodiDistribution?.slice(0, 6).map((item, idx) => {
                    const percentage = stats?.totalApplicants ? Math.round((item.count / stats.totalApplicants) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.prodi}</span>
                          <span className="font-bold text-slate-900">{item.count} orang ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`h-full rounded-full ${idx === 0 ? 'bg-[#1E3A8A]' : idx === 1 ? 'bg-blue-500' : 'bg-slate-400'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Distribusi Jalur Masuk */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#D4A017]" />
                    <span>Distribusi Jalur Seleksi</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Real-time DB</span>
                </div>

                <div className="space-y-3">
                  {stats?.jalurDistribution?.map((item, idx) => {
                    const percentage = stats?.totalApplicants ? Math.round((item.count / stats.totalApplicants) * 100) : 0;
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{item.jalur}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{percentage}% dari total pendaftar</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-extrabold text-slate-800 text-xs">
                          {item.count} pendaftar
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Quick Recent Activity Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pendaftar Terbaru</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar calon mahasiswa yang baru melakukan registrasi</p>
                </div>
                <button
                  onClick={() => handleTabChange('pendaftar')}
                  className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
                >
                  <span>Lihat Semua Pendaftar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">No. Registrasi</th>
                      <th className="px-5 py-3">Nama Calon Mahasiswa</th>
                      <th className="px-5 py-3">Program Studi Pilihan</th>
                      <th className="px-5 py-3">Jalur Pendaftaran</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.slice(0, 6).map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A8A]">
                          {app.registrationNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">{app.fullName}</p>
                          <p className="text-[11px] text-slate-400">{app.highSchool}</p>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">
                          {app.chosenStudyProgram}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {app.jalurPendaftaran}
                        </td>
                        <td className="px-5 py-3.5">
                          {renderStatusBadge(app.status)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedApplicant(app);
                              setDetailModalOpen(true);
                            }}
                            className="text-[#1E3A8A] hover:underline font-bold text-xs"
                          >
                            Detail
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

        {/* ========================================================================= */}
        {/* TAB 2, 3, 4, 5: TABEL PENDAFTAR DENGAN FITUR LENGKAP                     */}
        {/* ========================================================================= */}
        {['pendaftar', 'verifikasi', 'seleksi', 'kelulusan'].includes(activeTab) && (
          <div className="space-y-4">
            
            {/* Filter & Search Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama calon mahasiswa, No. Registrasi, email, asal SMA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'pendaftar' && (
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="ALL">Semua Status Seleksi</option>
                    <option value="PENDING">Menunggu Verifikasi</option>
                    <option value="VERIFIED">Berkas Terverifikasi</option>
                    <option value="PASSED">Lolos Seleksi</option>
                    <option value="FAILED">Tidak Lolos</option>
                    <option value="REGISTERED">Registrasi Ulang</option>
                  </select>
                )}

                <select
                  value={filterProdi}
                  onChange={(e) => setFilterProdi(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
                >
                  <option value="ALL">Semua Program Studi</option>
                  <option value="Informatika">Teknik Informatika</option>
                  <option value="Sistem Informasi">Sistem Informasi</option>
                  <option value="Mesin">Teknik Mesin</option>
                  <option value="Elektro">Teknik Elektro</option>
                  <option value="Sipil">Teknik Sipil</option>
                  <option value="Bisnis Digital">Bisnis Digital</option>
                  <option value="Manajemen">Manajemen</option>
                  <option value="Akuntansi">Akuntansi</option>
                </select>

                <select
                  value={filterJalur}
                  onChange={(e) => setFilterJalur(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
                >
                  <option value="ALL">Semua Jalur</option>
                  <option value="Prestasi">Jalur Prestasi</option>
                  <option value="Rapor">Jalur Nilai Rapor</option>
                  <option value="Mandiri">Jalur CBT Mandiri</option>
                  <option value="KIP-K">KIP-K & Beasiswa</option>
                </select>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
              <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">
                  Menampilkan {filteredApplicants.length} calon mahasiswa dari database
                </span>
                <span className="text-[11px] text-slate-400">
                  Data tersimpan permanen di tabel <code className="text-[#1E3A8A]">admission_applicants</code>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">No. Registrasi</th>
                      <th className="px-4 py-3">Biodata Calon Mahasiswa</th>
                      <th className="px-4 py-3">Program Studi</th>
                      <th className="px-4 py-3">Jalur Masuk</th>
                      <th className="px-4 py-3">Status Seleksi</th>
                      <th className="px-4 py-3">Nilai CBT</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplicants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          Tidak ada data pendaftar yang cocok dengan filter pencarian saat ini.
                        </td>
                      </tr>
                    ) : (
                      filteredApplicants.map((app) => (
                        <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#1E3A8A]">
                            {app.registrationNumber}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{app.fullName}</p>
                            <p className="text-[11px] text-slate-500">{app.highSchool}</p>
                            <p className="text-[10px] text-slate-400">{app.email} &bull; {app.phone}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {app.chosenStudyProgram}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {app.jalurPendaftaran}
                          </td>
                          <td className="px-4 py-3">
                            {renderStatusBadge(app.status)}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {app.testScore !== null && app.testScore !== undefined ? (
                              <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                                {app.testScore}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Tombol Cepat Verifikasi untuk Tab Verifikasi */}
                              {activeTab === 'verifikasi' && app.status === 'PENDING' && (
                                <button
                                  onClick={() => handleQuickVerify(app)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                                  title="Verifikasi Berkas Ini"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui</span>
                                </button>
                              )}

                              {/* Tombol Cepat Konversi Mahasiswa untuk Tab Kelulusan */}
                              {activeTab === 'kelulusan' && app.status === 'PASSED' && (
                                <button
                                  onClick={() => handleConvertToStudent(app)}
                                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                                  title="Terbitkan NIM dan Jadikan Mahasiswa Aktif"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  <span>Terbitkan NIM</span>
                                </button>
                              )}

                              {/* Tombol Edit / Update Status */}
                              <button
                                onClick={() => openStatusModal(app)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-100 transition-colors"
                                title="Perbarui Status & Nilai"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Detail */}
                              <button
                                onClick={() => {
                                  setSelectedApplicant(app);
                                  setDetailModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-100 transition-colors"
                                title="Lihat Profil Lengkap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                onClick={() => handleDeleteApplicant(app)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Data Pendaftar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

        {/* ========================================================================= */}
        {/* TAB 6: REKAPITULASI & STATISTIK RESMI UNTUK REKTORAT                      */}
        {/* ========================================================================= */}
        {activeTab === 'statistik' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Rekapitulasi Penerimaan Mahasiswa Baru TA 2027/2028</h3>
                <p className="text-xs text-slate-500">Laporan agregasi riil terintegrasi database sistem seleksi ITN</p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4A017]" />
                <span>Cetak Lembar Rekap</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400">Total Pendaftar Masuk</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats?.totalApplicants ?? 0} Orang</p>
                <p className="text-[11px] text-slate-500 mt-1">Tersaring melalui 4 jalur penerimaan resmi</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700">Dinyatakan Diterima</span>
                <p className="text-2xl font-black text-emerald-800 mt-1">{(stats?.passedCount ?? 0) + (stats?.registeredCount ?? 0)} Orang</p>
                <p className="text-[11px] text-emerald-600 mt-1">Tingkat kelulusan: {stats?.totalApplicants ? Math.round(((stats.passedCount + stats.registeredCount) / stats.totalApplicants) * 100) : 0}%</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-700">Telah Registrasi Ulang (NIM)</span>
                <p className="text-2xl font-black text-purple-900 mt-1">{stats?.registeredCount ?? 0} Mahasiswa</p>
                <p className="text-[11px] text-purple-600 mt-1">Telah siap mengikuti masa orientasi PKKMB</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Program Studi</th>
                    <th className="py-3 px-4 text-center">Pendaftar</th>
                    <th className="py-3 px-4 text-center">Terverifikasi</th>
                    <th className="py-3 px-4 text-center">Lolos Seleksi</th>
                    <th className="py-3 px-4 text-center">Registrasi Ulang</th>
                    <th className="py-3 px-4 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.prodiDistribution?.map((item, idx) => {
                    const prodiApps = applicants.filter((a) => a.chosenStudyProgram === item.prodi);
                    const verified = prodiApps.filter((a) => a.status === 'VERIFIED').length;
                    const passed = prodiApps.filter((a) => a.status === 'PASSED').length;
                    const reg = prodiApps.filter((a) => a.status === 'REGISTERED').length;
                    const percent = stats?.totalApplicants ? Math.round((item.count / stats.totalApplicants) * 100) : 0;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.prodi}</td>
                        <td className="py-3.5 px-4 text-center font-semibold">{item.count}</td>
                        <td className="py-3.5 px-4 text-center text-blue-700 font-semibold">{verified}</td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">{passed}</td>
                        <td className="py-3.5 px-4 text-center text-purple-800 font-extrabold">{reg}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: DETAIL PROFIL CALON MAHASISWA                                   */}
        {/* ========================================================================= */}
        {detailModalOpen && selectedApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4A017]">
                    Detail Pendaftar PMB
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedApplicant.fullName}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor Registrasi:</span>
                    <span className="font-mono font-bold text-[#1E3A8A]">{selectedApplicant.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Seleksi:</span>
                    <span>{renderStatusBadge(selectedApplicant.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Program Studi Pilihan:</span>
                    <span className="font-bold text-slate-900">{selectedApplicant.chosenStudyProgram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jalur Penerimaan:</span>
                    <span className="font-medium text-slate-800">{selectedApplicant.jalurPendaftaran}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Skor Ujian CBT / Rapor:</span>
                    <span className="font-bold text-slate-900">{selectedApplicant.testScore ?? 'Belum Dinilai'}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Email: <strong>{selectedApplicant.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>WhatsApp / Telepon: <strong>{selectedApplicant.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Asal Sekolah: <strong>{selectedApplicant.highSchool}</strong></span>
                  </div>
                  {selectedApplicant.notes && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mt-2">
                      <strong>Catatan Verifikator:</strong>
                      <p className="mt-0.5">{selectedApplicant.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openStatusModal(selectedApplicant);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554] transition-all"
                >
                  Ubah Status & Nilai
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: TAMBAH CALON MAHASISWA SECARA MANUAL KE DATABASE                 */}
        {/* ========================================================================= */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                    Formulir Pendaftaran BAAK PMB
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    Tambah Calon Mahasiswa Baru
                  </h3>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplicant} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Kevin Alamsyah"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Aktif *</label>
                    <input
                      type="email"
                      required
                      placeholder="kevin@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP *</label>
                    <input
                      type="text"
                      required
                      placeholder="081234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asal Sekolah (SMA / SMK / MA)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SMAN 28 Jakarta Selatan"
                    value={formData.highSchool}
                    onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pilihan Program Studi</label>
                    <select
                      value={formData.chosenStudyProgram}
                      onChange={(e) => setFormData({ ...formData, chosenStudyProgram: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white"
                    >
                      <option value="Teknik Informatika (S1)">Teknik Informatika (S1)</option>
                      <option value="Sistem Informasi (S1)">Sistem Informasi (S1)</option>
                      <option value="Teknik Mesin (S1)">Teknik Mesin (S1)</option>
                      <option value="Teknik Elektro (S1)">Teknik Elektro (S1)</option>
                      <option value="Teknik Sipil (S1)">Teknik Sipil (S1)</option>
                      <option value="Teknik Industri (S1)">Teknik Industri (S1)</option>
                      <option value="Bisnis Digital (S1)">Bisnis Digital (S1)</option>
                      <option value="Manajemen (S1)">Manajemen (S1)</option>
                      <option value="Akuntansi (S1)">Akuntansi (S1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jalur Pendaftaran</label>
                    <select
                      value={formData.jalurPendaftaran}
                      onChange={(e) => setFormData({ ...formData, jalurPendaftaran: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white"
                    >
                      <option value="Jalur Prestasi Akademik (Bebas Tes)">Jalur Prestasi Akademik (Bebas Tes)</option>
                      <option value="Jalur Nilai Rapor & Portofolio">Jalur Nilai Rapor & Portofolio</option>
                      <option value="Jalur Mandiri Online (CBT)">Jalur Mandiri Online (CBT)</option>
                      <option value="KIP-K & Beasiswa Nusantara">KIP-K & Beasiswa Nusantara</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Menyimpan ke DB...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-[#D4A017]" />
                        <span>Simpan ke Database</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: UBAH STATUS SELEKSI & NILAI CBT                                 */}
        {/* ========================================================================= */}
        {statusModalOpen && statusUpdateApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                    Keputusan Panitia PMB
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {statusUpdateApplicant.fullName}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">{statusUpdateApplicant.registrationNumber}</p>
                </div>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Seleksi Penerimaan *</label>
                  <select
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-none focus:border-[#1E3A8A] bg-white"
                  >
                    <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
                    <option value="VERIFIED">Berkas Terverifikasi / Siap Seleksi (VERIFIED)</option>
                    <option value="PASSED">Lulus Seleksi PMB (PASSED)</option>
                    <option value="FAILED">Tidak Lulus Seleksi (FAILED)</option>
                    <option value="REGISTERED">Registrasi Ulang Selesai (REGISTERED)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai Skor Ujian / Rapor (Skala 0 - 100)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="Contoh: 85.5"
                    value={updateScoreVal}
                    onChange={(e) => setUpdateScoreVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Verifikator & Keputusan</label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Berkas ijazah dan sertifikat terverifikasi valid. Nilai di atas passing grade."
                    value={updateNotesVal}
                    onChange={(e) => setUpdateNotesVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Perbarui Status di DB'}
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
