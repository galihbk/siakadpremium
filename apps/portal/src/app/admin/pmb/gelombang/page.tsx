'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Star,
  Users,
  Award,
  Layers,
  Sparkles,
  Printer,
  Calendar,
  DollarSign,
  Tag,
  Check,
  FileUp,
  Upload,
  Download,
  FileText,
} from 'lucide-react';

interface ReRegistrationFeeItem {
  id?: string;
  name: string;
  amount: number;
  note?: string;
}

const DEFAULT_RE_REGISTRATION_FEES: Record<string, ReRegistrationFeeItem[]> = {
  S1: [
    { id: 'fee-1', name: 'SPP / UKT Tetap Semester 1', amount: 3500000, note: 'Biaya pokok semester 1' },
    { id: 'fee-2', name: 'Biaya Pengembangan Institusi (DPP)', amount: 2500000, note: 'Dapat diangsur 2x' },
    { id: 'fee-3', name: 'PKKMB, Jas Almamater & Atribut Kampus', amount: 850000, note: 'Paket resmi mahasiswa baru' },
    { id: 'fee-4', name: 'Layanan TI, Perpustakaan & Asuransi Mahasiswa', amount: 450000, note: 'Fasilitas digital kampus' },
  ],
  S2: [
    { id: 'fee-1', name: 'Biaya Matrikulasi Pascasarjana', amount: 2500000, note: 'Sekali bayar di awal' },
    { id: 'fee-2', name: 'SPP / UKT Tetap Semester 1 (S2)', amount: 6500000, note: 'Biaya kuliah semester 1' },
    { id: 'fee-3', name: 'Dana Pengembangan Akademik & Riset', amount: 3000000, note: 'Dapat diangsur 2x' },
    { id: 'fee-4', name: 'Layanan Perpustakaan Digital & Lab Riset', amount: 800000, note: 'Akses jurnal internasional' },
  ],
  S3: [
    { id: 'fee-1', name: 'Biaya Ujian Kualifikasi & Matrikulasi', amount: 3500000, note: 'Sekali bayar di awal' },
    { id: 'fee-2', name: 'SPP / UKT Tetap Semester 1 (S3)', amount: 10000000, note: 'Biaya kuliah semester 1' },
    { id: 'fee-3', name: 'Dana Kolaborasi Riset & Hibah Publikasi', amount: 5000000, note: 'Dapat diangsur' },
    { id: 'fee-4', name: 'Fasilitas Laboratorium Riset Doktoral', amount: 1500000, note: 'Akses fasilitas riset penuh' },
  ],
};

interface AdmissionBatch {
  id: string;
  name: string;
  academicYear: string;
  jenjang?: string;
  startDate: string;
  endDate: string;
  examDate?: string;
  announcementDate?: string;
  registrationFee: number;
  reRegistrationFee?: number;
  reRegistrationFees?: ReRegistrationFeeItem[];
  quota: number;
  availableJalur: string[];
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  isDefault: boolean;
  description?: string;
  applicantCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AdmissionBrochure {
  id: string;
  jenjang?: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  downloadCount: number;
  description?: string;
  updatedAt: string;
}

interface BatchSummary {
  totalBatches: number;
  activeBatchName: string;
  totalQuota: number;
  totalApplicants: number;
}

const DEFAULT_JALUR_OPTIONS = [
  'Jalur Prestasi Akademik (Bebas Tes)',
  'Jalur Nilai Rapor & Portofolio',
  'Jalur Mandiri Online (CBT)',
  'KIP-K & Beasiswa Nusantara',
  'Jalur Kemitraan & Rekomendasi',
];

export default function PmbGelombangPage() {
  const [batches, setBatches] = useState<AdmissionBatch[]>([]);
  const [summary, setSummary] = useState<BatchSummary>({
    totalBatches: 0,
    activeBatchName: '-',
    totalQuota: 0,
    totalApplicants: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [filterJenjang, setFilterJenjang] = useState<string>('Semua');

  // Brochure State
  const [brochure, setBrochure] = useState<AdmissionBrochure | null>(null);
  const [brochureModalOpen, setBrochureModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [brochureJenjang, setBrochureJenjang] = useState<string>('S1');
  const [brochureTitle, setBrochureTitle] = useState('Brosur PMB ITN Jenjang S1 TA 2027/2028');
  const [brochureDesc, setBrochureDesc] = useState('');
  const [isUploadingBrochure, setIsUploadingBrochure] = useState(false);
  const [brochureMessage, setBrochureMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [viewingFeesBatch, setViewingFeesBatch] = useState<AdmissionBatch | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '2027/2028',
    jenjang: 'S1',
    startDate: '',
    endDate: '',
    examDate: '',
    announcementDate: '',
    registrationFee: 200000,
    reRegistrationFee: 7300000,
    reRegistrationFees: DEFAULT_RE_REGISTRATION_FEES['S1'] as ReRegistrationFeeItem[],
    quota: 300,
    availableJalur: [
      'Jalur Prestasi Akademik (Bebas Tes)',
      'Jalur Nilai Rapor & Portofolio',
      'Jalur Mandiri Online (CBT)',
    ],
    status: 'OPEN' as 'OPEN' | 'UPCOMING' | 'CLOSED',
    isDefault: false,
    description: '',
  });

  const handleFeeChange = (index: number, field: keyof ReRegistrationFeeItem, value: any) => {
    const updated = [...formData.reRegistrationFees];
    updated[index] = { ...updated[index], [field]: value };
    const total = updated.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      reRegistrationFees: updated,
      reRegistrationFee: total,
    }));
  };

  const handleAddFeeItem = () => {
    const newItem: ReRegistrationFeeItem = {
      id: `fee-${Date.now()}`,
      name: '',
      amount: 500000,
      note: '',
    };
    const updated = [...formData.reRegistrationFees, newItem];
    const total = updated.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      reRegistrationFees: updated,
      reRegistrationFee: total,
    }));
  };

  const handleRemoveFeeItem = (index: number) => {
    const updated = formData.reRegistrationFees.filter((_, i) => i !== index);
    const total = updated.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      reRegistrationFees: updated,
      reRegistrationFee: total,
    }));
  };

  const apiBaseUrl = getApiBaseUrl();

  const fetchBrochure = async (jenjang?: string) => {
    const target = jenjang || brochureJenjang;
    try {
      const res = await fetch(`${apiBaseUrl}/admissions/brochure?jenjang=${target}`, { credentials: 'omit' });
      if (res.ok) {
        const json = await res.json();
        const payload = json.data !== undefined ? json.data : json;
        if (payload && payload.fileName) {
          setBrochure(payload);
          setBrochureTitle(payload.title || `Brosur PMB ITN Jenjang ${target} TA 2027/2028`);
        }
      }
    } catch {
      // Non-blocking fallback
    }
  };

  const handleSelectBrochureJenjang = (j: string) => {
    setBrochureJenjang(j);
    setBrochureTitle(`Brosur PMB ITN Jenjang ${j} TA 2027/2028`);
    setSelectedFile(null);
    setBrochureMessage(null);
    fetchBrochure(j);
  };

  const handleUploadBrochure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !brochure) {
      setBrochureMessage({ type: 'error', text: 'Pilih file brosur (PDF/Gambar) terlebih dahulu.' });
      return;
    }

    setIsUploadingBrochure(true);
    setBrochureMessage(null);

    try {
      let fileData: string | undefined;
      let fileName = brochure?.fileName || `Brosur-PMB-ITN-${brochureJenjang}-2027.pdf`;
      let fileSize = brochure?.fileSize || '2.4 MB';
      let fileSizeBytes = selectedFile?.size || 2516582;
      let mimeType = selectedFile?.type || 'application/pdf';

      if (selectedFile) {
        fileName = selectedFile.name;
        fileSizeBytes = selectedFile.size;
        mimeType = selectedFile.type || 'application/pdf';
        const mb = fileSizeBytes / (1024 * 1024);
        fileSize = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(fileSizeBytes / 1024)} KB`;

        // Read as base64
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const res = await fetch(`${apiBaseUrl}/admissions/brochure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenjang: brochureJenjang,
          title: brochureTitle,
          fileName,
          fileSize,
          fileSizeBytes,
          mimeType,
          fileData,
          description: brochureDesc,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengunggah file brosur ke server.');
      }

      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;
      setBrochure(payload);
      setBrochureMessage({ type: 'success', text: `Brosur Jenjang ${brochureJenjang} ("${fileName}") berhasil diunggah dan langsung aktif di portal PMB!` });
      setSelectedFile(null);
      setTimeout(() => {
        setBrochureModalOpen(false);
        setBrochureMessage(null);
      }, 1500);
    } catch (err: any) {
      setBrochureMessage({ type: 'error', text: err.message || 'Terjadi kesalahan saat upload brosur.' });
    } finally {
      setIsUploadingBrochure(false);
    }
  };

  const fetchBatches = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/admissions/batches`, { credentials: 'omit' });
      if (!res.ok) {
        throw new Error('Gagal memuat data gelombang pendaftaran dari server.');
      }
      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setBatches(list);

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
    fetchBrochure();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    const initialFees = DEFAULT_RE_REGISTRATION_FEES['S1'];
    const totalFee = initialFees.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setFormData({
      name: `Gelombang ${batches.length + 1}`,
      academicYear: '2027/2028',
      jenjang: 'S1',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      examDate: '',
      announcementDate: '',
      registrationFee: 250000,
      reRegistrationFee: totalFee,
      reRegistrationFees: [...initialFees],
      quota: 300,
      availableJalur: [
        'Jalur Prestasi Akademik (Bebas Tes)',
        'Jalur Nilai Rapor & Portofolio',
        'Jalur Mandiri Online (CBT)',
      ],
      status: 'UPCOMING',
      isDefault: false,
      description: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (batch: AdmissionBatch) => {
    setModalMode('edit');
    setEditingId(batch.id);
    const j = batch.jenjang || 'S1';
    const initialFees = (batch.reRegistrationFees && batch.reRegistrationFees.length > 0)
      ? batch.reRegistrationFees
      : (DEFAULT_RE_REGISTRATION_FEES[j] || DEFAULT_RE_REGISTRATION_FEES['S1']);
    const totalFee = batch.reRegistrationFee || initialFees.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    setFormData({
      name: batch.name,
      academicYear: batch.academicYear,
      jenjang: j,
      startDate: batch.startDate,
      endDate: batch.endDate,
      examDate: batch.examDate || '',
      announcementDate: batch.announcementDate || '',
      registrationFee: batch.registrationFee,
      reRegistrationFee: totalFee,
      reRegistrationFees: [...initialFees],
      quota: batch.quota,
      availableJalur: batch.availableJalur || [],
      status: batch.status,
      isDefault: batch.isDefault,
      description: batch.description || '',
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
      setFormError('Tanggal buka tidak boleh lebih besar dari tanggal tutup.');
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
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal menyimpan gelombang pendaftaran.');
      }

      setModalOpen(false);
      fetchBatches();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateBatch = async (id: string, name: string) => {
    if (!confirm(`Jadikan "${name}" sebagai periode pendaftaran aktif utama?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/batches/${id}/activate`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Gagal mengaktifkan gelombang.');
      fetchBatches();
    } catch (err: any) {
      alert(err.message || 'Terjadi gangguan saat mengaktifkan gelombang.');
    }
  };

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Hapus gelombang "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/batches/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || 'Gagal menghapus gelombang.');
      }
      fetchBatches();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus gelombang.');
    }
  };

  const toggleJalurCheckbox = (jalur: string) => {
    setFormData((prev) => {
      const exists = prev.availableJalur.includes(jalur);
      if (exists) {
        return {
          ...prev,
          availableJalur: prev.availableJalur.filter((j) => j !== jalur),
        };
      } else {
        return {
          ...prev,
          availableJalur: [...prev.availableJalur, jalur],
        };
      }
    });
  };

  const formatRupiah = (num: number) => {
    if (num === 0) return 'Gratis (Bebas Biaya)';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const activeBatch = useMemo(() => {
    const list = Array.isArray(batches) ? batches : [];
    return list.find((b) => b.isDefault) || list.find((b) => b.status === 'OPEN');
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const list = Array.isArray(batches) ? batches : [];
    if (filterJenjang === 'Semua') return list;
    return list.filter((b) => (b.jenjang || 'S1') === filterJenjang || b.jenjang === 'Semua Jenjang');
  }, [batches, filterJenjang]);

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/gelombang"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A]">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Gelombang & Jadwal Pendaftaran PMB
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Pengaturan periode gelombang pendaftaran, target kuota calon mahasiswa, jadwal seleksi, dan biaya formulir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Gelombang Baru</span>
            </button>

            <button
              onClick={() => {
                setBrochureMessage(null);
                setSelectedFile(null);
                fetchBrochure(brochureJenjang);
                setBrochureModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Upload Brosur PMB</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchBatches}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Gelombang</span>
              <span className="p-2 rounded-xl bg-blue-50 text-[#1E3A8A]">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{summary.totalBatches}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Periode dibuat</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gelombang Aktif</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-emerald-700 truncate">
                {activeBatch ? activeBatch.name : 'Tidak Ada'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Status buka saat ini</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Kuota</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">{summary.totalQuota}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Target penerimaan</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pendaftar Database</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-purple-600">{summary.totalApplicants}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Calon mahasiswa</div>
            </div>
          </div>
        </div>

        {/* Banner Gelombang Aktif Utama */}
        {activeBatch && (
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] text-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-[#D4A017]/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Periode Pendaftaran Aktif</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex flex-wrap items-center gap-2">
                  <span>{activeBatch.name}</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#D4A017] text-slate-950">
                    Jenjang {activeBatch.jenjang || 'S1'}
                  </span>
                  <span className="text-blue-200 text-sm font-semibold">&bull; TA {activeBatch.academicYear}</span>
                </h2>

                <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                  {activeBatch.description || 'Pendaftaran penerimaan mahasiswa baru sedang dibuka untuk umum.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#D4A017]" />
                    <span>
                      Periode:{' '}
                      <strong className="text-white">
                        {activeBatch.startDate} s/d {activeBatch.endDate}
                      </strong>
                    </span>
                  </div>

                  {activeBatch.examDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#D4A017]" />
                      <span>
                        Jadwal CBT: <strong className="text-white">{activeBatch.examDate}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#D4A017]" />
                    <span>
                      Biaya Formulir:{' '}
                      <strong className="text-white">{formatRupiah(activeBatch.registrationFee)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  onClick={() => openEditModal(activeBatch)}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#1E3A8A] font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs cursor-pointer text-center"
                >
                  Edit Pengaturan Gelombang Ini
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabel / Card Seluruh Gelombang */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="font-bold text-sm text-slate-800">
                Daftar Gelombang Pendaftaran ({filteredBatches.length})
              </h2>
              <p className="text-xs text-slate-500">
                Seluruh gelombang pendaftaran PMB yang telah dikonfigurasikan di sistem.
              </p>
            </div>

            {/* Filter Jenjang (Semua, S1, S2, S3) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <span className="px-2 text-slate-400 font-bold text-[10px] uppercase">Jenjang:</span>
              {['Semua', 'S1', 'S2', 'S3'].map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setFilterJenjang(j)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer text-xs ${
                    filterJenjang === j
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {j === 'Semua' ? 'Semua' : `Jenjang ${j}`}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">GELOMBANG & JENJANG</th>
                  <th className="py-3.5 px-4">PERIODE PENDAFTARAN</th>
                  <th className="py-3.5 px-4">JADWAL SELEKSI</th>
                  <th className="py-3.5 px-4">BIAYA FORMULIR</th>
                  <th className="py-3.5 px-4">BIAYA DAFTAR ULANG</th>
                  <th className="py-3.5 px-4 text-center">KUOTA</th>
                  <th className="py-3.5 px-4 text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-center">DEFAULT</th>
                  <th className="py-3.5 px-4 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
                      <span>Memuat data gelombang...</span>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Tidak ada gelombang pendaftaran untuk filter Jenjang {filterJenjang}.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        batch.isDefault ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {batch.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/70">
                            {batch.jenjang ? `Jenjang ${batch.jenjang}` : 'Jenjang S1'}
                          </span>
                          <span className="text-slate-400 text-[11px]">&bull;</span>
                          <span className="text-[11px] text-slate-500">TA {batch.academicYear}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {batch.startDate} s/d {batch.endDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700">
                          Tes: <span className="font-semibold">{batch.examDate || '-'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Hasil: {batch.announcementDate || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {formatRupiah(batch.registrationFee)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[#1E3A8A]">
                          {formatRupiah(batch.reRegistrationFee || 0)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingFeesBatch(batch)}
                          className="text-[11px] text-[#D4A017] hover:underline font-bold flex items-center gap-1 mt-0.5 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{batch.reRegistrationFees?.length || 4} Komponen Biaya</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {batch.quota} mhs
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {batch.status === 'OPEN' ? (
                          <span className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Sedang Buka</span>
                          </span>
                        ) : batch.status === 'UPCOMING' ? (
                          <span className="text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span>Akan Datang</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                            <span>Ditutup</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {batch.isDefault ? (
                          <span className="inline-flex items-center gap-1 text-[#1E3A8A] font-black text-xs">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span>Utama</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleActivateBatch(batch.id, batch.name)}
                            title="Jadikan gelombang aktif utama"
                            className="px-2.5 py-1 rounded-lg border border-slate-300 hover:border-[#1E3A8A] text-slate-600 hover:text-[#1E3A8A] text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Aktifkan
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(batch)}
                            title="Edit Gelombang"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 transition-colors cursor-pointer"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL TAMBAH / EDIT GELOMBANG */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#1E3A8A]" />
                  <span>
                    {modalMode === 'create'
                      ? 'Tambah Gelombang Pendaftaran Baru'
                      : 'Edit Gelombang Pendaftaran'}
                  </span>
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      <option value="S1">Jenjang S1 (Sarjana)</option>
                      <option value="S2">Jenjang S2 (Magister)</option>
                      <option value="S3">Jenjang S3 (Doktor)</option>
                      <option value="Semua Jenjang">Semua Jenjang (S1 / S2 / S3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Status Gelombang
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
                    >
                      <option value="OPEN">OPEN (Sedang Buka)</option>
                      <option value="UPCOMING">UPCOMING (Akan Datang)</option>
                      <option value="CLOSED">CLOSED (Ditutup)</option>
                    </select>
                  </div>

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

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jadwal Ujian Seleksi / CBT (Opsional)
                    </label>
                    <input
                      type="date"
                      value={formData.examDate}
                      onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pengumuman Hasil Seleksi (Opsional)
                    </label>
                    <input
                      type="date"
                      value={formData.announcementDate}
                      onChange={(e) => setFormData({ ...formData, announcementDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Biaya Formulir Pendaftaran (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.registrationFee}
                      onChange={(e) =>
                        setFormData({ ...formData, registrationFee: Number(e.target.value) })
                      }
                      placeholder="200000"
                      step={50000}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Isi 0 jika pendaftaran gratis.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Target Kuota Pendaftar (Orang)
                    </label>
                    <input
                      type="number"
                      value={formData.quota}
                      onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                      placeholder="350"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                {/* Daftar Biaya Daftar Ulang (Rincian Komponen) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                    <div>
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#1E3A8A]" />
                        <span>Daftar Rincian Biaya Daftar Ulang (Registrasi Ulang)</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Rincian komponen biaya yang wajib diselesaikan calon mahasiswa baru setelah dinyatakan lulus seleksi.
                      </p>
                    </div>
                    <div className="text-left sm:text-right bg-blue-50/80 p-2 sm:p-0 rounded-xl sm:bg-transparent">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Biaya Daftar Ulang</span>
                      <span className="font-mono font-black text-sm sm:text-base text-[#1E3A8A]">
                        {formatRupiah(formData.reRegistrationFee)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {formData.reRegistrationFees.map((fee, idx) => (
                      <div
                        key={fee.id || idx}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs"
                      >
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-slate-400 block sm:hidden mb-0.5">Nama Komponen</span>
                          <input
                            type="text"
                            value={fee.name}
                            onChange={(e) => handleFeeChange(idx, 'name', e.target.value)}
                            placeholder="Contoh: SPP / UKT Tetap Semester 1"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-medium"
                            required
                          />
                        </div>
                        <div className="w-full sm:w-36">
                          <span className="text-[10px] font-bold text-slate-400 block sm:hidden mb-0.5">Nominal (Rp)</span>
                          <input
                            type="number"
                            value={fee.amount}
                            onChange={(e) => handleFeeChange(idx, 'amount', Number(e.target.value))}
                            placeholder="Nominal (Rp)"
                            step={50000}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-mono font-bold text-[#1E3A8A]"
                            required
                          />
                        </div>
                        <div className="w-full sm:w-44">
                          <span className="text-[10px] font-bold text-slate-400 block sm:hidden mb-0.5">Catatan / Keterangan</span>
                          <input
                            type="text"
                            value={fee.note || ''}
                            onChange={(e) => handleFeeChange(idx, 'note', e.target.value)}
                            placeholder="Catatan (misal: Dapat diangsur 2x)"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeeItem(idx)}
                          disabled={formData.reRegistrationFees.length <= 1}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 cursor-pointer self-end sm:self-center transition-colors"
                          title="Hapus komponen ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleAddFeeItem}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Komponen Biaya</span>
                    </button>

                    <div className="text-xs text-slate-500 font-medium">
                      {formData.reRegistrationFees.length} Komponen Terdaftar
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    Jalur Seleksi yang Dibuka di Gelombang Ini
                  </label>
                  <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {DEFAULT_JALUR_OPTIONS.map((jalur) => {
                      const isChecked = formData.availableJalur.includes(jalur);
                      return (
                        <label
                          key={jalur}
                          className="flex items-center gap-2 cursor-pointer hover:text-[#1E3A8A] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleJalurCheckbox(jalur)}
                            className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                          />
                          <span className={isChecked ? 'font-bold text-slate-800' : 'text-slate-600'}>
                            {jalur}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan / Keterangan Gelombang
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Gelombang awal dengan kuota terbatas dan beasiswa potongan UKT..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                    <span className="font-bold text-[#1E3A8A]">
                      Jadikan sebagai Gelombang Aktif Utama (Default Publik PMB)
                    </span>
                  </label>
                  <p className="text-[11px] text-blue-700 mt-1 pl-6">
                    Jika dicentang, gelombang ini akan otomatis tampil di landing page pendaftaran bagi calon mahasiswa baru.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Gelombang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Upload Brosur PMB */}
        {brochureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-[#D4A017]">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Upload Brosur PMB
                    </h2>
                    <p className="text-xs text-slate-500">
                      Unggah dokumen brosur resmi PMB untuk dapat diunduh oleh calon mahasiswa baru.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBrochureModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {brochureMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    brochureMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {brochureMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{brochureMessage.text}</span>
                </div>
              )}

              {/* Tab Pemilihan Jenjang Brosur */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Pilih Jenjang Brosur:
                  </label>
                  <span className="text-[11px] font-bold text-[#1E3A8A]">
                    Aktif: Jenjang {brochureJenjang}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {['S1', 'S2', 'S3', 'Semua Jenjang'].map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => handleSelectBrochureJenjang(j)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                        brochureJenjang === j
                          ? 'bg-[#1E3A8A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Brosur Saat Ini */}
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/60 text-xs">
                  <span className="font-semibold text-slate-500">Berkas Aktif di Portal PMB:</span>
                  <span className="font-bold text-[#1E3A8A]">Jenjang {brochure?.jenjang || brochureJenjang}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-200">
                      PDF
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {brochure?.fileName || `Brosur-PMB-ITN-${brochureJenjang}-2027.pdf`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {brochure?.fileSize || '2.4 MB'} &bull; {brochure?.downloadCount || 0} kali diunduh
                      </p>
                    </div>
                  </div>
                  <a
                    href={brochure?.fileUrl || `/downloads/brosur-pmb-${brochureJenjang.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>Lihat</span>
                  </a>
                </div>
              </div>

              {/* Form Upload Brosur Baru */}
              <form onSubmit={handleUploadBrochure} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pilih Berkas Brosur Baru Jenjang {brochureJenjang} (PDF / Gambar)
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-[#1E3A8A] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/40">
                    <Upload className="w-7 h-7 text-[#1E3A8A] mb-2" />
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedFile ? selectedFile.name : `Klik untuk memilih file brosur Jenjang ${brochureJenjang}`}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {selectedFile
                        ? `Ukuran: ${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : 'Format PDF, JPG, atau PNG (Maks. 15 MB)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Publikasi Brosur
                  </label>
                  <input
                    type="text"
                    value={brochureTitle}
                    onChange={(e) => setBrochureTitle(e.target.value)}
                    placeholder={`Contoh: Brosur PMB ITN Jenjang ${brochureJenjang} TA 2027/2028`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Keterangan Singkat (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={brochureDesc}
                    onChange={(e) => setBrochureDesc(e.target.value)}
                    placeholder={`Contoh: Brosur resmi lengkap program studi Jenjang ${brochureJenjang}, rincian beasiswa, dan syarat registrasi...`}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBrochureModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isUploadingBrochure || !selectedFile}
                    className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isUploadingBrochure ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <FileUp className="w-3.5 h-3.5 text-[#D4A017]" />
                        <span>Simpan & Publikasikan Brosur {brochureJenjang}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Lihat Rincian Biaya Daftar Ulang */}
        {viewingFeesBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#1E3A8A]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Rincian Biaya Daftar Ulang
                    </h2>
                    <p className="text-xs text-slate-500">
                      {viewingFeesBatch.name} &bull; Jenjang {viewingFeesBatch.jenjang || 'S1'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingFeesBatch(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Biaya Formulir Pendaftaran</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatRupiah(viewingFeesBatch.registrationFee)}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  <span className="font-bold text-slate-800 block text-xs">Komponen Biaya Daftar Ulang (Registrasi Ulang):</span>
                  {(viewingFeesBatch.reRegistrationFees && viewingFeesBatch.reRegistrationFees.length > 0
                    ? viewingFeesBatch.reRegistrationFees
                    : DEFAULT_RE_REGISTRATION_FEES[viewingFeesBatch.jenjang || 'S1'] || DEFAULT_RE_REGISTRATION_FEES['S1']
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.note && <p className="text-[11px] text-slate-500 mt-0.5">{item.note}</p>}
                      </div>
                      <span className="font-mono font-bold text-[#1E3A8A] shrink-0">
                        {formatRupiah(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between mt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Biaya Daftar Ulang</span>
                    <span className="text-[11px] text-blue-900">Dapat diangsur sesuai jadwal registrasi</span>
                  </div>
                  <span className="font-mono font-black text-base text-[#1E3A8A]">
                    {formatRupiah(viewingFeesBatch.reRegistrationFee || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setViewingFeesBatch(null)}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold text-xs hover:bg-[#172554] transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
