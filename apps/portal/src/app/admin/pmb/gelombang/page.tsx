'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Search,
  Filter,
  Calendar,
  Layers,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { AdmissionBatchItem } from '@siakad/types';

interface BatchSummary {
  totalBatches: number;
  activeBatchName: string;
  totalQuota: number;
  totalApplicants: number;
}

export default function PmbGelombangPage() {
  const [batches, setBatches] = useState<AdmissionBatchItem[]>([]);
  const [summary, setSummary] = useState<BatchSummary>({
    totalBatches: 0,
    activeBatchName: '-',
    totalQuota: 0,
    totalApplicants: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenjang, setFilterJenjang] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [availableJenjang, setAvailableJenjang] = useState<string[]>(['Semua', 'D4', 'S1', 'S2', 'S3']);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dialog State (Custom Confirm & Alert)
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

  // Form Data with registrationFee & reRegistrationFee per gelombang
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2027/2028',
    jenjang: 'S1',
    startDate: '',
    endDate: '',
    status: 'OPEN' as 'OPEN' | 'UPCOMING' | 'CLOSED',
    quota: 100,
    registrationFee: 250000,
    reRegistrationFee: 7300000,
    description: '',
    isDefault: false,
  });

  const apiBaseUrl = getApiBaseUrl();

  const fetchBatches = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const resBatch = await fetch(`${apiBaseUrl}/admissions/batches`, { credentials: 'omit' });

      if (!resBatch.ok) {
        throw new Error('Gagal memuat data gelombang pendaftaran dari server.');
      }
      const json = await resBatch.json();
      const payload = json.data !== undefined ? json.data : json;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setBatches(list);

      // Ambil daftar jenjang langsung dari respon database API
      if (payload?.availableJenjang && Array.isArray(payload.availableJenjang)) {
        setAvailableJenjang(payload.availableJenjang);
      } else {
        const dynamicSet = new Set<string>();
        list.forEach((b: any) => {
          if (b.jenjang?.trim()) dynamicSet.add(b.jenjang.trim().toUpperCase());
        });
        if (dynamicSet.size === 0) ['S1', 'S2', 'S3', 'D4'].forEach((j) => dynamicSet.add(j));
        setAvailableJenjang(['Semua', ...Array.from(dynamicSet)]);
      }

      const summaryObj = payload?.summary || json.summary;
      if (summaryObj) {
        setSummary(summaryObj);
      }
    } catch (err: any) {
      setApiError(err.message || 'Terjadi gangguan saat memuat data gelombang.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    const sixtyDaysLater = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setFormData({
      name: `Gelombang ${batches.length + 1}`,
      academicYear: '2027/2028',
      jenjang: 'S1',
      startDate: today,
      endDate: sixtyDaysLater,
      status: 'OPEN',
      quota: 250,
      registrationFee: 250000,
      reRegistrationFee: 7300000,
      description: '',
      isDefault: batches.length === 0,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (batch: AdmissionBatchItem) => {
    setModalMode('edit');
    setEditingId(batch.id);
    setFormData({
      name: batch.name,
      academicYear: batch.academicYear,
      jenjang: batch.jenjang || 'S1',
      startDate: batch.startDate,
      endDate: batch.endDate,
      status: batch.status,
      quota: batch.quota || 100,
      registrationFee: Number(batch.registrationFee ?? 250000),
      reRegistrationFee: Number(batch.reRegistrationFee ?? 7300000),
      description: batch.description || '',
      isDefault: batch.isDefault,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      setFormError('Nama gelombang, tanggal buka, dan tanggal tutup wajib diisi.');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setFormError('Tanggal pembukaan tidak boleh melebihi tanggal penutupan.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const url =
        modalMode === 'create'
          ? `${apiBaseUrl}/admissions/batches`
          : `${apiBaseUrl}/admissions/batches/${editingId}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          academicYear: formData.academicYear.trim(),
          jenjang: formData.jenjang.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          quota: Number(formData.quota) || 100,
          registrationFee: Number(formData.registrationFee) || 0,
          reRegistrationFee: Number(formData.reRegistrationFee) || 0,
          description: formData.description?.trim() || null,
          isDefault: Boolean(formData.isDefault),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal menyimpan gelombang pendaftaran.');
      }

      setModalOpen(false);
      await fetchBatches();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateBatch = (id: string, name: string) => {
    setDialogState({
      isOpen: true,
      title: 'Aktifkan Gelombang PMB?',
      message: (
        <span>
          Jadikan periode pendaftaran <strong className="text-slate-900 font-bold">&quot;{name}&quot;</strong> sebagai gelombang aktif utama di portal penerimaan mahasiswa?
        </span>
      ),
      type: 'info',
      confirmText: 'Ya, Jadikan Utama',
      cancelText: 'Batal',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/admissions/batches/${id}/activate`, {
            method: 'PATCH',
          });
          if (!res.ok) throw new Error('Gagal mengaktifkan gelombang.');
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          await fetchBatches();
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Gagal Mengaktifkan Gelombang',
            message: err.message || 'Terjadi gangguan saat mengaktifkan gelombang.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  const handleDeleteBatch = (id: string, name: string) => {
    setDialogState({
      isOpen: true,
      title: 'Hapus Periode Pendaftaran?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus gelombang <strong className="text-slate-900 font-bold">&quot;{name}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
        </span>
      ),
      type: 'danger',
      confirmText: 'Ya, Hapus Gelombang',
      cancelText: 'Batal',
      isAlert: false,
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/admissions/batches/${id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Gagal menghapus gelombang.');
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          await fetchBatches();
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Gagal Menghapus Gelombang',
            message: err.message || 'Terjadi gangguan saat menghapus gelombang.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  // Filtered List
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (filterJenjang !== 'Semua' && (b.jenjang || 'S1') !== filterJenjang) return false;
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchYear = b.academicYear.toLowerCase().includes(q);
        const matchDesc = b.description?.toLowerCase().includes(q);
        return matchName || matchYear || matchDesc;
      }
      return true;
    });
  }, [batches, filterJenjang, filterStatus, searchQuery]);

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysRemaining = (endDateStr: string) => {
    try {
      const end = new Date(endDateStr);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) return { text: 'Telah Berakhir', isEnded: true, days: 0 };
      if (diff === 0) return { text: 'Hari Terakhir', isEnded: false, days: 0 };
      return { text: `${diff} hari lagi`, isEnded: false, days: diff };
    } catch {
      return { text: '-', isEnded: false, days: 0 };
    }
  };

  return (
    <PortalLayout
      role="pmb"
      activeMenuHref="/admin/pmb/gelombang"
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#1e40af] flex items-center justify-center text-white shadow-md shadow-blue-900/20 shrink-0">
              <CalendarDays className="w-6 h-6 text-amber-400" />
            </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Gelombang Pendaftaran PMB
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Kelola jadwal periode pendaftaran, kuota kursi, serta tarif Biaya Formulir Pendaftaran &amp; Biaya Daftar Ulang pada setiap gelombang.
                </p>
              </div>
            </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <Link
              href="/admin/pmb/biaya"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Monitoring Pembayaran</span>
            </Link>

            <button
              onClick={fetchBatches}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh Data dari Database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] text-white text-xs font-bold shadow-md shadow-blue-900/20 hover:from-[#172554] hover:to-[#1E3A8A] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Gelombang</span>
            </button>
          </div>
        </div>

        {/* ERROR NOTICE */}
        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-semibold">{apiError}</span>
            </div>
            <button
              onClick={fetchBatches}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-bold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* SUMMARY CARDS (4 METRICS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-[#1E3A8A]/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Gelombang</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">{summary.totalBatches}</span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Periode Terdaftar</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gelombang Aktif</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-base font-black text-emerald-700 truncate block">
                {summary.activeBatchName || '-'}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Total Kuota</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {summary.totalQuota.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Calon Mahasiswa</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pendaftar Masuk</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {summary.totalApplicants.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Formulir Terdata</span>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama gelombang, tahun akademik..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#1E3A8A] transition-colors"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 w-full md:w-auto">
                <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Jenjang:
                </span>
                {availableJenjang.map((j) => (
                  <button
                    key={j}
                    onClick={() => setFilterJenjang(j)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      filterJenjang === j
                        ? 'bg-white text-[#1E3A8A] shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {j}
                  </button>
                ))}
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="OPEN">Status: OPEN</option>
                <option value="UPCOMING">Status: UPCOMING</option>
                <option value="CLOSED">Status: CLOSED</option>
              </select>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">Nama Gelombang</th>
                  <th className="py-3.5 px-4">Tahun Akademik</th>
                  <th className="py-3.5 px-4 text-center">Jenjang</th>
                  <th className="py-3.5 px-4">Periode Pendaftaran</th>
                  <th className="py-3.5 px-4">Biaya Pendaftaran &amp; Daftar Ulang</th>
                  <th className="py-3.5 px-4 text-center">Target Kuota</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#1E3A8A]" />
                        <span>Memuat data gelombang dari database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600 text-sm">Tidak ada periode gelombang pendaftaran.</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {searchQuery || filterJenjang !== 'Semua' || filterStatus !== 'ALL'
                          ? 'Tidak ada hasil yang sesuai dengan filter pencarian.'
                          : 'Klik tombol "Tambah Gelombang" untuk membuat periode pendaftaran baru.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch, index) => {
                    const daysRemaining = getDaysRemaining(batch.endDate);
                    return (
                      <tr
                        key={batch.id}
                        className="hover:bg-slate-50/75 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                          {index + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 text-sm">{batch.name}</span>
                          {batch.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {batch.description}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{batch.academicYear}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="text-xs font-bold text-slate-700">
                            {batch.jenjang || 'S1'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-800 text-xs">
                              {formatDateIndo(batch.startDate)} &mdash; {formatDateIndo(batch.endDate)}
                            </span>
                            <span
                              className={`text-[11px] font-medium ${
                                daysRemaining.isEnded
                                  ? 'text-rose-500'
                                  : daysRemaining.days <= 7
                                  ? 'text-amber-600 font-bold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {daysRemaining.text}
                            </span>
                          </div>
                        </td>

                        {/* BIAYA PENDAFTARAN & DAFTAR ULANG GELOMBANG INI */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[11px] text-slate-400 font-medium">Formulir:</span>
                              <span className="font-bold text-amber-700 font-mono">
                                Rp {Number(batch.registrationFee ?? 250000).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-[11px] text-slate-400 font-medium">Daftar Ulang:</span>
                              <span className="font-bold text-emerald-700 font-mono">
                                Rp {Number(batch.reRegistrationFee ?? 7300000).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold text-slate-800">
                            {batch.quota ? batch.quota.toLocaleString('id-ID') : '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Kursi</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                              batch.status === 'OPEN'
                                ? 'text-emerald-700'
                                : batch.status === 'UPCOMING'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                batch.status === 'OPEN'
                                  ? 'bg-emerald-500'
                                  : batch.status === 'UPCOMING'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            <span>{batch.status}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(batch)}
                              title="Edit Gelombang & Biaya"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteBatch(batch.id, batch.name)}
                              title="Hapus Gelombang"
                              disabled={batches.length <= 1}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
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
        </div>

        {/* MODAL TAMBAH / EDIT GELOMBANG (TERMASUK BIAYA PENDAFTARAN & DAFTAR ULANG) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
              {/* MODAL HEADER */}
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      {modalMode === 'create'
                        ? 'Tambah Gelombang Pendaftaran'
                        : 'Edit Gelombang Pendaftaran'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Tentukan periode pembukaan pendaftaran, kuota, serta tarif biaya formulir &amp; daftar ulang.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* FORM */}
              <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* NAMA GELOMBANG */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Gelombang <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Gelombang 1 (Early Bird)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                      required
                    />
                  </div>

                  {/* TAHUN AKADEMIK */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tahun Akademik <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="2027/2028"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  {/* JENJANG */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jenjang Pendidikan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.jenjang}
                      onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    >
                      {availableJenjang
                        .filter((j) => j !== 'Semua')
                        .map((j) => (
                          <option key={j} value={j}>
                            Jenjang {j}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* TANGGAL BUKA */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Pembukaan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  {/* TANGGAL TUTUP */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Penutupan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                      required
                    />
                  </div>

                  {/* FIELD BIAYA FORMULIR REGISTRASI */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                    <label className="block font-bold text-amber-900 mb-1">
                      Biaya Formulir Registrasi (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-700 text-xs">Rp</span>
                      <input
                        type="number"
                        value={formData.registrationFee}
                        onChange={(e) => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                        min={0}
                        step={10000}
                        placeholder="250000"
                        className="w-full pl-10 pr-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-amber-700/80 block mt-1">
                      Tarif: Rp {Number(formData.registrationFee || 0).toLocaleString('id-ID')} (dibayar saat buat akun)
                    </span>
                  </div>

                  {/* FIELD BIAYA DAFTAR ULANG */}
                  <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                    <label className="block font-bold text-emerald-900 mb-1">
                      Biaya Daftar Ulang (Heregistrasi Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-xs">Rp</span>
                      <input
                        type="number"
                        value={formData.reRegistrationFee}
                        onChange={(e) => setFormData({ ...formData, reRegistrationFee: Number(e.target.value) })}
                        min={0}
                        step={50000}
                        placeholder="7300000"
                        className="w-full pl-10 pr-3 py-2 rounded-xl border border-emerald-300 bg-white font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700/80 block mt-1">
                      Tarif: Rp {Number(formData.reRegistrationFee || 0).toLocaleString('id-ID')} (dibayar setelah lulus)
                    </span>
                  </div>

                  {/* STATUS */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Status Gelombang <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'OPEN' | 'UPCOMING' | 'CLOSED',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    >
                      <option value="OPEN">OPEN (Pendaftaran Dibuka)</option>
                      <option value="UPCOMING">UPCOMING (Akan Datang)</option>
                      <option value="CLOSED">CLOSED (Ditutup)</option>
                    </select>
                  </div>

                  {/* KUOTA */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target Kuota (Opsional)
                    </label>
                    <input
                      type="number"
                      value={formData.quota}
                      onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                      placeholder="Contoh: 300"
                      min={0}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>

                  {/* DESKRIPSI */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Deskripsi / Keterangan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Keterangan singkat periode pendaftaran..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                {/* MODAL ACTIONS */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554] transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-900/20"
                  >
                    {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{modalMode === 'create' ? 'Simpan Gelombang' : 'Simpan Perubahan'}</span>
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
      </div>
    </PortalLayout>
  );
}
