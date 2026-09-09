'use client';

import React, { useState, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  ChevronDown,
  TrendingUp,
  FileText,
  Building,
  GraduationCap,
  ShieldCheck,
  QrCode,
  Info,
  Sparkles,
  BarChart2,
  Check,
} from 'lucide-react';

interface NilaiItem {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  nilaiHuruf: 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'D' | 'E';
  nilaiAngka: number;
  dosen: string;
  keterangan: 'LULUS' | 'TIDAK LULUS';
}

interface SemesterData {
  id: string;
  semesterNumber: number;
  namaSemester: string;
  tahunAkademik: string;
  ips: number;
  sksSemester: number;
  sksKumulatif: number;
  ipkKumulatif: number;
  maksSksBerikutnya: number;
  tanggalKHS: string;
  nilaiList: NilaiItem[];
}

const SEMESTER_ARCHIVE: SemesterData[] = [
  {
    id: 'sem-5',
    semesterNumber: 5,
    namaSemester: 'Semester 5 (Gasal 2026/2027)',
    tahunAkademik: '2026/2027 Gasal',
    ips: 3.84,
    sksSemester: 14,
    sksKumulatif: 88,
    ipkKumulatif: 3.84,
    maksSksBerikutnya: 24,
    tanggalKHS: '09 September 2026',
    nilaiList: [
      {
        id: 'n-501',
        kode: 'TIF-301',
        nama: 'Rekayasa Perangkat Lunak',
        sks: 3,
        nilaiHuruf: 'A',
        nilaiAngka: 4.0,
        dosen: 'Dr. Bayu Wicaksono, M.Kom.',
        keterangan: 'LULUS',
      },
      {
        id: 'n-502',
        kode: 'TIF-305',
        nama: 'Pemrograman Web & Cloud Lanjut',
        sks: 3,
        nilaiHuruf: 'A',
        nilaiAngka: 4.0,
        dosen: 'Ir. Anita Rahmawati, M.T.',
        keterangan: 'LULUS',
      },
      {
        id: 'n-503',
        kode: 'TIF-308',
        nama: 'Keamanan Siber & Kriptografi Terapan',
        sks: 3,
        nilaiHuruf: 'A-',
        nilaiAngka: 3.75,
        dosen: 'Dr. Hendra Saputra, M.Kom.',
        keterangan: 'LULUS',
      },
      {
        id: 'n-504',
        kode: 'TIF-312',
        nama: 'Kecerdasan Buatan & Machine Learning',
        sks: 3,
        nilaiHuruf: 'A-',
        nilaiAngka: 3.75,
        dosen: 'Prof. Dr. Eng. Satria Pratama',
        keterangan: 'LULUS',
      },
      {
        id: 'n-505',
        kode: 'UNIV-204',
        nama: 'Technopreneurship & Inovasi Bisnis',
        sks: 2,
        nilaiHuruf: 'A',
        nilaiAngka: 4.0,
        dosen: 'Dr. Nurul Hidayati, M.M.',
        keterangan: 'LULUS',
      },
    ],
  },
  {
    id: 'sem-4',
    semesterNumber: 4,
    namaSemester: 'Semester 4 (Genap 2025/2026)',
    tahunAkademik: '2025/2026 Genap',
    ips: 3.90,
    sksSemester: 20,
    sksKumulatif: 74,
    ipkKumulatif: 3.84,
    maksSksBerikutnya: 24,
    tanggalKHS: '12 Juli 2026',
    nilaiList: [
      { id: 'n-401', kode: 'TIF-202', nama: 'Basis Data Terdistribusi', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Hendra Saputra, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-402', kode: 'TIF-204', nama: 'Desain & Analisis Algoritma', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-403', kode: 'TIF-206', nama: 'Sistem Operasi Lanjut', sks: 3, nilaiHuruf: 'A-', nilaiAngka: 3.75, dosen: 'Ir. Agus Susanto, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-404', kode: 'TIF-208', nama: 'Jaringan Komputer & Telematika', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Hendra Saputra, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-405', kode: 'TIF-210', nama: 'Pemrograman Berorientasi Objek', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Ir. Anita Rahmawati, M.T.', keterangan: 'LULUS' },
      { id: 'n-406', kode: 'UNIV-104', nama: 'Bahasa Inggris Akademik & TOEFL', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dewi Lestari, M.Pd.', keterangan: 'LULUS' },
      { id: 'n-407', kode: 'TIF-212', nama: 'Praktikum Jaringan & Sistem', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Ir. Agus Susanto, M.Kom.', keterangan: 'LULUS' },
    ],
  },
  {
    id: 'sem-3',
    semesterNumber: 3,
    namaSemester: 'Semester 3 (Gasal 2025/2026)',
    tahunAkademik: '2025/2026 Gasal',
    ips: 3.82,
    sksSemester: 20,
    sksKumulatif: 54,
    ipkKumulatif: 3.81,
    maksSksBerikutnya: 24,
    tanggalKHS: '15 Januari 2026',
    nilaiList: [
      { id: 'n-301', kode: 'TIF-103', nama: 'Struktur Data & Algoritma', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-302', kode: 'TIF-105', nama: 'Sistem Manajemen Basis Data', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Hendra Saputra, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-303', kode: 'TIF-107', nama: 'Matematika Diskrit Lanjut', sks: 3, nilaiHuruf: 'B+', nilaiAngka: 3.5, dosen: 'Dra. Sri Wahyuni, M.Si.', keterangan: 'LULUS' },
      { id: 'n-304', kode: 'TIF-109', nama: 'Arsitektur Komputer & Organisasi', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Prof. Dr. Eng. Satria Pratama', keterangan: 'LULUS' },
      { id: 'n-305', kode: 'TIF-111', nama: 'Pemrograman Web Dasar', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Ir. Anita Rahmawati, M.T.', keterangan: 'LULUS' },
      { id: 'n-306', kode: 'UNIV-103', nama: 'Pendidikan Pancasila & Kewarganegaraan', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Drs. H. Mulyadi, M.H.', keterangan: 'LULUS' },
      { id: 'n-307', kode: 'TIF-113', nama: 'Praktikum Struktur Data', sks: 3, nilaiHuruf: 'A-', nilaiAngka: 3.75, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
    ],
  },
  {
    id: 'sem-2',
    semesterNumber: 2,
    namaSemester: 'Semester 2 (Genap 2024/2025)',
    tahunAkademik: '2024/2025 Genap',
    ips: 3.80,
    sksSemester: 18,
    sksKumulatif: 34,
    ipkKumulatif: 3.78,
    maksSksBerikutnya: 24,
    tanggalKHS: '10 Juli 2025',
    nilaiList: [
      { id: 'n-201', kode: 'TIF-102', nama: 'Algoritma & Pemrograman II', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-202', kode: 'MAT-102', nama: 'Kalkulus Lanjut & Aljabar Linear', sks: 3, nilaiHuruf: 'B+', nilaiAngka: 3.5, dosen: 'Dra. Sri Wahyuni, M.Si.', keterangan: 'LULUS' },
      { id: 'n-203', kode: 'FIS-102', nama: 'Fisika Dasar & Elektronika Komputasi', sks: 3, nilaiHuruf: 'A-', nilaiAngka: 3.75, dosen: 'Dr. Ir. Budi Hartono, M.T.', keterangan: 'LULUS' },
      { id: 'n-204', kode: 'TIF-104', nama: 'Pengantar Teknologi Informasi', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Prof. Dr. Eng. Satria Pratama', keterangan: 'LULUS' },
      { id: 'n-205', kode: 'UNIV-102', nama: 'Bahasa Indonesia & Penulisan Ilmiah', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dra. Siti Rahmah, M.Hum.', keterangan: 'LULUS' },
      { id: 'n-206', kode: 'TIF-106', nama: 'Praktikum Pemrograman Komputer II', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-207', kode: 'UNIV-101', nama: 'Pendidikan Agama & Etika Moral', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. M. Ridwan, M.Ag.', keterangan: 'LULUS' },
    ],
  },
  {
    id: 'sem-1',
    semesterNumber: 1,
    namaSemester: 'Semester 1 (Gasal 2024/2025)',
    tahunAkademik: '2024/2025 Gasal',
    ips: 3.75,
    sksSemester: 16,
    sksKumulatif: 16,
    ipkKumulatif: 3.75,
    maksSksBerikutnya: 20,
    tanggalKHS: '12 Januari 2025',
    nilaiList: [
      { id: 'n-101', kode: 'TIF-101', nama: 'Algoritma & Pemrograman I', sks: 3, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Bayu Wicaksono, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-102', kode: 'MAT-101', nama: 'Kalkulus Dasar & Diferensial', sks: 3, nilaiHuruf: 'B+', nilaiAngka: 3.5, dosen: 'Dra. Sri Wahyuni, M.Si.', keterangan: 'LULUS' },
      { id: 'n-103', kode: 'TIF-108', nama: 'Logika Matematika & Himpunan', sks: 3, nilaiHuruf: 'A-', nilaiAngka: 3.75, dosen: 'Dr. Hendra Saputra, M.Kom.', keterangan: 'LULUS' },
      { id: 'n-104', kode: 'FIS-101', nama: 'Fisika Dasar Komputasi I', sks: 3, nilaiHuruf: 'B+', nilaiAngka: 3.5, dosen: 'Dr. Ir. Budi Hartono, M.T.', keterangan: 'LULUS' },
      { id: 'n-105', kode: 'TIF-110', nama: 'Praktikum Algoritma & Pemrograman I', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Ir. Anita Rahmawati, M.T.', keterangan: 'LULUS' },
      { id: 'n-106', kode: 'UNIV-105', nama: 'Etika Profesi & Dasar Kepemimpinan', sks: 2, nilaiHuruf: 'A', nilaiAngka: 4.0, dosen: 'Dr. Nurul Hidayati, M.M.', keterangan: 'LULUS' },
    ],
  },
];

export default function HasilStudiKHSPage() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('sem-5');

  // Find active semester data
  const currentSem = useMemo(() => {
    return SEMESTER_ARCHIVE.find((s) => s.id === selectedSemesterId) || SEMESTER_ARCHIVE[0];
  }, [selectedSemesterId]);

  // Calculations for current active semester
  const totalSksTaken = useMemo(() => {
    return currentSem.nilaiList.reduce((acc, curr) => acc + curr.sks, 0);
  }, [currentSem]);

  const totalSksPassed = useMemo(() => {
    return currentSem.nilaiList
      .filter((n) => n.keterangan === 'LULUS')
      .reduce((acc, curr) => acc + curr.sks, 0);
  }, [currentSem]);

  const totalBobotMutu = useMemo(() => {
    return currentSem.nilaiList.reduce((acc, curr) => acc + curr.sks * curr.nilaiAngka, 0);
  }, [currentSem]);

  const calculatedIPS = useMemo(() => {
    if (totalSksTaken === 0) return 0;
    return (totalBobotMutu / totalSksTaken).toFixed(2);
  }, [totalBobotMutu, totalSksTaken]);

  // Overall Grade breakdown stats
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { A: 0, 'A-': 0, 'B+': 0, B: 0, Lainnya: 0 };
    currentSem.nilaiList.forEach((n) => {
      if (counts[n.nilaiHuruf] !== undefined) {
        counts[n.nilaiHuruf]++;
      } else {
        counts.Lainnya++;
      }
    });
    return counts;
  }, [currentSem]);

  const handlePrintKHS = () => {
    window.print();
  };

  const handleDownloadTranscript = () => {
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
                <Award className="w-3.5 h-3.5" />
                <span>Kartu Hasil Studi Resmi</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terverifikasi BAAK</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Kartu Hasil Studi (KHS) Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Rincian evaluasi hasil studi, Indeks Prestasi Semester (IPS), Indeks Prestasi Kumulatif (IPK), dan transkrip akademik resmi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Unduh Transkrip Resmi</span>
            </button>
            <button
              onClick={handlePrintKHS}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak KHS (PDF)</span>
            </button>
          </div>
        </div>

        {/* Semester Selection & Profile Card Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Pilih Semester KHS:
            </label>
            <div className="relative min-w-[280px]">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer pr-10"
              >
                {SEMESTER_ARCHIVE.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.namaSemester} {sem.id === 'sem-5' ? '— (Terkini)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50/70 border border-blue-200/60 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#1E3A8A] shrink-0" />
            <span>
              KHS disahkan pada: <strong className="text-slate-900">{currentSem.tanggalKHS}</strong>
            </span>
          </div>
        </div>

        {/* Printable Official Letterhead Header (Visible only when printed) */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                Institut Teknologi Nusantara
              </h2>
              <p className="text-xs text-slate-700">Fakultas Ilmu Komputer &bull; Program Studi S1 Teknik Informatika</p>
              <p className="text-[11px] text-slate-500">Jalan Soekarno Hatta No. 128, Bandung, Jawa Barat | Website: siakad.itn.ac.id</p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-slate-900">KARTU HASIL STUDI (KHS)</h3>
              <p className="text-xs text-slate-700 font-semibold">{currentSem.namaSemester}</p>
              <p className="text-[11px] text-slate-500">No. Dokumen: KHS/2026/{currentSem.semesterNumber}/2311501001</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs text-slate-800">
            <div className="space-y-1">
              <p><strong>Nama Mahasiswa:</strong> Muhammad Rizky Pratama</p>
              <p><strong>Nomor Induk Mahasiswa (NIM):</strong> 2311501001</p>
              <p><strong>Program Studi:</strong> Teknik Informatika (S1)</p>
            </div>
            <div className="space-y-1">
              <p><strong>Tahun Akademik:</strong> {currentSem.tahunAkademik}</p>
              <p><strong>Dosen Pembimbing Akademik:</strong> Dr. Bayu Wicaksono, M.Kom.</p>
              <p><strong>Status Mahasiswa:</strong> Aktif</p>
            </div>
          </div>
        </div>

        {/* 4 Academic Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          {/* IPS Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                IPS Semester Ini
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#1E3A8A]">{calculatedIPS}</p>
              <span className="text-xs font-semibold text-slate-400">/ 4.00</span>
            </div>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              <span>Dengan Pujian (Cum Laude)</span>
            </div>
          </div>

          {/* IPK Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                IPK Kumulatif
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{currentSem.ipkKumulatif.toFixed(2)}</p>
              <span className="text-xs font-semibold text-slate-400">/ 4.00</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Dari total <strong className="text-slate-700">{currentSem.sksKumulatif} SKS</strong> yang diselesaikan
            </p>
          </div>

          {/* SKS Semester Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                SKS Semester Ini
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{totalSksPassed}</p>
              <span className="text-xs font-semibold text-slate-400">/ {totalSksTaken} SKS</span>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>100% SKS Lulus</span>
            </p>
          </div>

          {/* Max SKS Next Semester */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Beban Maksimal KRS
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#D4A017]">{currentSem.maksSksBerikutnya}</p>
              <span className="text-xs font-semibold text-slate-400">SKS</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Hak pengambilan SKS semester depan
            </p>
          </div>
        </div>

        {/* KHS GRADES TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Rincian Nilai Mata Kuliah &bull; {currentSem.namaSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi nilai akhir hasil belajar yang telah divalidasi oleh Program Studi.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 w-fit">
              {currentSem.nilaiList.length} Mata Kuliah ({totalSksTaken} SKS)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-center w-12">No.</th>
                  <th className="py-3.5 px-4">Kode MK</th>
                  <th className="py-3.5 px-4">Nama Mata Kuliah</th>
                  <th className="py-3.5 px-4 text-center">SKS (K)</th>
                  <th className="py-3.5 px-4 text-center">Nilai Huruf</th>
                  <th className="py-3.5 px-4 text-center">Angka Mutu (M)</th>
                  <th className="py-3.5 px-4 text-center">Bobot (K &times; M)</th>
                  <th className="py-3.5 px-4">Dosen Pengampu</th>
                  <th className="py-3.5 px-4 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {currentSem.nilaiList.map((item, idx) => {
                  const bobot = item.sks * item.nilaiAngka;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                        {item.kode}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {item.nama}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.sks}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-black ${
                            item.nilaiHuruf === 'A'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.nilaiHuruf === 'A-'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : item.nilaiHuruf === 'B+'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.nilaiHuruf === 'B'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.nilaiHuruf}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {item.nilaiAngka.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                        {bobot.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {item.dosen}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>{item.keterangan}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Summary Footer */}
              <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3.5 px-4 text-right">
                    TOTAL EVALUASI SEMESTER:
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm font-black text-[#1E3A8A]">
                    {totalSksTaken} SKS
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-normal">
                    —
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-normal">
                    —
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm font-black text-slate-900">
                    {totalBobotMutu.toFixed(2)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-right">
                    <span className="text-xs text-slate-600 font-normal mr-2">IPS:</span>
                    <span className="text-base font-black text-[#1E3A8A] bg-blue-100/70 px-2.5 py-1 rounded-lg">
                      {calculatedIPS}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PERFORMANCE & GRADE DISTRIBUTION CHART BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* IPS Semester Progression */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Tren Indeks Prestasi Semester (IPS)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekam jejak konsistensi akademik mahasiswa sejak Semester 1 s/d Semester 5.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Stabil Sangat Tinggi
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="pt-6 pb-2 grid grid-cols-5 gap-3 items-end h-48 border-b border-slate-100">
              {[
                { sem: 'Sem 1', val: 3.75, active: currentSem.semesterNumber === 1 },
                { sem: 'Sem 2', val: 3.80, active: currentSem.semesterNumber === 2 },
                { sem: 'Sem 3', val: 3.82, active: currentSem.semesterNumber === 3 },
                { sem: 'Sem 4', val: 3.90, active: currentSem.semesterNumber === 4 },
                { sem: 'Sem 5', val: 3.84, active: currentSem.semesterNumber === 5 },
              ].map((bar) => {
                const heightPercent = (bar.val / 4.0) * 100;
                return (
                  <div key={bar.sem} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[11px] font-mono font-bold text-slate-700 group-hover:text-[#1E3A8A] transition-colors">
                      {bar.val.toFixed(2)}
                    </span>
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                      <div
                        className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 ${
                          bar.active
                            ? 'bg-gradient-to-t from-[#1E3A8A] to-[#3B82F6]'
                            : 'bg-slate-300'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${bar.active ? 'text-[#1E3A8A]' : 'text-slate-500'}`}>
                      {bar.sem}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Batas Minimum Kelulusan: 2.00</span>
              <span className="font-semibold text-slate-700">Rata-rata Kumulatif: 3.84</span>
            </div>
          </div>

          {/* Grade Distribution Pill */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1E3A8A]" />
              <span>Distribusi Nilai {currentSem.namaSemester.split(' ')[0]} {currentSem.namaSemester.split(' ')[1]}</span>
            </h3>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Nilai A (4.00)', count: gradeCounts.A, color: 'bg-emerald-500', barBg: 'bg-emerald-100' },
                { label: 'Nilai A- (3.75)', count: gradeCounts['A-'], color: 'bg-teal-500', barBg: 'bg-teal-100' },
                { label: 'Nilai B+ (3.50)', count: gradeCounts['B+'], color: 'bg-blue-500', barBg: 'bg-blue-100' },
                { label: 'Nilai B (3.00)', count: gradeCounts.B, color: 'bg-amber-500', barBg: 'bg-amber-100' },
              ].map((stat) => {
                const percent = currentSem.nilaiList.length > 0 ? (stat.count / currentSem.nilaiList.length) * 100 : 0;
                return (
                  <div key={stat.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{stat.label}</span>
                      <span className="font-bold text-slate-900">{stat.count} Mata Kuliah ({percent.toFixed(0)}%)</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${stat.barBg} overflow-hidden`}>
                      <div
                        className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100 text-xs text-blue-900 mt-4">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                Kinerja Akademik Unggul
              </p>
              <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                Seluruh mata kuliah berhasil diselesaikan dengan predikat A dan A- tanpa ada perbaikan nilai.
              </p>
            </div>
          </div>
        </div>

        {/* OFFICIAL DIGITAL SIGNATURE & VALIDATION FOOTER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-100 pb-6">
            {/* QR Verification Seal */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-2 shrink-0">
                <QrCode className="w-full h-full text-slate-800" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Validasi Digital Resmi</span>
                </p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Pindai kode QR untuk memverifikasi keaslian transkrip nilai melalui Pusat Data BAAK ITN.
                </p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">ID: ITN-KHS-2026-88SKS-VAL</p>
              </div>
            </div>

            {/* Signature Dosen PA */}
            <div className="text-center p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-[11px] text-slate-500">Dosen Pembimbing Akademik,</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-sm font-serif italic text-blue-950 font-bold tracking-wider">
                  Dr. Bayu Wicaksono
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">Dr. Bayu Wicaksono, M.Kom.</p>
              <p className="text-[10px] font-mono text-slate-500">NIP: 198503122010121003</p>
            </div>

            {/* Signature Dekan / Kaprodi */}
            <div className="text-center p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <p className="text-[11px] text-slate-500">Ketua Program Studi Teknik Informatika,</p>
              <div className="h-14 flex items-center justify-center">
                <span className="text-sm font-serif italic text-blue-950 font-bold tracking-wider">
                  Prof. Dr. Satria Pratama
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900">Prof. Dr. Eng. Satria Pratama</p>
              <p className="text-[10px] font-mono text-slate-500">NIP: 197801052003121001</p>
            </div>
          </div>

          {/* Academic Regulations Notice */}
          <div className="flex items-start gap-2.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Catatan Skala Nilai:</strong> A = 4.00 (Istimewa) | A- = 3.75 (Sangat Baik) | B+ = 3.50 (Baik Sekali) | B = 3.00 (Baik) | C+ = 2.50 (Cukup Baik) | C = 2.00 (Cukup) | D = 1.00 (Kurang) | E = 0.00 (Gagal). Nilai kelulusan mata kuliah minimal adalah C (2.00). Dokumen ini sah dan diakui tanpa tanda tangan basah berdasarkan UU ITE Pasal 5 Ayat 1.
            </p>
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
