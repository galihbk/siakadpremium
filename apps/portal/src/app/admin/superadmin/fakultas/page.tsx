'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Landmark,
  GraduationCap,
  Users,
  UserCheck,
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
  ExternalLink,
  CheckCircle2,
  Award,
  Building2,
  X,
  MapPin,
  FileText,
} from 'lucide-react';

interface Faculty {
  id: string;
  code: string;
  name: string;
  deanName: string;
  deanNip: string;
  building: string;
  studyProgramsCount: number;
  studentsCount: number;
  lecturersCount: number;
  accreditation: 'Unggul' | 'Baik Sekali' | 'A' | 'B';
  skAkreditasi: string;
  establishedYear: number;
  description: string;
}

const initialFaculties: Faculty[] = [
  {
    id: 'fac-1',
    code: 'FASILKOM',
    name: 'Fakultas Ilmu Komputer & Informatika',
    deanName: 'Dr. Ir. Hendra Gunawan, M.T.',
    deanNip: '19750812 200112 1 002',
    building: 'Gedung BJ Habibie (Tower A), Lt. 3',
    studyProgramsCount: 5,
    studentsCount: 3420,
    lecturersCount: 112,
    accreditation: 'Unggul',
    skAkreditasi: 'No. 320/SK/LAM-INFOKOM/Ak/F/2024',
    establishedYear: 1998,
    description: 'Pusat keunggulan riset kecerdasan buatan, rekayasa perangkat lunak, dan keamanan siber berstandar internasional.',
  },
  {
    id: 'fac-2',
    code: 'FTI',
    name: 'Fakultas Teknik & Teknologi Industri',
    deanName: 'Prof. Dr. Agus Salim, M.Eng.',
    deanNip: '19680315 199403 1 001',
    building: 'Gedung Soekarno (Tower C), Lt. 2',
    studyProgramsCount: 6,
    studentsCount: 2850,
    lecturersCount: 98,
    accreditation: 'Unggul',
    skAkreditasi: 'No. 280/SK/LAM-TEKNIK/Ak/F/2023',
    establishedYear: 1993,
    description: 'Mengembangkan inovasi rekayasa elektro, mesin, industri, dan energi terbarukan ramah lingkungan.',
  },
  {
    id: 'fac-3',
    code: 'FEBD',
    name: 'Fakultas Ekonomi & Bisnis Digital',
    deanName: 'Dra. Hj. Sri Wahyuni, M.M., Ak.',
    deanNip: '19721104 199802 2 001',
    building: 'Gedung Mohammad Hatta (Tower B), Lt. 4',
    studyProgramsCount: 4,
    studentsCount: 1480,
    lecturersCount: 64,
    accreditation: 'Baik Sekali',
    skAkreditasi: 'No. 512/SK/LAMEMBA/Ak/F/2024',
    establishedYear: 2005,
    description: 'Mencetak pemimpin bisnis digital, akuntan profesional, dan technopreneur berdaya saing global.',
  },
  {
    id: 'fac-4',
    code: 'FDKV',
    name: 'Fakultas Desain Komunikasi Visual & Seni',
    deanName: 'Arya Wicaksana, M.Sn.',
    deanNip: '19810520 200812 1 003',
    building: 'Gedung Ki Hajar Dewantara (Tower D), Lt. 1-2',
    studyProgramsCount: 3,
    studentsCount: 790,
    lecturersCount: 50,
    accreditation: 'Baik Sekali',
    skAkreditasi: 'No. 189/SK/BAN-PT/Ak/F/2023',
    establishedYear: 2012,
    description: 'Fakultas kreatif penghasil desainer multimedia, animator, dan kreator konten industri kreatif.',
  },
];

export default function SuperAdminFakultasPage() {
  const [faculties, setFaculties] = useState<Faculty[]>(initialFaculties);
  const [searchQuery, setSearchQuery] = useState('');
  const [accreditationFilter, setAccreditationFilter] = useState<string>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    deanName: string;
    deanNip: string;
    building: string;
    studyProgramsCount: number;
    accreditation: Faculty['accreditation'];
    skAkreditasi: string;
    establishedYear: number;
    description: string;
  }>({
    code: '',
    name: '',
    deanName: '',
    deanNip: '',
    building: '',
    studyProgramsCount: 1,
    accreditation: 'Unggul',
    skAkreditasi: '',
    establishedYear: 2000,
    description: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredFaculties = useMemo(() => {
    return faculties.filter((f) => {
      const matchQuery =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.deanName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAcc = accreditationFilter === 'Semua' || f.accreditation === accreditationFilter;
      return matchQuery && matchAcc;
    });
  }, [faculties, searchQuery, accreditationFilter]);

  const metrics = useMemo(() => {
    const total = faculties.length;
    const totalProdi = faculties.reduce((acc, f) => acc + f.studyProgramsCount, 0);
    const totalMhs = faculties.reduce((acc, f) => acc + f.studentsCount, 0);
    const unggulCount = faculties.filter((f) => f.accreditation === 'Unggul').length;
    return { total, totalProdi, totalMhs, unggulCount };
  }, [faculties]);

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('name');
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

  // Reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, accreditationFilter]);

  const sortedFaculties = useMemo(() => {
    return [...filteredFaculties].sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
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
  }, [filteredFaculties, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedFaculties.length / itemsPerPage));
  const paginatedFaculties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedFaculties.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedFaculties, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setEditingFaculty(null);
    setFormData({
      code: '',
      name: '',
      deanName: '',
      deanNip: '',
      building: '',
      studyProgramsCount: 1,
      accreditation: 'Unggul',
      skAkreditasi: '',
      establishedYear: 2020,
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (f: Faculty) => {
    setEditingFaculty(f);
    setFormData({
      code: f.code,
      name: f.name,
      deanName: f.deanName,
      deanNip: f.deanNip,
      building: f.building,
      studyProgramsCount: f.studyProgramsCount,
      accreditation: f.accreditation,
      skAkreditasi: f.skAkreditasi,
      establishedYear: f.establishedYear,
      description: f.description,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.deanName) {
      alert('Mohon isi field wajib (Kode, Nama, dan Dekan)!');
      return;
    }

    if (editingFaculty) {
      setFaculties((prev) =>
        prev.map((f) =>
          f.id === editingFaculty.id
            ? {
                ...f,
                code: formData.code.toUpperCase(),
                name: formData.name,
                deanName: formData.deanName,
                deanNip: formData.deanNip,
                building: formData.building,
                accreditation: formData.accreditation,
                skAkreditasi: formData.skAkreditasi,
                establishedYear: Number(formData.establishedYear),
                description: formData.description,
              }
            : f
        )
      );
      showToast(`Data Fakultas "${formData.name}" berhasil diperbarui!`);
    } else {
      const newFac: Faculty = {
        id: `fac-${Date.now()}`,
        code: formData.code.toUpperCase(),
        name: formData.name,
        deanName: formData.deanName,
        deanNip: formData.deanNip || '-',
        building: formData.building || 'Gedung Pusat Akademik',
        studyProgramsCount: Number(formData.studyProgramsCount) || 1,
        studentsCount: 0,
        lecturersCount: 0,
        accreditation: formData.accreditation,
        skAkreditasi: formData.skAkreditasi || 'Dalam Proses',
        establishedYear: Number(formData.establishedYear) || new Date().getFullYear(),
        description: formData.description,
      };
      setFaculties([...faculties, newFac]);
      showToast(`Fakultas "${newFac.name}" berhasil ditambahkan!`);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus fakultas "${name}"? Seluruh data prodi terkait akan dipindahkan.`)) {
      setFaculties(faculties.filter((f) => f.id !== id));
      showToast(`Fakultas "${name}" berhasil dihapus.`);
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

        {/* Header Breadcrumb & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Master Data</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Fakultas</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Landmark className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Fakultas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Struktur fakultas, dekanat, gedung perkuliahan, dan koordinasi program studi Institut Teknologi Nusantara.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => showToast('Data fakultas berhasil diekspor (Excel/PDF)')}
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
              <span>Tambah Fakultas Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fakultas</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fakultas aktif beroperasi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <Landmark className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Program Studi</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalProdi}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Terdistribusi di 4 fakultas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mahasiswa Fakultas</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {metrics.totalMhs.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Mahasiswa aktif semester ini</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akreditasi Unggul</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{metrics.unggulCount} Fakultas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Standar mutu BAN-PT tertinggi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode fakultas, nama fakultas, atau nama dekan..."
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

          <div className="flex items-center gap-3">
            <select
              value={accreditationFilter}
              onChange={(e) => setAccreditationFilter(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Akreditasi</option>
              <option value="Unggul">Unggul</option>
              <option value="Baik Sekali">Baik Sekali</option>
            </select>
          </div>
        </div>

        {/* Table of Faculties */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Fakultas & Kode */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan nama fakultas"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fakultas & Kode</span>
                      {sortField === 'name' ? (
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

                  {/* Sort: Pimpinan Dekanat */}
                  <th
                    onClick={() => handleSort('deanName')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan pimpinan dekanat"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Pimpinan Dekanat</span>
                      {sortField === 'deanName' ? (
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

                  {/* Sort: Gedung / Lokasi */}
                  <th
                    onClick={() => handleSort('building')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan gedung lokasi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Gedung / Lokasi</span>
                      {sortField === 'building' ? (
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

                  {/* Sort: Jumlah Prodi */}
                  <th
                    onClick={() => handleSort('studyProgramsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan jumlah prodi"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Jumlah Prodi</span>
                      {sortField === 'studyProgramsCount' ? (
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

                  {/* Sort: Mahasiswa */}
                  <th
                    onClick={() => handleSort('studentsCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan total mahasiswa"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Mahasiswa</span>
                      {sortField === 'studentsCount' ? (
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

                  {/* Sort: Dosen */}
                  <th
                    onClick={() => handleSort('lecturersCount')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan total dosen"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Dosen</span>
                      {sortField === 'lecturersCount' ? (
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

                  {/* Sort: Akreditasi */}
                  <th
                    onClick={() => handleSort('accreditation')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan akreditasi"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Akreditasi</span>
                      {sortField === 'accreditation' ? (
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

                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedFaculties.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada data fakultas ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian Anda</p>
                    </td>
                  </tr>
                ) : (
                  paginatedFaculties.map((fac) => (
                    <tr key={fac.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white font-black text-xs flex items-center justify-center border border-[#D4A017] shadow-xs shrink-0">
                            {fac.code.substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{fac.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] font-extrabold text-[#1E3A8A] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {fac.code}
                              </span>
                              <span className="text-[11px] text-slate-400">Est. {fac.establishedYear}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{fac.deanName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">NIP: {fac.deanNip}</p>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{fac.building}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Link
                          href={`/admin/superadmin/prodi?faculty=${fac.code}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-colors"
                          title="Lihat Daftar Program Studi"
                        >
                          <span>{fac.studyProgramsCount} Prodi</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        {fac.studentsCount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {fac.lecturersCount}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            fac.accreditation === 'Unggul'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-100 text-[#1E3A8A] border border-blue-200'
                          }`}
                        >
                          {fac.accreditation}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(fac)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Fakultas"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fac.id, fac.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Fakultas"
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
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredFaculties.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredFaculties.length)} dari {filteredFaculties.length} data
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

        {/* Modal: Tambah / Edit Fakultas */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingFaculty ? 'Edit Data Fakultas' : 'Tambah Fakultas Baru'}
          subtitle="Master data struktur fakultas Institut Teknologi Nusantara"
          icon={<Landmark className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode Fakultas *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: FASILKOM"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] uppercase font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Peringkat Akreditasi</label>
                    <select
                      value={formData.accreditation}
                      onChange={(e) => setFormData({ ...formData, accreditation: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="Unggul">Unggul</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Nama Lengkap Fakultas *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Fakultas Ilmu Komputer & Informatika"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Dekan & Gelar *</label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Ir. Hendra Gunawan, M.T."
                      value={formData.deanName}
                      onChange={(e) => setFormData({ ...formData, deanName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NIP / NIDN Dekan</label>
                    <input
                      type="text"
                      placeholder="19750812 200112 1 002"
                      value={formData.deanNip}
                      onChange={(e) => setFormData({ ...formData, deanNip: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Gedung / Lokasi Dekanat</label>
                    <input
                      type="text"
                      placeholder="Gedung BJ Habibie (Tower A), Lt. 3"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tahun Berdiri</label>
                    <input
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => setFormData({ ...formData, establishedYear: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nomor SK Akreditasi</label>
                    <input
                      type="text"
                      placeholder="No. 320/SK/LAM-INFOKOM/Ak/F/2024"
                      value={formData.skAkreditasi}
                      onChange={(e) => setFormData({ ...formData, skAkreditasi: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Deskripsi Singkat / Fokus Keilmuan</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Visi keilmuan fakultas..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-xs"
                  >
                    {editingFaculty ? 'Simpan Perubahan' : 'Tambah Fakultas'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
