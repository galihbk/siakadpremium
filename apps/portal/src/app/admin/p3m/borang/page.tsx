'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart3,
  BookOpen,
  Users,
  Award,
  DollarSign,
  Printer,
  Sparkles,
  Search,
  Building2,
  ExternalLink,
  Info,
  Check,
  Eye,
  FileCheck2,
  TrendingUp,
  HelpCircle,
  X,
  FileText,
} from 'lucide-react';

export interface BorangProdiData {
  prodiCode: string;
  prodiName: string;
  faculty: string;
  dtpsCount: number; // Jumlah Dosen Tetap PS
  // Penelitian DTPS (3 Tahun: TS-2, TS-1, TS)
  penelitianLokal: number; // Dana PT / Mandiri
  penelitianNasional: number; // Kemdikbud / BRIN / BIMA
  penelitianInternasional: number; // Lembaga Asing
  danaPenelitianTotal: number;
  // Pengabdian PkM (3 Tahun)
  pkmLokal: number;
  pkmNasional: number;
  pkmInternasional: number;
  danaPkmTotal: number;
  // Luaran
  scopusCount: number;
  sintaCount: number;
  hakiCount: number;
  bukuCount: number;
  // Skor Kuantitatif LKPS
  scorePenelitian: number; // Skala 4.0
  scorePkm: number; // Skala 4.0
}

const INITIAL_PRODI_DATA: BorangProdiData[] = [
  {
    prodiCode: 'TI',
    prodiName: 'S1 Teknik Informatika',
    faculty: 'Fakultas Ilmu Komputer',
    dtpsCount: 16,
    penelitianLokal: 24,
    penelitianNasional: 14,
    penelitianInternasional: 3,
    danaPenelitianTotal: 485000000,
    pkmLokal: 18,
    pkmNasional: 8,
    pkmInternasional: 1,
    danaPkmTotal: 180000000,
    scopusCount: 12,
    sintaCount: 28,
    hakiCount: 14,
    bukuCount: 5,
    scorePenelitian: 3.85,
    scorePkm: 3.75,
  },
  {
    prodiCode: 'SI',
    prodiName: 'S1 Sistem Informasi',
    faculty: 'Fakultas Ilmu Komputer',
    dtpsCount: 12,
    penelitianLokal: 18,
    penelitianNasional: 9,
    penelitianInternasional: 1,
    danaPenelitianTotal: 310000000,
    pkmLokal: 14,
    pkmNasional: 6,
    pkmInternasional: 0,
    danaPkmTotal: 135000000,
    scopusCount: 7,
    sintaCount: 22,
    hakiCount: 9,
    bukuCount: 4,
    scorePenelitian: 3.70,
    scorePkm: 3.65,
  },
  {
    prodiCode: 'EL',
    prodiName: 'S1 Teknik Elektro',
    faculty: 'Fakultas Teknik',
    dtpsCount: 14,
    penelitianLokal: 20,
    penelitianNasional: 12,
    penelitianInternasional: 2,
    danaPenelitianTotal: 460000000,
    pkmLokal: 15,
    pkmNasional: 7,
    pkmInternasional: 1,
    danaPkmTotal: 165000000,
    scopusCount: 11,
    sintaCount: 24,
    hakiCount: 8,
    bukuCount: 3,
    scorePenelitian: 3.80,
    scorePkm: 3.70,
  },
  {
    prodiCode: 'MS',
    prodiName: 'S1 Teknik Mesin',
    faculty: 'Fakultas Teknik',
    dtpsCount: 15,
    penelitianLokal: 22,
    penelitianNasional: 11,
    penelitianInternasional: 2,
    danaPenelitianTotal: 490000000,
    pkmLokal: 16,
    pkmNasional: 6,
    pkmInternasional: 0,
    danaPkmTotal: 150000000,
    scopusCount: 9,
    sintaCount: 26,
    hakiCount: 11,
    bukuCount: 4,
    scorePenelitian: 3.75,
    scorePkm: 3.60,
  },
  {
    prodiCode: 'SP',
    prodiName: 'S1 Teknik Sipil',
    faculty: 'Fakultas Teknik',
    dtpsCount: 18,
    penelitianLokal: 26,
    penelitianNasional: 15,
    penelitianInternasional: 1,
    danaPenelitianTotal: 520000000,
    pkmLokal: 20,
    pkmNasional: 9,
    pkmInternasional: 0,
    danaPkmTotal: 195000000,
    scopusCount: 8,
    sintaCount: 30,
    hakiCount: 7,
    bukuCount: 6,
    scorePenelitian: 3.80,
    scorePkm: 3.78,
  },
  {
    prodiCode: 'AR',
    prodiName: 'S1 Arsitektur',
    faculty: 'Fakultas Teknik Sipil & Perencanaan',
    dtpsCount: 10,
    penelitianLokal: 14,
    penelitianNasional: 7,
    penelitianInternasional: 1,
    danaPenelitianTotal: 280000000,
    pkmLokal: 12,
    pkmNasional: 5,
    pkmInternasional: 0,
    danaPkmTotal: 120000000,
    scopusCount: 5,
    sintaCount: 18,
    hakiCount: 12,
    bukuCount: 5,
    scorePenelitian: 3.65,
    scorePkm: 3.60,
  },
];

export default function RekapBorangPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const [prodiData, setProdiData] = useState<BorangProdiData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAkreditasi, setSelectedAkreditasi] = useState<string>('BAN-PT 9 Kriteria');
  const [selectedYearScope, setSelectedYearScope] = useState<string>('Akumulasi 3 Tahun (TS-2 s.d TS)');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'penelitian' | 'pengabdian' | 'luaran' | 'iku5'>('penelitian');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProdiDetail, setSelectedProdiDetail] = useState<BorangProdiData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchBorang = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFaculty !== 'Semua') params.append('faculty', selectedFaculty);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lp3m/borang?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data?.data || json.data || [];
        setProdiData(data);
      }
    } catch (err) {
      console.warn('Gagal memuat rekap borang dari database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBorang();
  }, [selectedFaculty, searchTerm]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered prodi
  const filteredProdi = useMemo(() => {
    return prodiData.filter((item) => {
      const matchFaculty = selectedFaculty === 'Semua' || item.faculty === selectedFaculty;
      const matchSearch =
        item.prodiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.prodiCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFaculty && matchSearch;
    });
  }, [prodiData, selectedFaculty, searchTerm]);

  // Totals & Statistics
  const summary = useMemo(() => {
    const totalDTPS = filteredProdi.reduce((acc, curr) => acc + curr.dtpsCount, 0);
    const totalJudulLit = filteredProdi.reduce(
      (acc, curr) => acc + curr.penelitianLokal + curr.penelitianNasional + curr.penelitianInternasional,
      0
    );
    const totalJudulPkm = filteredProdi.reduce(
      (acc, curr) => acc + curr.pkmLokal + curr.pkmNasional + curr.pkmInternasional,
      0
    );
    const totalDanaLit = filteredProdi.reduce((acc, curr) => acc + curr.danaPenelitianTotal, 0);
    const totalDanaPkm = filteredProdi.reduce((acc, curr) => acc + curr.danaPkmTotal, 0);
    const totalScopus = filteredProdi.reduce((acc, curr) => acc + curr.scopusCount, 0);
    const totalSinta = filteredProdi.reduce((acc, curr) => acc + curr.sintaCount, 0);
    const totalHaki = filteredProdi.reduce((acc, curr) => acc + curr.hakiCount, 0);

    const rasioLitPerDosen = totalDTPS > 0 ? (totalJudulLit / totalDTPS / 3).toFixed(2) : '0';
    const rasioPkmPerDosen = totalDTPS > 0 ? (totalJudulPkm / totalDTPS / 3).toFixed(2) : '0';

    return {
      totalDTPS,
      totalJudulLit,
      totalJudulPkm,
      totalDanaLit,
      totalDanaPkm,
      totalDanaGabungan: totalDanaLit + totalDanaPkm,
      totalScopus,
      totalSinta,
      totalHaki,
      rasioLitPerDosen,
      rasioPkmPerDosen,
    };
  }, [filteredProdi]);

  return (
    <PortalLayout
      role="lp3m"
      userName="Prof. Dr. Ir. H. Sudirman, M.T."
      userIdText="Ketua LP3M & Dewan Riset Perguruan Tinggi"
    >
      <div className="space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#091a44] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
              <Link href="/admin/p3m" className="hover:text-white transition-colors">
                Dashboard LP3M
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Rekap Borang Akreditasi</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight flex items-center gap-2.5">
              <span>Rekapitulasi Borang Akreditasi & IKU Riset Tridharma</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed">
              Kompilasi otomatis data kuantitatif Laporan Kinerja Program Studi (LKPS) Kriteria C.6 (Penelitian) & C.7 (PkM), 
              pemetaan capaian luaran Scopus/SINTA, serta audit borang BAN-PT & LAM-PT.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10 shrink-0">
            <button
              onClick={() => showToast('Mengekspor berkas spreadsheet LKPS C.6 & C.7 format Excel (.xlsx)...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel LKPS BAN-PT</span>
            </button>
            <button
              onClick={() => showToast('Mempersiapkan dokumen Laporan Evaluasi Diri (LED) versi PDF...')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" />
              <span>Cetak Ringkasan Borang</span>
            </button>
          </div>

          <BarChart3 className="absolute right-[-20px] bottom-[-30px] w-64 h-64 text-white/5 pointer-events-none" />
        </div>

        {/* 5 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total DTPS Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalDTPS} Dosen</p>
            <p className="text-xs text-slate-500 mt-1">Dosen Tetap Program Studi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Judul Penelitian DTPS</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalJudulLit} Judul</p>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              Rasio: {summary.rasioLitPerDosen} judul/dosen/th
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Judul Pengabdian PkM</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalJudulPkm} Kegiatan</p>
            <p className="text-xs text-emerald-700 font-bold mt-1">
              Rasio: {summary.rasioPkmPerDosen} keg/dosen/th
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dana Tridharma Riset</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{formatRupiah(summary.totalDanaGabungan)}</p>
            <p className="text-xs text-slate-500 mt-1">Internal PT & Kemendikbud</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Luaran Berreputasi</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.totalScopus} <span className="text-xs font-semibold text-slate-500">Scopus</span> &bull; {summary.totalHaki} <span className="text-xs font-semibold text-slate-500">HKI</span>
            </p>
            <p className="text-xs text-purple-700 font-bold mt-1">{summary.totalSinta} Artikel SINTA 1-4</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Instrument Borang */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Instrumen Akreditasi
              </label>
              <select
                value={selectedAkreditasi}
                onChange={(e) => setSelectedAkreditasi(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold text-slate-800"
              >
                <option value="BAN-PT 9 Kriteria">BAN-PT: 9 Kriteria IAPS 4.0 / APT</option>
                <option value="LAM-INFOKOM">LAM-INFOKOM (Informatika & Komputer)</option>
                <option value="LAM-TEKNIK">LAM-TEKNIK (Teknik Sipil/Mesin/Elektro)</option>
                <option value="IKU Perguruan Tinggi">IKU 5 & IKU 3 Kemendikbudristek</option>
              </select>
            </div>

            {/* Scope Tahun TS */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Rentang Waktu Evaluasi Borang
              </label>
              <select
                value={selectedYearScope}
                onChange={(e) => setSelectedYearScope(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold text-slate-800"
              >
                <option value="Akumulasi 3 Tahun (TS-2 s.d TS)">Akumulasi 3 Tahun Terakhir (TS-2, TS-1, TS)</option>
                <option value="Tahun Berjalan (TS: 2026)">Tahun Berjalan (TS: 2026)</option>
                <option value="Tahun Sebelumnya (TS-1: 2025)">Tahun Sebelumnya (TS-1: 2025)</option>
                <option value="Dua Tahun Lalu (TS-2: 2024)">Dua Tahun Lalu (TS-2: 2024)</option>
              </select>
            </div>

            {/* Filter Fakultas */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Filter Unit Pengelola (Fakultas)
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-semibold text-slate-800"
              >
                <option value="Semua">Semua Fakultas</option>
                <option value="Fakultas Ilmu Komputer">Fakultas Ilmu Komputer</option>
                <option value="Fakultas Teknik">Fakultas Teknik</option>
                <option value="Fakultas Teknik Sipil & Perencanaan">Fakultas Teknik Sipil & Perencanaan</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 mt-0.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Program Studi, kode prodi, atau nama fakultas..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
            />
          </div>
        </div>

        {/* Tab Navigation for Borang Table */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('penelitian')}
            className={`flex-1 min-w-[150px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'penelitian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tabel C.6: Penelitian DTPS</span>
          </button>

          <button
            onClick={() => setActiveTab('pengabdian')}
            className={`flex-1 min-w-[150px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pengabdian'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tabel C.7: Pengabdian PkM</span>
          </button>

          <button
            onClick={() => setActiveTab('luaran')}
            className={`flex-1 min-w-[150px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'luaran'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Luaran: Scopus, SINTA & HKI</span>
          </button>

          <button
            onClick={() => setActiveTab('iku5')}
            className={`flex-1 min-w-[150px] py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'iku5'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Capaian IKU 5 & Skor LKPS</span>
          </button>
        </div>

        {/* TAB 1: TABEL C.6 PENELITIAN DTPS */}
        {activeTab === 'penelitian' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriks LKPS Tabel 3.b.1: Penelitian Dosen Tetap Program Studi (DTPS)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data pembiayaan penelitian mandiri/PT, nasional (BIMA Kemdikbud), dan kerjasama internasional dalam 3 tahun evaluasi.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {selectedAkreditasi}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Program Studi & Fakultas</th>
                    <th className="px-3 py-3 text-center">Jumlah DTPS</th>
                    <th className="px-3 py-3 text-center">PT / Mandiri</th>
                    <th className="px-3 py-3 text-center">Nasional (BIMA)</th>
                    <th className="px-3 py-3 text-center">Internasional</th>
                    <th className="px-3 py-3 text-center">Total Judul</th>
                    <th className="px-4 py-3 text-right">Total Anggaran</th>
                    <th className="px-3 py-3 text-center">Rasio / Dosen</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProdi.map((p, idx) => {
                    const totalJudul = p.penelitianLokal + p.penelitianNasional + p.penelitianInternasional;
                    const rasio = (totalJudul / p.dtpsCount / 3).toFixed(2);
                    return (
                      <tr key={p.prodiCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-xs">{p.prodiName}</p>
                          <p className="text-[10px] text-slate-400">{p.faculty}</p>
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-slate-800">{p.dtpsCount}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-slate-700">{p.penelitianLokal}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-blue-700 bg-blue-50/50">{p.penelitianNasional}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-purple-700 bg-purple-50/50">{p.penelitianInternasional}</td>
                        <td className="px-3 py-3.5 text-center font-black text-slate-900 bg-slate-50">{totalJudul}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-800">
                          {formatRupiah(p.danaPenelitianTotal)}
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-blue-800">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px]">
                            {rasio} / th
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedProdiDetail(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Rincian</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TABEL C.7 PENGABDIAN KEPADA MASYARAKAT (PKM) */}
        {activeTab === 'pengabdian' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriks LKPS Tabel 3.b.2: Pengabdian kepada Masyarakat (PkM) DTPS
                </h3>
                <p className="text-[11px] text-slate-500">
                  Data kegiatan pengabdian kemitraan masyarakat binaan, penerapan teknologi tepat guna, dan pendanaan hibah PkM.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {selectedAkreditasi}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Program Studi</th>
                    <th className="px-3 py-3 text-center">Jumlah DTPS</th>
                    <th className="px-3 py-3 text-center">PT / Lokal</th>
                    <th className="px-3 py-3 text-center">Nasional (BIMA/CSR)</th>
                    <th className="px-3 py-3 text-center">Internasional</th>
                    <th className="px-3 py-3 text-center">Total Kegiatan</th>
                    <th className="px-4 py-3 text-right">Total Anggaran PkM</th>
                    <th className="px-3 py-3 text-center">Rasio / Dosen</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProdi.map((p, idx) => {
                    const totalPkm = p.pkmLokal + p.pkmNasional + p.pkmInternasional;
                    const rasio = (totalPkm / p.dtpsCount / 3).toFixed(2);
                    return (
                      <tr key={p.prodiCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-xs">{p.prodiName}</p>
                          <p className="text-[10px] text-slate-400">{p.faculty}</p>
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-slate-800">{p.dtpsCount}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-slate-700">{p.pkmLokal}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-emerald-700 bg-emerald-50/50">{p.pkmNasional}</td>
                        <td className="px-3 py-3.5 text-center font-medium text-purple-700 bg-purple-50/50">{p.pkmInternasional}</td>
                        <td className="px-3 py-3.5 text-center font-black text-slate-900 bg-slate-50">{totalPkm}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-emerald-800">
                          {formatRupiah(p.danaPkmTotal)}
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-emerald-800">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px]">
                            {rasio} / th
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedProdiDetail(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Rincian</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LUARAN SCOPUS, SINTA & HKI */}
        {activeTab === 'luaran' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Matriks LKPS Tabel 3.b.3: Publikasi Ilmiah & Perolehan HAKI Dosen
                </h3>
                <p className="text-[11px] text-slate-500">
                  Rekapitulasi luaran wajib dan tambahan: Jurnal Scopus/WoS, Jurnal Nasional SINTA, Hak Cipta & Paten DJKI.
                </p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                SINTA & DJKI Terintegrasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Program Studi</th>
                    <th className="px-3 py-3 text-center">Jurnal Scopus/WoS</th>
                    <th className="px-3 py-3 text-center">Jurnal SINTA 1-4</th>
                    <th className="px-3 py-3 text-center">Paten & Hak Cipta</th>
                    <th className="px-3 py-3 text-center">Buku Ber-ISBN</th>
                    <th className="px-3 py-3 text-center">Total Luaran</th>
                    <th className="px-4 py-3 text-center">Status Borang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProdi.map((p, idx) => {
                    const totalLuaran = p.scopusCount + p.sintaCount + p.hakiCount + p.bukuCount;
                    return (
                      <tr key={p.prodiCode} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900 text-xs">{p.prodiName}</p>
                          <p className="text-[10px] text-slate-400">{p.faculty}</p>
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-purple-700 bg-purple-50/50">
                          {p.scopusCount} Dokumen
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-blue-700 bg-blue-50/50">
                          {p.sintaCount} Artikel
                        </td>
                        <td className="px-3 py-3.5 text-center font-bold text-amber-700 bg-amber-50/50">
                          {p.hakiCount} Sertifikat
                        </td>
                        <td className="px-3 py-3.5 text-center font-medium text-slate-700">{p.bukuCount} Buku</td>
                        <td className="px-3 py-3.5 text-center font-black text-slate-900 bg-slate-50">{totalLuaran}</td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" /> Memenuhi Syarat Unggul
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CAPAIAN IKU 5 & SKOR AKREDITASI */}
        {activeTab === 'iku5' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box IKU 5 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-black text-xs">
                      IKU 5
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Hasil Kerja Dosen Digunakan Masyarakat</h4>
                      <p className="text-[11px] text-slate-500">Standar Kemendikbudristek untuk PTN/PTS</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Capaian 124%
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Persentase dosen tetap yang hasil riset dan pengabdiannya berhasil mendapat rekognisi internasional 
                  atau diterapkan oleh mitra pemerintah daerah dan dunia industri.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Realisasi Akumulasi Institusi</span>
                    <span className="text-blue-800">62 Dosen (73%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1E3A8A] to-emerald-600 h-full rounded-full" style={{ width: '73%' }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Target Renstra: 50 Dosen (58%)</span>
                    <span className="text-emerald-700 font-semibold">Melampaui Target</span>
                  </div>
                </div>
              </div>

              {/* Box Skor LKPS C.6 & C.7 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                      LKPS
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Estimasi Skor Akreditasi Kuantitatif</h4>
                      <p className="text-[11px] text-slate-500">Berdasarkan Matriks Penilaian BAN-PT (Skala 4.0)</p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-900">
                    Predikat A (Unggul)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Kriteria C.6</span>
                    <span className="text-2xl font-black text-[#1E3A8A] mt-0.5 block">3.78</span>
                    <span className="text-[10px] font-semibold text-emerald-700">Kategori Unggul (&ge; 3.5)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Kriteria C.7</span>
                    <span className="text-2xl font-black text-emerald-700 mt-0.5 block">3.72</span>
                    <span className="text-[10px] font-semibold text-emerald-700">Kategori Unggul (&ge; 3.5)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RINCIAN PROGRAM STUDI */}
        {selectedProdiDetail && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rincian Borang</span>
                  <h3 className="text-lg font-black text-slate-900">{selectedProdiDetail.prodiName}</h3>
                  <p className="text-xs text-slate-500">{selectedProdiDetail.faculty} &bull; {selectedProdiDetail.dtpsCount} DTPS</p>
                </div>
                <button
                  onClick={() => setSelectedProdiDetail(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {/* 4 Cards Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Penelitian</span>
                    <span className="text-base font-black text-blue-900 block mt-0.5">
                      {selectedProdiDetail.penelitianLokal + selectedProdiDetail.penelitianNasional + selectedProdiDetail.penelitianInternasional} Judul
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">3 Tahun Terakhir</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Pengabdian PkM</span>
                    <span className="text-base font-black text-emerald-900 block mt-0.5">
                      {selectedProdiDetail.pkmLokal + selectedProdiDetail.pkmNasional + selectedProdiDetail.pkmInternasional} Keg.
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Mitra Masyarakat</span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">Scopus/WoS</span>
                    <span className="text-base font-black text-purple-900 block mt-0.5">
                      {selectedProdiDetail.scopusCount} Artikel
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Bereputasi Internasional</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">HAKI & Paten</span>
                    <span className="text-base font-black text-amber-900 block mt-0.5">
                      {selectedProdiDetail.hakiCount} Hak Cipta
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">DJKI Kemenkumham</span>
                  </div>
                </div>

                {/* Realisasi Keuangan */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">Total Realisasi Hibah Penelitian:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedProdiDetail.danaPenelitianTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">Total Realisasi Hibah PkM:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedProdiDetail.danaPkmTotal)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-800">Total Akumulasi Pendanaan Tridharma:</span>
                    <span className="text-emerald-700 text-sm">
                      {formatRupiah(selectedProdiDetail.danaPenelitianTotal + selectedProdiDetail.danaPkmTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedProdiDetail(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      showToast(`Mengekspor data LKPS ${selectedProdiDetail.prodiName} ke Excel...`);
                      setSelectedProdiDetail(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor Berkas Prodi Ini</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
