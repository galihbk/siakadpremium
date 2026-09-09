'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Mail,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Eye,
  X,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Building,
  Sparkles,
  ChevronRight,
  Info,
  Calendar,
  Send,
  Upload,
  User,
  GraduationCap,
  Filter,
  Check,
  BookOpen,
} from 'lucide-react';

interface LetterRequest {
  id: string;
  nomorSurat: string;
  jenisSurat: string;
  keperluan: string;
  tujuanInstansi: string;
  ditujukanKepada: string;
  tanggalPengajuan: string;
  tanggalSelesai?: string;
  status: 'SELESAI' | 'DIPROSES' | 'VERIFIKASI_PA' | 'DITOLAK';
  statusLabel: string;
  dosenPaStatus: 'DISETUJUI' | 'MENUNGGU' | 'DITOLAK';
  baakStatus: 'TERVERIFIKASI' | 'DALAM_PROSES' | 'MENUNGGU';
  alasanPenolakan?: string;
  isiSurat?: string;
}

const INITIAL_LETTERS: LetterRequest[] = [
  {
    id: 'req-001',
    nomorSurat: '421.4/ITN-BAAK/IX/2026/089',
    jenisSurat: 'Surat Keterangan Aktif Kuliah (SKAK)',
    keperluan: 'Kelengkapan Tunjangan Gaji Anak PNS / BPJS Kesehatan',
    tujuanInstansi: 'Badan Kepegawaian Negara (BKN) Kantor Regional III',
    ditujukanKepada: 'Kepala Subbagian Kepegawaian & Umum',
    tanggalPengajuan: '05 September 2026',
    tanggalSelesai: '05 September 2026',
    status: 'SELESAI',
    statusLabel: 'Selesai & Siap Unduh',
    dosenPaStatus: 'DISETUJUI',
    baakStatus: 'TERVERIFIKASI',
    isiSurat: 'Yang bertanda tangan di bawah ini Wakil Rektor Bidang Akademik Institut Teknologi Nusantara menerangkan dengan sebenarnya bahwa mahasiswa atas nama Muhammad Rizky Pratama (NIM: 2311501001) adalah benar-benar mahasiswa terdaftar aktif pada Program Studi S1 Teknik Informatika Semester Gasal Tahun Akademik 2026/2027.',
  },
  {
    id: 'req-002',
    nomorSurat: '422.1/ITN-FTI/IX/2026/042',
    jenisSurat: 'Surat Pengantar Kerja Praktik (KP) / Magang',
    keperluan: 'Permohonan Magang Industri Software Engineering (3 Bulan)',
    tujuanInstansi: 'PT Telkom Indonesia (Persero) Tbk - Divisi Digital Business',
    ditujukanKepada: 'Head of Human Capital Development',
    tanggalPengajuan: '07 September 2026',
    tanggalSelesai: '08 September 2026',
    status: 'SELESAI',
    statusLabel: 'Selesai & Siap Unduh',
    dosenPaStatus: 'DISETUJUI',
    baakStatus: 'TERVERIFIKASI',
    isiSurat: 'Sehubungan dengan kurikulum Program Studi S1 Teknik Informatika Institut Teknologi Nusantara yang mewajibkan pelaksanaan Kerja Praktik (KP), kami mohon kesediaan Bapak/Ibu untuk menerima mahasiswa kami melaksanakan kegiatan Kerja Praktik di PT Telkom Indonesia.',
  },
  {
    id: 'req-003',
    nomorSurat: '423.5/ITN-BAAK/IX/2026/PND-019',
    jenisSurat: 'Surat Izin Penelitian & Pengambilan Data Skripsi',
    keperluan: 'Pengambilan Dataset AI Citra Medis untuk Proyek Riset',
    tujuanInstansi: 'RSUD Al-Ihsan Provinsi Jawa Barat',
    ditujukanKepada: 'Direktur Pelayanan Medis & Penelitian',
    tanggalPengajuan: '08 September 2026',
    status: 'DIPROSES',
    statusLabel: 'Sedang Diproses BAAK',
    dosenPaStatus: 'DISETUJUI',
    baakStatus: 'DALAM_PROSES',
  },
  {
    id: 'req-004',
    nomorSurat: '424.2/ITN-FTI/IX/2026/RKM-008',
    jenisSurat: 'Surat Rekomendasi Beasiswa Prestasi',
    keperluan: 'Pengajuan Beasiswa Unggulan Kemendikbudristek 2026',
    tujuanInstansi: 'Pusat Layanan Pembiayaan Pendidikan (Puslapdik)',
    ditujukanKepada: 'Ketua Tim Seleksi Beasiswa Unggulan',
    tanggalPengajuan: '09 September 2026',
    status: 'VERIFIKASI_PA',
    statusLabel: 'Menunggu Verifikasi Dosen PA',
    dosenPaStatus: 'MENUNGGU',
    baakStatus: 'MENUNGGU',
  },
];

const KATALOG_SURAT = [
  {
    kode: 'SKAK',
    nama: 'Surat Keterangan Aktif Kuliah (SKAK)',
    deskripsi: 'Surat resmi yang menerangkan status aktif mahasiswa pada semester berjalan.',
    keperluanContoh: 'Tunjangan anak PNS/BUMN/Swasta, BPJS, Visa, atau pembuatan paspor.',
    durasi: 'Instan (Digital)',
    syarat: 'Status akademik aktif & UKT semester berjalan lunas.',
    icon: GraduationCap,
    badgeColor: 'bg-blue-50 text-[#1E3A8A] border-blue-200',
  },
  {
    kode: 'SKP',
    nama: 'Surat Pengantar Kerja Praktik (KP) / Magang',
    deskripsi: 'Surat permohonan resmi dari fakultas untuk pelaksanaan magang di instansi/perusahaan.',
    keperluanContoh: 'Magang BUMN, MSIB, atau magang mandiri di industri teknologi.',
    durasi: '1 - 2 Hari Kerja',
    syarat: 'Telah menempuh minimal 75 SKS & disetujui Dosen PA.',
    icon: Building,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    kode: 'SIP',
    nama: 'Surat Izin Penelitian / Pengambilan Data',
    deskripsi: 'Surat permohonan izin observasi lapangan, kuesioner, atau wawancara untuk Tugas Akhir.',
    keperluanContoh: 'Pengambilan sampel data di rumah sakit, instansi pemerintah, atau perusahaan.',
    durasi: '1 - 2 Hari Kerja',
    syarat: 'Proposal Tugas Akhir telah disetujui Pembimbing.',
    icon: FileText,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    kode: 'SRB',
    nama: 'Surat Rekomendasi Beasiswa & Kompetisi',
    deskripsi: 'Rekomendasi tertulis dari Ketua Program Studi atau Dekan untuk pendaftaran beasiswa.',
    keperluanContoh: 'Beasiswa Unggulan, Djarum Beasiswa Plus, IISMA, atau lomba internasional.',
    durasi: '2 Hari Kerja',
    syarat: 'IPK minimal 3.25 & tidak sedang menerima beasiswa ganda.',
    icon: Sparkles,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    kode: 'SKBB',
    nama: 'Surat Keterangan Berkelakuan Baik (SKBB)',
    deskripsi: 'Surat keterangan mahasiswa tidak pernah melanggar kode etik dan tata tertib kampus.',
    keperluanContoh: 'Perekrutan kerja (BUMN/Instansi Pemerintah), pertukaran mahasiswa luar negeri.',
    durasi: '1 Hari Kerja',
    syarat: 'Tidak sedang menjalani sanksi pelanggaran etika akademik.',
    icon: ShieldCheck,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    kode: 'SKBP',
    nama: 'Surat Keterangan Bebas Perpustakaan & Lab',
    deskripsi: 'Keterangan tidak memiliki tanggungan peminjaman buku atau alat laboratorium.',
    keperluanContoh: 'Kelengkapan pendaftaran sidang Tugas Akhir dan Yudisium kelulusan.',
    durasi: 'Instan (Sistem Terpadu)',
    syarat: 'Semua pinjaman koleksi perpustakaan & lab telah dikembalikan.',
    icon: BookOpen,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

export default function LayananSuratPage() {
  const [letters, setLetters] = useState<LetterRequest[]>(INITIAL_LETTERS);
  const [activeTab, setActiveTab] = useState<'semua' | 'selesai' | 'proses'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewLetter, setPreviewLetter] = useState<LetterRequest | null>(null);
  const [trackingLetter, setTrackingLetter] = useState<LetterRequest | null>(null);

  // Form State
  const [formJenis, setFormJenis] = useState(KATALOG_SURAT[0].nama);
  const [formKeperluan, setFormKeperluan] = useState('');
  const [formInstansi, setFormInstansi] = useState('');
  const [formDitujukan, setFormDitujukan] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccessAlert, setFormSuccessAlert] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('siakad_student_letters');
      if (stored) {
        setLetters(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save to localStorage helper
  const saveLettersLocally = (newList: LetterRequest[]) => {
    setLetters(newList);
    try {
      localStorage.setItem('siakad_student_letters', JSON.stringify(newList));
    } catch {
      // Ignore
    }
  };

  // Filtered List
  const filteredLetters = useMemo(() => {
    return letters.filter((item) => {
      const matchesTab =
        activeTab === 'semua' ||
        (activeTab === 'selesai' && item.status === 'SELESAI') ||
        (activeTab === 'proses' && (item.status === 'DIPROSES' || item.status === 'VERIFIKASI_PA'));

      const matchesSearch =
        item.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.jenisSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tujuanInstansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keperluan.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [letters, activeTab, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const selesai = letters.filter((l) => l.status === 'SELESAI').length;
    const proses = letters.filter((l) => l.status === 'DIPROSES' || l.status === 'VERIFIKASI_PA').length;
    return { semua: letters.length, selesai, proses };
  }, [letters]);

  // Handle Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    setTimeout(() => {
      const randomId = `req-${Date.now().toString().slice(-4)}`;
      const newLetter: LetterRequest = {
        id: randomId,
        nomorSurat: `421.4/ITN-BAAK/IX/2026/${Math.floor(100 + Math.random() * 900)}`,
        jenisSurat: formJenis,
        keperluan: formKeperluan,
        tujuanInstansi: formInstansi || 'Instansi Terkait',
        ditujukanKepada: formDitujukan || 'Pimpinan / HRD',
        tanggalPengajuan: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: formJenis.includes('Aktif Kuliah') ? 'SELESAI' : 'VERIFIKASI_PA',
        statusLabel: formJenis.includes('Aktif Kuliah') ? 'Selesai & Siap Unduh' : 'Menunggu Verifikasi Dosen PA',
        dosenPaStatus: formJenis.includes('Aktif Kuliah') ? 'DISETUJUI' : 'MENUNGGU',
        baakStatus: formJenis.includes('Aktif Kuliah') ? 'TERVERIFIKASI' : 'MENUNGGU',
        tanggalSelesai: formJenis.includes('Aktif Kuliah')
          ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : undefined,
        isiSurat: `Yang bertanda tangan di bawah ini Menerangkan dengan sebenarnya bahwa mahasiswa atas nama Muhammad Rizky Pratama (NIM: 2311501001) terdaftar aktif pada Semester Gasal 2026/2027 Institut Teknologi Nusantara untuk keperluan ${formKeperluan}.`,
      };

      const updated = [newLetter, ...letters];
      saveLettersLocally(updated);

      setFormSubmitting(false);
      setIsModalOpen(false);
      setFormKeperluan('');
      setFormInstansi('');
      setFormDitujukan('');
      setFormCatatan('');
      setFormSuccessAlert(`Permohonan ${formJenis} berhasil diajukan dengan ID ${newLetter.nomorSurat}!`);

      setTimeout(() => setFormSuccessAlert(null), 6000);
    }, 600);
  };

  const handlePrintPreview = () => {
    window.print();
  };

  return (
    <PortalLayout
      role="student"
      userName="Muhammad Rizky Pratama"
      userIdText="NIM: 2311501001 • Teknik Informatika"
    >
      <div className="space-y-6">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md bg-white/10 text-[#D4A017] border border-white/10">
                <Mail className="w-3.5 h-3.5" />
                <span>Layanan Surat Mahasiswa</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Tanda Tangan Digital Resmi BAAK</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Layanan Administrasi & Surat Menyurat
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Pengajuan mandiri Surat Keterangan Aktif Kuliah (SKAK), izin magang/KP, izin riset tugas akhir, dan rekomendasi beasiswa secara paperless.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Surat Baru</span>
            </button>
          </div>
        </div>

        {/* Alert Notification if any */}
        {formSuccessAlert && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccessAlert}</span>
            </div>
            <button onClick={() => setFormSuccessAlert(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengajuan</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{counts.semua} Surat</p>
              <p className="text-xs text-slate-500 mt-0.5">Tahun Akademik 2026/2027</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Surat Selesai</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{counts.selesai} Terbit</p>
              <p className="text-xs text-emerald-600 mt-0.5 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Siap diunduh format PDF</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dalam Proses</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{counts.proses} Surat</p>
              <p className="text-xs text-slate-500 mt-0.5">Verifikasi Dosen PA & BAAK</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Keabsahan Dokumen</span>
              <p className="text-2xl font-black text-[#1E3A8A] mt-1">QR Seal</p>
              <p className="text-xs text-slate-500 mt-0.5">Tervalidasi Digital BAAK</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* KATALOG JENIS SURAT SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4A017]" />
                <span>Katalog Layanan Surat Akademik</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih jenis surat di bawah ini untuk mengajukan permohonan secara mandiri.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {KATALOG_SURAT.map((kat) => {
              const Icon = kat.icon;
              return (
                <div
                  key={kat.kode}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#1E3A8A] hover:shadow-subtle transition-all duration-200 flex flex-col justify-between group bg-slate-50/40 hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${kat.badgeColor}`}>
                        {kat.durasi}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                      {kat.nama}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {kat.deskripsi}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-[10px] text-slate-500">
                      <p><strong>Contoh:</strong> {kat.keperluanContoh}</p>
                      <p><strong>Syarat:</strong> {kat.syarat}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => {
                        setFormJenis(kat.nama);
                        setIsModalOpen(true);
                      }}
                      className="w-full py-1.5 px-3 bg-white hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white border border-slate-200 hover:border-[#1E3A8A] rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Ajukan Surat Ini</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIWAYAT PENGAJUAN SURAT SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          {/* Header Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1E3A8A]" />
                <span>Riwayat & Status Pengajuan Surat</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres penandatanganan Dosen PA dan penerbitan nomor surat resmi BAAK.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('semua')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'semua'
                      ? 'bg-white text-[#1E3A8A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({counts.semua})
                </button>
                <button
                  onClick={() => setActiveTab('selesai')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'selesai'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Selesai ({counts.selesai})
                </button>
                <button
                  onClick={() => setActiveTab('proses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'proses'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Proses ({counts.proses})
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari surat / instansi..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A8A] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">No. Dokumen & Tanggal</th>
                  <th className="py-3.5 px-4">Jenis Surat</th>
                  <th className="py-3.5 px-4">Instansi Tujuan & Keperluan</th>
                  <th className="py-3.5 px-4 text-center">Status Dosen PA</th>
                  <th className="py-3.5 px-4 text-center">Status Surat</th>
                  <th className="py-3.5 px-4 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada permohonan surat yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-mono font-bold text-[#1E3A8A] text-xs">
                          {item.nomorSurat}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Diajukan: {item.tanggalPengajuan}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div>{item.jenisSurat}</div>
                        {item.tanggalSelesai && (
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Disahkan: {item.tanggalSelesai}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="font-medium text-slate-900 truncate">
                          {item.tujuanInstansi}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.keperluan}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.dosenPaStatus === 'DISETUJUI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.dosenPaStatus === 'DISETUJUI' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Disetujui</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Menunggu</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${
                            item.status === 'SELESAI'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status === 'SELESAI' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>SELESAI</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 animate-spin" />
                              <span>DIPROSES</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.status === 'SELESAI' ? (
                            <>
                              <button
                                onClick={() => setPreviewLetter(item)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Lihat Pratinjau Surat Resmi"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Lihat</span>
                              </button>
                              <button
                                onClick={() => setPreviewLetter(item)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-700 text-emerald-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Unduh PDF Surat Resmi"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setTrackingLetter(item)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Lacak Status</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Notes & SOP */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs text-slate-700 space-y-3 print:hidden">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-[#1E3A8A]" />
            <span>SOP & Ketentuan Pengajuan Surat Mahasiswa</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 leading-relaxed">
            <li>Surat Keterangan Aktif Kuliah (SKAK) diterbitkan secara <strong>otomatis & instan</strong> dengan tanda tangan digital resmi dan QR Code jika status registrasi KRS dan UKT telah tervalidasi.</li>
            <li>Untuk Surat Pengantar Magang dan Izin Penelitian, permohonan akan diteruskan terlebih dahulu kepada <strong>Dosen Pembimbing Akademik (Dosen PA)</strong> untuk diverifikasi sebelum diterbitkan oleh BAAK.</li>
            <li>Keaslian dokumen surat digital ITN dapat diverifikasi oleh pihak eksternal/instansi melalui pemindaian <strong>QR Code</strong> di pojok kanan bawah surat.</li>
          </ul>
        </div>

      </div>

      {/* MODAL 1: AJUKAN PERMOHONAN SURAT BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#D4A017]" />
                  <span>Formulir Permohonan Surat Mahasiswa</span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Isi informasi tujuan dan keperluan surat secara lengkap.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Jenis Surat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Surat yang Diajukan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formJenis}
                  onChange={(e) => setFormJenis(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium text-slate-900 bg-white"
                >
                  {KATALOG_SURAT.map((kat) => (
                    <option key={kat.kode} value={kat.nama}>
                      {kat.nama} ({kat.durasi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Keperluan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keperluan Permohonan Surat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formKeperluan}
                  onChange={(e) => setFormKeperluan(e.target.value)}
                  placeholder="Contoh: Pengajuan Tunjangan Gaji Anak PNS / Pembukaan Rekening Bank / Syarat Beasiswa"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium text-slate-900"
                />
              </div>

              {/* Instansi Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Instansi / Perusahaan Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formInstansi}
                    onChange={(e) => setFormInstansi(e.target.value)}
                    placeholder="Contoh: PT Telekomunikasi Indonesia"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ditujukan Kepada (Pejabat / Jabatan)
                  </label>
                  <input
                    type="text"
                    value={formDitujukan}
                    onChange={(e) => setFormDitujukan(e.target.value)}
                    placeholder="Contoh: Manajer HRD / Kepala Bagian Kepegawaian"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Tambahan untuk Petugas BAAK (Opsional)
                </label>
                <input
                  type="text"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Informasi pelengkap atau nomor kontak narahubung instansi"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium text-slate-900"
                />
              </div>

              {/* Student Identity Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Pemohon Terdaftar:</span>
                </p>
                <p className="text-[11px] text-blue-800">
                  Muhammad Rizky Pratama (NIM: 2311501001) &bull; S1 Teknik Informatika &bull; Dosen PA: Dr. Bayu Wicaksono, M.Kom.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Mengirim Permohonan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#D4A017]" />
                      <span>Kirim Permohonan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRATINJAU DOKUMEN SURAT RESMI */}
      {previewLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Top Toolbar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Pratinjau Dokumen Surat Resmi BAAK ITN</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPreview}
                  className="px-3 py-1.5 rounded-lg bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setPreviewLetter(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Letter Paper Layout */}
            <div className="p-8 sm:p-12 overflow-y-auto bg-white font-serif text-slate-900 space-y-6 leading-relaxed">
              {/* Kop Surat */}
              <div className="border-b-2 border-slate-950 pb-4 text-center font-sans">
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-900">
                  Institut Teknologi Nusantara
                </h2>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Biro Administrasi Akademik dan Kemahasiswaan (BAAK)
                </p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Jalan Soekarno Hatta No. 128, Bandung 40266 | Telp: (022) 7564108 | Email: baak@itn.ac.id | Laman: www.itn.ac.id
                </p>
              </div>

              {/* Nomor Surat & Judul */}
              <div className="text-center font-sans space-y-1">
                <h3 className="text-sm font-bold uppercase underline tracking-wide">
                  {previewLetter.jenisSurat}
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  Nomor: {previewLetter.nomorSurat}
                </p>
              </div>

              {/* Isi Surat */}
              <div className="text-xs sm:text-sm space-y-4 text-justify">
                <p>
                  Yang bertanda tangan di bawah ini, Wakil Rektor Bidang Akademik & Kemahasiswaan Institut Teknologi Nusantara, menerangkan dengan sebenarnya bahwa:
                </p>

                <div className="pl-6 space-y-1.5 font-sans text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Nama Lengkap</span>
                    <span className="col-span-2 font-bold text-slate-900">: Muhammad Rizky Pratama</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Nomor Induk Mahasiswa (NIM)</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">: 2311501001</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Program Studi / Jenjang</span>
                    <span className="col-span-2 font-bold text-slate-900">: Teknik Informatika / Strata 1 (S1)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Fakultas</span>
                    <span className="col-span-2 font-bold text-slate-900">: Fakultas Ilmu Komputer</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Semester / Tahun Akademik</span>
                    <span className="col-span-2 font-bold text-slate-900">: Semester 5 (Gasal 2026/2027)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-semibold text-slate-600">Status Akademik</span>
                    <span className="col-span-2 font-bold text-emerald-700">: AKTIF TERDAFTAR</span>
                  </div>
                </div>

                <p>
                  Adalah benar mahasiswa yang bersangkutan aktif mengikuti kegiatan akademik perkuliahan pada Semester Gasal Tahun Akademik 2026/2027 di lingkungan Institut Teknologi Nusantara.
                </p>

                <p>
                  Surat keterangan ini dibuat dengan sesungguhnya untuk keperluan:{' '}
                  <strong>{previewLetter.keperluan}</strong> yang ditujukan kepada <strong>{previewLetter.tujuanInstansi}</strong>.
                </p>

                <p>
                  Demikian surat keterangan ini kami sampaikan agar dapat dipergunakan sebagaimana mestinya.
                </p>
              </div>

              {/* Tanda Tangan & QR Code Seal */}
              <div className="pt-6 font-sans flex items-end justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-300 rounded-lg p-1.5 flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-800">Validasi Digital BAAK</p>
                    <p>Dokumen tervalidasi sah</p>
                    <p className="font-mono mt-0.5">ID: {previewLetter.id}</p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p>Bandung, {previewLetter.tanggalSelesai || previewLetter.tanggalPengajuan}</p>
                  <p className="font-bold text-slate-800">Wakil Rektor Bidang Akademik,</p>
                  <div className="h-12 flex items-center justify-end">
                    <span className="font-serif italic text-[#1E3A8A] font-black text-sm tracking-wider">
                      Dr. Eng. Satria Pratama, M.T.
                    </span>
                  </div>
                  <p className="font-bold text-slate-900">Prof. Dr. Eng. Satria Pratama, M.T.</p>
                  <p className="font-mono text-[10px] text-slate-500">NIP: 197801052003121001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TRACKING TIMELINE PROGRES SURAT */}
      {trackingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lacak Status Pengajuan Surat</h3>
                <p className="text-xs text-slate-500">{trackingLetter.nomorSurat}</p>
              </div>
              <button
                onClick={() => setTrackingLetter(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-500 my-1" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pengajuan Diterima Sistem</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Permohonan diajukan oleh mahasiswa pada {trackingLetter.tanggalPengajuan}.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      trackingLetter.dosenPaStatus === 'DISETUJUI'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {trackingLetter.dosenPaStatus === 'DISETUJUI' ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <div className="w-0.5 h-10 bg-slate-200 my-1" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Verifikasi Dosen Pembimbing Akademik</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {trackingLetter.dosenPaStatus === 'DISETUJUI'
                      ? 'Dosen PA telah menyetujui permohonan surat.'
                      : 'Menunggu persetujuan Dr. Bayu Wicaksono, M.Kom.'}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      trackingLetter.status === 'SELESAI'
                        ? 'bg-emerald-500 text-white'
                        : trackingLetter.dosenPaStatus === 'DISETUJUI'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {trackingLetter.status === 'SELESAI' ? <Check className="w-4 h-4" /> : '3'}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Penerbitan & Tanda Tangan BAAK</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {trackingLetter.status === 'SELESAI'
                      ? 'Surat telah disahkan dan siap diunduh secara resmi.'
                      : 'Proses validasi nomor surat dan QR digital oleh Biro Akademik.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setTrackingLetter(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </PortalLayout>
  );
}
