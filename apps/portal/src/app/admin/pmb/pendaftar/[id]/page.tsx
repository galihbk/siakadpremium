'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  School,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw,
  Printer,
  Download,
  ExternalLink,
  Edit,
  Trash2,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Eye,
  X,
  Award,
  Users,
  MessageCircle,
} from 'lucide-react';

export default function PendaftarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [applicant, setApplicant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [updateStatusVal, setUpdateStatusVal] = useState<string>('VERIFIED');
  const [updateNotesVal, setUpdateNotesVal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copied alert
  const [isCopied, setIsCopied] = useState(false);

  // PDF Download State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Dialog State
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

  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [previewModalDoc, setPreviewModalDoc] = useState<{ title: string; url: string } | null>(null);

  const apiBase = getApiBaseUrl();

  const getFileUrl = (val?: string | null) => {
    if (!val) return '';
    let trimmed = String(val).trim();

    // Replace hardcoded internal backend URLs with relative /api/v1
    if (trimmed.includes('localhost:3001/api/v1')) {
      trimmed = trimmed.replace(/http:\/\/localhost:3001\/api\/v1/, '/api/v1');
    } else if (trimmed.includes('127.0.0.1:3001/api/v1')) {
      trimmed = trimmed.replace(/http:\/\/127\.0\.0\.1:3001\/api\/v1/, '/api/v1');
    }

    if (
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://')
    ) {
      return trimmed;
    }
    // Raw base64 check
    if (trimmed.startsWith('/9j/') || trimmed.startsWith('iVBORw0KGgo') || trimmed.startsWith('R0lGOD')) {
      const mime = trimmed.startsWith('/9j/') ? 'image/jpeg' : trimmed.startsWith('iVBOR') ? 'image/png' : 'image/gif';
      return `data:${mime};base64,${trimmed}`;
    }

    if (trimmed.startsWith('/api/v1') || (apiBase && trimmed.startsWith(apiBase))) {
      return trimmed;
    }

    return `${apiBase}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
  };

  const handleVerifyPaymentDirect = async (paymentId: string, targetStatus: 'PAID' | 'PENDING' = 'PAID') => {
    try {
      const res = await fetch(`${apiBase}/admissions/admin/pmb/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          notes: targetStatus === 'PAID' ? 'Diverifikasi Lunas oleh Admin PMB' : 'Status diubah ke PENDING oleh Admin PMB',
          verifiedBy: 'Admin PMB ITN',
        }),
      });

      let jsonRes: any = {};
      if (res.ok) {
        jsonRes = await res.json().catch(() => ({}));
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = Array.isArray(errJson.message)
          ? errJson.message.join(', ')
          : errJson.message || 'Gagal memperbarui status pembayaran.';
        throw new Error(errMsg);
      }

      await fetchApplicant();

      if (targetStatus === 'PAID') {
        const studentRes = jsonRes.student || {};
        const generatedNim = studentRes.nim || applicant?.nim || '270010016';
        console.log(`Pembayaran Lunas. NIM terbit: ${generatedNim}`);
      }

      setDialogState({
        isOpen: true,
        title: targetStatus === 'PAID' ? 'Pembayaran Lunas & NIM Diterbitkan!' : 'Status Pembayaran Diperbarui',
        message:
          targetStatus === 'PAID'
            ? `Pembayaran Daftar Ulang telah divalidasi LUNAS! Calon mahasiswa ${applicant?.fullName || 'Galih Bagaskoro'} resmi dikonversi menjadi Mahasiswa Aktif.`
            : 'Status pembayaran Daftar Ulang telah diperbarui.',
        type: targetStatus === 'PAID' ? 'success' : 'info',
        isAlert: true,
        confirmText: 'Tutup',
      });
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Memperbarui Status',
        message: err.message || 'Terjadi kesalahan saat memperbarui status pembayaran.',
        type: 'danger',
        isAlert: true,
      });
    }
  };

  const fetchApplicant = async () => {
    if (!id) return;
    setIsRefreshing(true);
    setErrorMsg(null);
    setPhotoLoadError(false);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${id}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setApplicant(data);
        setUpdateStatusVal(data.status || 'VERIFIED');
        setUpdateNotesVal(data.notes || '');
      } else {
        throw new Error('Gagal mengambil data pendaftar dari server.');
      }
    } catch (err: any) {
      console.error('Error fetching applicant detail:', err);
      setErrorMsg(err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplicant();
  }, [id]);

  const handleCopyRegNumber = () => {
    if (!applicant?.registrationNumber) return;
    navigator.clipboard.writeText(applicant.registrationNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/admissions/applicants/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatusVal,
          notes: updateNotesVal,
          verifiedBy: 'Admin PMB ITN',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Gagal memperbarui status seleksi.');
      }

      setStatusModalOpen(false);
      await fetchApplicant();

      setDialogState({
        isOpen: true,
        title: 'Status Berhasil Diperbarui',
        message: `Status seleksi calon mahasiswa telah diubah menjadi "${updateStatusVal}".`,
        type: 'success',
        isAlert: true,
        confirmText: 'Tutup',
      });
    } catch (err: any) {
      setDialogState({
        isOpen: true,
        title: 'Gagal Memperbarui Status',
        message: err.message || 'Terjadi kesalahan sistem saat memperbarui status.',
        type: 'danger',
        isAlert: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplicant = () => {
    if (!applicant) return;
    setDialogState({
      isOpen: true,
      title: 'Hapus Data Calon Mahasiswa?',
      message: (
        <div>
          Apakah Anda yakin ingin menghapus data calon mahasiswa{' '}
          <strong>{applicant.fullName}</strong> ({applicant.registrationNumber})?
          <p className="text-xs text-rose-600 mt-2 font-medium">
            Tindakan ini permanen dan akan menghapus data pendaftaran terkait.
          </p>
        </div>
      ),
      type: 'danger',
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const res = await fetch(`${apiBase}/admissions/applicants/${applicant.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Gagal menghapus data dari server.');
          router.push('/admin/pmb/pendaftar');
        } catch (err: any) {
          setDialogState({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: err.message || 'Terjadi kesalahan saat menghapus data.',
            type: 'danger',
            isAlert: true,
          });
        }
      },
    });
  };

  // Unduh Bukti PDF Langsung
  const handleDownloadBuktiPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      if (typeof window === 'undefined') return;

      // 1. Pastikan html2pdf sudah dimuat ke window
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src="/js/html2pdf.bundle.min.js"]');
          if (existing) {
            if ((window as any).html2pdf) {
              resolve();
              return;
            }
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error('Gagal memuat pustaka PDF')));
            return;
          }
          const script = document.createElement('script');
          script.src = '/js/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Gagal memuat pustaka PDF'));
          document.head.appendChild(script);
        });
      }

      const html2pdf = (window as any).html2pdf;
      const element = document.getElementById('bukti-pendaftaran-detail-card');
      if (!element) throw new Error('Elemen dokumen cetak tidak ditemukan');

      const cleanReg = applicant?.registrationNumber
        ? applicant.registrationNumber.replace(/[^a-zA-Z0-9-_]/g, '_')
        : 'PMB_ITN';

      const opt = {
        margin: [4, 6, 4, 6],
        filename: `Bukti_Pendaftaran_${cleanReg}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      console.error('Download PDF error:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Status Badge Helper
  const renderStatus = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Menunggu Pembayaran</span>
          </span>
        );
      case 'VERIFYING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Verifikasi Pembayaran Formulir</span>
          </span>
        );
      case 'VERIFYING_RE_REGISTRATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Verifikasi Pembayaran Daftar Ulang (Bukti Terkirim)</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Menunggu Verifikasi Berkas</span>
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>Berkas Terverifikasi</span>
          </span>
        );
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lolos Seleksi (Diterima)</span>
          </span>
        );
      case 'REGISTERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>Mahasiswa Diterima (NIM Terbit)</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Tidak Lolos Seleksi</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status || 'DRAFT'}
          </span>
        );
    }
  };

  // WhatsApp Link Helper
  const getCleanWaPhone = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  const waNumber = getCleanWaPhone(applicant?.phone);

  return (
    <PortalLayout role="pmb" activeMenuHref="/admin/pmb/pendaftar">
      <div className="w-full space-y-6">
        
        {/* Navigation / Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pmb/pendaftar"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors shadow-2xs inline-flex items-center justify-center"
              title="Kembali ke Daftar Calon Mahasiswa"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link href="/admin/pmb" className="hover:text-blue-700">
                  PMB
                </Link>
                <span>/</span>
                <Link href="/admin/pmb/pendaftar" className="hover:text-blue-700">
                  Data Calon Mahasiswa
                </Link>
                <span>/</span>
                <span className="text-slate-800 font-semibold">Detail Calon Mahasiswa</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {applicant ? applicant.fullName : 'Memuat Data Pendaftar...'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={fetchApplicant}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memperbarui...' : 'Segarkan'}</span>
            </button>

            <button
              onClick={handleDownloadBuktiPdf}
              disabled={isDownloadingPdf || !applicant}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isDownloadingPdf ? 'animate-bounce' : ''}`} />
              <span>{isDownloadingPdf ? 'Menyiapkan PDF...' : 'Cetak Bukti (PDF)'}</span>
            </button>

            <button
              onClick={() => setStatusModalOpen(true)}
              disabled={!applicant}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Edit className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Perbarui Status</span>
            </button>

            <button
              onClick={handleDeleteApplicant}
              disabled={!applicant}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
              title="Hapus Data Calon Mahasiswa"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-12 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 font-bold text-sm">Mengambil data lengkap calon mahasiswa...</p>
            <p className="text-xs text-slate-400">Mohon tunggu beberapa saat</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-rose-900">Gagal Memuat Data</h3>
            <p className="text-xs text-rose-700 max-w-md mx-auto">{errorMsg}</p>
            <div className="pt-2">
              <button
                onClick={fetchApplicant}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Detail Content */}
        {!isLoading && applicant && (
          <div className="space-y-6">
            
            {/* HERO PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50/60 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                {/* Photo / Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-28 sm:w-28 sm:h-36 rounded-2xl border-2 border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shadow-md">
                    {applicant.documents?.fileFoto && !photoLoadError ? (
                      <img
                        src={getFileUrl(applicant.documents.fileFoto)}
                        alt={applicant.fullName}
                        onError={() => setPhotoLoadError(true)}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          setPreviewModalDoc({
                            title: `Pas Foto - ${applicant.fullName}`,
                            url: getFileUrl(applicant.documents.fileFoto),
                          })
                        }
                        title="Klik untuk memperbesar foto"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <div className="w-12 h-12 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-black text-xl mx-auto mb-1">
                          {applicant.fullName?.slice(0, 2).toUpperCase() || 'CM'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold block">Pas Foto</span>
                      </div>
                    )}
                  </div>
                  {applicant.status === 'PASSED' && (
                    <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1 rounded-full shadow-md border-2 border-white" title="Lolos Seleksi">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {renderStatus(applicant.status)}
                    {applicant.isKip && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        Pendaftar KIP-Kuliah
                      </span>
                    )}
                    {applicant.nim && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-900 border border-purple-300">
                        NIM: {applicant.nim}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {applicant.fullName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <span className="text-slate-400">No. Registrasi:</span>
                        <span className="font-mono font-bold text-blue-900">
                          {applicant.registrationNumber}
                        </span>
                        <button
                          onClick={handleCopyRegNumber}
                          title="Salin Nomor Registrasi"
                          className="ml-1 text-slate-400 hover:text-blue-600"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {applicant.nik && (
                        <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <span className="text-slate-400">NIK:</span>
                          <span className="font-mono font-semibold text-slate-800">{applicant.nik}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Terdaftar: {new Date(applicant.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic Highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Program Studi Pilihan</span>
                      <span className="font-bold text-blue-900 text-sm">{applicant.chosenStudyProgram}</span>
                      <span className="text-[11px] text-slate-500 block">Jenjang {applicant.jenjang || 'S1'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jalur &amp; Gelombang</span>
                      <span className="font-bold text-slate-800">{applicant.jalurPendaftaran || 'Jalur Reguler'}</span>
                      <span className="text-[11px] text-slate-500 block">{applicant.gelombang || 'Gelombang Berjalan'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Asal Sekolah / SMA</span>
                      <span className="font-bold text-slate-800">{applicant.schoolName || applicant.highSchool || '-'}</span>
                      <span className="text-[11px] text-slate-500 block">{applicant.major ? `Jurusan ${applicant.major}` : 'SMA/SMK'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Contact Actions */}
                <div className="shrink-0 flex sm:flex-col gap-2 w-full md:w-auto">
                  {waNumber ? (
                    <a
                      href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(applicant.fullName)},%20kami%20dari%20Panitia%20PMB%20Institut%20Teknologi%20Nusantara%20(ITN)%20terkait%20pendaftaran%20PMB%20Nomor%20${encodeURIComponent(applicant.registrationNumber)}...`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  {applicant.email ? (
                    <a
                      href={`mailto:${applicant.email}?subject=Informasi%20PMB%20ITN%20-%20${encodeURIComponent(applicant.registrationNumber)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                    >
                      <Mail className="w-4 h-4 text-blue-700" />
                      <span>Kirim Email</span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* GRID DETAIL CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI (2 Kolom): Data Pribadi, Pendidikan, Orang Tua, Dokumen */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* KARTU 1: DATA PRIBADI & KONTAK */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Data Pribadi Calon Mahasiswa</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nama Lengkap (Sesuai Ijazah)</span>
                      <span className="font-bold text-slate-900 text-sm">{applicant.fullName}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nomor Induk Kependudukan (NIK)</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{applicant.nik || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Tempat, Tanggal Lahir</span>
                      <span className="font-semibold text-slate-800">
                        {applicant.birthPlace ? `${applicant.birthPlace}, ` : ''}{applicant.birthDate || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Jenis Kelamin &amp; Agama</span>
                      <span className="font-semibold text-slate-800">
                        {applicant.gender === 'M' || applicant.gender === 'L' || applicant.gender === 'Laki-laki'
                          ? 'Laki-laki'
                          : applicant.gender === 'F' || applicant.gender === 'P' || applicant.gender === 'Perempuan'
                          ? 'Perempuan'
                          : applicant.gender || '-'} 
                        {applicant.religion ? ` • ${applicant.religion}` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Email Terdaftar</span>
                      <span className="font-semibold text-blue-900 break-all">{applicant.email || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nomor HP / WhatsApp</span>
                      <span className="font-semibold text-slate-800">{applicant.phone || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Provinsi</span>
                      <span className="font-semibold text-slate-800">{(applicant as any).province || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Kota / Kabupaten</span>
                      <span className="font-semibold text-slate-800">{(applicant as any).city || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Kecamatan</span>
                      <span className="font-semibold text-slate-800">{(applicant as any).kecamatan || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Kelurahan / Desa</span>
                      <span className="font-semibold text-slate-800">{(applicant as any).kelurahan || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">RT / RW &amp; Kode Pos</span>
                      <span className="font-semibold text-slate-800">
                        {[
                          (applicant as any).rtRw ? `RT/RW ${(applicant as any).rtRw}` : '',
                          (applicant as any).postalCode ? `Kode Pos ${(applicant as any).postalCode}` : '',
                        ].filter(Boolean).join(' • ') || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1 sm:col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">Alamat Jalan / No. Rumah</span>
                      <span className="font-medium text-slate-800 leading-relaxed">{(applicant as any).streetAddress || applicant.address || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* KARTU 2: ASAL SEKOLAH & PENDIDIKAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <School className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Riwayat Pendidikan &amp; Asal Sekolah</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1 sm:col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">Nama Asal Sekolah</span>
                      <span className="font-bold text-slate-900 text-sm">{applicant.schoolName || applicant.highSchool || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Jurusan Sekolah</span>
                      <span className="font-semibold text-slate-800">{applicant.major || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Tahun Kelulusan</span>
                      <span className="font-semibold text-slate-800">{applicant.graduationYear || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nomor Induk Siswa Nasional (NISN)</span>
                      <span className="font-mono font-semibold text-slate-800">{applicant.nisn || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nomor Pokok Sekolah Nasional (NPSN)</span>
                      <span className="font-mono font-semibold text-slate-800">{applicant.npsn || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* KARTU 3: DATA ORANG TUA / WALI */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Data Orang Tua / Wali</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nama Ayah</span>
                      <span className="font-bold text-slate-900">{applicant.fatherName || applicant.parentName || '-'}</span>
                      <span className="text-[11px] text-slate-500 block">Pekerjaan: {applicant.fatherJob || applicant.parentJob || '-'}</span>
                      <span className="text-[11px] text-slate-500 block">Penghasilan: {applicant.fatherIncome || applicant.parentIncome || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1">
                      <span className="text-slate-400 font-medium block text-[11px]">Nama Ibu</span>
                      <span className="font-bold text-slate-900">{applicant.motherName || '-'}</span>
                      <span className="text-[11px] text-slate-500 block">Pekerjaan: {applicant.motherJob || '-'}</span>
                      <span className="text-[11px] text-slate-500 block">Penghasilan: {applicant.motherIncome || '-'}</span>
                    </div>

                    <div className="p-3 bg-slate-50/70 rounded-xl space-y-1 sm:col-span-2">
                      <span className="text-slate-400 font-medium block text-[11px]">Kontak / No. Telepon Orang Tua</span>
                      <span className="font-semibold text-slate-800">{applicant.parentPhone || applicant.fatherPhone || applicant.motherPhone || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* KARTU 4: DOKUMEN & BERKAS PERSYARATAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Berkas &amp; Dokumen Persyaratan</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(() => {
                      const regPayment = applicant.payments?.find((p: any) => p.type === 'REGISTRATION') || applicant.payments?.[0];
                      const proofUrl = regPayment?.proofUrl;

                      return [
                        { label: 'Pas Foto Resmi (3x4)', key: 'fileFoto', val: applicant.documents?.fileFoto },
                        { label: 'Kartu Tanda Penduduk (KTP)', key: 'fileKtp', val: applicant.documents?.fileKtp },
                        { label: 'Kartu Keluarga (KK)', key: 'fileKk', val: applicant.documents?.fileKk },
                        { label: 'Ijazah / Surat Keterangan Lulus', key: 'fileIjazah', val: applicant.documents?.fileIjazah },
                        { label: 'Bukti Transfer Pembayaran PMB', key: 'proofUrl', val: proofUrl },
                        { label: 'Kartu / Berkas KIP-Kuliah', key: 'fileKip', val: applicant.documents?.fileKip },
                        { label: 'Berkas Prestasi / Tambahan', key: 'fileTambahan', val: applicant.documents?.fileTambahan },
                      ].map((doc, idx) => {
                        const hasDoc = !!doc.val;
                        const fileUrl = hasDoc ? getFileUrl(doc.val) : null;

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                              hasDoc
                                ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
                                : 'bg-slate-50/50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <span className="font-bold block text-slate-800 truncate">{doc.label}</span>
                              <span className="text-[11px] block">
                                {hasDoc ? (
                                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Sudah Diunggah
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Belum diunggah</span>
                                )}
                              </span>
                            </div>

                            {hasDoc && fileUrl && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalDoc({ title: doc.label, url: fileUrl })}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Lihat Berkas</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

              </div>

              {/* KOLOM KANAN (1 Kolom): Status Seleksi, Pembayaran, Program Studi */}
              <div className="space-y-6">
                
                {/* KARTU KANAN 1: STATUS SELEKSI & KEPUTUSAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Keputusan Seleksi</h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5">
                      <span className="text-slate-400 font-medium block text-[11px]">Status Seleksi Saat Ini</span>
                      <div>{renderStatus(applicant.status)}</div>
                    </div>

                    {applicant.verifiedAt && (
                      <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                        <span className="text-slate-400 font-medium block text-[11px]">Waktu Verifikasi Berkas</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(applicant.verifiedAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                        {applicant.verifiedBy && (
                          <span className="text-[11px] text-slate-500 block">Oleh: {applicant.verifiedBy}</span>
                        )}
                      </div>
                    )}

                    {applicant.notes && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 space-y-1">
                        <span className="text-amber-800 font-bold block text-[11px]">Catatan Panitia / Reviewer:</span>
                        <p className="text-amber-900 leading-relaxed">{applicant.notes}</p>
                      </div>
                    )}

                    <button
                      onClick={() => setStatusModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-800 font-bold hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Ubah Status &amp; Catatan Seleksi</span>
                    </button>
                  </div>
                </div>

                {/* KARTU KANAN 2: RIWAYAT PEMBAYARAN */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Riwayat Pembayaran PMB</h3>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {applicant.payments && applicant.payments.length > 0 ? (
                      applicant.payments.map((p: any, idx: number) => (
                        <div
                          key={p.id || idx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {p.type === 'REGISTRATION' ? 'Biaya Pendaftaran / Formulir' : 'Biaya Daftar Ulang (Heregistrasi)'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                p.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'VERIFYING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status === 'PAID' ? 'LUNAS' : p.status === 'VERIFYING' ? 'VERIFIKASI' : 'BELUM LUNAS'}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between pt-1">
                            <span className="text-slate-400 text-[11px]">Jumlah Tagihan:</span>
                            <span className="font-mono font-black text-blue-900 text-sm">
                              Rp {Number(p.amount || 0).toLocaleString('id-ID')}
                            </span>
                          </div>

                          {p.paymentMethod && (
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Metode:</span>
                              <span className="font-medium text-slate-700">{p.paymentMethod}</span>
                            </div>
                          )}

                          {p.proofUrl ? (
                            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModalDoc({
                                    title: `Bukti Transfer - ${p.type === 'REGISTRATION' ? 'Biaya Pendaftaran' : 'Daftar Ulang'} (Rp ${Number(p.amount || 0).toLocaleString('id-ID')})`,
                                    url: getFileUrl(p.proofUrl),
                                  })
                                }
                                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4 text-blue-700" />
                                <span>Lihat Bukti Transfer</span>
                              </button>
                              {p.status !== 'PAID' ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPaymentDirect(p.id, 'PAID')}
                                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Setujui Lunas</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPaymentDirect(p.id, 'PENDING')}
                                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-[11px] inline-flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Reset ke Belum Lunas</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="pt-1 text-[11px] text-amber-700 italic">
                              * Belum ada bukti transfer diunggah oleh calon mahasiswa
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 space-y-1">
                        <span className="font-semibold block">Belum ada transaksi pembayaran</span>
                        <span className="text-[11px] text-slate-400 block">
                          Tagihan formulir pendaftaran belum terdata atau masuk jalur KIP.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KARTU KANAN 3: AKADEMIK DETAIL */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="text-base font-black text-slate-900">Pilihan Akademik</h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Program Studi:</span>
                      <span className="font-bold text-blue-900 text-right">{applicant.chosenStudyProgram}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Jenjang:</span>
                      <span className="font-semibold text-slate-800">{applicant.jenjang || 'S1'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Jalur Pendaftaran:</span>
                      <span className="font-semibold text-slate-800">{applicant.jalurPendaftaran || 'Reguler'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Pilihan Kelas:</span>
                      <span className="font-semibold text-slate-800">{applicant.pilihanKelas || 'Reguler Pagi'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Gelombang PMB:</span>
                      <span className="font-semibold text-slate-800">{applicant.gelombang || 'Gelombang 1'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* MODAL UBAH STATUS SELEKSI */}
      {statusModalOpen && applicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 !m-0">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Ubah Status Calon Mahasiswa</h3>
              <button
                onClick={() => setStatusModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <p className="font-bold text-slate-900 text-sm">{applicant.fullName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{applicant.registrationNumber}</p>
                <p className="text-blue-900 font-medium">{applicant.chosenStudyProgram}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Pilih Status Seleksi Baru</label>
                <select
                  value={updateStatusVal}
                  onChange={(e) => setUpdateStatusVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="UNPAID">Menunggu Pembayaran (UNPAID)</option>
                  <option value="VERIFYING_PAYMENT">Verifikasi Pembayaran (VERIFYING_PAYMENT)</option>
                  <option value="PENDING">Menunggu Verifikasi Berkas (PENDING)</option>
                  <option value="VERIFIED">Berkas Terverifikasi (VERIFIED)</option>
                  <option value="PASSED">Lolos Seleksi / Diterima (PASSED)</option>
                  <option value="REGISTERED">Mahasiswa Diterima / NIM Terbit (REGISTERED)</option>
                  <option value="FAILED">Tidak Lolos Seleksi (FAILED)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Catatan Seleksi / Alasan</label>
                <textarea
                  rows={3}
                  value={updateNotesVal}
                  onChange={(e) => setUpdateNotesVal(e.target.value)}
                  placeholder="Contoh: Berkas telah diverifikasi lengkap, memenuhi kualifikasi..."
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

      {/* ELEMEN TEMPLATE A4 CETAK BUKTI PENDAFTARAN (Off-screen / Hidden for html2pdf) */}
      {applicant && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div
            id="bukti-pendaftaran-detail-card"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '14mm 16mm',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. KOP SURAT RESMI */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                {/* ITN Logo Vector */}
                <svg viewBox="0 0 120 120" width="60" height="60" fill="none">
                  <circle cx="60" cy="60" r="54" fill="#0F172A" />
                  <circle cx="60" cy="60" r="50" fill="#FFFFFF" stroke="#D4A017" strokeWidth="2" />
                  <circle cx="60" cy="60" r="32" fill="#1E3A8A" />
                  <polygon points="60,34 78,44 78,66 60,82 42,66 42,44" fill="#0F172A" stroke="#D4A017" strokeWidth="1.5" />
                  <path d="M50 63 C55 60 60 62 60 62 C60 62 65 60 70 63 L70 70 C65 67 60 69 60 69 C60 69 55 67 50 70 Z" fill="#FFFFFF" />
                  <path d="M58 55 C57 51 59 48 60 46 C61 48 63 51 62 55 C61 57 59 57 58 55 Z" fill="#F59E0B" />
                  <text x="60" y="78" textAnchor="middle" fill="#D4A017" fontSize="7.5" fontWeight="900">ITN</text>
                </svg>
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#475569', textTransform: 'uppercase' }}>
                  YAYASAN PENDIDIKAN TINGGI TEKNOLOGI NUSANTARA
                </h4>
                <h1 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase' }}>
                  INSTITUT TEKNOLOGI NUSANTARA
                </h1>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '11px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  PANITIA PENERIMAAN MAHASISWA BARU (PMB) T.A. 2027/2028
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#475569' }}>
                  Kampus Utama: Jl. Boulevard Teknologi No. 1, Menteng, Jakarta Pusat • Telp: (021) 7890-1234
                </p>
                <p style={{ margin: '1px 0 0 0', fontSize: '8.5px', color: '#64748b' }}>
                  Laman Resmi: https://pmb.siakadpremium.ac.id • Surel: pmb@itn.ac.id • WhatsApp: 0812-7643-8553
                </p>
              </div>

              {/* QR Code Vector */}
              <div style={{ width: '60px', height: '60px', flexShrink: 0, border: '1px solid #cbd5e1', padding: '3px', borderRadius: '4px', textAlign: 'center' }}>
                <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
                  <rect width="100" height="100" fill="white" />
                  <rect x="6" y="6" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
                  <rect x="13" y="13" width="12" height="12" fill="#1E3A8A" />
                  <rect x="68" y="6" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
                  <rect x="75" y="13" width="12" height="12" fill="#1E3A8A" />
                  <rect x="6" y="68" width="26" height="26" stroke="#0F172A" strokeWidth="4" fill="none" />
                  <rect x="13" y="75" width="12" height="12" fill="#1E3A8A" />
                  <rect x="42" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="52" y="8" width="6" height="6" fill="#0F172A" />
                  <rect x="38" y="38" width="7" height="7" fill="#1E3A8A" />
                  <rect x="54" y="38" width="6" height="6" fill="#0F172A" />
                  <rect x="38" y="54" width="6" height="6" fill="#0F172A" />
                  <rect x="62" y="52" width="7" height="7" fill="#1E3A8A" />
                  <rect x="43" y="43" width="14" height="14" fill="#D4A017" rx="2" />
                  <text x="50" y="52" textAnchor="middle" fill="#1E3A8A" fontSize="6.5" fontWeight="900">ITN</text>
                </svg>
              </div>
            </div>

            {/* Garis Pembatas Kop Surat */}
            <div style={{ borderTop: '2.5px solid #1E3A8A', width: '100%', marginTop: '8px' }}></div>
            <div style={{ borderTop: '1px solid #D4A017', width: '100%', marginTop: '2px', marginBottom: '14px' }}></div>

            {/* 2. JUDUL DOKUMEN & NOMOR REGISTRASI */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a' }}>
                KARTU TANDA BUKTI PENDAFTARAN
              </h3>
              <p style={{ margin: '2px 0 6px 0', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                CALON MAHASISWA BARU TAHUN AKADEMIK 2027/2028
              </p>
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 20px',
                    backgroundColor: '#f8fafc',
                    border: '1.5px solid #64748b',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#0f172a',
                  }}
                >
                  NOMOR REGISTRASI :{' '}
                  <span style={{ color: '#1e3a8a', fontWeight: 900 }}>
                    {applicant.registrationNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. HERO PILIHAN PROGRAM STUDI */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', backgroundColor: '#f8fafc', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', lineHeight: 1.6 }}>
                <div><strong>Program Studi:</strong> <span style={{ color: '#1e3a8a', fontWeight: 800 }}>{applicant.chosenStudyProgram}</span> ({applicant.jenjang || 'S1'})</div>
                <div><strong>Jalur &amp; Gelombang:</strong> {applicant.jalurPendaftaran || 'Jalur Reguler'} • {applicant.gelombang || 'Gelombang 1'}</div>
                <div><strong>Pilihan Kelas:</strong> {applicant.pilihanKelas || 'Kelas Reguler'}</div>
              </div>

              {/* Pas Foto Box */}
              <div style={{ width: '70px', height: '90px', border: '1.5px solid #94a3b8', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }}>
                {applicant.documents?.fileFoto ? (
                  <img
                    src={getFileUrl(applicant.documents.fileFoto)}
                    alt="Foto"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textAlign: 'center' }}>PAS FOTO<br/>3x4</span>
                )}
              </div>
            </div>

            {/* 4. TABEL DETAIL DATA CALON MAHASISWA */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', marginBottom: '12px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <td colSpan={2} style={{ padding: '5px 8px', fontWeight: 800, textTransform: 'uppercase' }}>
                    I. Data Diri Calon Mahasiswa
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ width: '35%', padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Nama Lengkap</td>
                  <td style={{ padding: '5px 8px', fontWeight: 800, color: '#0f172a' }}>{applicant.fullName}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Nomor Induk Kependudukan (NIK)</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{applicant.nik || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Tempat &amp; Tanggal Lahir</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.birthPlace ? `${applicant.birthPlace}, ` : ''}{applicant.birthDate || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Jenis Kelamin / Agama</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.gender || '-'} / {applicant.religion || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Email &amp; No. WhatsApp</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.email} • {applicant.phone}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Provinsi / Kota</td>
                  <td style={{ padding: '5px 8px' }}>{(applicant as any).province || '-'} / {(applicant as any).city || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Kecamatan / Kelurahan</td>
                  <td style={{ padding: '5px 8px' }}>{(applicant as any).kecamatan || '-'} / {(applicant as any).kelurahan || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>RT / RW &amp; Kode Pos</td>
                  <td style={{ padding: '5px 8px' }}>
                    {[
                      (applicant as any).rtRw ? `RT/RW ${(applicant as any).rtRw}` : '',
                      (applicant as any).postalCode ? `Kode Pos ${(applicant as any).postalCode}` : '',
                    ].filter(Boolean).join(' • ') || '-'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Alamat Jalan / Lengkap</td>
                  <td style={{ padding: '5px 8px' }}>{(applicant as any).streetAddress || applicant.address || '-'}</td>
                </tr>

                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <td colSpan={2} style={{ padding: '5px 8px', fontWeight: 800, textTransform: 'uppercase' }}>
                    II. Riwayat Asal Sekolah
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Nama Asal Sekolah</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>{applicant.schoolName || applicant.highSchool || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Jurusan / Tahun Lulus</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.major || '-'} / {applicant.graduationYear || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>NISN / NPSN</td>
                  <td style={{ padding: '5px 8px', fontFamily: 'monospace' }}>{applicant.nisn || '-'} / {applicant.npsn || '-'}</td>
                </tr>

                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <td colSpan={2} style={{ padding: '5px 8px', fontWeight: 800, textTransform: 'uppercase' }}>
                    III. Data Orang Tua / Wali
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>Nama Ayah / Ibu</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.fatherName || applicant.parentName || '-'} / {applicant.motherName || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '5px 8px', fontWeight: 700, color: '#475569' }}>No. HP Orang Tua</td>
                  <td style={{ padding: '5px 8px' }}>{applicant.parentPhone || applicant.fatherPhone || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* 5. PETUNJUK RESMI PMB */}
            <div style={{ border: '1px solid #94a3b8', borderRadius: '4px', padding: '8px 12px', fontSize: '9px', lineHeight: 1.5, color: '#334155', backgroundColor: '#f8fafc' }}>
              <strong>PETUNJUK BAGI CALON MAHASISWA:</strong>
              <ol style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                <li>Simpan Kartu Tanda Bukti Pendaftaran ini sebagai bukti sah pendaftaran mahasiswa baru Institut Teknologi Nusantara.</li>
                <li>Pantau pengumuman verifikasi berkas dan kelulusan seleksi secara berkala melalui portal PMB resmi di <strong>https://pmb.siakadpremium.ac.id</strong>.</li>
                <li>Bila dinyatakan diterima, segera lakukan proses registrasi ulang dan pembayaran biaya pendidikan untuk penerbitan NIM.</li>
              </ol>
            </div>

            {/* Footer Cetak */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', fontSize: '8.5px', color: '#64748b' }}>
              <div>Dicetak melalui Sistem PMB ITN • {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
              <div>Halaman 1 dari 1 (Dokumen Sah Elektronik)</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Berkas / Foto Dokumen */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 !m-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{previewModalDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Tab Baru</span>
                </a>
                <button
                  onClick={() => setPreviewModalDoc(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2 border border-slate-200/80">
              {previewModalDoc.url.startsWith('data:image/') ||
              previewModalDoc.url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ||
              previewModalDoc.url.startsWith('data:') ? (
                <img
                  src={previewModalDoc.url}
                  alt={previewModalDoc.title}
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
                />
              ) : (
                <iframe
                  src={previewModalDoc.url}
                  title={previewModalDoc.title}
                  className="w-full h-[65vh] rounded-lg border-0"
                />
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPreviewModalDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
