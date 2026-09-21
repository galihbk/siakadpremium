'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  X,
  ExternalLink,
  DollarSign,
  User,
  GraduationCap,
  Calendar,
  Building2,
  Layers,
} from 'lucide-react';

interface PaymentItem {
  id: string;
  applicationId: string;
  registrationNumber: string;
  applicantName: string;
  email: string;
  phone: string;
  prodi: string;
  wave: string;
  track: string;
  type: 'REGISTRATION' | 'RE_REGISTRATION';
  amount: number;
  status: 'PENDING' | 'VERIFYING' | 'PAID';
  proofUrl?: string | null;
  paidAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
}

export default function AdminPmbBiayaPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Proof Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fee Config State (Satu nominal Registrasi & satu nominal Daftar Ulang)
  const [feeConfig, setFeeConfig] = useState({
    registrationFee: 250000,
    reRegistrationFee: 7300000,
  });
  const [isSavingFee, setIsSavingFee] = useState(false);

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
  const [feeSaveMessage, setFeeSaveMessage] = useState<string | null>(null);

  const apiBase = getApiBaseUrl();

  const fetchFeeConfig = async () => {
    try {
      const res = await fetch(`${apiBase}/admissions/pmb/fee-config`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const data = json.data !== undefined ? json.data : json;
        if (data) {
          setFeeConfig({
            registrationFee: Number(data.registrationFee) || 250000,
            reRegistrationFee: Number(data.reRegistrationFee) || 7300000,
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch fee config:', err);
    }
  };

  const handleSaveFeeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFee(true);
    setFeeSaveMessage(null);
    try {
      const res = await fetch(`${apiBase}/admissions/pmb/fee-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationFee: Number(feeConfig.registrationFee),
          reRegistrationFee: Number(feeConfig.reRegistrationFee),
        }),
      });
      if (!res.ok) {
        throw new Error('Gagal menyimpan konfigurasi biaya PMB.');
      }
      setFeeSaveMessage('Konfigurasi Biaya PMB berhasil disimpan ke database!');
      setTimeout(() => setFeeSaveMessage(null), 3500);
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Menyimpan Biaya',
        message: err.message || 'Gagal menyimpan konfigurasi biaya PMB.',
        type: 'danger',
        isAlert: true,
      });
    } finally {
      setIsSavingFee(false);
    }
  };

  const fetchPayments = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await fetch(`${apiBase}/admissions/admin/pmb/payments`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setPayments(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      } else {
        throw new Error('Gagal memuat data pembayaran dari server.');
      }
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setApiError(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchFeeConfig();
  }, []);

  const handleVerify = async (paymentId: string, targetStatus: 'PAID' | 'PENDING') => {
    setIsVerifying(true);
    try {
      const { user: authUser } = getAuthSession();
      const res = await fetch(`${apiBase}/admissions/admin/pmb/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          verifiedBy: authUser?.fullName || 'Panitia PMB ITN',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal memverifikasi pembayaran.');
      }

      setDialogState({
        isOpen: true,
        title: targetStatus === 'PAID' ? 'Pembayaran Lunas & NIM Diterbitkan!' : 'Status Diperbarui',
        message:
          targetStatus === 'PAID'
            ? 'Pembayaran berhasil diverifikasi LUNAS di database!'
            : 'Status pembayaran berhasil diubah menjadi PENDING.',
        type: targetStatus === 'PAID' ? 'success' : 'info',
        isAlert: true,
      });
      setSelectedPayment(null);
      fetchPayments();
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Memvalidasi Pembayaran',
        message: err.message || 'Terjadi kesalahan sistem.',
        type: 'danger',
        isAlert: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Filtered List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (typeFilter !== 'ALL' && p.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchReg = p.registrationNumber?.toLowerCase().includes(q);
        const matchName = p.applicantName?.toLowerCase().includes(q);
        const matchEmail = p.email?.toLowerCase().includes(q);
        return matchReg || matchName || matchEmail;
      }
      return true;
    });
  }, [payments, typeFilter, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = payments.length;
    const pending = payments.filter((p) => p.status === 'PENDING').length;
    const verifying = payments.filter((p) => p.status === 'VERIFYING').length;
    const paid = payments.filter((p) => p.status === 'PAID').length;
    const totalPaidAmount = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    return { total, pending, verifying, paid, totalPaidAmount };
  }, [payments]);

  return (
    <PortalLayout
      role="pmb"
      activeMenuHref="/admin/pmb/biaya"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <CreditCard className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Keuangan & Pembayaran PMB
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Monitoring & Verifikasi Pembayaran
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verifikasi bukti transfer Biaya Registrasi dan Biaya Daftar Ulang calon mahasiswa secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/pmb/gelombang"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Setting Gelombang &amp; Biaya</span>
            </Link>

            <button
              onClick={fetchPayments}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1E3A8A]' : ''}`} />
            </button>
          </div>
        </div>

        {/* KONFIGURASI BIAYA PMB (DIPISAH DARI GELOMBANG - SEDERHANA) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-3 mb-4">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                <span>Pengaturan Nominal Biaya PMB</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Konfigurasi nominal standar biaya PMB. Pendaftaran formulir adalah <strong>GRATIS</strong>; Biaya Registrasi ditagihkan setelah submit formulir, dan Biaya Daftar Ulang ditagihkan setelah dinyatakan Lulus.
              </p>
            </div>
            {feeSaveMessage && (
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{feeSaveMessage}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveFeeConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Registrasi (Rp)
              </label>
              <input
                type="number"
                value={feeConfig.registrationFee}
                onChange={(e) =>
                  setFeeConfig({ ...feeConfig, registrationFee: Number(e.target.value) })
                }
                placeholder="250000"
                step={25000}
                min={0}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:outline-hidden focus:border-[#1E3A8A]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditagihkan setelah calon mahasiswa submit formulir (Nomor PMB terbit).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biaya Daftar Ulang (Rp)
              </label>
              <input
                type="number"
                value={feeConfig.reRegistrationFee}
                onChange={(e) =>
                  setFeeConfig({ ...feeConfig, reRegistrationFee: Number(e.target.value) })
                }
                placeholder="7300000"
                step={50000}
                min={0}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-[#1E3A8A] text-xs focus:outline-hidden focus:border-[#1E3A8A]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditagihkan setelah calon mahasiswa dinyatakan Lulus seleksi PMB.
              </span>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSavingFee}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-900/15 flex items-center justify-center gap-2"
              >
                {isSavingFee && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Perubahan Biaya</span>
              </button>
            </div>
          </form>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Tagihan</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.total}</div>
            <span className="text-[10px] text-slate-400">Registrasi & Daftar Ulang</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Perlu Verifikasi</span>
            <div className="text-2xl font-black text-amber-800 mt-1">{stats.verifying}</div>
            <span className="text-[10px] text-amber-700 font-medium">Bukti bayar telah diunggah</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Lunas Terverifikasi</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">{stats.paid}</div>
            <span className="text-[10px] text-emerald-700 font-medium">Sah masuk kas kampus</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider">Total Penerimaan</span>
            <div className="text-lg font-black text-[#1E3A8A] mt-1">
              Rp {stats.totalPaidAmount.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-blue-700 font-medium">Dana terhimpun dari PMB</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Registrasi, Nama, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">Semua Jenis Biaya</option>
              <option value="REGISTRATION">Biaya Registrasi</option>
              <option value="RE_REGISTRATION">Biaya Daftar Ulang</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="ALL">Semua Status</option>
              <option value="VERIFYING">Menunggu Verifikasi</option>
              <option value="PAID">Lunas</option>
              <option value="PENDING">Belum Bayar</option>
            </select>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
              Memuat data transaksi pembayaran...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Tidak ada data pembayaran yang sesuai dengan kriteria filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">NO. REGISTRASI</th>
                    <th className="py-3 px-4">NAMA CALON MAHASISWA</th>
                    <th className="py-3 px-4">PROGRAM STUDI</th>
                    <th className="py-3 px-4">JENIS BIAYA</th>
                    <th className="py-3 px-4">NOMINAL</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.registrationNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.applicantName}</div>
                        <div className="text-[10px] text-slate-400">{p.email} • {p.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.prodi}</div>
                        <div className="text-[10px] text-slate-400">{p.wave} • {p.track}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.type === 'REGISTRATION'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {p.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Daftar Ulang'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        Rp {p.amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'VERIFYING'
                              ? 'bg-amber-50 text-amber-700 animate-pulse'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.status === 'PAID' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : p.status === 'VERIFYING' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {p.status === 'PAID'
                            ? 'Lunas'
                            : p.status === 'VERIFYING'
                            ? 'Perlu Verifikasi'
                            : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-blue-50 hover:text-[#1E3A8A] font-bold text-slate-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Periksa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

        {/* Verification Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 !m-0">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Detail Pembayaran PMB
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedPayment.type === 'REGISTRATION' ? 'Biaya Registrasi' : 'Biaya Daftar Ulang'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">No. Registrasi</span>
                  <span className="font-mono font-bold text-slate-900">{selectedPayment.registrationNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nama Calon Mahasiswa</span>
                  <span className="font-bold text-slate-900">{selectedPayment.applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Program Studi</span>
                  <span className="font-medium text-slate-800">{selectedPayment.prodi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nominal Tagihan</span>
                  <span className="font-mono font-bold text-[#1E3A8A]">
                    Rp {selectedPayment.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Bukti Transfer */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bukti Pembayaran yang Diunggah
                </label>
                {selectedPayment.proofUrl ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-2">
                    <img
                      src={selectedPayment.proofUrl}
                      alt="Bukti Transfer"
                      className="max-h-64 object-contain rounded-lg"
                    />
                    <a
                      href={selectedPayment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[11px] text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span>Buka gambar di tab baru</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    Calon mahasiswa belum mengunggah foto / struk bukti pembayaran.
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs">
                  <span className="text-slate-400">Status Saat Ini: </span>
                  <span className="font-bold text-slate-800">
                    {selectedPayment.status === 'PAID'
                      ? 'LUNAS'
                      : selectedPayment.status === 'VERIFYING'
                      ? 'MENUNGGU VERIFIKASI'
                      : 'BELUM BAYAR'}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {selectedPayment.status !== 'PENDING' && (
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerify(selectedPayment.id, 'PENDING')}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Set Belum Bayar
                    </button>
                  )}
                  {selectedPayment.status !== 'PAID' && (
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={() => handleVerify(selectedPayment.id, 'PAID')}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isVerifying ? 'Memvalidasi...' : 'Validasi Lunas'}</span>
                    </button>
                  )}
                </div>
              </div>
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
