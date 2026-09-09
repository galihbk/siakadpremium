'use client';

import React, { useState, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  Filter,
  Grid,
  List,
  Info,
  Building2,
  X,
} from 'lucide-react';

interface JadwalKuliahItem {
  id: string;
  code: string;
  name: string;
  sks: number;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  jamMulai: string;
  jamSelesai: string;
  ruang: string;
  gedung: string;
  dosen: string;
  dosenGelar: string;
  dosenEmail: string;
  tipe: 'Teori' | 'Praktikum' | 'Kuliah Umum';
  kelas: string;
  kehadiranPercent: number;
  totalPertemuan: number;
  pertemuanSelesai: number;
  lmsUrl?: string;
  deskripsi: string;
  color: string;
}

const JADWAL_LIST: JadwalKuliahItem[] = [
  {
    id: 'jk-1',
    code: 'TIF-301',
    name: 'Rekayasa Perangkat Lunak',
    sks: 3,
    hari: 'Senin',
    jamMulai: '08:00',
    jamSelesai: '10:30',
    ruang: 'Lab Komputasi 3',
    gedung: 'Gedung B, Lantai 2',
    dosen: 'Dr. Bayu Wicaksono',
    dosenGelar: 'Dr. Bayu Wicaksono, M.Kom.',
    dosenEmail: 'bayu.wicaksono@itn.ac.id',
    tipe: 'Teori',
    kelas: 'IF-3A',
    kehadiranPercent: 100,
    totalPertemuan: 16,
    pertemuanSelesai: 3,
    lmsUrl: 'https://lms.itn.ac.id/course/tif301',
    deskripsi: 'Mempelajari metodologi rekayasa perangkat lunak modern, arsitektur microservices, agile scrum, design pattern, dan pengujian perangkat lunak terotomasi.',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'jk-2',
    code: 'TIF-305',
    name: 'Pemrograman Web & Cloud Lanjut',
    sks: 3,
    hari: 'Selasa',
    jamMulai: '10:30',
    jamSelesai: '13:00',
    ruang: 'Lab Software Engineering',
    gedung: 'Gedung D, Lantai 1',
    dosen: 'Ir. Anita Rahmawati',
    dosenGelar: 'Ir. Anita Rahmawati, M.T.',
    dosenEmail: 'anita.rahmawati@itn.ac.id',
    tipe: 'Praktikum',
    kelas: 'IF-3A',
    kehadiranPercent: 100,
    totalPertemuan: 16,
    pertemuanSelesai: 3,
    lmsUrl: 'https://lms.itn.ac.id/course/tif305',
    deskripsi: 'Praktik mendalam Fullstack Modern (Next.js, NestJS, Prisma ORM), kontainerisasi Docker, Kubernetes, dan implementasi CI/CD pipeline pada penyedia Cloud.',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'jk-3',
    code: 'TIF-308',
    name: 'Keamanan Siber & Kriptografi Terapan',
    sks: 3,
    hari: 'Rabu',
    jamMulai: '13:00',
    jamSelesai: '15:30',
    ruang: 'Ruang Teori 402',
    gedung: 'Gedung Kuliah Bersama (GKB), Lantai 4',
    dosen: 'Dr. Hendra Saputra',
    dosenGelar: 'Dr. Hendra Saputra, M.Kom.',
    dosenEmail: 'hendra.saputra@itn.ac.id',
    tipe: 'Teori',
    kelas: 'IF-3B',
    kehadiranPercent: 100,
    totalPertemuan: 16,
    pertemuanSelesai: 3,
    lmsUrl: 'https://lms.itn.ac.id/course/tif308',
    deskripsi: 'Prinsip kriptografi simetris & asimetris, otentikasi JWT, PKI, penetration testing etis, mitigasi ancaman OWASP Top 10, dan keamanan jaringan nirkabel.',
    color: 'from-amber-600 to-orange-700',
  },
  {
    id: 'jk-4',
    code: 'TIF-312',
    name: 'Kecerdasan Buatan & Machine Learning',
    sks: 3,
    hari: 'Kamis',
    jamMulai: '08:00',
    jamSelesai: '10:30',
    ruang: 'Auditorium Riset AI',
    gedung: 'Gedung Rektorat Baru, Lantai 3',
    dosen: 'Prof. Dr. Eng. Satria Pratama',
    dosenGelar: 'Prof. Dr. Eng. Satria Pratama',
    dosenEmail: 'satria.pratama@itn.ac.id',
    tipe: 'Teori',
    kelas: 'IF-3A',
    kehadiranPercent: 100,
    totalPertemuan: 16,
    pertemuanSelesai: 3,
    lmsUrl: 'https://lms.itn.ac.id/course/tif312',
    deskripsi: 'Konsep dasar algoritma pembelajaran mesin (Supervised, Unsupervised, Reinforcement Learning), Deep Neural Network, Computer Vision, dan NLP terapan.',
    color: 'from-purple-600 to-violet-700',
  },
  {
    id: 'jk-5',
    code: 'UNIV-204',
    name: 'Technopreneurship & Inovasi Bisnis',
    sks: 2,
    hari: 'Jumat',
    jamMulai: '09:00',
    jamSelesai: '10:40',
    ruang: 'Ruang Teori 201',
    gedung: 'Gedung A, Lantai 2',
    dosen: 'Dr. Nurul Hidayati',
    dosenGelar: 'Dr. Nurul Hidayati, M.M.',
    dosenEmail: 'nurul.hidayati@itn.ac.id',
    tipe: 'Kuliah Umum',
    kelas: 'UNIV-G',
    kehadiranPercent: 100,
    totalPertemuan: 16,
    pertemuanSelesai: 2,
    lmsUrl: 'https://lms.itn.ac.id/course/univ204',
    deskripsi: 'Pengembangan model bisnis digital Canvas (BMC), validasi produk MVP, pitching venture capital, aspek legal HAKI, dan strategi pemasaran produk teknologi.',
    color: 'from-rose-600 to-pink-700',
  },
];

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

export default function JadwalKuliahPage() {
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMatkul, setSelectedMatkul] = useState<JadwalKuliahItem | null>(null);

  // Determine current day in Indonesian for "Hari Ini" highlight
  const todayName = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  }, []);

  // Filtered list
  const filteredJadwal = useMemo(() => {
    return JADWAL_LIST.filter((item) => {
      const matchHari = selectedHari === 'Semua' || item.hari === selectedHari;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.dosen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruang.toLowerCase().includes(searchQuery.toLowerCase());
      return matchHari && matchSearch;
    });
  }, [selectedHari, searchQuery]);

  // Export iCalendar (.ics) function
  const handleExportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ITN Siakad Premium//Jadwal Kuliah//ID\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Jadwal Kuliah ITN 2026/2027\n`;

    const dayOffsets: Record<string, number> = {
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
    };

    JADWAL_LIST.forEach((item) => {
      const [startH, startM] = item.jamMulai.split(':');
      const [endH, endM] = item.jamSelesai.split(':');
      
      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `SUMMARY:[${item.code}] ${item.name}\n`;
      icsContent += `DESCRIPTION:Dosen: ${item.dosenGelar}\\nSKS: ${item.sks}\\nKelas: ${item.kelas}\\nRuang: ${item.ruang}\\n${item.gedung}\n`;
      icsContent += `LOCATION:${item.ruang} - ${item.gedung}\n`;
      icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${item.hari.substring(0, 2).toUpperCase()};COUNT=16\n`;
      icsContent += `STATUS:CONFIRMED\n`;
      icsContent += `END:VEVENT\n`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'Jadwal_Kuliah_ITN_2026_Gasal.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
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
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester Gasal 2026/2027</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Periode Perkuliahan Aktif</span>
              </span>
              {todayName !== 'Minggu' && todayName !== 'Sabtu' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hari Ini: {todayName}</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Jadwal Perkuliahan & Laboratorium
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Informasi jadwal tatap muka kelas reguler, praktikum laboratorium, dan dosen pengampu TA 2026/2027 Gasal.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportICS}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Ekspor ke Kalender Google / Outlook / Apple"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Sinkron Kalender (.ics)</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total SKS Aktif</span>
              <p className="text-2xl font-black text-[#1E3A8A] mt-1">14 SKS</p>
              <p className="text-xs text-slate-500 mt-0.5">5 Mata Kuliah Terdaftar</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hari Perkuliahan</span>
              <p className="text-2xl font-black text-slate-900 mt-1">5 Hari</p>
              <p className="text-xs text-slate-500 mt-0.5">Senin s/d Jumat</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jam Tatap Muka</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">12.5 Jam</p>
              <p className="text-xs text-slate-500 mt-0.5">Alokasi Waktu per Minggu</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Syarat Presensi UAS</span>
              <p className="text-2xl font-black text-[#D4A017] mt-1">Min. 75%</p>
              <p className="text-xs text-slate-500 mt-0.5">Kehadiran Saat Ini: 100%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & View Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-center print:hidden">
          {/* Day Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedHari('Semua')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedHari === 'Semua'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Hari ({JADWAL_LIST.length})
            </button>
            {HARI_ORDER.map((hari) => {
              const count = JADWAL_LIST.filter((j) => j.hari === hari).length;
              const isToday = todayName === hari;
              return (
                <button
                  key={hari}
                  onClick={() => setSelectedHari(hari)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    selectedHari === hari
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : isToday
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{hari}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedHari === hari ? 'bg-white/20' : 'bg-slate-200'}`}>
                    {count}
                  </span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Hari Ini" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Grid/List Switcher */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata kuliah, dosen, ruang..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-blue-100 font-medium"
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

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel / Daftar"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Official Header (Only shown during print) */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900">Institut Teknologi Nusantara</h2>
              <p className="text-xs text-slate-600">Biro Administrasi Akademik & Kemahasiswaan (BAAK)</p>
              <p className="text-xs text-slate-600">Jalan Soekarno Hatta No. 128, Bandung, Jawa Barat</p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-slate-900">JADWAL PERKULIAHAN RESMI</h3>
              <p className="text-xs text-slate-700">Semester Gasal 2026/2027</p>
              <p className="text-xs text-slate-500">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs">
            <div>
              <p><strong>Nama Mahasiswa:</strong> Muhammad Rizky Pratama</p>
              <p><strong>NIM:</strong> 2311501001</p>
            </div>
            <div>
              <p><strong>Program Studi:</strong> S1 - Teknik Informatika</p>
              <p><strong>Dosen PA:</strong> Dr. Bayu Wicaksono, M.Kom.</p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        {filteredJadwal.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-subtle">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada jadwal ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba sesuaikan kata kunci pencarian atau filter hari yang Anda pilih.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJadwal.map((item) => {
              const isToday = todayName === item.hari;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMatkul(item)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer border-t-4"
                  style={{
                    borderTopColor:
                      item.hari === 'Senin'
                        ? '#2563EB'
                        : item.hari === 'Selasa'
                        ? '#059669'
                        : item.hari === 'Rabu'
                        ? '#D97706'
                        : item.hari === 'Kamis'
                        ? '#7C3AED'
                        : '#E11D48',
                  }}
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        {item.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {item.sks} SKS
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            item.tipe === 'Praktikum'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.tipe}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-2">
                      {item.name}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.dosenGelar}</span>
                    </p>
                  </div>

                  {/* Card Schedule Bar */}
                  <div className="bg-slate-50/80 px-5 py-3 border-y border-slate-100 space-y-1.5 mt-auto">
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.hari}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 ml-1">
                            HARI INI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px] font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.jamMulai} - {item.jamSelesai}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.ruang} &bull; {item.gedung}</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Kelas {item.kelas} &bull; Mgg {item.pertemuanSelesai}/{item.totalPertemuan}</span>
                    </div>
                    <span className="text-[#1E3A8A] font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Detail <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Hari & Waktu</th>
                    <th className="py-3.5 px-4">Kode</th>
                    <th className="py-3.5 px-4">Mata Kuliah</th>
                    <th className="py-3.5 px-4 text-center">SKS</th>
                    <th className="py-3.5 px-4">Dosen Pengampu</th>
                    <th className="py-3.5 px-4">Ruangan</th>
                    <th className="py-3.5 px-4 text-center">Kelas</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredJadwal.map((item) => {
                    const isToday = todayName === item.hari;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-blue-50/50 transition-colors ${
                          isToday ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{item.hari}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                                HARI INI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.jamMulai} - {item.jamSelesai}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-[#1E3A8A]">
                          {item.code}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div>{item.name}</div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-md mt-1 ${
                              item.tipe === 'Praktikum'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.tipe}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">
                          {item.sks}
                        </td>
                        <td className="py-4 px-4 text-slate-700">
                          <p className="font-medium text-slate-900">{item.dosenGelar}</p>
                          <p className="text-[11px] text-slate-400">{item.dosenEmail}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-800">{item.ruang}</div>
                          <div className="text-[11px] text-slate-500">{item.gedung}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">
                          {item.kelas}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedMatkul(item)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Rincian
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

        {/* Academic Notes & Policies */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 text-xs text-slate-700 space-y-3 print:hidden">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-[#1E3A8A]" />
            <span>Tata Tertib & Ketentuan Perkuliahan Semester Gasal</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 leading-relaxed">
            <li>Toleransi keterlambatan kehadiran mahasiswa adalah maksimal <strong>15 menit</strong> setelah perkuliahan dimulai.</li>
            <li>Mahasiswa diwajibkan memenuhi minimal <strong>75% kehadiran</strong> tatap muka untuk dapat mengikuti Ujian Akhir Semester (UAS).</li>
            <li>Bagi perkuliahan di Laboratorium Komputer, mahasiswa wajib mengenakan jas almamater atau pakaian rapi berkerah dan sepatu tertutup.</li>
            <li>Jika berhalangan hadir karena sakit atau izin dispensasi resmi, serahkan surat keterangan ke BAAK maksimal 3 hari kerja setelah ketidakhadiran.</li>
          </ul>
        </div>

      </div>

      {/* DETAIL MODAL POPUP */}
      {selectedMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className={`p-6 text-white bg-gradient-to-r ${selectedMatkul.color}`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-1 rounded-md">
                  {selectedMatkul.code} &bull; {selectedMatkul.kelas}
                </span>
                <button
                  onClick={() => setSelectedMatkul(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold">{selectedMatkul.name}</h3>
              <p className="text-xs text-white/80 mt-1">
                {selectedMatkul.sks} SKS &bull; {selectedMatkul.tipe}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Deskripsi & Silabus Mata Kuliah
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedMatkul.deskripsi}
                </p>
              </div>

              {/* Schedule Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 font-semibold block mb-0.5">Waktu Kuliah</span>
                  <p className="font-bold text-slate-900">{selectedMatkul.hari}, {selectedMatkul.jamMulai} - {selectedMatkul.jamSelesai} WIB</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-slate-500 font-semibold block mb-0.5">Ruangan</span>
                  <p className="font-bold text-slate-900">{selectedMatkul.ruang}</p>
                  <p className="text-[11px] text-slate-500">{selectedMatkul.gedung}</p>
                </div>
              </div>

              {/* Lecturer Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Dosen Pengampu
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-sm">
                    {selectedMatkul.dosen.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedMatkul.dosenGelar}</p>
                    <p className="text-[11px] text-blue-600 hover:underline">
                      <a href={`mailto:${selectedMatkul.dosenEmail}`}>{selectedMatkul.dosenEmail}</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-700">Presensi Kehadiran Sementara</span>
                  <span className="font-bold text-emerald-700">{selectedMatkul.kehadiranPercent}% (3/3 Selesai)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${selectedMatkul.kehadiranPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Syarat minimum kehadiran mengikuti UAS adalah 75%.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {selectedMatkul.lmsUrl && (
                <a
                  href={selectedMatkul.lmsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka LMS Kuliah</span>
                </a>
              )}
              <button
                onClick={() => setSelectedMatkul(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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
