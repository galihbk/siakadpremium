'use client';

import { confirmDialog } from '@/components/ui/ConfirmHost';

import { useInstitution } from '@/lib/useInstitution';
import { CampusLogo } from '@/components/common/CampusLogo';
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  departmentOptions,
  categoryOptions,
  employmentStatusOptions,
  type PegawaiItem,
} from '@/components/sdm/PegawaiForm';
import {
  Briefcase,
  Users,
  UserCheck,
  Search,
  Plus,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Award,
  IdCard,
  QrCode,
  Sparkles,
  Filter,
  Eye,
  Calendar,
  Layers,
  ShieldCheck,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Check,
  Clock,
} from 'lucide-react';

export default function SdmPegawaiPage() {
  const inst = useInstitution();
  const [employees, setEmployees] = useState<PegawaiItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua Kategori');
  const [departmentFilter, setDepartmentFilter] = useState('Semua Unit');
  const [employmentFilter, setEmploymentFilter] = useState('Semua Status');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedIdCard, setSelectedIdCard] = useState<PegawaiItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeFilterCount =
    (categoryFilter !== 'Semua Kategori' ? 1 : 0) +
    (departmentFilter !== 'Semua Unit' ? 1 : 0) +
    (employmentFilter !== 'Semua Status' ? 1 : 0) +
    (statusFilter !== 'Semua' ? 1 : 0);

  const resetFilters = () => {
    setCategoryFilter('Semua Kategori');
    setDepartmentFilter('Semua Unit');
    setEmploymentFilter('Semua Status');
    setStatusFilter('Semua');
    setCurrentPage(1);
  };

  // Sorting & Pagination
  const [sortField, setSortField] = useState<keyof PegawaiItem>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch directly from PostgreSQL database
  const loadEmployeesFromDB = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/employees`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setEmployees(data);
          try {
            localStorage.setItem('siakad_pegawai_data', JSON.stringify(data));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat pegawai dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear old hardcoded localStorage if present
    try {
      const stored = localStorage.getItem('siakad_pegawai_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.id === 'peg-1')) {
          localStorage.removeItem('siakad_pegawai_data');
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          setEmployees(parsed);
        }
      }
    } catch {}

    loadEmployeesFromDB();
  }, []);

  const handleSort = (field: keyof PegawaiItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullDisplayName = `${emp.titlePrefix || ''} ${emp.fullName} ${emp.titleSuffix || ''}`.toLowerCase();
      const matchSearch =
        fullDisplayName.includes(searchQuery.toLowerCase()) ||
        (emp.nip && emp.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.nidn && emp.nidn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.nuptk && emp.nuptk.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.structuralPosition && emp.structuralPosition.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.functionalPosition && emp.functionalPosition.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === 'Semua Kategori' || emp.category === categoryFilter;
      const matchDepartment = departmentFilter === 'Semua Unit' || emp.department === departmentFilter;
      const matchEmployment = employmentFilter === 'Semua Status' || emp.employmentStatus === employmentFilter;
      const matchStatus = statusFilter === 'Semua' || emp.status === statusFilter;

      return matchSearch && matchCategory && matchDepartment && matchEmployment && matchStatus;
    });
  }, [employees, searchQuery, categoryFilter, departmentFilter, employmentFilter, statusFilter]);

  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return 0;
    });
  }, [filteredEmployees, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / itemsPerPage));
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedEmployees, currentPage, itemsPerPage]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = employees.length;
    const dosenCount = employees.filter((e) => e.category?.includes('Dosen')).length;
    const tendikCount = employees.filter((e) => !e.category?.includes('Dosen')).length;
    const pnsCount = employees.filter((e) => e.employmentStatus === 'PNS / ASN').length;
    const tetapCount = employees.filter((e) => e.employmentStatus === 'Tetap Yayasan').length;
    const aktifCount = employees.filter((e) => e.status === 'Aktif').length;
    return { total, dosenCount, tendikCount, pnsCount, tetapCount, aktifCount };
  }, [employees]);

  const handleDelete = async (id: string, name: string) => {
    if ((await confirmDialog(`Apakah Anda yakin ingin menghapus data pegawai "${name}" dari database?`))) {
      try {
        const res = await fetch(`${apiBase}/employees/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          showToast(`Data pegawai "${name}" telah dihapus dari database.`);
        }
      } catch (err) {
        console.warn('Gagal menghapus dari database:', err);
      }
      await loadEmployeesFromDB();
    }
  };

  const handleToggleActive = async (emp: PegawaiItem) => {
    const nextActive = emp.status !== 'Aktif';
    const nextStatus: PegawaiItem['status'] = nextActive ? 'Aktif' : 'Cuti';
    setTogglingId(emp.id);
    // Optimistic update -- langsung ubah tampilan, dibalikin lagi kalau request gagal.
    setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: nextStatus } : e)));
    try {
      const res = await fetch(`${apiBase}/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status keaktifan pegawai.');
    } catch (err) {
      console.warn(err);
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, status: emp.status } : e)));
    } finally {
      setTogglingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'NIP',
      'NIDN',
      'NUPTK',
      'Nama Lengkap',
      'Gelar Depan',
      'Gelar Belakang',
      'Jenis Kelamin',
      'Kategori',
      'Status Kepegawaian',
      'Unit Kerja',
      'Jabatan Struktural',
      'Jabatan Fungsional',
      'Pendidikan',
      'Email',
      'No. Telepon',
      'Tanggal Bergabung',
      'Status',
    ];
    const rows = filteredEmployees.map((e) => [
      `"${e.nip}"`,
      `"${e.nidn || '-'}"`,
      `"${e.nuptk || '-'}"`,
      `"${e.fullName}"`,
      `"${e.titlePrefix || '-'}"`,
      `"${e.titleSuffix || '-'}"`,
      `"${e.gender}"`,
      `"${e.category}"`,
      `"${e.employmentStatus}"`,
      `"${e.department}"`,
      `"${e.structuralPosition || '-'}"`,
      `"${e.functionalPosition || '-'}"`,
      `"${e.education}"`,
      `"${e.email}"`,
      `"${e.phone}"`,
      `"${e.joinDate}"`,
      `"${e.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_pegawai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data rekapitulasi pegawai berhasil diunduh (CSV).');
  };

  return (
    <PortalLayout
      role="sdm"
      userName="Dewi Lestari, S.Psi., M.M."
      userIdText="Kepala Biro SDM & Kepegawaian"
    >
      <div className="w-full space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
              <Link href="/admin/sdm" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">SDM</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-semibold">Kepegawaian (SDM)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-900/10 border border-[#D4A017]/30">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manajemen Pegawai & SDM Kampus</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pengelolaan biodata, jabatan fungsional/struktural, unit kerja, dan kartu identitas pegawai perguruan tinggi.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-[0.98]"
              title="Ekspor seluruh data pegawai yang difilter ke format Excel / CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all active:scale-[0.98]"
              title="Cetak ringkasan kepegawaian"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Laporan</span>
            </button>
            <Link
              href="/admin/sdm/pegawai/baru"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#1E3A8A] to-blue-700 hover:from-blue-900 hover:to-blue-800 rounded-xl shadow-sm shadow-blue-900/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pegawai Baru</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards / SDM Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Seluruh SDM</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <span className="text-xs text-emerald-600 font-medium">Pegawai Terdaftar</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Dosen, Tendik, IT & Tenaga Pendukung</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tenaga Kependidikan</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.tendikCount}</span>
              <span className="text-xs text-amber-600 font-medium">Staf & Tendik</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">BAAK, Keuangan, Laboran, IT, & Fasilitas</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dosen Pengajar</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.dosenCount}</span>
              <span className="text-xs text-purple-600 font-medium">Dosen Tetap & LB</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Tenaga pendidik terverifikasi PDDIKTI</p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status ASN / Tetap</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{stats.pnsCount + stats.tetapCount}</span>
              <span className="text-xs text-emerald-600 font-medium">{stats.pnsCount} ASN, {stats.tetapCount} Tetap</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Kepastian status kepegawaian institusi</p>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari berdasarkan NIP, NIDN/NUPTK, Nama, Jabatan, Unit, atau Email..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all placeholder:text-slate-400"
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

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter Data Pegawai"
          subtitle="Persempit daftar pegawai berdasarkan kriteria berikut"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Pegawai</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                {categoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Kerja / Fakultas</label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                {departmentOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                <select
                  value={employmentFilter}
                  onChange={(e) => {
                    setEmploymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  {employmentStatusOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                >
                  <option value="Semua">Semua Status Aktif</option>
                  <option value="Aktif">Aktif Bekerja</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Tugas Belajar">Tugas Belajar</option>
                  <option value="Pensiun">Pensiun</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={resetFilters}
                disabled={activeFilterCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Terapkan
              </button>
            </div>
          </div>
        </Modal>

        {/* Content Area: Table vs Grid View */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <div className="w-8 h-8 border-2 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-600">Memuat data pegawai & kepegawaian kampus...</p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                    <th
                      onClick={() => handleSort('fullName')}
                      className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                      title="Klik untuk mengurutkan nama"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Nama Pegawai & Identitas</span>
                        {sortField === 'fullName' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    {([
                      ['department', 'Unit Kerja'],
                      ['structuralPosition', 'Jabatan Struktural'],
                      ['functionalPosition', 'Jabatan Fungsional'],
                    ] as const).map(([field, label]) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                        title={`Klik untuk mengurutkan ${label.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{label}</span>
                          {sortField === field ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100" />
                          )}
                        </div>
                      </th>
                    ))}

                    <th
                      onClick={() => handleSort('category')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-center"
                      title="Klik untuk mengurutkan kategori"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Kategori</span>
                        {sortField === 'category' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('employmentStatus')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-center"
                      title="Klik untuk mengurutkan status kepegawaian"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Status Kepegawaian</span>
                        {sortField === 'employmentStatus' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    <th className="py-3.5 px-4 text-center">Kontak Resmi</th>

                    <th
                      onClick={() => handleSort('status')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group text-center"
                      title="Klik untuk mengurutkan status aktif"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Keaktifan</span>
                        {sortField === 'status' ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </div>
                    </th>

                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-sm">Tidak ada data pegawai yang sesuai</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Coba sesuaikan kata kunci pencarian atau reset filter di atas
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map((emp) => {
                      const displayName = `${emp.titlePrefix ? emp.titlePrefix + ' ' : ''}${emp.fullName}${
                        emp.titleSuffix ? ', ' + emp.titleSuffix : ''
                      }`;

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Nama & Identitas */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl}
                                    alt={emp.fullName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white font-black text-xs flex items-center justify-center border border-[#D4A017] shadow-xs">
                                    {emp.fullName.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span
                                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                    emp.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  title={emp.status}
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{displayName}</div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    NIP: {emp.nip}
                                  </span>
                                  {emp.nidn && (
                                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                      NIDN: {emp.nidn}
                                    </span>
                                  )}
                                  {emp.nuptk && (
                                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                                      NUPTK: {emp.nuptk}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400">({emp.gender})</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Unit Kerja */}
                          <td className="py-4 px-4">
                            <div className="text-xs text-slate-700 flex items-start gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="max-w-[16rem]">{emp.department}</span>
                            </div>
                            {emp.shiftName && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-indigo-600">
                                <Clock className="w-2.5 h-2.5" /> {emp.shiftName}
                              </span>
                            )}
                          </td>

                          {/* Jabatan Struktural */}
                          <td className="py-4 px-4">
                            {emp.structuralPosition ? (
                              <span className="font-semibold text-slate-800 text-xs">{emp.structuralPosition}</span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>

                          {/* Jabatan Fungsional */}
                          <td className="py-4 px-4">
                            {emp.functionalPosition ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {emp.functionalPosition}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </td>

                          {/* Kategori */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                emp.category.includes('Dosen')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : emp.category !== 'Tenaga Kependidikan'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {emp.category}
                            </span>
                          </td>

                          {/* Status Kepegawaian */}
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                emp.employmentStatus === 'PNS / ASN'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : emp.employmentStatus === 'Tetap Yayasan'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : emp.employmentStatus === 'Outsourcing (Alih Daya)'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {emp.employmentStatus}
                            </span>
                            {emp.vendorName && <div className="text-[10px] text-slate-500 mt-1 max-w-[10rem] mx-auto truncate" title={emp.vendorName}>{emp.vendorName}</div>}
                          </td>

                          {/* Kontak */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              {emp.email ? (
                                <a
                                  href={`mailto:${emp.email}`}
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  {emp.email}
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-300 flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> -
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {emp.phone}
                              </span>
                            </div>
                          </td>

                          {/* Keaktifan */}
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => handleToggleActive(emp)}
                              disabled={togglingId === emp.id}
                              title={emp.status === 'Aktif' ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                              className="inline-flex flex-col items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <span
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  emp.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                    emp.status === 'Aktif' ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">{emp.status}</span>
                            </button>
                          </td>

                          {/* Aksi */}
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedIdCard(emp)}
                                className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                                title="Lihat Kartu Pegawai Digital (ID Card)"
                              >
                                <IdCard className="w-4 h-4" />
                              </button>
                              <Link href={`/admin/sdm/pegawai/${emp.id}/edit`}
                                
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Biodata Pegawai"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(emp.id, emp.fullName)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Pegawai"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="py-3 px-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Menampilkan</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#1E3A8A]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>dari total {filteredEmployees.length} pegawai</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 font-semibold text-slate-700">
                  Halaman {currentPage} dari {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Grid / Card View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedEmployees.map((emp) => {
                const displayName = `${emp.titlePrefix ? emp.titlePrefix + ' ' : ''}${emp.fullName}${
                  emp.titleSuffix ? ', ' + emp.titleSuffix : ''
                }`;

                return (
                  <div
                    key={emp.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={emp.fullName}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white font-black text-sm flex items-center justify-center border border-[#D4A017] shadow-xs">
                              {emp.fullName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border mb-1 ${
                                emp.category.includes('Dosen')
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {emp.category}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">{displayName}</h3>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleActive(emp)}
                          disabled={togglingId === emp.id}
                          title={emp.status === 'Aktif' ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          className="inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              emp.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                emp.status === 'Aktif' ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </span>
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>NIP</span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{emp.nip}</span>
                        </div>
                        {emp.nidn && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>NIDN</span>
                            <span className="font-mono font-bold text-purple-700 text-[11px]">{emp.nidn}</span>
                          </div>
                        )}
                        {emp.nuptk && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>NUPTK</span>
                            <span className="font-mono font-bold text-purple-700 text-[11px]">{emp.nuptk}</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between text-slate-500 gap-2">
                          <span>Jabatan Struktural</span>
                          <span className="font-semibold text-slate-800 text-right">{emp.structuralPosition || '-'}</span>
                        </div>
                        <div className="flex items-start justify-between text-slate-500 gap-2">
                          <span>Jabatan Fungsional</span>
                          <span className="font-semibold text-slate-800 text-right">{emp.functionalPosition || '-'}</span>
                        </div>
                        <div className="flex items-start justify-between text-slate-500 gap-2">
                          <span>Unit Kerja</span>
                          <span className="text-slate-600 text-right text-[11px] truncate max-w-[180px]">
                            {emp.department}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Status</span>
                          <span className="font-semibold text-slate-700 text-[11px]">{emp.employmentStatus}</span>
                        </div>
                        {emp.shiftName && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Shift</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 text-[11px]">
                              <Clock className="w-2.5 h-2.5" /> {emp.shiftName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedIdCard(emp)}
                          className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat ID Card Digital"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>
                        <Link href={`/admin/sdm/pegawai/${emp.id}/edit`}
                          
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id, emp.fullName)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for Grid */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan {paginatedEmployees.length} dari total {filteredEmployees.length} pegawai</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Kartu Pegawai Digital (ID Card) */}
        {selectedIdCard && (
          <Modal
            isOpen={!!selectedIdCard}
            onClose={() => setSelectedIdCard(null)}
            title="Kartu Identitas Pegawai Digital"
            subtitle={`KTA resmi kepegawaian ${inst.campusName} berstandar smart card.`}
            icon={<IdCard className="w-5 h-5" />}
            maxWidth="md"
          >
            <div className="space-y-4">
              {/* Card Mockup Visual */}
              <div
                id="id-card-print-area"
                className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white rounded-2xl p-6 shadow-2xl border-2 border-[#D4A017] overflow-hidden"
              >
                {/* Gold geometric watermark */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017]/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none" />

                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5">
                    <CampusLogo url={inst.logoUrl} initials={inst.logoInitials} className="w-8 h-8 rounded-lg bg-[#D4A017] text-[#0F172A] font-black text-sm flex items-center justify-center shadow-sm shrink-0" />
                    <div>
                      <h4 className="font-extrabold text-xs tracking-wider uppercase text-white">
                        {inst.campusName}
                      </h4>
                      <p className="text-[9px] text-amber-300 font-medium">KARTU TANDA PEGAWAI RESMI</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-[#D4A017]" />
                </div>

                {/* Body Card */}
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative shrink-0">
                    {selectedIdCard.avatarUrl ? (
                      <img
                        src={selectedIdCard.avatarUrl}
                        alt={selectedIdCard.fullName}
                        className="w-20 h-24 rounded-xl object-cover border-2 border-[#D4A017] shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-24 rounded-xl bg-gradient-to-b from-blue-700 to-indigo-900 border-2 border-[#D4A017] flex items-center justify-center font-bold text-lg text-white">
                        {selectedIdCard.fullName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#D4A017] text-slate-950">
                      {selectedIdCard.category}
                    </span>
                    <h3 className="font-black text-sm text-white leading-tight">
                      {selectedIdCard.titlePrefix ? selectedIdCard.titlePrefix + ' ' : ''}
                      {selectedIdCard.fullName}
                      {selectedIdCard.titleSuffix ? ', ' + selectedIdCard.titleSuffix : ''}
                    </h3>
                    <p className="text-[10px] text-blue-200 font-medium line-clamp-2">
                      {selectedIdCard.position}
                    </p>
                    <p className="text-[9px] text-slate-300 line-clamp-1">{selectedIdCard.department}</p>
                  </div>
                </div>

                {/* Footer Card with Barcode / QR Info */}
                <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-mono">NOMOR INDUK PEGAWAI (NIP):</p>
                    <p className="text-xs font-mono font-black text-amber-300">{selectedIdCard.nip}</p>
                    {selectedIdCard.nidn && (
                      <p className="text-[9px] text-purple-300 font-mono">NIDN: {selectedIdCard.nidn}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-white p-1 rounded-lg flex items-center justify-center shadow-md">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIdCard(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak ID Card</span>
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
