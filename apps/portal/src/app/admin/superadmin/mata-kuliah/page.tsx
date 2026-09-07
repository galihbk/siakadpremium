'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  BookOpen,
  GraduationCap,
  Layers,
  Award,
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
  FileText,
  Clock,
  Check,
} from 'lucide-react';

interface CourseItem {
  id: string;
  code: string;
  name: string;
  studyProgram: string;
  facultyCode: 'FASILKOM' | 'FTI' | 'FEBD' | 'FDKV' | 'UNIVERSITAS';
  sksTeori: number;
  sksPraktik: number;
  totalSks: number;
  semester: number;
  type: 'Wajib Institusi' | 'Wajib Prodi' | 'Pilihan' | 'MBKM';
  coordinator: string;
  status: 'Aktif' | 'Nonaktif';
  description: string;
}

const initialCourses: CourseItem[] = [
  {
    id: 'mk-1',
    code: 'UNI-101',
    name: 'Pendidikan Pancasila & Kewarganegaraan',
    studyProgram: 'Seluruh Program Studi (MKDU)',
    facultyCode: 'UNIVERSITAS',
    sksTeori: 2,
    sksPraktik: 0,
    totalSks: 2,
    semester: 1,
    type: 'Wajib Institusi',
    coordinator: 'Dr. Ahmad Fauzi, M.Pd.',
    status: 'Aktif',
    description: 'Membangun karakter kebangsaan, wawasan konstitusi, dan etika kehidupan berbangsa dan bernegara.',
  },
  {
    id: 'mk-2',
    code: 'UNI-102',
    name: 'Bahasa Indonesia & Penulisan Ilmiah',
    studyProgram: 'Seluruh Program Studi (MKDU)',
    facultyCode: 'UNIVERSITAS',
    sksTeori: 2,
    sksPraktik: 0,
    totalSks: 2,
    semester: 1,
    type: 'Wajib Institusi',
    coordinator: 'Dra. Nur Indah, M.Hum.',
    status: 'Aktif',
    description: 'Keterampilan menulis artikel ilmiah, tata bahasa baku, dan sitasi akademik standar internasional.',
  },
  {
    id: 'mk-3',
    code: 'TIF-101',
    name: 'Algoritma & Struktur Data',
    studyProgram: 'S1 Teknik Informatika',
    facultyCode: 'FASILKOM',
    sksTeori: 2,
    sksPraktik: 2,
    totalSks: 4,
    semester: 1,
    type: 'Wajib Prodi',
    coordinator: 'Dr. Eng. Dian Wahyudi, M.Kom.',
    status: 'Aktif',
    description: 'Dasar-dasar logika algoritma, kompleksitas waktu Big-O, struktur data array, linked-list, tree, dan graph.',
  },
  {
    id: 'mk-4',
    code: 'TIF-201',
    name: 'Basis Data & SQL Lanjut',
    studyProgram: 'S1 Teknik Informatika',
    facultyCode: 'FASILKOM',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 2,
    type: 'Wajib Prodi',
    coordinator: 'Fajar Nugraha, M.Kom.',
    status: 'Aktif',
    description: 'Pemodelan relasional ERD, normalisasi, optimasi query indexing, dan pengantar database NoSQL.',
  },
  {
    id: 'mk-5',
    code: 'TIF-305',
    name: 'Kecerdasan Buatan & Machine Learning',
    studyProgram: 'S1 Teknik Informatika',
    facultyCode: 'FASILKOM',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 5,
    type: 'Wajib Prodi',
    coordinator: 'Dr. Ir. Hendra Gunawan, M.T.',
    status: 'Aktif',
    description: 'Konsep supervised/unsupervised learning, deep learning, computer vision, dan NLP menggunakan Python.',
  },
  {
    id: 'mk-6',
    code: 'SI-102',
    name: 'Rekayasa Proses Bisnis & Enterprise System',
    studyProgram: 'S1 Sistem Informasi',
    facultyCode: 'FASILKOM',
    sksTeori: 3,
    sksPraktik: 0,
    totalSks: 3,
    semester: 3,
    type: 'Wajib Prodi',
    coordinator: 'Siti Rahmawati, S.Kom., M.T.I.',
    status: 'Aktif',
    description: 'Pemodelan BPMN, integrasi ERP, arsitektur data perusahaan, dan manajemen rantai pasok digital.',
  },
  {
    id: 'mk-7',
    code: 'ELK-201',
    name: 'Rangkaian Listrik & Elektronika Dasar',
    studyProgram: 'S1 Teknik Elektro',
    facultyCode: 'FTI',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 2,
    type: 'Wajib Prodi',
    coordinator: 'Ir. Budi Santoso, M.T.',
    status: 'Aktif',
    description: 'Hukum Kirchhoff, rangkaian AC/DC, komponen semikonduktor, transistor, op-amp, dan simulasi Spice.',
  },
  {
    id: 'mk-8',
    code: 'MSN-204',
    name: 'Termodinamika Teknik & Mekanika Fluida',
    studyProgram: 'S1 Teknik Mesin',
    facultyCode: 'FTI',
    sksTeori: 3,
    sksPraktik: 1,
    totalSks: 4,
    semester: 3,
    type: 'Wajib Prodi',
    coordinator: 'Prof. Dr. Agus Salim, M.Eng.',
    status: 'Aktif',
    description: 'Hukum termodinamika I & II, siklus tenaga uap dan gas, serta dinamika aliran fluida viskositas.',
  },
  {
    id: 'mk-9',
    code: 'IND-302',
    name: 'Ergonomi & Perancangan Sistem Kerja',
    studyProgram: 'S1 Teknik Industri',
    facultyCode: 'FTI',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 4,
    type: 'Wajib Prodi',
    coordinator: 'Dra. Rina Marlina, M.T.',
    status: 'Aktif',
    description: 'Antropometri tenaga kerja, biomekanika, studi waktu dan gerakan, serta tata letak fasilitas pabrik.',
  },
  {
    id: 'mk-10',
    code: 'BD-201',
    name: 'Digital Marketing & E-Commerce Strategy',
    studyProgram: 'S1 Bisnis Digital',
    facultyCode: 'FEBD',
    sksTeori: 3,
    sksPraktik: 0,
    totalSks: 3,
    semester: 2,
    type: 'Wajib Prodi',
    coordinator: 'Muhammad Rizki, S.E., M.B.A.',
    status: 'Aktif',
    description: 'Strategi omnichannel, SEO/SEM, conversion rate optimization, dan analitik performa bisnis e-commerce.',
  },
  {
    id: 'mk-11',
    code: 'MNJ-301',
    name: 'Manajemen Keuangan Korporat',
    studyProgram: 'S1 Manajemen',
    facultyCode: 'FEBD',
    sksTeori: 3,
    sksPraktik: 0,
    totalSks: 3,
    semester: 3,
    type: 'Wajib Prodi',
    coordinator: 'Dr. Farida Aryani, M.M.',
    status: 'Aktif',
    description: 'Penilaian investasi modal, cost of capital, struktur pendanaan, dan manajemen risiko finansial.',
  },
  {
    id: 'mk-12',
    code: 'AKT-202',
    name: 'Sistem Informasi Akuntansi & ERP SAP',
    studyProgram: 'S1 Akuntansi',
    facultyCode: 'FEBD',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 4,
    type: 'Wajib Prodi',
    coordinator: 'Dra. Hj. Sri Wahyuni, M.M., Ak.',
    status: 'Aktif',
    description: 'Siklus transaksi pendapatan dan pengeluaran, audit trail komputer, dan implementasi SAP Financial.',
  },
  {
    id: 'mk-13',
    code: 'DKV-102',
    name: 'Tipografi & Prinsip Desain Visual',
    studyProgram: 'S1 Desain Komunikasi Visual',
    facultyCode: 'FDKV',
    sksTeori: 1,
    sksPraktik: 2,
    totalSks: 3,
    semester: 1,
    type: 'Wajib Prodi',
    coordinator: 'Bayu Pratama, M.Ds.',
    status: 'Aktif',
    description: 'Anatomi huruf, hierarki visual, grid layout, keterbacaan, dan eksplorasi tipografi eksperimental.',
  },
  {
    id: 'mk-14',
    code: 'DKV-308',
    name: 'UI/UX Design & Desain Interaksi',
    studyProgram: 'S1 Desain Komunikasi Visual',
    facultyCode: 'FDKV',
    sksTeori: 1,
    sksPraktik: 2,
    totalSks: 3,
    semester: 5,
    type: 'Pilihan',
    coordinator: 'Arya Wicaksana, M.Sn.',
    status: 'Aktif',
    description: 'Design thinking, user journey mapping, wireframing, interactive prototyping Figma, dan usability testing.',
  },
  {
    id: 'mk-15',
    code: 'TIF-401',
    name: 'Keamanan Siber & Ethical Hacking',
    studyProgram: 'S1 Teknik Informatika',
    facultyCode: 'FASILKOM',
    sksTeori: 2,
    sksPraktik: 1,
    totalSks: 3,
    semester: 6,
    type: 'Pilihan',
    coordinator: 'Dr. Eng. Dian Wahyudi, M.Kom.',
    status: 'Aktif',
    description: 'Kriptografi modern, vulnerability assessment, penetration testing OWASP Top 10, dan forensik digital.',
  },
  {
    id: 'mk-16',
    code: 'MBKM-401',
    name: 'Magang Industri Bersertifikat (MBKM)',
    studyProgram: 'Seluruh Program Studi S1/D4',
    facultyCode: 'UNIVERSITAS',
    sksTeori: 0,
    sksPraktik: 20,
    totalSks: 20,
    semester: 7,
    type: 'MBKM',
    coordinator: 'Tim BAAK & Dosen Pembimbing Lapangan',
    status: 'Aktif',
    description: 'Konversi 20 SKS praktik kerja profesional di perusahaan mitra industri nasional dan multinasional.',
  },
];

export default function SuperAdminMataKuliahPage() {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('Semua');
  const [semesterFilter, setSemesterFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    studyProgram: 'S1 Teknik Informatika',
    facultyCode: 'FASILKOM' as CourseItem['facultyCode'],
    sksTeori: 2,
    sksPraktik: 1,
    semester: 1,
    type: 'Wajib Prodi' as CourseItem['type'],
    coordinator: '',
    status: 'Aktif' as CourseItem['status'],
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
  }, [searchQuery, facultyFilter, semesterFilter, typeFilter]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.coordinator.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFaculty =
        facultyFilter === 'Semua' || c.facultyCode === facultyFilter;
      const matchSem =
        semesterFilter === 'Semua' || c.semester.toString() === semesterFilter;
      const matchType = typeFilter === 'Semua' || c.type === typeFilter;

      return matchSearch && matchFaculty && matchSem && matchType;
    });
  }, [courses, searchQuery, facultyFilter, semesterFilter, typeFilter]);

  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
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
  }, [filteredCourses, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / itemsPerPage));
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCourses, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const totalMK = courses.length;
    const totalSKS = courses.reduce((acc, c) => acc + c.totalSks, 0);
    const wajibCount = courses.filter((c) => c.type.startsWith('Wajib')).length;
    const pilihanCount = courses.filter((c) => c.type === 'Pilihan' || c.type === 'MBKM').length;
    return { totalMK, totalSKS, wajibCount, pilihanCount };
  }, [courses]);

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      studyProgram: 'S1 Teknik Informatika',
      facultyCode: 'FASILKOM',
      sksTeori: 2,
      sksPraktik: 1,
      semester: 1,
      type: 'Wajib Prodi',
      coordinator: '',
      status: 'Aktif',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: CourseItem) => {
    setEditingCourse(c);
    setFormData({
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgram,
      facultyCode: c.facultyCode,
      sksTeori: c.sksTeori,
      sksPraktik: c.sksPraktik,
      semester: c.semester,
      type: c.type,
      coordinator: c.coordinator,
      status: c.status,
      description: c.description,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSks = Number(formData.sksTeori) + Number(formData.sksPraktik);

    if (editingCourse) {
      setCourses((prev) =>
        prev.map((c) =>
          c.id === editingCourse.id
            ? {
                ...c,
                ...formData,
                sksTeori: Number(formData.sksTeori),
                sksPraktik: Number(formData.sksPraktik),
                totalSks,
                semester: Number(formData.semester),
              }
            : c
        )
      );
      showToast(`Mata kuliah "${formData.name}" berhasil diperbarui.`);
    } else {
      const newCourse: CourseItem = {
        id: `mk-${Date.now()}`,
        ...formData,
        sksTeori: Number(formData.sksTeori),
        sksPraktik: Number(formData.sksPraktik),
        totalSks,
        semester: Number(formData.semester),
      };
      setCourses([newCourse, ...courses]);
      showToast(`Mata kuliah baru "${formData.name}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus mata kuliah "${name}" dari kurikulum?`)) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      showToast(`Mata kuliah "${name}" berhasil dihapus.`);
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
              <span className="text-[#1E3A8A] font-bold">Mata Kuliah</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Mata Kuliah & Kurikulum</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Struktur mata kuliah, bobot SKS Teori/Praktik, kurikulum program studi, dan koordinator akademik ITN.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => showToast('Data silabus & kurikulum mata kuliah berhasil diekspor (Excel)')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 text-[#D4A017]" />
              <span>Tambah Mata Kuliah</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mata Kuliah</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.totalMK} MK</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kurikulum aktif beroperasi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total SKS Terdaftar</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalSKS} SKS</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Distribusi teori & praktikum</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mata Kuliah Wajib</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.wajibCount} MK</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Wajib Institusi & Wajib Prodi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MK Pilihan & MBKM</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.pilihanCount} MK</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pengayaan & magang industri</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
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
              placeholder="Cari kode MK, nama mata kuliah, atau nama koordinator dosen..."
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
            {/* Filter Fakultas / Unit */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Fakultas / Unit</option>
              <option value="UNIVERSITAS">MKDU Institusi (Universitas)</option>
              <option value="FASILKOM">Fakultas Ilmu Komputer (FASILKOM)</option>
              <option value="FTI">Fakultas Teknik & Industri (FTI)</option>
              <option value="FEBD">Fakultas Ekonomi & Bisnis (FEBD)</option>
              <option value="FDKV">Fakultas Desain Visual (FDKV)</option>
            </select>

            {/* Filter Semester */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
            </select>

            {/* Filter Sifat MK */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Sifat MK</option>
              <option value="Wajib Institusi">Wajib Institusi</option>
              <option value="Wajib Prodi">Wajib Prodi</option>
              <option value="Pilihan">Pilihan</option>
              <option value="MBKM">MBKM</option>
            </select>

            {(searchQuery || facultyFilter !== 'Semua' || semesterFilter !== 'Semua' || typeFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFacultyFilter('Semua');
                  setSemesterFilter('Semua');
                  setTypeFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Mata Kuliah */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Kode & MK */}
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kode MK"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kode & Mata Kuliah</span>
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

                  {/* Sort: SKS */}
                  <th
                    onClick={() => handleSort('totalSks')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan total SKS"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Bobot SKS</span>
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

                  {/* Sort: Semester */}
                  <th
                    onClick={() => handleSort('semester')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan semester"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Semester</span>
                      {sortField === 'semester' ? (
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

                  {/* Sort: Sifat MK */}
                  <th
                    onClick={() => handleSort('type')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan sifat mata kuliah"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Sifat MK</span>
                      {sortField === 'type' ? (
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

                  {/* Sort: Koordinator Dosen */}
                  <th
                    onClick={() => handleSort('coordinator')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan koordinator dosen"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Koordinator Dosen</span>
                      {sortField === 'coordinator' ? (
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

                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada data mata kuliah ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
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

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{c.studyProgram}</span>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.facultyCode}</p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 font-black text-indigo-700 text-xs">
                          {c.totalSks} SKS
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {c.sksTeori}T / {c.sksPraktik}P
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-800 text-xs">Sem {c.semester}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.type === 'Wajib Institusi'
                              ? 'bg-blue-100 text-[#1E3A8A]'
                              : c.type === 'Wajib Prodi'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.type === 'Pilihan'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {c.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 text-xs">{c.coordinator}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Mata Kuliah"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Mata Kuliah"
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
                &bull; Menampilkan {Math.min(filteredCourses.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredCourses.length)} dari {filteredCourses.length} data
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

        {/* Modal: Tambah / Edit Mata Kuliah */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCourse ? 'Edit Data Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
          subtitle="Master kurikulum akademik Institut Teknologi Nusantara"
          icon={<BookOpen className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Mata Kuliah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TIF-201"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Semester Ditawarkan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Mata Kuliah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Algoritma & Struktur Data"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fakultas / Unit Pengampu
                    </label>
                    <select
                      value={formData.facultyCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          facultyCode: e.target.value as CourseItem['facultyCode'],
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="UNIVERSITAS">MKDU Institusi (Universitas)</option>
                      <option value="FASILKOM">FASILKOM (Ilmu Komputer)</option>
                      <option value="FTI">FTI (Teknik & Industri)</option>
                      <option value="FEBD">FEBD (Ekonomi & Bisnis Digital)</option>
                      <option value="FDKV">FDKV (Desain & Seni)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sifat Mata Kuliah
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as CourseItem['type'] })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
                    >
                      <option value="Wajib Institusi">Wajib Institusi</option>
                      <option value="Wajib Prodi">Wajib Prodi</option>
                      <option value="Pilihan">Pilihan</option>
                      <option value="MBKM">MBKM</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS Teori</label>
                    <input
                      type="number"
                      min={0}
                      max={6}
                      value={formData.sksTeori}
                      onChange={(e) => setFormData({ ...formData, sksTeori: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">SKS Praktik</label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={formData.sksPraktik}
                      onChange={(e) => setFormData({ ...formData, sksPraktik: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Bobot</label>
                    <div className="px-3.5 py-2 text-xs rounded-xl bg-slate-100 font-black text-[#1E3A8A] flex items-center justify-center">
                      {Number(formData.sksTeori) + Number(formData.sksPraktik)} SKS
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosen Koordinator Mata Kuliah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Eng. Dian Wahyudi, M.Kom."
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Silabus & Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    placeholder="Pokok bahasan materi, capaian pembelajaran (CPL), dan rujukan utama..."
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
                    {editingCourse ? 'Simpan Perubahan' : 'Tambah Mata Kuliah'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
