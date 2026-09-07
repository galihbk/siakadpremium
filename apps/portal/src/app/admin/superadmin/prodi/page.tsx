'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  GraduationCap,
  Landmark,
  Users,
  UserCheck,
  Search,
  Plus,
  Download,
  ChevronRight,
  Edit3,
  Trash2,
  CheckCircle2,
  Award,
  Building2,
  X,
  BookOpen,
  Filter,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
} from 'lucide-react';

interface StudyProgram {
  id: string;
  code: string;
  diktiCode: string;
  name: string;
  degreeLevel: 'S1' | 'D4' | 'D3' | 'S2';
  degreeTitle: string;
  facultyCode: 'FASILKOM' | 'FTI' | 'FEBD' | 'FDKV';
  facultyName: string;
  headOfProgram: string;
  headNip: string;
  studentsCount: number;
  lecturersCount: number;
  accreditation: 'Unggul' | 'Baik Sekali' | 'A' | 'B';
  accreditationAgency: string;
  skAkreditasi: string;
  status: 'Aktif' | 'Nonaktif';
}

const initialStudyPrograms: StudyProgram[] = [
  {
    id: 'prodi-1',
    code: 'TI-S1',
    diktiCode: '55201',
    name: 'Teknik Informatika',
    degreeLevel: 'S1',
    degreeTitle: 'S.Kom.',
    facultyCode: 'FASILKOM',
    facultyName: 'Fakultas Ilmu Komputer & Informatika',
    headOfProgram: 'Dr. Bambang Sutrisno, M.Kom.',
    headNip: '19790112 200501 1 002',
    studentsCount: 1240,
    lecturersCount: 38,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: 'No. 088/SK/LAM-INFOKOM/Ak/S/2024',
    status: 'Aktif',
  },
  {
    id: 'prodi-2',
    code: 'SI-S1',
    diktiCode: '57201',
    name: 'Sistem Informasi',
    degreeLevel: 'S1',
    degreeTitle: 'S.Kom.',
    facultyCode: 'FASILKOM',
    facultyName: 'Fakultas Ilmu Komputer & Informatika',
    headOfProgram: 'Dewi Rahmawati, M.Kom.',
    headNip: '19820415 200812 2 001',
    studentsCount: 980,
    lecturersCount: 32,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: 'No. 112/SK/LAM-INFOKOM/Ak/S/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-3',
    code: 'RPL-S1',
    diktiCode: '55202',
    name: 'Rekayasa Perangkat Lunak',
    degreeLevel: 'S1',
    degreeTitle: 'S.Kom.',
    facultyCode: 'FASILKOM',
    facultyName: 'Fakultas Ilmu Komputer & Informatika',
    headOfProgram: 'Arif Wicaksono, M.Cs.',
    headNip: '19850920 201201 1 004',
    studentsCount: 520,
    lecturersCount: 18,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: 'No. 204/SK/LAM-INFOKOM/Ak/S/2024',
    status: 'Aktif',
  },
  {
    id: 'prodi-4',
    code: 'TRKJ-D4',
    diktiCode: '55301',
    name: 'Teknologi Rekayasa Komputer Jaringan',
    degreeLevel: 'D4',
    degreeTitle: 'S.Tr.Kom.',
    facultyCode: 'FASILKOM',
    facultyName: 'Fakultas Ilmu Komputer & Informatika',
    headOfProgram: 'Rahmat Hidayat, M.T.',
    headNip: '19800311 200604 1 003',
    studentsCount: 410,
    lecturersCount: 14,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: 'No. 045/SK/LAM-INFOKOM/Ak/D4/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-5',
    code: 'MI-D3',
    diktiCode: '57401',
    name: 'Manajemen Informatika',
    degreeLevel: 'D3',
    degreeTitle: 'A.Md.Kom.',
    facultyCode: 'FASILKOM',
    facultyName: 'Fakultas Ilmu Komputer & Informatika',
    headOfProgram: 'Siti Aminah, M.Kom.',
    headNip: '19871109 201402 2 002',
    studentsCount: 270,
    lecturersCount: 10,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'BAN-PT',
    skAkreditasi: 'No. 518/SK/BAN-PT/Ak/D3/2022',
    status: 'Aktif',
  },
  {
    id: 'prodi-6',
    code: 'TE-S1',
    diktiCode: '20201',
    name: 'Teknik Elektro',
    degreeLevel: 'S1',
    degreeTitle: 'S.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Ir. Budi Santoso, M.T.',
    headNip: '19700514 199702 1 001',
    studentsCount: 780,
    lecturersCount: 26,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-TEKNIK',
    skAkreditasi: 'No. 340/SK/LAM-TEKNIK/Ak/S/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-7',
    code: 'TM-S1',
    diktiCode: '21201',
    name: 'Teknik Mesin',
    degreeLevel: 'S1',
    degreeTitle: 'S.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Dr. Suparman, M.Eng.',
    headNip: '19730822 200003 1 002',
    studentsCount: 640,
    lecturersCount: 24,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-TEKNIK',
    skAkreditasi: 'No. 290/SK/LAM-TEKNIK/Ak/S/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-8',
    code: 'TI-IND-S1',
    diktiCode: '26201',
    name: 'Teknik Industri',
    degreeLevel: 'S1',
    degreeTitle: 'S.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Dra. Rina Marlina, M.T.',
    headNip: '19760218 200212 2 001',
    studentsCount: 710,
    lecturersCount: 22,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-TEKNIK',
    skAkreditasi: 'No. 182/SK/LAM-TEKNIK/Ak/S/2024',
    status: 'Aktif',
  },
  {
    id: 'prodi-9',
    code: 'TK-S1',
    diktiCode: '24201',
    name: 'Teknik Kimia',
    degreeLevel: 'S1',
    degreeTitle: 'S.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Dr. Ir. Wahyudi, M.T.',
    headNip: '19710915 199903 1 003',
    studentsCount: 320,
    lecturersCount: 12,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'LAM-TEKNIK',
    skAkreditasi: 'No. 095/SK/LAM-TEKNIK/Ak/S/2022',
    status: 'Aktif',
  },
  {
    id: 'prodi-10',
    code: 'TRO-D4',
    diktiCode: '20301',
    name: 'Teknologi Rekayasa Otomasi',
    degreeLevel: 'D4',
    degreeTitle: 'S.Tr.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Hendro Sasongko, M.T.',
    headNip: '19830628 200912 1 002',
    studentsCount: 240,
    lecturersCount: 8,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'LAM-TEKNIK',
    skAkreditasi: 'No. 110/SK/LAM-TEKNIK/Ak/D4/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-11',
    code: 'TE-D3',
    diktiCode: '20401',
    name: 'Teknik Elektronika',
    degreeLevel: 'D3',
    degreeTitle: 'A.Md.T.',
    facultyCode: 'FTI',
    facultyName: 'Fakultas Teknik & Teknologi Industri',
    headOfProgram: 'Joko Widodo, S.T., M.T.',
    headNip: '19780410 200604 1 001',
    studentsCount: 160,
    lecturersCount: 6,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'BAN-PT',
    skAkreditasi: 'No. 402/SK/BAN-PT/Ak/D3/2021',
    status: 'Aktif',
  },
  {
    id: 'prodi-12',
    code: 'BD-S1',
    diktiCode: '61202',
    name: 'Bisnis Digital',
    degreeLevel: 'S1',
    degreeTitle: 'S.Bns.',
    facultyCode: 'FEBD',
    facultyName: 'Fakultas Ekonomi & Bisnis Digital',
    headOfProgram: 'Muhammad Rizki, S.E., M.B.A.',
    headNip: '19860714 201504 1 003',
    studentsCount: 580,
    lecturersCount: 22,
    accreditation: 'Unggul',
    accreditationAgency: 'LAMEMBA',
    skAkreditasi: 'No. 301/SK/LAMEMBA/Ak/S/2024',
    status: 'Aktif',
  },
  {
    id: 'prodi-13',
    code: 'MAN-S1',
    diktiCode: '61201',
    name: 'Manajemen',
    degreeLevel: 'S1',
    degreeTitle: 'S.M.',
    facultyCode: 'FEBD',
    facultyName: 'Fakultas Ekonomi & Bisnis Digital',
    headOfProgram: 'Dr. Nurul Hidayati, M.M.',
    headNip: '19741005 200112 2 001',
    studentsCount: 490,
    lecturersCount: 20,
    accreditation: 'Unggul',
    accreditationAgency: 'LAMEMBA',
    skAkreditasi: 'No. 245/SK/LAMEMBA/Ak/S/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-14',
    code: 'AKT-S1',
    diktiCode: '62201',
    name: 'Akuntansi',
    degreeLevel: 'S1',
    degreeTitle: 'S.Ak.',
    facultyCode: 'FEBD',
    facultyName: 'Fakultas Ekonomi & Bisnis Digital',
    headOfProgram: 'Ahmad Farhan, M.Ak., Ak., CA',
    headNip: '19810325 200902 1 002',
    studentsCount: 260,
    lecturersCount: 12,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'LAMEMBA',
    skAkreditasi: 'No. 180/SK/LAMEMBA/Ak/S/2022',
    status: 'Aktif',
  },
  {
    id: 'prodi-15',
    code: 'PSKD-D4',
    diktiCode: '61301',
    name: 'Perbankan Syariah & Keuangan Digital',
    degreeLevel: 'D4',
    degreeTitle: 'S.Tr.E.',
    facultyCode: 'FEBD',
    facultyName: 'Fakultas Ekonomi & Bisnis Digital',
    headOfProgram: 'Fitriani, M.E.Sy.',
    headNip: '19880918 201601 2 004',
    studentsCount: 150,
    lecturersCount: 10,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'LAMEMBA',
    skAkreditasi: 'No. 092/SK/LAMEMBA/Ak/D4/2023',
    status: 'Aktif',
  },
  {
    id: 'prodi-16',
    code: 'DKV-S1',
    diktiCode: '90201',
    name: 'Desain Komunikasi Visual',
    degreeLevel: 'S1',
    degreeTitle: 'S.Ds.',
    facultyCode: 'FDKV',
    facultyName: 'Fakultas Desain Komunikasi Visual & Seni',
    headOfProgram: 'Bayu Pratama, M.Ds.',
    headNip: '19841203 201101 1 001',
    studentsCount: 440,
    lecturersCount: 24,
    accreditation: 'Unggul',
    accreditationAgency: 'BAN-PT',
    skAkreditasi: 'No. 410/SK/BAN-PT/Ak/S/2024',
    status: 'Aktif',
  },
  {
    id: 'prodi-17',
    code: 'DPI-S1',
    diktiCode: '90202',
    name: 'Desain Produk Industri',
    degreeLevel: 'S1',
    degreeTitle: 'S.Ds.',
    facultyCode: 'FDKV',
    facultyName: 'Fakultas Desain Komunikasi Visual & Seni',
    headOfProgram: 'Dian Permana, M.Ds.',
    headNip: '19830517 201012 1 003',
    studentsCount: 210,
    lecturersCount: 14,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'BAN-PT',
    skAkreditasi: 'No. 312/SK/BAN-PT/Ak/S/2022',
    status: 'Aktif',
  },
  {
    id: 'prodi-18',
    code: 'ADG-D4',
    diktiCode: '90301',
    name: 'Animasi & Desain Game',
    degreeLevel: 'D4',
    degreeTitle: 'S.Tr.Ds.',
    facultyCode: 'FDKV',
    facultyName: 'Fakultas Desain Komunikasi Visual & Seni',
    headOfProgram: 'Gilang Ramadhan, M.Sn.',
    headNip: '19890214 201701 1 002',
    studentsCount: 140,
    lecturersCount: 12,
    accreditation: 'Baik Sekali',
    accreditationAgency: 'BAN-PT',
    skAkreditasi: 'No. 150/SK/BAN-PT/Ak/D4/2023',
    status: 'Aktif',
  },
];

export default function SuperAdminProdiPage() {
  const searchParams = useSearchParams();
  const initialFacultyParam = searchParams.get('faculty');

  const [programs, setPrograms] = useState<StudyProgram[]>(initialStudyPrograms);
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyFilter, setFacultyFilter] = useState<string>(initialFacultyParam || 'Semua');
  const [degreeFilter, setDegreeFilter] = useState<string>('Semua');
  const [accreditationFilter, setAccreditationFilter] = useState<string>('Semua');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<StudyProgram | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialFacultyParam) {
      setFacultyFilter(initialFacultyParam);
    }
  }, [initialFacultyParam]);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    diktiCode: string;
    name: string;
    degreeLevel: StudyProgram['degreeLevel'];
    degreeTitle: string;
    facultyCode: StudyProgram['facultyCode'];
    headOfProgram: string;
    headNip: string;
    studentsCount: number;
    lecturersCount: number;
    accreditation: StudyProgram['accreditation'];
    accreditationAgency: string;
    skAkreditasi: string;
  }>({
    code: '',
    diktiCode: '',
    name: '',
    degreeLevel: 'S1',
    degreeTitle: 'S.Kom.',
    facultyCode: 'FASILKOM',
    headOfProgram: '',
    headNip: '',
    studentsCount: 100,
    lecturersCount: 10,
    accreditation: 'Unggul',
    accreditationAgency: 'LAM-INFOKOM',
    skAkreditasi: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const filteredPrograms = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diktiCode.includes(searchQuery) ||
        p.headOfProgram.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFaculty = facultyFilter === 'Semua' || p.facultyCode === facultyFilter;
      const matchDegree = degreeFilter === 'Semua' || p.degreeLevel === degreeFilter;
      const matchAcc = accreditationFilter === 'Semua' || p.accreditation === accreditationFilter;

      return matchSearch && matchFaculty && matchDegree && matchAcc;
    });
  }, [programs, searchQuery, facultyFilter, degreeFilter, accreditationFilter]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, facultyFilter, degreeFilter, accreditationFilter]);

  const sortedPrograms = useMemo(() => {
    return [...filteredPrograms].sort((a, b) => {
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
  }, [filteredPrograms, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedPrograms.length / itemsPerPage));
  const paginatedPrograms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPrograms.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPrograms, currentPage, itemsPerPage]);

  const metrics = useMemo(() => {
    const total = programs.length;
    const s1Count = programs.filter((p) => p.degreeLevel === 'S1').length;
    const vokasiCount = programs.filter((p) => p.degreeLevel === 'D4' || p.degreeLevel === 'D3').length;
    const unggulCount = programs.filter((p) => p.accreditation === 'Unggul').length;
    const totalMhs = programs.reduce((acc, p) => acc + p.studentsCount, 0);

    return { total, s1Count, vokasiCount, unggulCount, totalMhs };
  }, [programs]);

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setFormData({
      code: '',
      diktiCode: '',
      name: '',
      degreeLevel: 'S1',
      degreeTitle: 'S.Kom.',
      facultyCode: 'FASILKOM',
      headOfProgram: '',
      headNip: '',
      studentsCount: 100,
      lecturersCount: 10,
      accreditation: 'Unggul',
      accreditationAgency: 'LAM-INFOKOM',
      skAkreditasi: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: StudyProgram) => {
    setEditingProgram(p);
    setFormData({
      code: p.code,
      diktiCode: p.diktiCode,
      name: p.name,
      degreeLevel: p.degreeLevel,
      degreeTitle: p.degreeTitle,
      facultyCode: p.facultyCode,
      headOfProgram: p.headOfProgram,
      headNip: p.headNip,
      studentsCount: p.studentsCount,
      lecturersCount: p.lecturersCount,
      accreditation: p.accreditation,
      accreditationAgency: p.accreditationAgency,
      skAkreditasi: p.skAkreditasi,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.headOfProgram) {
      alert('Mohon isi field wajib!');
      return;
    }

    const facultyMap: Record<string, string> = {
      FASILKOM: 'Fakultas Ilmu Komputer & Informatika',
      FTI: 'Fakultas Teknik & Teknologi Industri',
      FEBD: 'Fakultas Ekonomi & Bisnis Digital',
      FDKV: 'Fakultas Desain Komunikasi Visual & Seni',
    };

    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === editingProgram.id
            ? {
                ...p,
                code: formData.code.toUpperCase(),
                diktiCode: formData.diktiCode,
                name: formData.name,
                degreeLevel: formData.degreeLevel,
                degreeTitle: formData.degreeTitle,
                facultyCode: formData.facultyCode,
                facultyName: facultyMap[formData.facultyCode] || p.facultyName,
                headOfProgram: formData.headOfProgram,
                headNip: formData.headNip,
                accreditation: formData.accreditation,
                accreditationAgency: formData.accreditationAgency,
                skAkreditasi: formData.skAkreditasi,
              }
            : p
        )
      );
      showToast(`Program Studi "${formData.name}" berhasil diperbarui!`);
    } else {
      const newProg: StudyProgram = {
        id: `prodi-${Date.now()}`,
        code: formData.code.toUpperCase(),
        diktiCode: formData.diktiCode || '00000',
        name: formData.name,
        degreeLevel: formData.degreeLevel,
        degreeTitle: formData.degreeTitle,
        facultyCode: formData.facultyCode,
        facultyName: facultyMap[formData.facultyCode] || 'Fakultas',
        headOfProgram: formData.headOfProgram,
        headNip: formData.headNip || '-',
        studentsCount: Number(formData.studentsCount) || 0,
        lecturersCount: Number(formData.lecturersCount) || 0,
        accreditation: formData.accreditation,
        accreditationAgency: formData.accreditationAgency,
        skAkreditasi: formData.skAkreditasi || 'Dalam Proses',
        status: 'Aktif',
      };
      setPrograms([...programs, newProg]);
      showToast(`Program Studi "${newProg.name}" berhasil ditambahkan!`);
    }

    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus Program Studi "${name}"?`)) {
      setPrograms(programs.filter((p) => p.id !== id));
      showToast(`Program Studi "${name}" berhasil dihapus.`);
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
              <span className="text-[#1E3A8A] font-bold">Program Studi</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <GraduationCap className="w-7 h-7 text-[#1E3A8A]" />
              <span>Manajemen Program Studi (Prodi)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Daftar seluruh program studi S1, D4, dan D3 terakreditasi Institut Teknologi Nusantara.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => showToast('Data program studi berhasil diekspor (Excel/CSV)')}
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
              <span>Tambah Program Studi</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Program Studi</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Program studi aktif</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] border border-blue-100 flex items-center justify-center font-bold text-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenjang Sarjana (S1)</p>
              <h3 className="text-2xl font-black text-indigo-700 mt-1">{metrics.s1Count} Prodi</h3>
              <p className="text-xs text-indigo-600 font-medium mt-0.5">Pendidikan akademik S1</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-lg">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jenjang Vokasi (D4/D3)</p>
              <h3 className="text-2xl font-black text-purple-700 mt-1">{metrics.vokasiCount} Prodi</h3>
              <p className="text-xs text-purple-600 font-medium mt-0.5">Pendidikan terapan & profesi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-lg">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Akreditasi Unggul</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">{metrics.unggulCount} Prodi</h3>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Standar mutu tertinggi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-lg">
              <Award className="w-6 h-6" />
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
              placeholder="Cari nama prodi, kode DIKTI, atau nama kaprodi..."
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
            {/* Filter Fakultas */}
            <select
              value={facultyFilter}
              onChange={(e) => setFacultyFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Fakultas</option>
              <option value="FASILKOM">Fakultas Ilmu Komputer (FASILKOM)</option>
              <option value="FTI">Fakultas Teknik & Teknologi Industri (FTI)</option>
              <option value="FEBD">Fakultas Ekonomi & Bisnis Digital (FEBD)</option>
              <option value="FDKV">Fakultas Desain Komunikasi Visual (FDKV)</option>
            </select>

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

            {/* Filter Akreditasi */}
            <select
              value={accreditationFilter}
              onChange={(e) => setAccreditationFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 cursor-pointer"
            >
              <option value="Semua">Semua Akreditasi</option>
              <option value="Unggul">Unggul</option>
              <option value="Baik Sekali">Baik Sekali</option>
            </select>

            {(facultyFilter !== 'Semua' || degreeFilter !== 'Semua' || accreditationFilter !== 'Semua') && (
              <button
                onClick={() => {
                  setFacultyFilter('Semua');
                  setDegreeFilter('Semua');
                  setAccreditationFilter('Semua');
                }}
                className="text-xs text-rose-600 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table of Study Programs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 select-none">
                  {/* Sort: Nama / Jenjang */}
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan nama prodi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Program Studi & Jenjang</span>
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

                  {/* Sort: Fakultas */}
                  <th
                    onClick={() => handleSort('facultyCode')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan fakultas"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Fakultas</span>
                      {sortField === 'facultyCode' ? (
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

                  {/* Sort: Kaprodi */}
                  <th
                    onClick={() => handleSort('headOfProgram')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan kaprodi"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ketua Program Studi (Kaprodi)</span>
                      {sortField === 'headOfProgram' ? (
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

                  {/* Sort: Gelar */}
                  <th
                    onClick={() => handleSort('degreeTitle')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    title="Klik untuk mengurutkan gelar"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Gelar</span>
                      {sortField === 'degreeTitle' ? (
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
                    title="Klik untuk mengurutkan jumlah mahasiswa"
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
                    title="Klik untuk mengurutkan jumlah dosen"
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
                {paginatedPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Tidak ada program studi yang cocok</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan filter fakultas atau jenjang</p>
                    </td>
                  </tr>
                ) : (
                  paginatedPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                              prog.degreeLevel === 'S1'
                                ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                                : prog.degreeLevel === 'D4'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {prog.degreeLevel}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{prog.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                Kode: {prog.diktiCode}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">({prog.code})</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Link
                          href={`/admin/superadmin/fakultas`}
                          className="font-bold text-[#1E3A8A] hover:underline"
                        >
                          {prog.facultyCode}
                        </Link>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{prog.facultyName}</p>
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{prog.headOfProgram}</p>
                        <p className="text-[10px] text-slate-500 font-mono">NIP: {prog.headNip}</p>
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-700 font-mono">
                        {prog.degreeTitle}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-[#1E3A8A]">
                        {prog.studentsCount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-4 px-4 text-center font-bold text-slate-800">
                        {prog.lecturersCount}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              prog.accreditation === 'Unggul'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-[#1E3A8A] border border-blue-200'
                            }`}
                          >
                            {prog.accreditation}
                          </span>
                          <p className="text-[9px] text-slate-400 uppercase font-semibold">
                            {prog.accreditationAgency}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(prog)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Program Studi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prog.id, prog.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Program Studi"
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
                <option value={18}>Semua (18)</option>
              </select>
              <span>per halaman</span>
              <span className="text-slate-400 ml-2 hidden md:inline">
                &bull; Menampilkan {Math.min(filteredPrograms.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredPrograms.length)} dari {filteredPrograms.length} data
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

        {/* Modal: Tambah / Edit Program Studi */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingProgram ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
          subtitle="Master data program studi akademik Institut Teknologi Nusantara"
          icon={<GraduationCap className="w-5 h-5" />}
          maxWidth="xl"
        >
          <form onSubmit={handleSaveProgram} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Fakultas Induk *</label>
                    <select
                      value={formData.facultyCode}
                      onChange={(e) => setFormData({ ...formData, facultyCode: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="FASILKOM">Fakultas Ilmu Komputer & Informatika (FASILKOM)</option>
                      <option value="FTI">Fakultas Teknik & Teknologi Industri (FTI)</option>
                      <option value="FEBD">Fakultas Ekonomi & Bisnis Digital (FEBD)</option>
                      <option value="FDKV">Fakultas Desain Komunikasi Visual & Seni (FDKV)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Program Studi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Teknik Informatika"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenjang Pendidikan *</label>
                    <select
                      value={formData.degreeLevel}
                      onChange={(e) => setFormData({ ...formData, degreeLevel: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="S1">Sarjana (S1)</option>
                      <option value="D4">Sarjana Terapan (D4)</option>
                      <option value="D3">Diploma Tiga (D3)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Gelar Kelulusan *</label>
                    <input
                      type="text"
                      required
                      placeholder="S.Kom., S.T., S.M., S.Tr.Kom."
                      value={formData.degreeTitle}
                      onChange={(e) => setFormData({ ...formData, degreeTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode DIKTI</label>
                    <input
                      type="text"
                      placeholder="Contoh: 55201"
                      value={formData.diktiCode}
                      onChange={(e) => setFormData({ ...formData, diktiCode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode Internal Prodi</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: TI-S1"
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

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Lembaga Akreditasi</label>
                    <input
                      type="text"
                      placeholder="LAM-INFOKOM / LAM-TEKNIK / BAN-PT"
                      value={formData.accreditationAgency}
                      onChange={(e) => setFormData({ ...formData, accreditationAgency: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Ketua Prodi (Kaprodi) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap & gelar"
                      value={formData.headOfProgram}
                      onChange={(e) => setFormData({ ...formData, headOfProgram: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">NIP / NIDN Kaprodi</label>
                    <input
                      type="text"
                      placeholder="19790112 200501 1 002"
                      value={formData.headNip}
                      onChange={(e) => setFormData({ ...formData, headNip: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
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
                    {editingProgram ? 'Simpan Perubahan' : 'Tambah Program Studi'}
                  </button>
                </div>
              </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
