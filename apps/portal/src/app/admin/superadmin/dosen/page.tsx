'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  GraduationCap,
  Users,
  UserCheck,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Building2,
  Award,
  IdCard,
  Sparkles,
  KeyRound,
  LayoutGrid,
  List,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface LecturerItem {
  id: string;
  userId: string;
  nidn: string;
  nip?: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  email: string;
  phone?: string;
  studyProgramId?: string;
  studyProgramName?: string;
  facultyCode?: string;
  facultyName?: string;
  isAcademicAdvisor: boolean;
  isActive: boolean;
  role?: string;
  createdAt?: string;
}

export interface StudyProgramOption {
  id: string;
  name: string;
  code: string;
  facultyName?: string;
}

export default function SuperAdminDosenPage() {
  const [lecturers, setLecturers] = useState<LecturerItem[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgramOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [prodiFilter, setProdiFilter] = useState('Semua Program Studi');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');
  const [advisorFilter, setAdvisorFilter] = useState<'Semua' | 'PA' | 'NonPA'>('Semua');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<LecturerItem | null>(null);
  const [resettingLecturer, setResettingLecturer] = useState<LecturerItem | null>(null);
  const [viewingCredential, setViewingCredential] = useState<LecturerItem | null>(null);
  const [deletingLecturer, setDeletingLecturer] = useState<LecturerItem | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof LecturerItem>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    fullName: '',
    titlePrefix: '',
    titleSuffix: '',
    nidn: '',
    nip: '',
    email: '',
    phone: '',
    studyProgramId: '',
    isAcademicAdvisor: true,
    password: 'Password123!',
    isActive: true,
  });

  // Reset password form state
  const [newPassword, setNewPassword] = useState('Password123!');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Lecturers & Study Programs
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [lecturersRes, prodiRes] = await Promise.all([
        fetch(`${apiBase}/lecturers`),
        fetch(`${apiBase}/study-programs`),
      ]);

      if (lecturersRes.ok) {
        const json = await lecturersRes.json();
        setLecturers(json.data || []);
      }

      if (prodiRes.ok) {
        const json = await prodiRes.json();
        setStudyPrograms(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Gagal memuat data dari server. Silakan muat ulang.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Lecturer
  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.nidn.trim() || !formData.email.trim()) {
      showToast('Nama Lengkap, NIDN, dan Email wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        titlePrefix: formData.titlePrefix.trim() || undefined,
        titleSuffix: formData.titleSuffix.trim() || undefined,
        nidn: formData.nidn.trim(),
        nip: formData.nip.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        studyProgramId: formData.studyProgramId || (studyPrograms[0]?.id ?? undefined),
        isAcademicAdvisor: formData.isAcademicAdvisor,
        password: formData.password || 'Password123!',
      };

      const res = await fetch(`${apiBase}/lecturers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal membuat akun dosen');
      }

      showToast(`Akun dosen untuk "${formData.fullName}" berhasil dibuat.`);
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat membuat akun dosen.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Lecturer
  const handleUpdateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLecturer) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        titlePrefix: formData.titlePrefix.trim() || undefined,
        titleSuffix: formData.titleSuffix.trim() || undefined,
        nidn: formData.nidn.trim(),
        nip: formData.nip.trim() || undefined,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        studyProgramId: formData.studyProgramId || undefined,
        isAcademicAdvisor: formData.isAcademicAdvisor,
        isActive: formData.isActive,
      };

      const res = await fetch(`${apiBase}/lecturers/${editingLecturer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui data dosen');
      }

      showToast(`Data dosen "${formData.fullName}" berhasil diperbarui.`);
      setEditingLecturer(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat memperbarui akun dosen.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingLecturer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/${resettingLecturer.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal mereset kata sandi');
      }

      showToast(`Kata sandi untuk ${resettingLecturer.fullName} berhasil diperbarui.`);
      setResettingLecturer(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui kata sandi.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Lecturer
  const handleDeleteLecturer = async () => {
    if (!deletingLecturer) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/${deletingLecturer.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal menghapus akun dosen');
      }

      showToast(`Akun dosen "${deletingLecturer.fullName}" berhasil dihapus.`);
      setDeletingLecturer(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus akun dosen.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      titlePrefix: '',
      titleSuffix: '',
      nidn: '',
      nip: '',
      email: '',
      phone: '',
      studyProgramId: studyPrograms[0]?.id || '',
      isAcademicAdvisor: true,
      password: 'Password123!',
      isActive: true,
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (lec: LecturerItem) => {
    setEditingLecturer(lec);
    setFormData({
      fullName: lec.fullName || '',
      titlePrefix: lec.titlePrefix || '',
      titleSuffix: lec.titleSuffix || '',
      nidn: lec.nidn || '',
      nip: lec.nip || '',
      email: lec.email || '',
      phone: lec.phone || '',
      studyProgramId: lec.studyProgramId || '',
      isAcademicAdvisor: !!lec.isAcademicAdvisor,
      password: '',
      isActive: lec.isActive ?? true,
    });
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sorting
  const handleSort = (field: keyof LecturerItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Data
  const filteredLecturers = useMemo(() => {
    return lecturers
      .filter((lec) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (lec.fullName && lec.fullName.toLowerCase().includes(query)) ||
          (lec.nidn && lec.nidn.toLowerCase().includes(query)) ||
          (lec.nip && lec.nip.toLowerCase().includes(query)) ||
          (lec.email && lec.email.toLowerCase().includes(query)) ||
          (lec.studyProgramName && lec.studyProgramName.toLowerCase().includes(query));

        const matchesProdi =
          prodiFilter === 'Semua Program Studi' || lec.studyProgramName === prodiFilter;

        const matchesStatus =
          statusFilter === 'Semua' ||
          (statusFilter === 'Aktif' ? lec.isActive : !lec.isActive);

        const matchesAdvisor =
          advisorFilter === 'Semua' ||
          (advisorFilter === 'PA' ? lec.isAcademicAdvisor : !lec.isAcademicAdvisor);

        return matchesSearch && matchesProdi && matchesStatus && matchesAdvisor;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [lecturers, searchQuery, prodiFilter, statusFilter, advisorFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredLecturers.length / itemsPerPage) || 1;
  const paginatedLecturers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLecturers.slice(start, start + itemsPerPage);
  }, [filteredLecturers, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = lecturers.length;
    const active = lecturers.filter((l) => l.isActive).length;
    const advisors = lecturers.filter((l) => l.isAcademicAdvisor).length;
    const uniqueProdis = new Set(lecturers.map((l) => l.studyProgramId).filter(Boolean)).size;
    return { total, active, advisors, uniqueProdis };
  }, [lecturers]);

  // Unique Prodi options for filter dropdown
  const prodiFilterOptions = useMemo(() => {
    const list = Array.from(new Set(lecturers.map((l) => l.studyProgramName).filter(Boolean))) as string[];
    return ['Semua Program Studi', ...list];
  }, [lecturers]);

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
    >
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/30'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:opacity-80 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
              <Link href="/admin/superadmin" className="hover:text-slate-200 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Pengguna</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-emerald-400">Dosen</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <GraduationCap className="w-6 h-6" />
              </span>
              Manajemen Akun Dosen
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola data profil tenaga pengajar, akun login portal dosen, penugasan pembimbing akademik (PA), dan hak akses.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Akun Dosen</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Akun Dosen</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.total}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">Terdaftar</span> di sistem informasi akademik
            </div>
          </div>

          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dosen Aktif</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.active}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-teal-400 font-medium">
                {stats.total ? Math.round((stats.active / stats.total) * 100) : 0}%
              </span>{' '}
              memiliki status login aktif
            </div>
          </div>

          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pembimbing Akademik</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.advisors}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-blue-400 font-medium">Dosen PA</span> berwenang menyetujui KRS
            </div>
          </div>

          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Program Studi Terisi</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.uniqueProdis}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              Dari <span className="text-amber-400 font-medium">{studyPrograms.length}</span> prodi yang tersedia
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama dosen, NIDN, NIP, atau email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            {/* Prodi Filter */}
            <select
              value={prodiFilter}
              onChange={(e) => {
                setProdiFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {prodiFilterOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Status Akun</option>
              <option value="Aktif">Status Aktif</option>
              <option value="Nonaktif">Status Nonaktif</option>
            </select>

            {/* PA Filter */}
            <select
              value={advisorFilter}
              onChange={(e) => {
                setAdvisorFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Peran</option>
              <option value="PA">Dosen Pembimbing (PA)</option>
              <option value="NonPA">Bukan Dosen PA</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
            <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Section (Loading or Table / Grid) */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Memuat data akun dosen...</p>
          </div>
        ) : filteredLecturers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <GraduationCap className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-300">Tidak ada data dosen ditemukan</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Coba ubah kata kunci pencarian atau bersihkan filter yang sedang aktif.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setProdiFilter('Semua Program Studi');
                setStatusFilter('Semua');
                setAdvisorFilter('Semua');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center gap-1.5 hover:text-white"
                      >
                        <span>Nama Dosen & Gelar</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 font-semibold">
                      <button
                        onClick={() => handleSort('nidn')}
                        className="flex items-center gap-1.5 hover:text-white"
                      >
                        <span>NIDN / NIP</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-500" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 font-semibold">Program Studi</th>
                    <th className="py-3.5 px-4 font-semibold">Akun Login</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Dosen PA</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {paginatedLecturers.map((lec) => {
                    const initials = lec.fullName
                      ? lec.fullName
                          .replace(/Dr\.|Prof\.|Ir\.|M\.Kom|S\.T|M\.T|S\.Kom|M\.Sc|M\.Eng|M\.M|Ak\.|S\.E\./gi, '')
                          .trim()
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'DS';

                    return (
                      <tr
                        key={lec.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Name & Titles */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shrink-0 shadow-inner">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium text-slate-100 group-hover:text-emerald-300 transition-colors">
                                {lec.fullName}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>{lec.phone || 'No. HP belum diatur'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* NIDN & NIP */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40 inline-block">
                            NIDN: {lec.nidn}
                          </div>
                          {lec.nip && (
                            <div className="text-xs text-slate-500 font-mono mt-1">
                              NIP: {lec.nip}
                            </div>
                          )}
                        </td>

                        {/* Program Studi */}
                        <td className="py-3.5 px-4">
                          <div className="text-sm text-slate-200 font-medium">
                            {lec.studyProgramName || 'Umum / Belum Diatur'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {lec.facultyName || (lec.facultyCode ? `Fakultas ${lec.facultyCode}` : 'Universitas')}
                          </div>
                        </td>

                        {/* Email / Login */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{lec.email}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Role: <span className="text-emerald-400/90 font-mono">LECTURER</span>
                          </div>
                        </td>

                        {/* Pembimbing Akademik (PA) */}
                        <td className="py-3.5 px-4 text-center">
                          {lec.isAcademicAdvisor ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Award className="w-3 h-3" />
                              Dosen PA
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-slate-500">
                              Bukan PA
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {lec.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Nonaktif
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Credentials */}
                            <button
                              onClick={() => setViewingCredential(lec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Lihat Kredensial & Profil"
                            >
                              <IdCard className="w-4 h-4" />
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResettingLecturer(lec);
                                setNewPassword('Password123!');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Reset Kata Sandi"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditModal(lec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Edit Data Dosen"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeletingLecturer(lec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Akun Dosen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Menampilkan{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLecturers.length)}
                </span>{' '}
                -{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredLecturers.length)}
                </span>{' '}
                dari{' '}
                <span className="font-semibold text-slate-200">{filteredLecturers.length}</span> dosen
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid / Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedLecturers.map((lec) => {
              const initials = lec.fullName
                ? lec.fullName
                    .replace(/Dr\.|Prof\.|Ir\.|M\.Kom|S\.T|M\.T|S\.Kom|M\.Sc|M\.Eng|M\.M|Ak\.|S\.E\./gi, '')
                    .trim()
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'DS';

              return (
                <div
                  key={lec.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 hover:border-emerald-500/30 transition-all duration-200 flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-100 text-sm group-hover:text-emerald-300 transition-colors leading-snug">
                            {lec.fullName}
                          </h4>
                          <span className="text-xs text-emerald-400 font-mono font-medium">
                            NIDN: {lec.nidn}
                          </span>
                        </div>
                      </div>

                      {lec.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Nonaktif
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-2 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300">
                          {lec.studyProgramName || 'Umum / Belum Diatur'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate text-slate-300">{lec.email}</span>
                      </div>
                      {lec.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-400">{lec.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-500">Peran PA:</span>
                        {lec.isAcademicAdvisor ? (
                          <span className="text-blue-400 font-medium flex items-center gap-1">
                            <Award className="w-3 h-3" /> Dosen PA
                          </span>
                        ) : (
                          <span className="text-slate-500">Bukan PA</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-800/70 flex items-center justify-between">
                    <button
                      onClick={() => setViewingCredential(lec)}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <IdCard className="w-3.5 h-3.5" />
                      Kredensial
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setResettingLecturer(lec);
                          setNewPassword('Password123!');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        title="Reset Kata Sandi"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(lec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                        title="Edit Dosen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingLecturer(lec)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: TAMBAH AKUN DOSEN BARU                                           */}
        {/* ========================================================================= */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Buat Akun Dosen Baru"
        >
          <form onSubmit={handleCreateLecturer} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Akun dosen yang dibuat akan langsung memiliki hak akses portal sebagai <strong>LECTURER</strong> dan dapat login menggunakan alamat email serta kata sandi yang Anda tentukan di bawah.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gelar Depan */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gelar Depan <span className="text-slate-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dr., Prof. Dr., Ir."
                  value={formData.titlePrefix}
                  onChange={(e) => setFormData({ ...formData, titlePrefix: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Gelar Belakang */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gelar Belakang <span className="text-slate-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: M.Kom., S.T., M.T., Ph.D."
                  value={formData.titleSuffix}
                  onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Lengkap Dosen <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap tanpa gelar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NIDN */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  NIDN (Nomor Induk Dosen Nasional) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0412088501 (10 digit)"
                  value={formData.nidn}
                  onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* NIP */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  NIP / NUPTK <span className="text-slate-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 19850812 201012 1 003"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Program Studi */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Homebase Program Studi <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.studyProgramId}
                onChange={(e) => setFormData({ ...formData, studyProgramId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Program Studi</option>
                {studyPrograms.map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.name} {prodi.facultyName ? `(${prodi.facultyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Akun Login */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Akun Portal <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama.dosen@itn.ac.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Password Awal */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kata Sandi Awal <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Dosen dapat mengubah kata sandi ini setelah berhasil masuk.</p>
              </div>
            </div>

            {/* Nomor Telepon / WA */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nomor Handphone / WhatsApp <span className="text-slate-500">(Opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 0812-3456-7890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Checkbox PA */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <input
                type="checkbox"
                id="isAcademicAdvisor"
                checked={formData.isAcademicAdvisor}
                onChange={(e) => setFormData({ ...formData, isAcademicAdvisor: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="isAcademicAdvisor" className="text-xs text-slate-300 cursor-pointer">
                <strong>Tetapkan sebagai Pembimbing Akademik (Dosen PA)</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mengizinkan dosen ini untuk membimbing mahasiswa dan menyetujui Kartu Rencana Studi (KRS).
                </p>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan & Buat Akun</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 2: EDIT AKUN DOSEN                                                  */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!editingLecturer}
          onClose={() => setEditingLecturer(null)}
          title="Edit Data Dosen"
        >
          <form onSubmit={handleUpdateLecturer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gelar Depan</label>
                <input
                  type="text"
                  value={formData.titlePrefix}
                  onChange={(e) => setFormData({ ...formData, titlePrefix: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gelar Belakang</label>
                <input
                  type="text"
                  value={formData.titleSuffix}
                  onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Lengkap <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  NIDN <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nidn}
                  onChange={(e) => setFormData({ ...formData, nidn: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">NIP</label>
                <input
                  type="text"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Program Studi</label>
              <select
                value={formData.studyProgramId}
                onChange={(e) => setFormData({ ...formData, studyProgramId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Program Studi</option>
                {studyPrograms.map((prodi) => (
                  <option key={prodi.id} value={prodi.id}>
                    {prodi.name} {prodi.facultyName ? `(${prodi.facultyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Login <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsAcademicAdvisor"
                  checked={formData.isAcademicAdvisor}
                  onChange={(e) => setFormData({ ...formData, isAcademicAdvisor: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="editIsAcademicAdvisor" className="text-xs text-slate-300 cursor-pointer">
                  Tetapkan sebagai Pembimbing Akademik (Dosen PA)
                </label>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-300 cursor-pointer">
                  Status Akun Aktif (Dapat Login ke Portal)
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingLecturer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Perbarui Data Dosen</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 3: RESET KATA SANDI                                                 */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!resettingLecturer}
          onClose={() => setResettingLecturer(null)}
          title="Reset Kata Sandi Dosen"
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Reset Kata Sandi Akun
              </div>
              <p>
                Anda akan mengubah kata sandi untuk akun dosen:{' '}
                <strong>{resettingLecturer?.fullName}</strong> ({resettingLecturer?.email}).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kata Sandi Baru <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Kata sandi baru akan langsung dienkripsi dan dapat langsung digunakan oleh dosen untuk masuk ke portal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResettingLecturer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mereset...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Terapkan Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 4: DETAIL & KARTU KREDENSIAL                                        */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!viewingCredential}
          onClose={() => setViewingCredential(null)}
          title="Kartu Kredensial & Profil Dosen"
        >
          {viewingCredential && (
            <div className="space-y-5">
              {/* Card Badge */}
              <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg">
                      <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center font-bold text-emerald-400 text-base">
                        {viewingCredential.fullName
                          .replace(/Dr\.|Prof\.|Ir\.|M\.Kom|S\.T|M\.T|S\.Kom|M\.Sc|M\.Eng|M\.M|Ak\.|S\.E\./gi, '')
                          .trim()
                          .split(' ')
                          .filter(Boolean)
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">
                        {viewingCredential.fullName}
                      </h3>
                      <p className="text-xs text-emerald-400 font-mono mt-0.5">
                        NIDN: {viewingCredential.nidn}
                      </p>
                      {viewingCredential.nip && (
                        <p className="text-[11px] text-slate-400 font-mono">
                          NIP: {viewingCredential.nip}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    DOSEN
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Program Studi</span>
                    <span className="font-semibold text-slate-200">
                      {viewingCredential.studyProgramName || 'Umum'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fakultas</span>
                    <span className="font-semibold text-slate-200">
                      {viewingCredential.facultyName || 'Institut Teknologi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pembimbing Akademik</span>
                    <span className="font-semibold text-blue-400">
                      {viewingCredential.isAcademicAdvisor ? 'Ya (Dosen PA)' : 'Tidak'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status Akses</span>
                    <span
                      className={`font-semibold ${
                        viewingCredential.isActive ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {viewingCredential.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Info Copy Box */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Kredensial Akses Portal
                </h4>

                {/* Email Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Email Login
                    </span>
                    <span className="text-sm font-mono text-slate-200">
                      {viewingCredential.email}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(viewingCredential.email, 'email')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Salin Email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* URL Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Tautan Portal Login
                    </span>
                    <span className="text-sm font-mono text-slate-200">
                      http://localhost:3002/login
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('http://localhost:3002/login', 'url')}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Salin Tautan"
                  >
                    {copiedField === 'url' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setViewingCredential(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL 5: KONFIRMASI HAPUS                                                 */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!deletingLecturer}
          onClose={() => setDeletingLecturer(null)}
          title="Konfirmasi Hapus Akun Dosen"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
              <div className="font-semibold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Peringatan Penghapusan Akun
              </div>
              <p>
                Apakah Anda yakin ingin menghapus akun dosen{' '}
                <strong>{deletingLecturer?.fullName}</strong> (NIDN: {deletingLecturer?.nidn})?
              </p>
              <p className="text-rose-400/80">
                Tindakan ini akan menonaktifkan hak akses login portal dan menghapus relasi dosen tersebut.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingLecturer(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteLecturer}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Akun</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PortalLayout>
  );
}
