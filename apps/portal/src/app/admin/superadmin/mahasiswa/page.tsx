'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Users,
  Search,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Printer,
  Download,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  IdCard,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export interface StudentItem {
  id: string;
  nim: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  studyProgram: string;
  faculty: string;
  entryYear: number;
  currentSemester: number;
  status: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT';
  ipk: number;
  sksTotal: number;
  dosenPA?: string;
  address?: string;
}

const INITIAL_STUDENTS: StudentItem[] = [
  {
    id: 'std-1',
    nim: '2311501001',
    fullName: 'Muhammad Rizky Pratama',
    email: 'mahasiswa@itn.ac.id',
    phone: '081399887766',
    gender: 'MALE',
    studyProgram: 'Teknik Informatika (S1)',
    faculty: 'Fakultas Ilmu Komputer',
    entryYear: 2023,
    currentSemester: 5,
    status: 'ACTIVE',
    ipk: 3.82,
    sksTotal: 96,
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    address: 'Jl. Melati Indah No. 14, Jakarta Selatan',
  },
  {
    id: 'std-2',
    nim: '2311501002',
    fullName: 'Rina Salsabila',
    email: 'student02@itn.ac.id',
    phone: '081234567890',
    gender: 'FEMALE',
    studyProgram: 'Sistem Informasi (S1)',
    faculty: 'Fakultas Ilmu Komputer',
    entryYear: 2024,
    currentSemester: 3,
    status: 'ACTIVE',
    ipk: 3.65,
    sksTotal: 54,
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    address: 'Jl. Cempaka Putih Tengah No. 22, Jakarta Pusat',
  },
  {
    id: 'std-3',
    nim: '2211502010',
    fullName: 'Ahmad Faisal Pratama',
    email: 'faisal.pratama@itn.ac.id',
    phone: '081277665544',
    gender: 'MALE',
    studyProgram: 'Teknik Mesin (S1)',
    faculty: 'Fakultas Teknik',
    entryYear: 2022,
    currentSemester: 7,
    status: 'ACTIVE',
    ipk: 3.45,
    sksTotal: 130,
    dosenPA: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
    address: 'Jl. Raya Bogor KM 28, Cimanggis, Depok',
  },
  {
    id: 'std-4',
    nim: '2411503005',
    fullName: 'Anisa Putri Maharani',
    email: 'anisa.putri@itn.ac.id',
    phone: '085711223344',
    gender: 'FEMALE',
    studyProgram: 'Bisnis Digital (S1)',
    faculty: 'Fakultas Ekonomi & Bisnis',
    entryYear: 2024,
    currentSemester: 3,
    status: 'ACTIVE',
    ipk: 3.90,
    sksTotal: 58,
    dosenPA: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
    address: 'Jl. Tebet Barat Dalam No. 8, Jakarta Selatan',
  },
  {
    id: 'std-5',
    nim: '2111501099',
    fullName: 'Dimas Bagaskara',
    email: 'dimas.bagas@itn.ac.id',
    phone: '081955667788',
    gender: 'MALE',
    studyProgram: 'Teknik Informatika (S1)',
    faculty: 'Fakultas Ilmu Komputer',
    entryYear: 2021,
    currentSemester: 9,
    status: 'LEAVE',
    ipk: 3.12,
    sksTotal: 128,
    dosenPA: 'Dr. Siti Rahmawati, S.T., M.Kom.',
    address: 'Jl. Margonda Raya No. 100, Beji, Depok',
  },
  {
    id: 'std-6',
    nim: '2011501008',
    fullName: 'Kevin Jonathan Wijaya',
    email: 'kevin.jonathan@itn.ac.id',
    phone: '081299881122',
    gender: 'MALE',
    studyProgram: 'Teknik Informatika (S1)',
    faculty: 'Fakultas Ilmu Komputer',
    entryYear: 2020,
    currentSemester: 8,
    status: 'GRADUATED',
    ipk: 3.95,
    sksTotal: 144,
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    address: 'Jl. Kelapa Gading Boulevard Blok WA-2, Jakarta Utara',
  },
  {
    id: 'std-7',
    nim: '2411504012',
    fullName: 'Dina Kusuma Wardani',
    email: 'dina.kusuma@itn.ac.id',
    phone: '087811993344',
    gender: 'FEMALE',
    studyProgram: 'Manajemen (S1)',
    faculty: 'Fakultas Ekonomi & Bisnis',
    entryYear: 2024,
    currentSemester: 3,
    status: 'ACTIVE',
    ipk: 3.55,
    sksTotal: 52,
    dosenPA: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
    address: 'Jl. Duren Sawit Baru No. 15, Jakarta Timur',
  },
  {
    id: 'std-8',
    nim: '2311502044',
    fullName: 'Bagas Aditya Nugroho',
    email: 'bagas.aditya@itn.ac.id',
    phone: '082144332211',
    gender: 'MALE',
    studyProgram: 'Teknik Elektro (S1)',
    faculty: 'Fakultas Teknik',
    entryYear: 2023,
    currentSemester: 5,
    status: 'ACTIVE',
    ipk: 3.30,
    sksTotal: 92,
    dosenPA: 'Dr. Ir. Budi Hartono, M.T.',
    address: 'Jl. Fatmawati Raya No. 45, Cilandak, Jakarta Selatan',
  },
];

export default function SuperAdminMahasiswaPage() {
  const [students, setStudents] = useState<StudentItem[]>(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterAngkatan, setFilterAngkatan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nim: '',
    fullName: '',
    email: '',
    phone: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    studyProgram: 'Teknik Informatika (S1)',
    entryYear: 2024,
    currentSemester: 1,
    status: 'ACTIVE' as 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT',
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    address: '',
  });

  const [loadingDb, setLoadingDb] = useState(false);

  const fetchDbStudents = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/list`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const mapped: StudentItem[] = json.data.map((s: any) => ({
            id: s.id,
            nim: s.nim,
            fullName: s.name,
            email: s.email,
            phone: s.phone || '081234567890',
            gender: (s.gender as 'MALE' | 'FEMALE') || 'MALE',
            studyProgram: s.studyProgram,
            faculty: s.faculty,
            entryYear: s.entryYear || 2024,
            currentSemester: s.currentSemester || 1,
            status: (s.status as 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT') || 'ACTIVE',
            ipk: s.ipk || 0,
            sksTotal: s.currentSemester ? s.currentSemester * 20 : 20,
            dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
            address: s.address || '-',
          }));
          setStudents(mapped);
        }
      }
    } catch (e) {
      console.warn('Gagal memuat mahasiswa dari DB:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterProdi !== 'ALL' && !s.studyProgram.includes(filterProdi)) return false;
      if (filterAngkatan !== 'ALL' && s.entryYear !== Number(filterAngkatan)) return false;
      if (filterStatus !== 'ALL' && s.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchNim = s.nim.includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        const matchProdi = s.studyProgram.toLowerCase().includes(q);
        return matchName || matchNim || matchEmail || matchProdi;
      }
      return true;
    });
  }, [students, searchQuery, filterProdi, filterAngkatan, filterStatus]);

  // Handle Save (Create / Update)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nim || !formData.fullName || !formData.email) {
      alert('NIM, Nama Lengkap, dan Email wajib diisi.');
      return;
    }

    if (editingStudent) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                ...formData,
                faculty: formData.studyProgram.includes('Informatika') || formData.studyProgram.includes('Sistem') ? 'Fakultas Ilmu Komputer' : 'Fakultas Teknik',
              }
            : s,
        ),
      );
      alert('Data mahasiswa berhasil diperbarui!');
    } else {
      const newStudent: StudentItem = {
        id: `std-${Date.now()}`,
        ...formData,
        faculty: formData.studyProgram.includes('Informatika') || formData.studyProgram.includes('Sistem') ? 'Fakultas Ilmu Komputer' : 'Fakultas Teknik',
        ipk: 0.0,
        sksTotal: 0,
      };
      setStudents((prev) => [newStudent, ...prev]);
      alert('Mahasiswa baru berhasil ditambahkan!');
    }

    setFormModalOpen(false);
    setEditingStudent(null);
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      nim: `241150${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      email: '',
      phone: '',
      gender: 'MALE',
      studyProgram: 'Teknik Informatika (S1)',
      entryYear: 2024,
      currentSemester: 1,
      status: 'ACTIVE',
      dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
      address: '',
    });
    setFormModalOpen(true);
  };

  const openEditModal = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      nim: student.nim,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      studyProgram: student.studyProgram,
      entryYear: student.entryYear,
      currentSemester: student.currentSemester,
      status: student.status,
      dosenPA: student.dosenPA || '',
      address: student.address || '',
    });
    setFormModalOpen(true);
  };

  const handleDeleteStudent = (student: StudentItem) => {
    if (!confirm(`Hapus data mahasiswa ${student.fullName} (${student.nim})?`)) return;
    setStudents((prev) => prev.filter((s) => s.id !== student.id));
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>;
      case 'LEAVE':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Cuti Kuliah</span>;
      case 'GRADUATED':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Lulus / Alumni</span>;
      case 'DROPOUT':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Drop Out (DO)</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
      activeMenuHref="/admin/superadmin/mahasiswa"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                PENGELOLAAN PENGGUNA & CIVITAS
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Master Data Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pengelolaan biodata induk, status perkuliahan, registrasi program studi, dan riwayat akademik mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDbStudents}
              disabled={loadingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Mahasiswa</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mahasiswa Aktif</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">
              {students.filter((s) => s.status === 'ACTIVE').length}
            </p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Terdaftar di semester ini</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cuti Kuliah</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
              {students.filter((s) => s.status === 'LEAVE').length}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Dengan izin BAAK</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lulus / Alumni</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
              {students.filter((s) => s.status === 'GRADUATED').length}
            </p>
            <span className="text-[11px] text-slate-500 mt-1 inline-block">Memiliki ijazah & transkrip</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata IPK</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {(students.reduce((acc, curr) => acc + curr.ipk, 0) / students.length).toFixed(2)}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Skala predikat Unggul</span>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama mahasiswa, NIM, email, atau program studi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Program Studi</option>
              <option value="Informatika">Teknik Informatika</option>
              <option value="Sistem Informasi">Sistem Informasi</option>
              <option value="Mesin">Teknik Mesin</option>
              <option value="Elektro">Teknik Elektro</option>
              <option value="Bisnis Digital">Bisnis Digital</option>
              <option value="Manajemen">Manajemen</option>
            </select>

            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Angkatan</option>
              <option value="2024">Angkatan 2024</option>
              <option value="2023">Angkatan 2023</option>
              <option value="2022">Angkatan 2022</option>
              <option value="2021">Angkatan 2021</option>
              <option value="2020">Angkatan 2020</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="LEAVE">Cuti</option>
              <option value="GRADUATED">Lulus</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">NIM</th>
                  <th className="px-5 py-3.5">Nama Mahasiswa & Kontak</th>
                  <th className="px-5 py-3.5">Program Studi</th>
                  <th className="px-5 py-3.5 text-center">Angkatan / Smstr</th>
                  <th className="px-5 py-3.5 text-center">IPK / SKS</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      Tidak ditemukan mahasiswa dengan kriteria pencarian saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1E3A8A]">
                        {s.nim}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{s.fullName}</p>
                        <p className="text-[11px] text-slate-400">{s.email} &bull; {s.phone}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{s.studyProgram}</p>
                        <p className="text-[10px] text-slate-400">{s.faculty}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                        {s.entryYear} / Smtr {s.currentSemester}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-bold text-emerald-700">{s.ipk.toFixed(2)}</span>
                        <span className="text-slate-400 text-[10px] ml-1">({s.sksTotal} SKS)</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {renderStatusBadge(s.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setDetailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100"
                            title="Detail Mahasiswa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Modal Detail Mahasiswa */}
        {detailModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D4A017]">
                    KARTU INDUK MAHASISWA
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedStudent.fullName}</h3>
                  <p className="text-xs font-mono text-[#1E3A8A] font-bold">NIM: {selectedStudent.nim}</p>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Program Studi:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.studyProgram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fakultas:</span>
                  <span className="font-medium text-slate-800">{selectedStudent.faculty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dosen Pembimbing Akademik (PA):</span>
                  <span className="font-bold text-[#1E3A8A]">{selectedStudent.dosenPA}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Indeks Prestasi Kumulatif (IPK):</span>
                  <span className="font-black text-emerald-700">{selectedStudent.ipk.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total SKS Lulus:</span>
                  <span className="font-bold text-slate-900">{selectedStudent.sksTotal} SKS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Perkuliahan:</span>
                  <span>{renderStatusBadge(selectedStudent.status)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-1">
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                <p><strong>Nomor HP / WA:</strong> {selectedStudent.phone}</p>
                <p><strong>Alamat Domisili:</strong> {selectedStudent.address || 'Belum diisi'}</p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openEditModal(selectedStudent);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554]"
                >
                  Edit Data Mahasiswa
                </button>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tambah / Edit Mahasiswa */}
        {formModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900">
                  {editingStudent ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru'}
                </h3>
                <button
                  onClick={() => setFormModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIM *</label>
                    <input
                      type="text"
                      required
                      value={formData.nim}
                      onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="MALE">Laki-laki</option>
                      <option value="FEMALE">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Mahasiswa *</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Kampus *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Program Studi</label>
                    <select
                      value={formData.studyProgram}
                      onChange={(e) => setFormData({ ...formData, studyProgram: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Teknik Informatika (S1)">Teknik Informatika (S1)</option>
                      <option value="Sistem Informasi (S1)">Sistem Informasi (S1)</option>
                      <option value="Teknik Mesin (S1)">Teknik Mesin (S1)</option>
                      <option value="Teknik Elektro (S1)">Teknik Elektro (S1)</option>
                      <option value="Bisnis Digital (S1)">Bisnis Digital (S1)</option>
                      <option value="Manajemen (S1)">Manajemen (S1)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Mahasiswa</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="ACTIVE">Aktif</option>
                      <option value="LEAVE">Cuti Kuliah</option>
                      <option value="GRADUATED">Lulus / Alumni</option>
                      <option value="DROPOUT">Drop Out</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172554] shadow-xs"
                  >
                    Simpan Data
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
