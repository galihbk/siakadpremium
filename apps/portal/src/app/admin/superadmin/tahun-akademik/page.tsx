'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
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
  Users,
  Award,
  Layers,
  Check,
  Radio,
  FileText,
} from 'lucide-react';

interface AcademicYearItem {
  id: string;
  code: string;
  yearName: string;
  startDate: string;
  endDate: string;
  pmbStartDate: string;
  pmbEndDate: string;
  semestersAvailable: string[];
  studentsCount: number;
  skRektor: string;
  isActive: boolean;
  status: 'Aktif' | 'Arsip' | 'Mendatang';
  notes: string;
}

const initialYears: AcademicYearItem[] = [
  {
    id: 'ay-1',
    code: '2026',
    yearName: '2026/2027',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    pmbStartDate: '2026-01-05',
    pmbEndDate: '2026-07-25',
    semestersAvailable: ['Gasal (Aktif)', 'Genap', 'Pendek'],
    studentsCount: 8540,
    skRektor: 'SK Rektor No. 042/ITN/R/2026',
    isActive: true,
    status: 'Aktif',
    notes: 'Tahun akademik berjalan untuk seluruh program studi sarjana dan vokasi terpadu ITN.',
  },
  {
    id: 'ay-2',
    code: '2025',
    yearName: '2025/2026',
    startDate: '2025-08-01',
    endDate: '2026-07-31',
    pmbStartDate: '2025-01-10',
    pmbEndDate: '2025-07-28',
    semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
    studentsCount: 8120,
    skRektor: 'SK Rektor No. 038/ITN/R/2025',
    isActive: false,
    status: 'Arsip',
    notes: 'Telah tuntas 100%. Pelaporan Feeder PDDIKTI Gasal, Genap, dan Pendek selesai terverifikasi.',
  },
  {
    id: 'ay-3',
    code: '2024',
    yearName: '2024/2025',
    startDate: '2024-08-01',
    endDate: '2025-07-31',
    pmbStartDate: '2024-01-15',
    pmbEndDate: '2024-07-30',
    semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
    studentsCount: 7650,
    skRektor: 'SK Rektor No. 029/ITN/R/2024',
    isActive: false,
    status: 'Arsip',
    notes: 'Arsip akademik. Kurikulum OBE 2024 pertama kali diterapkan secara masif pada angkatan ini.',
  },
  {
    id: 'ay-4',
    code: '2023',
    yearName: '2023/2024',
    startDate: '2023-08-01',
    endDate: '2024-07-31',
    pmbStartDate: '2023-01-10',
    pmbEndDate: '2023-07-25',
    semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
    studentsCount: 7100,
    skRektor: 'SK Rektor No. 018/ITN/R/2023',
    isActive: false,
    status: 'Arsip',
    notes: 'Arsip riwayat akademik dan pelaporan nilai kelulusan angkatan 2019/2020.',
  },
  {
    id: 'ay-5',
    code: '2022',
    yearName: '2022/2023',
    startDate: '2022-08-01',
    endDate: '2023-07-31',
    pmbStartDate: '2022-01-08',
    pmbEndDate: '2022-07-20',
    semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
    studentsCount: 6580,
    skRektor: 'SK Rektor No. 012/ITN/R/2022',
    isActive: false,
    status: 'Arsip',
    notes: 'Arsip data historis akademik sistem SIAKAD kampus ITN.',
  },
  {
    id: 'ay-6',
    code: '2027',
    yearName: '2027/2028',
    startDate: '2027-08-01',
    endDate: '2028-07-31',
    pmbStartDate: '2027-01-04',
    pmbEndDate: '2027-07-24',
    semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
    studentsCount: 0,
    skRektor: 'Draft SK Rektor 2027',
    isActive: false,
    status: 'Mendatang',
    notes: 'Perencanaan kuota daya tampung penerimaan mahasiswa baru (PMB 2027).',
  },
];

export default function SuperAdminTahunAkademikPage() {
  const [years, setYears] = useState<AcademicYearItem[]>(initialYears);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYearItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    yearName: string;
    startDate: string;
    endDate: string;
    pmbStartDate: string;
    pmbEndDate: string;
    studentsCount: number;
    skRektor: string;
    isActive: boolean;
    notes: string;
  }>({
    code: '',
    yearName: '',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    pmbStartDate: '2026-01-05',
    pmbEndDate: '2026-07-25',
    studentsCount: 0,
    skRektor: 'SK Rektor No. .../ITN/R/2026',
    isActive: false,
    notes: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
  }, [searchQuery, statusFilter]);

  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const matchSearch =
        y.yearName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.skRektor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'Semua' || y.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [years, searchQuery, statusFilter]);

  const sortedYears = useMemo(() => {
    return [...filteredYears].sort((a, b) => {
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
  }, [filteredYears, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedYears.length / itemsPerPage));
  const paginatedYears = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedYears.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedYears, currentPage, itemsPerPage]);

  const activeYear = useMemo(() => years.find((y) => y.isActive), [years]);

  const metrics = useMemo(() => {
    const totalTA = years.length;
    const activeStudents = activeYear ? activeYear.studentsCount : 0;
    const archiveCount = years.filter((y) => y.status === 'Arsip').length;
    return { totalTA, activeStudents, archiveCount };
  }, [years, activeYear]);

  const handleSetActive = (id: string, yearName: string) => {
    if (confirm(`Jadikan tahun akademik "${yearName}" sebagai tahun akademik AKTIF kampus? Seluruh sistem registrasi dan KRS akan mengacu pada tahun ajaran ini.`)) {
      setYears((prev) =>
        prev.map((y) => ({
          ...y,
          isActive: y.id === id,
          status: y.id === id ? 'Aktif' : y.status === 'Aktif' ? 'Arsip' : y.status,
        }))
      );
      showToast(`Tahun akademik "${yearName}" sekarang aktif sebagai acuan sistem.`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingYear(null);
    setFormData({
      code: '2028',
      yearName: '2028/2029',
      startDate: '2028-08-01',
      endDate: '2029-07-31',
      pmbStartDate: '2028-01-05',
      pmbEndDate: '2028-07-25',
      studentsCount: 0,
      skRektor: 'SK Rektor No. .../ITN/R/2028',
      isActive: false,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (y: AcademicYearItem) => {
    setEditingYear(y);
    setFormData({
      code: y.code,
      yearName: y.yearName,
      startDate: y.startDate,
      endDate: y.endDate,
      pmbStartDate: y.pmbStartDate,
      pmbEndDate: y.pmbEndDate,
      studentsCount: y.studentsCount,
      skRektor: y.skRektor,
      isActive: y.isActive,
      notes: y.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingYear) {
      setYears((prev) =>
        prev.map((y) =>
          y.id === editingYear.id
            ? {
                ...y,
                ...formData,
                studentsCount: Number(formData.studentsCount),
                status: formData.isActive ? 'Aktif' : y.status,
              }
            : formData.isActive
              ? { ...y, isActive: false, status: y.isActive ? 'Arsip' : y.status }
              : y
        )
      );
      showToast(`Tahun akademik "${formData.yearName}" berhasil diperbarui.`);
    } else {
      const newYear: AcademicYearItem = {
        id: `ay-${Date.now()}`,
        ...formData,
        semestersAvailable: ['Gasal', 'Genap', 'Pendek'],
        studentsCount: Number(formData.studentsCount),
        status: formData.isActive ? 'Aktif' : 'Mendatang',
      };

      setYears((prev) =>
        formData.isActive
          ? [newYear, ...prev.map((y) => ({ ...y, isActive: false, status: y.isActive ? 'Arsip' : y.status }))]
          : [newYear, ...prev]
      );
      showToast(`Tahun akademik baru "${formData.yearName}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    const targetYear = years.find((y) => y.id === id);
    if (targetYear?.isActive) {
      alert('Tidak dapat menghapus tahun akademik yang sedang AKTIF!');
      return;
    }

    if (confirm(`Hapus data tahun akademik "${name}"?`)) {
      setYears((prev) => prev.filter((y) => y.id !== id));
      showToast(`Tahun akademik "${name}" berhasil dihapus.`);
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
              <span className="text-[#1E3A8A] font-bold">Tahun Akademik</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Tahun Akademik</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Pengaturan tahun ajaran utama, status keaktifan sistemik, periode registrasi, dan arsip data historis ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/semester"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Kelola Semester</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Tahun Akademik</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Akademik Aktif</p>
              <h3 className="text-2xl font-black text-[#1E3A8A] mt-1">{activeYear ? activeYear.yearName : '-'}</h3>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Acuan Sistem Berjalan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tahun Ajaran</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalTA} Periode</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Master data kurun waktu</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mahasiswa Terdaftar</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {metrics.activeStudents.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Mahasiswa aktif di TA berjalan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Arsip Historis</p>
              <h3 className="text-2xl font-black text-slate-700 mt-1">{metrics.archiveCount} Periode</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tersimpan aman di database</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tahun ajaran (contoh: 2026/2027) atau nomor SK Rektor..."
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

          <div className="flex items-center gap-2.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif Saja</option>
              <option value="Arsip">Arsip</option>
              <option value="Mendatang">Mendatang</option>
            </select>
          </div>
        </div>

        {/* Table of Academic Years */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Tahun Akademik */}
                  <th
                    onClick={() => handleSort('yearName')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tahun akademik"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kode & Tahun Akademik</span>
                      {sortField === 'yearName' ? (
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

                  {/* Sort: Periode Tanggal */}
                  <th
                    onClick={() => handleSort('startDate')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tanggal pelaksanaan"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Periode Pelaksanaan</span>
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

                  <th className="py-3.5 px-4">Semester Tersedia</th>

                  {/* Sort: Mahasiswa Terdaftar */}
                  <th
                    onClick={() => handleSort('studentsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan mahasiswa terdaftar"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Mahasiswa Terdaftar</span>
                      {sortField === 'studentsCount' ? (
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

                  {/* Sort: SK Rektor */}
                  <th
                    onClick={() => handleSort('skRektor')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan SK penetapan"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dasar Hukum (SK Rektor)</span>
                      {sortField === 'skRektor' ? (
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

                  {/* Sort: Status */}
                  <th
                    onClick={() => handleSort('isActive')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan status keaktifan"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status Sistem</span>
                      {sortField === 'isActive' ? (
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

                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedYears.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada tahun akademik ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedYears.map((y) => (
                    <tr
                      key={y.id}
                      className={`transition-colors ${
                        y.isActive ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                              y.isActive
                                ? 'bg-[#1E3A8A] text-white border-[#D4A017] shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {y.code}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{y.yearName}</span>
                              {y.isActive && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{y.notes}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-xs font-bold text-slate-800">
                          {y.startDate} <span className="text-slate-400 font-normal">s/d</span> {y.endDate}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          PMB: {y.pmbStartDate} s/d {y.pmbEndDate}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {y.semestersAvailable.map((sem, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                sem.includes('Aktif')
                                  ? 'bg-[#1E3A8A] text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sem}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-slate-900 text-sm">
                          {y.studentsCount > 0 ? y.studentsCount.toLocaleString('id-ID') : '-'}
                        </span>
                        {y.studentsCount > 0 && <span className="text-[10px] text-slate-400 block">Mahasiswa</span>}
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-xs font-mono font-medium text-slate-700 line-clamp-1">{y.skRektor}</p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {y.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sedang Berjalan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(y.id, y.yearName)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#1E3A8A] border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                            title="Aktifkan tahun ajaran ini"
                          >
                            <Check className="w-3 h-3" />
                            <span>Set Aktif</span>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href="/admin/superadmin/semester"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Semester"
                          >
                            <Clock className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(y)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Tahun Akademik"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(y.id, y.yearName)}
                            disabled={y.isActive}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors cursor-pointer"
                            title={y.isActive ? 'Tidak dapat menghapus tahun aktif' : 'Hapus Tahun Akademik'}
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
                &bull; Menampilkan {Math.min(filteredYears.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredYears.length)} dari {filteredYears.length} tahun ajaran
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

        {/* Modal: Tambah / Edit Tahun Akademik */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingYear ? 'Edit Tahun Akademik' : 'Tambah Tahun Akademik Baru'}
          subtitle="Master kalender tahun ajaran Institut Teknologi Nusantara"
          icon={<Calendar className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Tahun Ajaran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Tahun Akademik <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026/2027"
                      value={formData.yearName}
                      onChange={(e) => setFormData({ ...formData, yearName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold text-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tanggal Mulai Tahun Ajaran <span className="text-rose-500">*</span>
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
                      Tanggal Berakhir Tahun Ajaran <span className="text-rose-500">*</span>
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
                      Mulai Periode PMB Baru
                    </label>
                    <input
                      type="date"
                      value={formData.pmbStartDate}
                      onChange={(e) => setFormData({ ...formData, pmbStartDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selesai Periode PMB Baru
                    </label>
                    <input
                      type="date"
                      value={formData.pmbEndDate}
                      onChange={(e) => setFormData({ ...formData, pmbEndDate: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor SK Rektor Penetapan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SK Rektor No. 042/ITN/R/2026"
                    value={formData.skRektor}
                    onChange={(e) => setFormData({ ...formData, skRektor: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan TA</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan kebijakan akademik tahun ajaran ini..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Jadikan Tahun Akademik Aktif Sistem</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tahun akademik lain otomatis dialihkan menjadi status arsip historis.
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
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs"
                  >
                    {editingYear ? 'Simpan Perubahan' : 'Tambah Tahun Akademik'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
