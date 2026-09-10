'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileCode,
  FolderLock,
  ExternalLink,
  Eye,
  Trash2,
  Copy,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  ShieldCheck,
  X,
  Upload,
  Check,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export interface DocumentItem {
  id: string;
  code: string;
  title: string;
  category: 'Panduan & Renstra' | 'Regulasi & SK Rektor' | 'Template Proposal' | 'Instrumen Borang';
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'ZIP';
  fileSize: string;
  version: string;
  academicYear: string;
  updatedAt: string;
  downloadsCount: number;
  accessLevel: 'Publik' | 'Dosen & Reviewer' | 'Khusus Tim LP3M';
  description: string;
  author: string;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'DOC-2026-001',
    code: 'RENSTRA-LP3M-2026',
    title: 'Rencana Strategis (RENSTRA) Penelitian & Pengabdian kepada Masyarakat 2024-2028',
    category: 'Panduan & Renstra',
    fileType: 'PDF',
    fileSize: '6.4 MB',
    version: 'Edisi Revisi 2.1',
    academicYear: '2024 - 2028',
    updatedAt: '15 Jan 2026',
    downloadsCount: 582,
    accessLevel: 'Publik',
    description: 'Peta jalan (roadmap) riset institusi, fokus riset unggulan kecerdasan buatan, energi terbarukan, dan pemberdayaan UMKM pesisir.',
    author: 'Dewan Riset LP3M',
  },
  {
    id: 'DOC-2026-002',
    code: 'PANDUAN-HIBAH-2026',
    title: 'Buku Panduan Pelaksanaan Hibah Penelitian & Pengabdian Internal Tahun Anggaran 2026',
    category: 'Panduan & Renstra',
    fileType: 'PDF',
    fileSize: '4.8 MB',
    version: 'Rev. 3.2',
    academicYear: '2026/2027',
    updatedAt: '10 Jan 2026',
    downloadsCount: 1240,
    accessLevel: 'Publik',
    description: 'Pedoman lengkap tata cara pengajuan usulan, kriteria penilaian reviewer, jadwal tahapan monev, dan luaran wajib.',
    author: 'Tim Kurasi LP3M',
  },
  {
    id: 'DOC-2026-003',
    code: 'SK-REK-014-2026',
    title: 'SK Rektor No. 014/REK/2026: Standar Biaya Masukan (SBM) & Honorarium Peneliti',
    category: 'Regulasi & SK Rektor',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    version: 'SK Resmi',
    academicYear: '2026',
    updatedAt: '05 Jan 2026',
    downloadsCount: 730,
    accessLevel: 'Dosen & Reviewer',
    description: 'Ketetapan plafon biaya operasional penelitian, belanja bahan laboratorium, biaya publikasi internasional, dan insentif HAKI.',
    author: 'Biro Hukum & Rektorat',
  },
  {
    id: 'DOC-2026-004',
    code: 'SK-REK-029-2026',
    title: 'SK Penetapan Dewan Reviewer Internal & Eksternal LP3M Tahun 2026',
    category: 'Regulasi & SK Rektor',
    fileType: 'PDF',
    fileSize: '950 KB',
    version: 'SK Resmi',
    academicYear: '2026',
    updatedAt: '08 Jan 2026',
    downloadsCount: 310,
    accessLevel: 'Khusus Tim LP3M',
    description: 'Daftar nama reviewer bersertifikat nasional yang berwenang melakukan penilaian proposal dan laporan kemajuan riset.',
    author: 'Biro Kepegawaian',
  },
  {
    id: 'DOC-2026-005',
    code: 'TMP-PROP-LIT-2026',
    title: 'Template Dokumen Usulan Proposal Penelitian Fundamental & Terapan (Word .docx)',
    category: 'Template Proposal',
    fileType: 'DOCX',
    fileSize: '850 KB',
    version: 'v2026.1',
    academicYear: '2026',
    updatedAt: '18 Jan 2026',
    downloadsCount: 2150,
    accessLevel: 'Publik',
    description: 'Format baku halaman judul, lembar pengesahan dekan, sistematika proposal, metode penelitian, dan jadwal kegiatan Gantt Chart.',
    author: 'Subbag Publikasi',
  },
  {
    id: 'DOC-2026-006',
    code: 'TMP-RAB-EXCEL-2026',
    title: 'Template Rencana Anggaran Biaya (RAB) Otomatis Sesuai SBM Terkini (Excel .xlsx)',
    category: 'Template Proposal',
    fileType: 'XLSX',
    fileSize: '420 KB',
    version: 'v2026.2',
    academicYear: '2026',
    updatedAt: '20 Jan 2026',
    downloadsCount: 1840,
    accessLevel: 'Publik',
    description: 'Formula spreadsheet terstandarisasi untuk perhitungan biaya bahan habis pakai, perjalanan dinas, honor surveyor, dan pelaporan pajak.',
    author: 'Tim Keuangan Riset',
  },
  {
    id: 'DOC-2026-007',
    code: 'TMP-PKM-LAP-2026',
    title: 'Format Laporan Akhir & Logbook Kegiatan Pengabdian kepada Masyarakat (PkM)',
    category: 'Template Proposal',
    fileType: 'DOCX',
    fileSize: '1.1 MB',
    version: 'v2026.0',
    academicYear: '2026',
    updatedAt: '22 Jan 2026',
    downloadsCount: 920,
    accessLevel: 'Publik',
    description: 'Template laporan pertanggungjawaban program kemitraan masyarakat disertai bukti dokumentasi dan surat kepuasan mitra.',
    author: 'Divisi Pengabdian PkM',
  },
  {
    id: 'DOC-2026-008',
    code: 'BOR-BANPT-9STD',
    title: 'Matriks Borang Akreditasi LKPS & LED Kriteria C.6 & C.7 (Standar 9 BAN-PT)',
    category: 'Instrumen Borang',
    fileType: 'XLSX',
    fileSize: '2.4 MB',
    version: 'Instrumen 2026',
    academicYear: '2026',
    updatedAt: '28 Jan 2026',
    downloadsCount: 460,
    accessLevel: 'Dosen & Reviewer',
    description: 'Tabel perhitungan data kuantitatif penelitian/PkM dosen tetap program studi (DTPS) untuk borang akreditasi BAN-PT & LAM.',
    author: 'Tim Penjaminan Mutu & LP3M',
  },
  {
    id: 'DOC-2026-009',
    code: 'BOR-HAKI-PANDUAN',
    title: 'Panduan & Formulir Pengajuan Perlindungan Hak Cipta & Paten DJKI Kemenkumham',
    category: 'Instrumen Borang',
    fileType: 'PDF',
    fileSize: '3.1 MB',
    version: 'v2026',
    academicYear: '2026',
    updatedAt: '02 Feb 2026',
    downloadsCount: 380,
    accessLevel: 'Publik',
    description: 'SOP pengajuan sertifikat HAKI dosen, surat pernyataan pengalihan hak cipta, dan format deskripsi klaim paten teknologi.',
    author: 'Sentra HAKI LP3M',
  },
];

export default function BankDokumenPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Upload State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    code: '',
    category: 'Panduan & Renstra' as DocumentItem['category'],
    fileType: 'PDF' as DocumentItem['fileType'],
    version: 'v2026.1',
    accessLevel: 'Publik' as DocumentItem['accessLevel'],
    description: '',
    author: 'LP3M ITN',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Semua') params.append('category', selectedCategory);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lp3m/documents?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.data || json.data || [];
        setDocuments(data);
      }
    } catch (err) {
      console.warn('Gagal memuat dokumen dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedCategory, searchTerm]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchCategory = selectedCategory === 'Semua' || doc.category === selectedCategory;
      return matchCategory;
    });
  }, [documents, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: documents.length,
      panduan: documents.filter((d) => d.category === 'Panduan & Renstra').length,
      regulasi: documents.filter((d) => d.category === 'Regulasi & SK Rektor').length,
      template: documents.filter((d) => d.category === 'Template Proposal').length,
      borang: documents.filter((d) => d.category === 'Instrumen Borang').length,
      totalDownloads: documents.reduce((acc, curr) => acc + (curr.downloadsCount || 0), 0),
    };
  }, [documents]);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await fetch(`${apiBase}/lp3m/documents/${doc.id}/download`, { method: 'POST' });
      fetchDocs();
    } catch (e) {
      // ignore
    }
    showToast(`Mengunduh berkas [${doc.fileType}] ${doc.title}...`);
  };

  const handleCopyLink = (doc: DocumentItem) => {
    navigator.clipboard?.writeText?.(window.location.origin + `/admin/p3m/dokumen?file=${doc.code}`);
    showToast(`Tautan unduhan dokumen "${doc.code}" berhasil disalin ke papan klip.`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus arsip dokumen: "${title}" dari database?`)) {
      try {
        const res = await fetch(`${apiBase}/lp3m/documents/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Dokumen "${title}" berhasil dihapus dari database.`);
          fetchDocs();
        } else {
          showToast('Gagal menghapus dokumen.');
        }
      } catch (err) {
        showToast('Koneksi database terganggu.');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) return;

    try {
      const res = await fetch(`${apiBase}/lp3m/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadForm),
      });

      if (res.ok) {
        showToast(`Dokumen baru "${uploadForm.title}" berhasil diunggah ke basis data.`);
        setIsUploadModalOpen(false);
        setUploadForm({
          title: '',
          code: '',
          category: 'Panduan & Renstra',
          fileType: 'PDF',
          version: 'v2026.1',
          accessLevel: 'Publik',
          description: '',
          author: 'LP3M ITN',
        });
        fetchDocs();
      } else {
        showToast('Gagal menyimpan dokumen ke database.');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan.');
    }
  };

  const getFileTypeBadge = (type: DocumentItem['fileType']) => {
    switch (type) {
      case 'PDF':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700">PDF</span>;
      case 'DOCX':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700">WORD</span>;
      case 'XLSX':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-700">EXCEL</span>;
      case 'ZIP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-700">ZIP</span>;
    }
  };

  return (
    <PortalLayout
      role="lp3m"
      userName="Prof. Dr. Ir. H. Sudirman, M.T."
      userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi"
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner LP3M Bank Dokumen */}
        <div className="bg-gradient-to-r from-[#091a44] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Bank Dokumen & Regulasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight flex items-center gap-2.5">
              <span>Bank Dokumen, Regulasi & Panduan Riset</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed">
              Repositori resmi pedoman riset internal & BIMA Kemdikbud, Standar Biaya Masukan (SBM), SK Rektor, 
              template proposal terstandarisasi, dan instrumen borang akreditasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>+ Unggah Dokumen Baru</span>
            </button>
            <Link
              href="/admin/p3m/borang"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Rekap Borang Akreditasi</span>
            </Link>
          </div>

          <FileText className="absolute right-[-20px] bottom-[-30px] w-64 h-64 text-white/5 pointer-events-none" />
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Arsip Dokumen</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-blue-700">{stats.totalDownloads}</strong> Total Pengunduhan
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Buku Panduan & Renstra</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.panduan}</p>
            <p className="text-xs text-slate-500 mt-1">Pedoman Penelitian & PkM</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SK & Regulasi SBM</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.regulasi}</p>
            <p className="text-xs text-slate-500 mt-1">Ketetapan Resmi Rektor</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Template Proposal & RAB</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.template}</p>
            <p className="text-xs text-slate-500 mt-1">Format Word & Excel Resmi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Instrumen Borang</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.borang}</p>
            <p className="text-xs text-slate-500 mt-1">Standar BAN-PT / LAM-PT</p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {['Semua', 'Panduan & Renstra', 'Regulasi & SK Rektor', 'Template Proposal', 'Instrumen Borang'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-100 text-[#1E3A8A]' : 'bg-slate-100 text-slate-600'
                }`}
                title="Tampilan Grid Kartu"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-100 text-[#1E3A8A]' : 'bg-slate-100 text-slate-600'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari berdasarkan nama dokumen, kode arsip, nomor SK Rektor, atau deskripsi..."
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
            />
          </div>
        </div>

        {/* CONTENT VIEW: GRID OR TABLE */}
        {filteredDocs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">Tidak Ditemukan Dokumen yang Cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan periksa kata kunci pencarian atau ganti filter kategori dokumen yang Anda pilih.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#1E3A8A] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {getFileTypeBadge(doc.fileType)}
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        {doc.code}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {doc.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-[#1E3A8A] transition-colors mb-2">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {doc.updatedAt}
                    </span>
                    <span className="font-medium text-slate-600">{doc.fileSize} &bull; {doc.downloadsCount}x unduh</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </button>
                    <button
                      onClick={() => setSelectedDocPreview(doc)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Pratinjau Dokumen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleCopyLink(doc)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Salin Tautan"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Kode & Tipe</th>
                    <th className="px-4 py-3">Nama Dokumen & Deskripsi</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Versi / Tahun</th>
                    <th className="px-4 py-3">Ukuran & Unduhan</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getFileTypeBadge(doc.fileType)}
                          <span className="font-mono text-[11px] font-bold text-slate-700">{doc.code}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">{doc.accessLevel}</span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-bold text-slate-900 text-xs mb-0.5">{doc.title}</p>
                        <p className="text-[11px] text-slate-500 leading-snug">{doc.description}</p>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-[11px] block">{doc.version}</span>
                        <span className="text-[10px] text-slate-400">{doc.academicYear}</span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className="font-semibold text-slate-700 block">{doc.fileSize}</span>
                        <span className="text-[10px] text-slate-400">{doc.downloadsCount} kali diunduh</span>
                      </td>
                      <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 font-bold transition-colors cursor-pointer"
                            title="Unduh Berkas"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDocPreview(doc)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Pratinjau"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(doc)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Salin Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: PRATINJAU DOKUMEN */}
        {selectedDocPreview && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  {getFileTypeBadge(selectedDocPreview.fileType)}
                  <span className="text-xs font-mono font-bold text-slate-500">{selectedDocPreview.code}</span>
                </div>
                <button
                  onClick={() => setSelectedDocPreview(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {selectedDocPreview.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {selectedDocPreview.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kategori</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDocPreview.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Versi / Edisi</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDocPreview.version}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Ukuran File</span>
                    <span className="text-xs font-bold text-slate-800">{selectedDocPreview.fileSize}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Hak Akses</span>
                    <span className="text-xs font-bold text-emerald-700">{selectedDocPreview.accessLevel}</span>
                  </div>
                </div>

                {/* Simulated Viewer Box */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50">
                  <FileText className="w-16 h-16 text-[#1E3A8A] mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-xs text-slate-800">
                    Pratinjau Siap untuk Berkas Resmi LP3M
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Dokumen ini telah ditandatangani secara digital dengan stempel elektronik perguruan tinggi dan dewan riset.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedDocPreview(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      handleDownload(selectedDocPreview);
                      setSelectedDocPreview(null);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Berkas Asli ({selectedDocPreview.fileSize})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: UNGGAH DOKUMEN BARU */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Unggah Dokumen / Regulasi Baru</h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Resmi Dokumen <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="Contoh: SK Rektor tentang Standar Biaya Masukan Penelitian TA 2026..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kategori Dokumen <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="Panduan & Renstra">Panduan & Renstra</option>
                      <option value="Regulasi & SK Rektor">Regulasi & SK Rektor</option>
                      <option value="Template Proposal">Template Proposal</option>
                      <option value="Instrumen Borang">Instrumen Borang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Format Berkas <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={uploadForm.fileType}
                      onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value as any })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    >
                      <option value="PDF">PDF (Portable Document Format)</option>
                      <option value="DOCX">Word (.docx / .doc)</option>
                      <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
                      <option value="ZIP">Arsip Berkas (.zip / .rar)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode / Nomor SK
                    </label>
                    <input
                      type="text"
                      value={uploadForm.code}
                      onChange={(e) => setUploadForm({ ...uploadForm, code: e.target.value })}
                      placeholder="Contoh: SK-019/LP3M/2026"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Versi / Edisi
                    </label>
                    <input
                      type="text"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                      placeholder="Contoh: Rev 2.0 atau 2026"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hak Akses Pengunduh
                  </label>
                  <select
                    value={uploadForm.accessLevel}
                    onChange={(e) => setUploadForm({ ...uploadForm, accessLevel: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Publik">Publik (Semua Dosen & Mahasiswa)</option>
                    <option value="Dosen & Reviewer">Dosen & Reviewer Saja</option>
                    <option value="Khusus Tim LP3M">Khusus Tim Pengelola LP3M</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Ringkas Dokumen
                  </label>
                  <textarea
                    rows={2}
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Tuliskan isi pokok ringkas dari dokumen ini..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                {/* Upload Zone Dummy */}
                <div className="border-2 border-dashed border-slate-200 hover:border-[#1E3A8A] rounded-2xl p-5 text-center transition-colors cursor-pointer bg-slate-50/50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Pilih berkas dari komputer atau tarik ke sini</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Maksimal ukuran berkas 25 MB (.pdf, .docx, .xlsx, .zip)</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Unggah & Publikasikan
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
