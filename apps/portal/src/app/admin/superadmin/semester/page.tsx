'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  X,
  FileText,
  Award,
  Layers,
  BookOpen,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface SemesterPeriodItem {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  type: 'Gasal' | 'Genap' | 'Pendek';
  startDate: string;
  endDate: string;
  krsStartDate: string;
  krsEndDate: string;
  gradeDeadline: string;
  totalCoursesOffered: number;
  totalCreditsOffered: number;
  isActive: boolean;
  isGradeLocked: boolean;
  status: 'Buka' | 'Masa Ujian' | 'Terkunci' | 'Selesai';
  notes: string;
}

export default function SuperAdminSemesterPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const [semesters, setSemesters] = useState<SemesterPeriodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SemesterPeriodItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSemesters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/semesters`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setSemesters(data);
        }
      } else {
        console.error('Gagal memuat data semester:', res.status);
      }
    } catch (err) {
      console.error('Koneksi ke sistem semester terputus:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    academicYear: string;
    type: SemesterPeriodItem['type'];
    startDate: string;
    endDate: string;
    krsStartDate: string;
    krsEndDate: string;
    gradeDeadline: string;
    totalCoursesOffered: number;
    totalCreditsOffered: number;
    isActive: boolean;
    isGradeLocked: boolean;
    status: SemesterPeriodItem['status'];
    notes: string;
  }>({
    code: '',
    name: '',
    academicYear: '2026/2027',
    type: 'Gasal',
    startDate: '2026-09-01',
    endDate: '2027-01-20',
    krsStartDate: '2026-08-15',
    krsEndDate: '2026-08-31',
    gradeDeadline: '2027-01-28',
    totalCoursesOffered: 45,
    totalCreditsOffered: 1350,
    isActive: false,
    isGradeLocked: true,
    status: 'Buka',
    notes: '',
  });

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const filteredSemesters = useMemo(() => {
    return semesters.filter((s) => {
      const matchSearch =
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.academicYear || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'Semua' || s.type === typeFilter;
      const matchStatus = statusFilter === 'Semua' || s.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [semesters, searchQuery, typeFilter, statusFilter]);

  const sortedSemesters = useMemo(() => {
    return [...filteredSemesters].sort((a, b) => {
      const aVal: any = (a as any)[sortField];
      const bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'boolean') {
        return sortOrder === 'asc' ? (aVal === bVal ? 0 : aVal ? 1 : -1) : (aVal === bVal ? 0 : aVal ? -1 : 1);
      }
      return 0;
    });
  }, [filteredSemesters, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedSemesters.length / itemsPerPage));
  const paginatedSemesters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSemesters.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSemesters, currentPage, itemsPerPage]);

  const activeSemester = useMemo(() => semesters.find((s) => s.isActive), [semesters]);

  const metrics = useMemo(() => {
    const total = semesters.length;
    const activeName = activeSemester ? activeSemester.name : '-';
    const totalMK = activeSemester ? activeSemester.totalCoursesOffered : 0;
    const totalSKS = activeSemester ? activeSemester.totalCreditsOffered : 0;
    return { total, activeName, totalMK, totalSKS };
  }, [semesters, activeSemester]);

  const handleToggleGradeLock = async (id: string, name: string, currentLocked: boolean) => {
    const action = currentLocked ? 'Buka Kunci' : 'Kunci';
    if (confirm(`${action} entri nilai dosen untuk "${name}"?`)) {
      try {
        const res = await fetch(`${apiBase}/academic/semesters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isGradeLocked: !currentLocked }),
        });
        if (res.ok) {
          showToast(`Input nilai "${name}" sekarang ${!currentLocked ? 'TERKUNCI' : 'TERBUKA UNTUK DOSEN'}.`);
          await loadSemesters();
        } else {
          showToast('Gagal mengubah status penguncian nilai.');
        }
      } catch {
        showToast('Terjadi gangguan koneksi saat mengubah status nilai.');
      }
    }
  };

  const handleSetActiveSemester = async (id: string, name: string) => {
    if (confirm(`Jadikan "${name}" sebagai SEMESTER AKTIF kampus? Seluruh aktivitas portal dosen, mahasiswa, dan KRS akan beralih ke semester ini.`)) {
      try {
        const res = await fetch(`${apiBase}/academic/semesters/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true, status: 'Buka' }),
        });
        if (res.ok) {
          showToast(`"${name}" sekarang aktif sebagai semester berjalan.`);
          await loadSemesters();
        } else {
          showToast('Gagal mengaktifkan periode semester.');
        }
      } catch {
        showToast('Terjadi gangguan koneksi saat mengaktifkan semester.');
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingSemester(null);
    setFormData({
      code: '20271',
      name: 'Semester Gasal 2027/2028',
      academicYear: '2027/2028',
      type: 'Gasal',
      startDate: '2027-09-01',
      endDate: '2028-01-20',
      krsStartDate: '2027-08-15',
      krsEndDate: '2027-08-31',
      gradeDeadline: '2028-01-28',
      totalCoursesOffered: 45,
      totalCreditsOffered: 1350,
      isActive: false,
      isGradeLocked: true,
      status: 'Terkunci',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: SemesterPeriodItem) => {
    setEditingSemester(s);
    setFormData({
      code: s.code,
      name: s.name,
      academicYear: s.academicYear,
      type: s.type,
      startDate: s.startDate,
      endDate: s.endDate,
      krsStartDate: s.krsStartDate,
      krsEndDate: s.krsEndDate,
      gradeDeadline: s.gradeDeadline,
      totalCoursesOffered: s.totalCoursesOffered,
      totalCreditsOffered: s.totalCreditsOffered,
      isActive: s.isActive,
      isGradeLocked: s.isGradeLocked,
      status: s.status,
      notes: s.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...formData,
      totalCoursesOffered: Number(formData.totalCoursesOffered),
      totalCreditsOffered: Number(formData.totalCreditsOffered),
    };

    try {
      if (editingSemester) {
        const res = await fetch(`${apiBase}/academic/semesters/${editingSemester.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Data semester "${formData.name}" berhasil diperbarui.`);
          await loadSemesters();
          setIsModalOpen(false);
        } else {
          showToast('Gagal memperbarui data semester.');
        }
      } else {
        const res = await fetch(`${apiBase}/academic/semesters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast(`Periode semester baru "${formData.name}" berhasil ditambahkan.`);
          await loadSemesters();
          setIsModalOpen(false);
        } else {
          showToast('Gagal menambahkan periode semester.');
        }
      }
    } catch {
      showToast('Terjadi gangguan koneksi saat menyimpan periode semester.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const targetSem = semesters.find((s) => s.id === id);
    if (targetSem?.isActive) {
      alert('Semester yang sedang AKTIF tidak dapat dihapus!');
      return;
    }

    if (confirm(`Hapus periode semester "${name}"? Seluruh arsip perkuliahan dan kelas yang terkait akan terpengaruh.`)) {
      try {
        const res = await fetch(`${apiBase}/academic/semesters/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          showToast(`Semester "${name}" berhasil dihapus.`);
          await loadSemesters();
        } else {
          showToast('Gagal menghapus semester.');
        }
      } catch {
        showToast('Terjadi gangguan koneksi saat menghapus semester.');
      }
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Akademik</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Periode Semester</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Clock className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Periode Semester</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Pengaturan semester aktif (Gasal, Genap, Pendek), masa KRS/KPRS, perkuliahan, dan kontrol kunci entri nilai dosen.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/tahun-akademik"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Tahun Akademik</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Semester Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semester Aktif</p>
              <h3 className="text-lg font-black text-[#1E3A8A] mt-1 line-clamp-1">
                {activeSemester ? activeSemester.name : '-'}
              </h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Kode DIKTI: {activeSemester ? activeSemester.code : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Validasi KRS</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">91.5% Selesai</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">7.820 KRS mahasiswa tuntas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontrol Input Nilai</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {activeSemester?.isGradeLocked ? 'Terkunci' : 'Terbuka'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSemester?.isGradeLocked ? 'Menunggu masa ujian UTS/UAS' : 'Dosen dapat entri nilai'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mata Kuliah Ditawarkan</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">
                {metrics.totalMK} MK ({metrics.totalSKS} SKS)
              </h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Penawaran semester berjalan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode semester (contoh: 20261) atau nama semester..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tipe Semester */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Tipe Semester</option>
              <option value="Gasal">Semester Gasal</option>
              <option value="Genap">Semester Genap</option>
              <option value="Pendek">Semester Pendek / Antara</option>
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status Portal</option>
              <option value="Buka">Buka (Aktif)</option>
              <option value="Terkunci">Terkunci</option>
              <option value="Selesai">Selesai (Arsip)</option>
            </select>

            {(searchQuery || typeFilter !== 'Semua' || statusFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table of Semesters */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Kode & Nama Semester */}
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kode semester"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kode & Nama Semester</span>
                      {sortField === 'code' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Tahun Akademik */}
                  <th
                    onClick={() => handleSort('academicYear')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tahun akademik"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tahun Ajaran</span>
                      {sortField === 'academicYear' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Periode Perkuliahan */}
                  <th
                    onClick={() => handleSort('startDate')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan masa perkuliahan"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Masa Perkuliahan</span>
                      {sortField === 'startDate' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Periode KRS */}
                  <th
                    onClick={() => handleSort('krsStartDate')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan periode KRS"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Periode KRS</span>
                      {sortField === 'krsStartDate' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Batas Nilai */}
                  <th
                    onClick={() => handleSort('gradeDeadline')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan deadline nilai"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Batas Entri Nilai</span>
                      {sortField === 'gradeDeadline' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Kunci Nilai */}
                  <th className="py-3.5 px-4 text-center">Status Nilai</th>

                  {/* Status Semester */}
                  <th className="py-3.5 px-4 text-center">Status Sistem</th>

                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin" />
                        <p className="font-semibold text-sm text-slate-700">Memuat data periode semester...</p>
                        <p className="text-xs text-slate-400">Sinkronisasi status masa perkuliahan dan penguncian nilai</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedSemesters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada periode semester ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedSemesters.map((s) => (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        s.isActive ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`font-mono text-xs font-black px-2 py-1 rounded-lg border shrink-0 mt-0.5 ${
                              s.isActive
                                ? 'bg-[#1E3A8A] text-white border-[#D4A017]'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {s.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 leading-snug">
                              <span>{s.name}</span>
                              {s.isActive && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{s.notes}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-slate-800 text-xs">{s.academicYear}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold block w-fit mt-0.5 ${
                            s.type === 'Gasal'
                              ? 'bg-blue-100 text-[#1E3A8A]'
                              : s.type === 'Genap'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.type}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {s.startDate} <span className="text-slate-400 font-normal">s/d</span> {s.endDate}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-semibold text-slate-700">
                          {s.krsStartDate} <span className="text-slate-400 font-normal">s/d</span> {s.krsEndDate}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-rose-600 font-bold">
                        {s.gradeDeadline}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleGradeLock(s.id, s.name, s.isGradeLocked)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            s.isGradeLocked
                              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Klik untuk membuka/mengunci input nilai dosen"
                        >
                          {s.isGradeLocked ? <Lock className="w-3 h-3 text-slate-500" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
                          <span>{s.isGradeLocked ? 'Terkunci' : 'Terbuka'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Aktif Berjalan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveSemester(s.id, s.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1E3A8A] border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                            title="Aktifkan semester ini"
                          >
                            <Check className="w-3 h-3" />
                            <span>Set Aktif</span>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Periode Semester"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            disabled={s.isActive}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title={s.isActive ? 'Tidak dapat menghapus semester aktif' : 'Hapus Semester'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredSemesters.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredSemesters.length)} dari {filteredSemesters.length} semester
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Tambah / Edit Semester */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSemester ? 'Edit Periode Semester' : 'Tambah Semester Baru'}
          subtitle="Siklus kalender operasional Institut Teknologi Nusantara"
          icon={<Clock className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Semester (DIKTI) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20261"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Ajaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026/2027"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Semester <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Semester Gasal 2026/2027"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold text-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Semester</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as SemesterPeriodItem['type'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Gasal">Semester Gasal</option>
                      <option value="Genap">Semester Genap</option>
                      <option value="Pendek">Semester Antara / Pendek</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mulai Perkuliahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selesai Perkuliahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mulai Pengisian KRS <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.krsStartDate}
                      onChange={(e) => setFormData({ ...formData, krsStartDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Batas Akhir Validasi KRS <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.krsEndDate}
                      onChange={(e) => setFormData({ ...formData, krsEndDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Akhir Input Nilai Dosen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.gradeDeadline}
                    onChange={(e) => setFormData({ ...formData, gradeDeadline: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Jadikan Semester Aktif Berjalan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Portal mahasiswa dan dosen akan otomatis mengacu pada semester ini.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingSemester ? 'Simpan Perubahan' : 'Tambah Semester'}</span>
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
