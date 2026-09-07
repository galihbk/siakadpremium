'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  FileText,
  GraduationCap,
  Award,
  Layers,
  Search,
  Plus,
  Download,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  BookOpen,
  Calendar,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface CurriculumItem {
  id: string;
  code: string;
  name: string;
  studyProgram: string;
  degreeLevel: 'S1' | 'D4' | 'D3';
  facultyCode: 'FASILKOM' | 'FTI' | 'FEBD' | 'FDKV';
  startYear: number;
  sksWajib: number;
  sksPilihan: number;
  totalSks: number;
  curriculumType: 'Kurikulum OBE' | 'Kurikulum MBKM' | 'Vokasi Terapan';
  skRektor: string;
  status: 'Aktif' | 'Masa Transisi' | 'Arsip';
  description: string;
}

const initialCurriculums: CurriculumItem[] = [
  {
    id: 'c-1',
    code: 'KUR-TIF-2024',
    name: 'Kurikulum OBE Teknik Informatika 2024',
    studyProgram: 'S1 Teknik Informatika',
    degreeLevel: 'S1',
    facultyCode: 'FASILKOM',
    startYear: 2024,
    sksWajib: 120,
    sksPilihan: 24,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 112/ITN/R/2024',
    status: 'Aktif',
    description: 'Outcome-Based Education berorientasi AI Engineer, Fullstack Developer, dan Cyber Security Specialist.',
  },
  {
    id: 'c-2',
    code: 'KUR-SI-2024',
    name: 'Kurikulum MBKM Sistem Informasi 2024',
    studyProgram: 'S1 Sistem Informasi',
    degreeLevel: 'S1',
    facultyCode: 'FASILKOM',
    startYear: 2024,
    sksWajib: 118,
    sksPilihan: 26,
    totalSks: 144,
    curriculumType: 'Kurikulum MBKM',
    skRektor: 'SK Rektor No. 113/ITN/R/2024',
    status: 'Aktif',
    description: 'Fokus pada enterprise system architecture, business intelligence, dan digital transformation consultant.',
  },
  {
    id: 'c-3',
    code: 'KUR-RPL-2023',
    name: 'Kurikulum Rekayasa Perangkat Lunak 2023',
    studyProgram: 'S1 Rekayasa Perangkat Lunak',
    degreeLevel: 'S1',
    facultyCode: 'FASILKOM',
    startYear: 2023,
    sksWajib: 122,
    sksPilihan: 22,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 098/ITN/R/2023',
    status: 'Aktif',
    description: 'Standar rekayasa cloud native, QA automation, DevOps lifecycle, dan software scalability.',
  },
  {
    id: 'c-4',
    code: 'KUR-TKJ-2022',
    name: 'Kurikulum Terapan Jaringan Komputer 2022',
    studyProgram: 'D4 Teknologi Rekayasa Komputer Jaringan',
    degreeLevel: 'D4',
    facultyCode: 'FASILKOM',
    startYear: 2022,
    sksWajib: 110,
    sksPilihan: 34,
    totalSks: 144,
    curriculumType: 'Vokasi Terapan',
    skRektor: 'SK Rektor No. 045/ITN/R/2022',
    status: 'Aktif',
    description: 'Kurikulum vokasi terapan 60% praktik industri bersertifikasi Cisco CCNA & RedHat Linux.',
  },
  {
    id: 'c-5',
    code: 'KUR-MI-2021',
    name: 'Kurikulum Vokasi Manajemen Informatika 2021',
    studyProgram: 'D3 Manajemen Informatika',
    degreeLevel: 'D3',
    facultyCode: 'FASILKOM',
    startYear: 2021,
    sksWajib: 96,
    sksPilihan: 14,
    totalSks: 110,
    curriculumType: 'Vokasi Terapan',
    skRektor: 'SK Rektor No. 021/ITN/R/2021',
    status: 'Masa Transisi',
    description: 'Kurikulum jenjang D3 untuk mencetak programmer aplikasi bisnis dan administrator basis data muda.',
  },
  {
    id: 'c-6',
    code: 'KUR-ELK-2024',
    name: 'Kurikulum OBE Teknik Elektro Industri 2024',
    studyProgram: 'S1 Teknik Elektro',
    degreeLevel: 'S1',
    facultyCode: 'FTI',
    startYear: 2024,
    sksWajib: 124,
    sksPilihan: 20,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 115/ITN/R/2024',
    status: 'Aktif',
    description: 'Sistem tenaga listrik cerdas (smart grid), instrumentasi biomedis, dan sistem embedded IoT.',
  },
  {
    id: 'c-7',
    code: 'KUR-MSN-2023',
    name: 'Kurikulum OBE Rekayasa Mekanikal 2023',
    studyProgram: 'S1 Teknik Mesin',
    degreeLevel: 'S1',
    facultyCode: 'FTI',
    startYear: 2023,
    sksWajib: 122,
    sksPilihan: 22,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 101/ITN/R/2023',
    status: 'Aktif',
    description: 'Desain manufaktur otomotif, konversi energi terbarukan, dan perancangan mekanikal CAD/CAM.',
  },
  {
    id: 'c-8',
    code: 'KUR-IND-2024',
    name: 'Kurikulum Lean & Supply Chain Industri 2024',
    studyProgram: 'S1 Teknik Industri',
    degreeLevel: 'S1',
    facultyCode: 'FTI',
    startYear: 2024,
    sksWajib: 120,
    sksPilihan: 24,
    totalSks: 144,
    curriculumType: 'Kurikulum MBKM',
    skRektor: 'SK Rektor No. 116/ITN/R/2024',
    status: 'Aktif',
    description: 'Manajemen rantai pasok industri 4.0, lean manufacturing, ergonomi, dan optimasi operasional pabrik.',
  },
  {
    id: 'c-9',
    code: 'KUR-BD-2024',
    name: 'Kurikulum OBE Bisnis Digital & Technopreneur 2024',
    studyProgram: 'S1 Bisnis Digital',
    degreeLevel: 'S1',
    facultyCode: 'FEBD',
    startYear: 2024,
    sksWajib: 116,
    sksPilihan: 28,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 118/ITN/R/2024',
    status: 'Aktif',
    description: 'Inovasi model bisnis digital, growth hacking, financial technology, dan startup incubation.',
  },
  {
    id: 'c-10',
    code: 'KUR-MNJ-2023',
    name: 'Kurikulum Manajemen Stratejik Global 2023',
    studyProgram: 'S1 Manajemen',
    degreeLevel: 'S1',
    facultyCode: 'FEBD',
    startYear: 2023,
    sksWajib: 120,
    sksPilihan: 24,
    totalSks: 144,
    curriculumType: 'Kurikulum MBKM',
    skRektor: 'SK Rektor No. 104/ITN/R/2023',
    status: 'Aktif',
    description: 'Manajemen pemasaran internasional, kepemimpinan korporasi, dan manajemen investasi portofolio.',
  },
  {
    id: 'c-11',
    code: 'KUR-AKT-2024',
    name: 'Kurikulum Akuntansi Forensik & Sistem ERP 2024',
    studyProgram: 'S1 Akuntansi',
    degreeLevel: 'S1',
    facultyCode: 'FEBD',
    startYear: 2024,
    sksWajib: 122,
    sksPilihan: 22,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 119/ITN/R/2024',
    status: 'Aktif',
    description: 'Standar IFRS, audit forensik berbasis data analytics, perpajakan digital, dan ERP SAP terintegrasi.',
  },
  {
    id: 'c-12',
    code: 'KUR-DKV-2024',
    name: 'Kurikulum OBE Desain Komunikasi Visual 2024',
    studyProgram: 'S1 Desain Komunikasi Visual',
    degreeLevel: 'S1',
    facultyCode: 'FDKV',
    startYear: 2024,
    sksWajib: 114,
    sksPilihan: 30,
    totalSks: 144,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 120/ITN/R/2024',
    status: 'Aktif',
    description: 'Visual branding, UI/UX interaction design, ilustrasi digital, motion graphics, dan periklanan kreatif.',
  },
];

export default function SuperAdminKurikulumPage() {
  const [curriculums, setCurriculums] = useState<CurriculumItem[]>(initialCurriculums);
  const [searchQuery, setSearchQuery] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('Semua');
  const [facultyFilter, setFacultyFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    studyProgram: string;
    degreeLevel: CurriculumItem['degreeLevel'];
    facultyCode: CurriculumItem['facultyCode'];
    startYear: number;
    sksWajib: number;
    sksPilihan: number;
    curriculumType: CurriculumItem['curriculumType'];
    skRektor: string;
    status: CurriculumItem['status'];
    description: string;
  }>({
    code: '',
    name: '',
    studyProgram: 'S1 Teknik Informatika',
    degreeLevel: 'S1',
    facultyCode: 'FASILKOM',
    startYear: 2024,
    sksWajib: 120,
    sksPilihan: 24,
    curriculumType: 'Kurikulum OBE',
    skRektor: 'SK Rektor No. 125/ITN/R/2024',
    status: 'Aktif',
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, degreeFilter, facultyFilter, statusFilter]);

  const filteredCurriculums = useMemo(() => {
    return curriculums.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studyProgram.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skRektor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDegree = degreeFilter === 'Semua' || c.degreeLevel === degreeFilter;
      const matchFaculty = facultyFilter === 'Semua' || c.facultyCode === facultyFilter;
      const matchStatus = statusFilter === 'Semua' || c.status === statusFilter;

      return matchSearch && matchDegree && matchFaculty && matchStatus;
    });
  }, [curriculums, searchQuery, degreeFilter, facultyFilter, statusFilter]);

  const sortedCurriculums = useMemo(() => {
    return [...filteredCurriculums].sort((a, b) => {
      const aVal: any = (a as any)[sortField];
      const bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [filteredCurriculums, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedCurriculums.length / itemsPerPage));
  const paginatedCurriculums = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCurriculums.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCurriculums, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const total = curriculums.length;
    const obeCount = curriculums.filter((c) => c.curriculumType === 'Kurikulum OBE' || c.curriculumType === 'Kurikulum MBKM').length;
    const aktifCount = curriculums.filter((c) => c.status === 'Aktif').length;
    const avgSks = Math.round(curriculums.reduce((acc, c) => acc + c.totalSks, 0) / (total || 1));
    return { total, obeCount, aktifCount, avgSks };
  }, [curriculums]);

  const handleOpenAddModal = () => {
    setEditingCurriculum(null);
    setFormData({
      code: '',
      name: '',
      studyProgram: 'S1 Teknik Informatika',
      degreeLevel: 'S1',
      facultyCode: 'FASILKOM',
      startYear: 2024,
      sksWajib: 120,
      sksPilihan: 24,
      curriculumType: 'Kurikulum OBE',
      skRektor: 'SK Rektor No. 125/ITN/R/2024',
      status: 'Aktif',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: CurriculumItem) => {
    setEditingCurriculum(c);
    setFormData({
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgram,
      degreeLevel: c.degreeLevel,
      facultyCode: c.facultyCode,
      startYear: c.startYear,
      sksWajib: c.sksWajib,
      sksPilihan: c.sksPilihan,
      curriculumType: c.curriculumType,
      skRektor: c.skRektor,
      status: c.status,
      description: c.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSks = Number(formData.sksWajib) + Number(formData.sksPilihan);

    if (editingCurriculum) {
      setCurriculums((prev) =>
        prev.map((c) =>
          c.id === editingCurriculum.id
            ? {
                ...c,
                ...formData,
                startYear: Number(formData.startYear),
                sksWajib: Number(formData.sksWajib),
                sksPilihan: Number(formData.sksPilihan),
                totalSks,
              }
            : c
        )
      );
      showToast(`Kurikulum "${formData.name}" berhasil diperbarui.`);
    } else {
      const newCurriculum: CurriculumItem = {
        id: `c-${Date.now()}`,
        ...formData,
        startYear: Number(formData.startYear),
        sksWajib: Number(formData.sksWajib),
        sksPilihan: Number(formData.sksPilihan),
        totalSks,
      };
      setCurriculums([newCurriculum, ...curriculums]);
      showToast(`Kurikulum baru "${formData.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus dokumen kurikulum "${name}"? Seluruh sebaran mata kuliah terkait kurikulum ini akan diarsipkan.`)) {
      setCurriculums((prev) => prev.filter((c) => c.id !== id));
      showToast(`Kurikulum "${name}" berhasil dihapus.`);
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Master Data</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Kurikulum Program Studi</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Kurikulum & Dokumen OBE</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Penetapan struktur kurikulum berbasis capaian pembelajaran (CPL), SK Rektor, dan standar kelulusan SKS ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/admin/superadmin/mata-kuliah"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Data Mata Kuliah</span>
            </Link>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Kurikulum Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kurikulum</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total} Kurikulum</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tersebar di 18 Program Studi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurikulum OBE / MBKM</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.obeCount} Kurikulum</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Standar internasional LAM/BAN-PT</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata SKS Lulus</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.avgSks} SKS</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Minimal syarat wisuda sarjana</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Kurikulum Aktif</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.aktifCount} Aktif</h3>
              <p className="text-xs text-slate-500 mt-0.5">Berlaku untuk TA 2026/2027</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode kurikulum, nama program studi, atau nomor SK Rektor..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-slate-50/50"
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Jenjang */}
            <select
              value={degreeFilter}
              onChange={(e) => setDegreeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Jenjang</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="D4">Sarjana Terapan (D4)</option>
              <option value="D3">Diploma Tiga (D3)</option>
            </select>

            {/* Filter Fakultas */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Fakultas</option>
              <option value="FASILKOM">FASILKOM</option>
              <option value="FTI">FTI</option>
              <option value="FEBD">FEBD</option>
              <option value="FDKV">FDKV</option>
            </select>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Masa Transisi">Masa Transisi</option>
              <option value="Arsip">Arsip</option>
            </select>

            {(searchQuery || degreeFilter !== 'Semua' || facultyFilter !== 'Semua' || statusFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDegreeFilter('Semua');
                  setFacultyFilter('Semua');
                  setStatusFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table of Curriculums */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Kode & Kurikulum */}
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kode kurikulum"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kode & Nama Kurikulum</span>
                      {sortField === 'code' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Program Studi */}
                  <th
                    onClick={() => handleSort('studyProgram')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan program studi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program Studi</span>
                      {sortField === 'studyProgram' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Tahun Mulai */}
                  <th
                    onClick={() => handleSort('startYear')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan tahun mulai berlaku"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Tahun Mulai</span>
                      {sortField === 'startYear' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: Total SKS */}
                  <th
                    onClick={() => handleSort('totalSks')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan total SKS kelulusan"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>SKS Lulus</span>
                      {sortField === 'totalSks' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  {/* Sort: SK Rektor */}
                  <th
                    onClick={() => handleSort('skRektor')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan SK penetapan"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dasar Hukum (SK Rektor)</span>
                      {sortField === 'skRektor' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4 text-center">Jenis Kurikulum</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCurriculums.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada dokumen kurikulum ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCurriculums.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0 mt-0.5">
                            {c.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm leading-snug">{c.name}</div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 text-xs">{c.studyProgram}</div>
                        <span className="text-[10px] text-slate-400 font-semibold">{c.facultyCode} &bull; Jenjang {c.degreeLevel}</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-900 text-xs">TA {c.startYear}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">s/d Sekarang</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 font-black text-indigo-700 text-xs">
                          {c.totalSks} SKS
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c.sksWajib} Wajib / {c.sksPilihan} Pilihan
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-xs font-mono font-medium text-slate-700 line-clamp-1">{c.skRektor}</p>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.curriculumType === 'Kurikulum OBE'
                              ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                              : c.curriculumType === 'Kurikulum MBKM'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {c.curriculumType}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          ></span>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/superadmin/mata-kuliah`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Lihat Sebaran Mata Kuliah"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Kurikulum"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Kurikulum"
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

          {/* Pagination Controls Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>Semua (20)</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredCurriculums.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredCurriculums.length)} dari {filteredCurriculums.length} data
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-semibold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Tambah / Edit Kurikulum */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCurriculum ? 'Edit Dokumen Kurikulum' : 'Tambah Kurikulum Baru'}
          subtitle="Standar kurikulum pendidikan Institut Teknologi Nusantara"
          icon={<FileText className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Kurikulum <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KUR-TIF-2024"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tahun Mulai Berlaku <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={2018}
                      max={2030}
                      value={formData.startYear}
                      onChange={(e) => setFormData({ ...formData, startYear: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kurikulum <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kurikulum OBE Teknik Informatika 2024"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Program Studi Pengampu
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S1 Teknik Informatika"
                      value={formData.studyProgram}
                      onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fakultas
                    </label>
                    <select
                      value={formData.facultyCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          facultyCode: e.target.value as CurriculumItem['facultyCode'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="FASILKOM">FASILKOM (Ilmu Komputer)</option>
                      <option value="FTI">FTI (Teknik Industri)</option>
                      <option value="FEBD">FEBD (Ekonomi & Bisnis)</option>
                      <option value="FDKV">FDKV (Desain & Seni)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS Wajib</label>
                    <input
                      type="number"
                      min={80}
                      max={150}
                      value={formData.sksWajib}
                      onChange={(e) => setFormData({ ...formData, sksWajib: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS Pilihan</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={formData.sksPilihan}
                      onChange={(e) => setFormData({ ...formData, sksPilihan: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Syarat Lulus</label>
                    <div className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 font-black text-[#1E3A8A] flex items-center justify-center">
                      {Number(formData.sksWajib) + Number(formData.sksPilihan)} SKS
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kurikulum</label>
                    <select
                      value={formData.curriculumType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          curriculumType: e.target.value as CurriculumItem['curriculumType'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Kurikulum OBE">Kurikulum OBE</option>
                      <option value="Kurikulum MBKM">Kurikulum MBKM</option>
                      <option value="Vokasi Terapan">Vokasi Terapan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status Keaktifan</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as CurriculumItem['status'] })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Masa Transisi">Masa Transisi</option>
                      <option value="Arsip">Arsip</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor SK Rektor Penetapan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SK Rektor No. 125/ITN/R/2024"
                    value={formData.skRektor}
                    onChange={(e) => setFormData({ ...formData, skRektor: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profil Lulusan & Capaian (CPL)</label>
                  <textarea
                    rows={2}
                    placeholder="Profil profesional lulusan, keahlian utama, dan bidang karir..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs"
                  >
                    {editingCurriculum ? 'Simpan Perubahan' : 'Tambah Kurikulum'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
