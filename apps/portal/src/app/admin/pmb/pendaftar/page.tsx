'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  X,
  Building2,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { AdmissionApplicantItem } from '@siakad/types';

export default function PendaftarPage() {
  const [applicants, setApplicants] = useState<AdmissionApplicantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterProdi, setFilterProdi] = useState<string>('ALL');
  const [filterJalur, setFilterJalur] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Modal
  const [statusUpdateApplicant, setStatusUpdateApplicant] = useState<AdmissionApplicantItem | null>(null);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('VERIFIED');
  const [updateNotesVal, setUpdateNotesVal] = useState<string>('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Custom Confirm/Alert Dialog State
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
    onConfirm?: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
  });

  // New Applicant Form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highSchool: '',
    chosenStudyProgram: 'Teknik Informatika (S1)',
    jalurPendaftaran: 'Jalur Reguler',
    notes: '',
  });

  const apiBase = getApiBaseUrl();

  const fetchApplicants = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants?limit=1000`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json.data?.data)
          ? json.data.data
          : [];
        setApplicants(list);
      } else {
        throw new Error('Gagal memuat data pendaftar dari server.');
      }
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const filteredApplicants = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return applicants.filter((item) => {
      const matchSearch =
        !term ||
        item.fullName.toLowerCase().includes(term) ||
        item.registrationNumber.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.phone && item.phone.toLowerCase().includes(term)) ||
        (item.chosenStudyProgram && item.chosenStudyProgram.toLowerCase().includes(term)) ||
        (item.jalurPendaftaran && item.jalurPendaftaran.toLowerCase().includes(term)) ||
        (item.highSchool && item.highSchool.toLowerCase().includes(term));

      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchProdi = filterProdi === 'ALL' || item.chosenStudyProgram === filterProdi;
      const matchJalur = filterJalur === 'ALL' || item.jalurPendaftaran === filterJalur;

      return matchSearch && matchStatus && matchProdi && matchJalur;
    });
  }, [applicants, searchQuery, filterStatus, filterProdi, filterJalur]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterProdi, filterJalur]);

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApplicants.slice(start, start + itemsPerPage);
  }, [filteredApplicants, currentPage, itemsPerPage]);

  const startIndex = filteredApplicants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredApplicants.length);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const uniqueProdis = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      if (a.chosenStudyProgram) set.add(a.chosenStudyProgram);
    });
    return Array.from(set);
  }, [applicants]);

  const uniqueJalur = useMemo(() => {
    const set = new Set<string>();
    applicants.forEach((a) => {
      if (a.jalurPendaftaran) set.add(a.jalurPendaftaran);
    });
    return Array.from(set);
  }, [applicants]);

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setDialogState({
        isOpen: true,
        title: 'Formulir Belum Lengkap',
        message: 'Mohon lengkapi Nama Lengkap, Email, dan Nomor Telepon pendaftar.',
        type: 'warning',
        isAlert: true,
        confirmText: 'Mengerti',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        highSchool: formData.highSchool.trim() || 'SMA/SMK Sederajat',
        chosenStudyProgram: formData.chosenStudyProgram,
        jalurPendaftaran: formData.jalurPendaftaran,
        notes: formData.notes.trim() || undefined,
      };

      const res = await fetch(`${apiBase}/admissions/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menambahkan pendaftar baru.');
      }

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        highSchool: '',
        chosenStudyProgram: 'Teknik Informatika (S1)',
        jalurPendaftaran: 'Jalur Reguler',
        notes: '',
      });
      setAddModalOpen(false);
      await fetchApplicants();
      setDialogState({
        isOpen: true,
        title: 'Pendaftar Berhasil Ditambahkan',
        message: 'Data calon mahasiswa baru telah berhasil disimpan ke database.',
        type: 'success',
        isAlert: true,
        confirmText: 'Selesai',
      });
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Menambahkan Pendaftar',
        message: err.message || 'Terjadi kesalahan sistem saat menyimpan data.',
        type: 'danger',
        isAlert: true,
        confirmText: 'Tutup',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusModal = (applicant: AdmissionApplicantItem) => {
    setStatusUpdateApplicant(applicant);
    setUpdateStatusVal(applicant.status);
    setUpdateNotesVal(applicant.notes || '');
    setStatusModalOpen(true);
  };

  const handleSaveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateApplicant) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        status: updateStatusVal,
        notes: updateNotesVal.trim() || undefined,
      };

      const res = await fetch(`${apiBase}/admissions/applicants/${statusUpdateApplicant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal memperbarui status pendaftar.');
      }

      setStatusModalOpen(false);
      setStatusUpdateApplicant(null);
      await fetchApplicants();
      setDialogState({
        isOpen: true,
        title: 'Status Berhasil Diperbarui',
        message: 'Perubahan status pendaftar telah tersimpan ke sistem.',
        type: 'success',
        isAlert: true,
        confirmText: 'Selesai',
      });
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Memperbarui Status',
        message: err.message || 'Gagal memperbarui status pendaftar.',
        type: 'danger',
        isAlert: true,
        confirmText: 'Tutup',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplicant = (id: string, name: string) => {
    setDialogState({
      isOpen: true,
      title: 'Hapus Data Pendaftar?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data calon mahasiswa <strong className="text-slate-900 font-bold">&quot;{name}&quot;</strong>? Tindakan ini permanen dan tidak dapat dibatalkan.
        </span>
      ),
      type: 'danger',
      confirmText: 'Ya, Hapus Pendaftar',
      cancelText: 'Batal',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/admissions/applicants/${id}`, {
            method: 'DELETE',
          });
          if (res.ok) {
            setApplicants((prev) => prev.filter((item) => item.id !== id));
            setDialogState((prev) => ({ ...prev, isOpen: false }));
          } else {
            const errData = await res.json().catch(() => ({}));
            setDialogState({
              isOpen: true,
              title: 'Gagal Menghapus Data',
              message: errData.message || 'Gagal menghapus data pendaftar.',
              type: 'danger',
              isAlert: true,
            });
          }
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Terjadi Kendala',
            message: err.message || 'Terjadi kendala saat menghapus data pendaftar.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  const handleExportCsv = () => {
    if (filteredApplicants.length === 0) return;
    const headers = ['No Registrasi', 'Nama Lengkap', 'Email', 'Telepon', 'Asal Sekolah', 'Program Studi', 'Jalur', 'Status'];
    const rows = filteredApplicants.map((a) => [
      `"${a.registrationNumber}"`,
      `"${a.fullName}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.highSchool || '-'}"`,
      `"${a.chosenStudyProgram}"`,
      `"${a.jalurPendaftaran}"`,
      `"${a.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_pendaftar_pmb_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return (
          <span className="text-amber-800 bg-amber-50 border border-amber-200/90 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            Menunggu Pembayaran
          </span>
        );
      case 'VERIFYING_PAYMENT':
        return (
          <span className="text-blue-800 bg-blue-50 border border-blue-200/90 px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
            Verifikasi Pembayaran Form
          </span>
        );
      case 'VERIFYING_RE_REGISTRATION':
        return (
          <span className="text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs animate-pulse whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
            Verifikasi Daftar Ulang
          </span>
        );
      case 'PENDING':
        return (
          <span className="text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            Menunggu Verifikasi Berkas
          </span>
        );
      case 'VERIFIED':
        return <span className="text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">Berkas Valid</span>;
      case 'PASSED':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">Lolos Seleksi</span>;
      case 'FAILED':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">Tidak Lolos</span>;
      case 'REGISTERED':
        return <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md text-xs font-extrabold whitespace-nowrap">Mahasiswa Diterima</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="pmb"
      activeMenuHref="/admin/pmb/pendaftar"
    >
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Calon Mahasiswa Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direktori seluruh pendaftar PMB tahun akademik berjalan beserta status seleksi dan data kontak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={fetchApplicants}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan'}</span>
            </button>

            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Calon Mahasiswa</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={fetchApplicants} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor registrasi, nama, email, no telepon, asal sekolah, prodi..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Bersihkan pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="ALL">Semua Status</option>
                <option value="UNPAID">Menunggu Pembayaran</option>
                <option value="VERIFYING_PAYMENT">Verifikasi Pembayaran Form</option>
                <option value="VERIFYING_RE_REGISTRATION">Verifikasi Daftar Ulang</option>
                <option value="PENDING">Menunggu Verifikasi Berkas</option>
                <option value="VERIFIED">Berkas Valid</option>
                <option value="PASSED">Lolos Seleksi</option>
                <option value="REGISTERED">Mahasiswa Diterima</option>
                <option value="FAILED">Tidak Lolos</option>
              </select>

              <select
                value={filterProdi}
                onChange={(e) => setFilterProdi(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 max-w-[200px]"
              >
                <option value="ALL">Semua Program Studi</option>
                {uniqueProdis.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filterJalur}
                onChange={(e) => setFilterJalur(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 max-w-[180px]"
              >
                <option value="ALL">Semua Jalur</option>
                {uniqueJalur.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>

              {(searchQuery || filterStatus !== 'ALL' || filterProdi !== 'ALL' || filterJalur !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('ALL');
                    setFilterProdi('ALL');
                    setFilterJalur('ALL');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-xl transition-colors inline-flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                Menampilkan <strong className="text-slate-900">{startIndex}</strong> - <strong className="text-slate-900">{endIndex}</strong> dari <strong className="text-slate-900">{filteredApplicants.length}</strong> pendaftar
                {filteredApplicants.length !== applicants.length && (
                  <span className="text-slate-400 text-[11px] ml-1.5">
                    (difilter dari total {applicants.length} pendaftar)
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">No. Registrasi</th>
                  <th className="py-3 px-4 min-w-[180px]">Nama Pendaftar</th>
                  <th className="py-3 px-4 min-w-[160px]">Program Studi</th>
                  <th className="py-3 px-4 whitespace-nowrap">Jalur Seleksi</th>
                  <th className="py-3 px-4 whitespace-nowrap">Asal Sekolah</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap min-w-[190px]">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      <span>Memuat data pendaftar...</span>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Tidak ada pendaftar yang cocok.</p>
                      <p className="text-[11px] mt-1 text-slate-400">Coba sesuaikan kata kunci pencarian atau reset filter status Anda.</p>
                      {(searchQuery || filterStatus !== 'ALL' || filterProdi !== 'ALL' || filterJalur !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterStatus('ALL');
                            setFilterProdi('ALL');
                            setFilterJalur('ALL');
                          }}
                          className="mt-3 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <Link
                          href={`/admin/pmb/pendaftar/${item.id}`}
                          className="hover:underline hover:text-blue-900 transition-colors"
                        >
                          {item.registrationNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <Link
                          href={`/admin/pmb/pendaftar/${item.id}`}
                          className="group block"
                        >
                          <div className="group-hover:text-blue-700 transition-colors">{item.fullName}</div>
                          <div className="text-[11px] text-slate-400">{item.email}</div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {item.chosenStudyProgram}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.jalurPendaftaran}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.highSchool || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatus(item.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/pmb/pendaftar/${item.id}`}
                            title="Lihat Detail Lengkap Calon Mahasiswa"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenStatusModal(item)}
                            title="Ubah Status"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteApplicant(item.id, item.fullName)}
                            title="Hapus Data"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value={10}>10 baris</option>
                  <option value={20}>20 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                </select>
              </div>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-600">
                Menampilkan <strong className="text-slate-900">{startIndex}</strong> - <strong className="text-slate-900">{endIndex}</strong> dari <strong className="text-slate-900">{filteredApplicants.length}</strong> pendaftar
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Halaman Pertama"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="Halaman Sebelumnya"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                      currentPage === num
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="Halaman Selanjutnya"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Halaman Terakhir"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Calon Mahasiswa */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 !m-0">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Tambah Calon Mahasiswa Baru</h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApplicant} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: Muhammad Rizky Pratama"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@pendaftar.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="081234567890"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    value={formData.highSchool}
                    onChange={(e) => setFormData({ ...formData, highSchool: e.target.value })}
                    placeholder="SMA Negeri 1 Jakarta / SMK Telkom"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program Studi Pilihan</label>
                    <select
                      value={formData.chosenStudyProgram}
                      onChange={(e) => setFormData({ ...formData, chosenStudyProgram: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      <option value="Teknik Informatika (S1)">Teknik Informatika (S1)</option>
                      <option value="Sistem Informasi (S1)">Sistem Informasi (S1)</option>
                      <option value="Teknik Mesin (S1)">Teknik Mesin (S1)</option>
                      <option value="Teknik Elektro (S1)">Teknik Elektro (S1)</option>
                      <option value="Bisnis Digital (S1)">Bisnis Digital (S1)</option>
                      <option value="Manajemen (S1)">Manajemen (S1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jalur Seleksi</label>
                    <select
                      value={formData.jalurPendaftaran}
                      onChange={(e) => setFormData({ ...formData, jalurPendaftaran: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                    >
                      <option value="Jalur Reguler">Jalur Reguler</option>
                      <option value="Jalur Prestasi Nilai Rapor">Jalur Prestasi Nilai Rapor</option>
                      <option value="Jalur Prestasi Kemitraan">Jalur Prestasi Kemitraan</option>
                      <option value="Jalur Alih Jenjang (Transfer)">Jalur Alih Jenjang (Transfer)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Panitia (Opsional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Misal: Berkas ijazah lengkap"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172554] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Calon Mahasiswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Ubah Status */}
        {statusModalOpen && statusUpdateApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 !m-0">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Perbarui Status Pendaftar</h3>
                <button
                  onClick={() => setStatusModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStatusUpdate} className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="font-bold text-slate-900">{statusUpdateApplicant.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{statusUpdateApplicant.registrationNumber}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Seleksi</label>
                  <select
                    value={updateStatusVal}
                    onChange={(e) => setUpdateStatusVal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
                  >
                    <option value="UNPAID">UNPAID - Menunggu Pembayaran</option>
                    <option value="VERIFYING_PAYMENT">VERIFYING_PAYMENT - Verifikasi Pembayaran</option>
                    <option value="PENDING">PENDING - Menunggu Verifikasi Berkas</option>
                    <option value="VERIFIED">VERIFIED - Berkas Valid</option>
                    <option value="PASSED">PASSED - Dinyatakan Lolos</option>
                    <option value="FAILED">FAILED - Tidak Lolos</option>
                    <option value="REGISTERED">REGISTERED - Mahasiswa Diterima</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catatan Verifikator / Panitia</label>
                  <textarea
                    rows={2}
                    value={updateNotesVal}
                    onChange={(e) => setUpdateNotesVal(e.target.value)}
                    placeholder="Catatan tambahan hasil seleksi..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirm & Alert Modal */}
        <ConfirmModal
          isOpen={dialogState.isOpen}
          onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={dialogState.onConfirm}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          isAlert={dialogState.isAlert}
        />
    </PortalLayout>
  );
}
