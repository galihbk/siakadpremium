'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Check,
  Eye,
  Printer,
  Download,
  Building2,
  Users,
  BookOpen,
  Award,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export interface KrsRecord {
  id: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  semester: number;
  academicYear: string;
  totalSks: number;
  status: 'APPROVED' | 'SUBMITTED' | 'DRAFT' | 'REJECTED';
  dosenPA: string;
  submittedAt: string;
  courses: {
    code: string;
    name: string;
    sks: number;
    classRoom: string;
    schedule: string;
    lecturer: string;
  }[];
}

const INITIAL_KRS: KrsRecord[] = [
  {
    id: 'krs-1',
    nim: '2311501001',
    studentName: 'Muhammad Rizky Pratama',
    studyProgram: 'Teknik Informatika (S1)',
    semester: 5,
    academicYear: '2026/2027 Gasal',
    totalSks: 21,
    status: 'APPROVED',
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    submittedAt: '25 Agu 2026 09:30',
    courses: [
      { code: 'TIF-301', name: 'Pemrograman Web Lanjut (Fullstack)', sks: 3, classRoom: 'Lab Komputasi A', schedule: 'Senin, 08.00 - 10.30', lecturer: 'Dr. Bayu Wicaksono, M.Kom.' },
      { code: 'TIF-302', name: 'Rekayasa Perangkat Lunak', sks: 3, classRoom: 'R. Teori 204', schedule: 'Senin, 13.00 - 15.30', lecturer: 'Dr. Siti Rahmawati, S.T., M.Kom.' },
      { code: 'TIF-303', name: 'Kecerdasan Buatan (AI & ML)', sks: 3, classRoom: 'Lab AI & Data', schedule: 'Selasa, 10.00 - 12.30', lecturer: 'Dr. Eng. Satria Pratama, M.T.' },
      { code: 'TIF-304', name: 'Keamanan Siber & Jaringan', sks: 3, classRoom: 'Lab Jaringan', schedule: 'Rabu, 08.00 - 10.30', lecturer: 'Dr. Eng. Satria Pratama, M.T.' },
      { code: 'TIF-305', name: 'Basis Data Terdistribusi (Cloud DB)', sks: 3, classRoom: 'Lab Komputasi B', schedule: 'Kamis, 13.00 - 15.30', lecturer: 'Dr. Siti Rahmawati, S.T., M.Kom.' },
      { code: 'TIF-306', name: 'Interaksi Manusia & Komputer (UI/UX)', sks: 3, classRoom: 'R. Multimedia', schedule: 'Jumat, 08.00 - 10.30', lecturer: 'Bagus Wicaksono, S.Kom.' },
      { code: 'UNI-201', name: 'Kewirausahaan Teknologi (Technopreneur)', sks: 3, classRoom: 'Auditorium 1', schedule: 'Jumat, 13.30 - 16.00', lecturer: 'Dr. Nurul Hidayati, S.E., M.M.' },
    ],
  },
  {
    id: 'krs-2',
    nim: '2311501002',
    studentName: 'Rina Salsabila',
    studyProgram: 'Sistem Informasi (S1)',
    semester: 3,
    academicYear: '2026/2027 Gasal',
    totalSks: 20,
    status: 'SUBMITTED',
    dosenPA: 'Dr. Bayu Wicaksono, M.Kom.',
    submittedAt: '28 Agu 2026 14:15',
    courses: [
      { code: 'SI-201', name: 'Analisis & Perancangan Sistem Informasi', sks: 3, classRoom: 'R. 302', schedule: 'Senin, 10.00 - 12.30', lecturer: 'Ir. Anita Rahmawati, M.T.' },
      { code: 'SI-202', name: 'Manajemen Basis Data Relasional', sks: 3, classRoom: 'Lab SI', schedule: 'Selasa, 08.00 - 10.30', lecturer: 'Dr. Bayu Wicaksono, M.Kom.' },
      { code: 'SI-203', name: 'Sistem Informasi Manajemen Bisnis', sks: 3, classRoom: 'R. 304', schedule: 'Rabu, 10.00 - 12.30', lecturer: 'Ir. Anita Rahmawati, M.T.' },
      { code: 'SI-204', name: 'Algoritma & Struktur Data Lanjut', sks: 4, classRoom: 'Lab Komputasi A', schedule: 'Kamis, 08.00 - 11.20', lecturer: 'Dr. Siti Rahmawati, S.T., M.Kom.' },
      { code: 'SI-205', name: 'Statistika & Analitika Bisnis', sks: 3, classRoom: 'R. 201', schedule: 'Jumat, 08.00 - 10.30', lecturer: 'Dr. Nurul Hidayati, S.E., M.M.' },
      { code: 'UNI-105', name: 'Bahasa Inggris Akademik & TOEFL', sks: 4, classRoom: 'Lab Bahasa', schedule: 'Jumat, 13.30 - 16.50', lecturer: 'Drs. Herman Prasetyo, M.Pd.' },
    ],
  },
  {
    id: 'krs-3',
    nim: '2211502010',
    studentName: 'Ahmad Faisal Pratama',
    studyProgram: 'Teknik Mesin (S1)',
    semester: 7,
    academicYear: '2026/2027 Gasal',
    totalSks: 18,
    status: 'APPROVED',
    dosenPA: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
    submittedAt: '26 Agu 2026 11:20',
    courses: [
      { code: 'TM-401', name: 'Perancangan Sistem Mekatronika & Otomasi', sks: 4, classRoom: 'Workshop Mesin', schedule: 'Senin, 08.00 - 11.20', lecturer: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.' },
      { code: 'TM-402', name: 'Manajemen Rekayasa Industri & Manufaktur', sks: 3, classRoom: 'R. Mesin 102', schedule: 'Selasa, 13.00 - 15.30', lecturer: 'Dr. Ir. Budi Hartono, M.T.' },
      { code: 'TM-403', name: 'Seminar Proposal Skripsi', sks: 2, classRoom: 'Ruang Sidang FT', schedule: 'Kamis, 10.00 - 11.40', lecturer: 'Tim Dosen Penguji' },
      { code: 'TM-404', name: 'Kerja Praktik Industri (Magang BUMN)', sks: 4, classRoom: 'Industri Mitra', schedule: 'Fleksibel', lecturer: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.' },
      { code: 'UNI-401', name: 'Kuliah Kerja Nyata Tematik (KKN)', sks: 5, classRoom: 'Lokasi Pengabdian', schedule: 'Blended', lecturer: 'Tim LP3M ITN' },
    ],
  },
  {
    id: 'krs-4',
    nim: '2411503005',
    studentName: 'Anisa Putri Maharani',
    studyProgram: 'Bisnis Digital (S1)',
    semester: 3,
    academicYear: '2026/2027 Gasal',
    totalSks: 21,
    status: 'APPROVED',
    dosenPA: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
    submittedAt: '24 Agu 2026 16:00',
    courses: [
      { code: 'BD-201', name: 'E-Commerce Platform Development', sks: 3, classRoom: 'Lab Bisnis Digital', schedule: 'Senin, 10.00 - 12.30', lecturer: 'Dr. Nurul Hidayati, S.E., M.M.' },
      { code: 'BD-202', name: 'Digital Marketing & Growth Hacking', sks: 3, classRoom: 'R. Kreatif FEB', schedule: 'Selasa, 08.00 - 10.30', lecturer: 'Dewi Lestari, S.E., M.Ak.' },
      { code: 'BD-203', name: 'Financial Technology (FinTech)', sks: 3, classRoom: 'R. 401', schedule: 'Rabu, 13.00 - 15.30', lecturer: 'Dewi Lestari, S.E., M.Ak.' },
      { code: 'BD-204', name: 'UI/UX Design for Digital Products', sks: 3, classRoom: 'Lab Komputasi A', schedule: 'Kamis, 10.00 - 12.30', lecturer: 'Bagus Wicaksono, S.Kom.' },
      { code: 'BD-205', name: 'Hukum Siber & Etika Bisnis Digital', sks: 3, classRoom: 'R. 301', schedule: 'Kamis, 14.00 - 16.30', lecturer: 'Dr. Nurul Hidayati, S.E., M.M.' },
      { code: 'BD-206', name: 'Data Analytics with Python for Business', sks: 3, classRoom: 'Lab AI & Data', schedule: 'Jumat, 08.00 - 10.30', lecturer: 'Dr. Bayu Wicaksono, M.Kom.' },
      { code: 'UNI-202', name: 'Etika Profesi & Kepemimpinan Global', sks: 3, classRoom: 'Auditorium 2', schedule: 'Jumat, 13.30 - 16.00', lecturer: 'Dr. Eng. Satria Pratama, M.T.' },
    ],
  },
  {
    id: 'krs-5',
    nim: '2111501099',
    studentName: 'Dimas Bagaskara',
    studyProgram: 'Teknik Informatika (S1)',
    semester: 9,
    academicYear: '2026/2027 Gasal',
    totalSks: 12,
    status: 'SUBMITTED',
    dosenPA: 'Dr. Siti Rahmawati, S.T., M.Kom.',
    submittedAt: '30 Agu 2026 19:40',
    courses: [
      { code: 'TIF-499', name: 'Skripsi / Tugas Akhir', sks: 6, classRoom: 'Laboratorium Riset', schedule: 'Bimbingan Mandiri', lecturer: 'Dr. Siti Rahmawati, S.T., M.Kom.' },
      { code: 'TIF-402', name: 'Etika Profesi Teknologi Informasi', sks: 2, classRoom: 'R. 202', schedule: 'Selasa, 13.00 - 14.40', lecturer: 'Dr. Bayu Wicaksono, M.Kom.' },
      { code: 'TIF-403', name: 'Metodologi Penelitian Informatika', sks: 4, classRoom: 'R. 204', schedule: 'Kamis, 08.00 - 11.20', lecturer: 'Dr. Siti Rahmawati, S.T., M.Kom.' },
    ],
  },
];

export default function SuperAdminKrsPage() {
  const [krsList, setKrsList] = useState<KrsRecord[]>(INITIAL_KRS);
  const [loadingDb, setLoadingDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedKrs, setSelectedKrs] = useState<KrsRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchDbKrs = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/students/krs`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          const dbCourses = json.data.map((c: any) => ({
            code: c.code,
            name: c.name,
            sks: c.sks || 3,
            classRoom: c.ruang !== '-' ? c.ruang : 'Lab Komputasi A',
            schedule: c.hari !== '-' ? `${c.hari}, ${c.jam}` : 'Senin, 08.00 - 10.30',
            lecturer: c.dosen || 'Tim Dosen Pengampu',
          }));

          // Attach real DB courses to students in list
          setKrsList((prev) =>
            prev.map((item, idx) =>
              idx === 0
                ? {
                    ...item,
                    courses: dbCourses,
                    totalSks: dbCourses.reduce((sum: number, c: any) => sum + c.sks, 0),
                  }
                : item,
            ),
          );
        }
      }
    } catch (e) {
      console.warn('Gagal memuat KRS dari DB:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchDbKrs();
  }, []);

  const filteredKrs = useMemo(() => {
    return krsList.filter((k) => {
      if (filterProdi !== 'ALL' && !k.studyProgram.includes(filterProdi)) return false;
      if (filterStatus !== 'ALL' && k.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          k.studentName.toLowerCase().includes(q) ||
          k.nim.includes(q) ||
          k.dosenPA.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [krsList, searchQuery, filterProdi, filterStatus]);

  // Handle Approve / Reject
  const handleUpdateKrsStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setKrsList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: newStatus } : k)),
    );
    if (selectedKrs && selectedKrs.id === id) {
      setSelectedKrs((prev) => prev ? { ...prev, status: newStatus } : null);
    }
    alert(`Status KRS berhasil diubah menjadi ${newStatus}!`);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Disetujui Dosen PA</span>
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <X className="w-3 h-3 text-rose-600" />
            <span>Ditolak / Revisi</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Draft Mahasiswa
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
      activeMenuHref="/admin/superadmin/krs"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                PEMANTAUAN AKADEMIK & STUDI
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; Semester Gasal 2026/2027</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kartu Rencana Studi (KRS) Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Monitoring pengambilan SKS, validasi jadwal perkuliahan, dan persetujuan Dosen Pembimbing Akademik.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap KRS</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total KRS Diajukan</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">{krsList.length}</p>
            <span className="text-[11px] text-slate-500 font-medium">Mahasiswa aktif</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disetujui Dosen PA</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
              {krsList.filter((k) => k.status === 'APPROVED').length}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold">Tercetak otomatis</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Review</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">
              {krsList.filter((k) => k.status === 'SUBMITTED').length}
            </p>
            <span className="text-[11px] text-amber-700 font-semibold">Perlu tindakan PA</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata SKS</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {(krsList.reduce((acc, curr) => acc + curr.totalSks, 0) / krsList.length).toFixed(1)}
            </p>
            <span className="text-[11px] text-blue-600 font-semibold">SKS per mahasiswa</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mahasiswa, NIM, atau Dosen Pembimbing Akademik..."
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
              <option value="Bisnis Digital">Bisnis Digital</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="ALL">Semua Status Persetujuan</option>
              <option value="APPROVED">Disetujui Dosen PA</option>
              <option value="SUBMITTED">Menunggu Persetujuan</option>
              <option value="REJECTED">Ditolak / Perlu Revisi</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">NIM / Mahasiswa</th>
                  <th className="px-5 py-3.5">Program Studi</th>
                  <th className="px-5 py-3.5 text-center">Semester</th>
                  <th className="px-5 py-3.5 text-center">Beban SKS</th>
                  <th className="px-5 py-3.5">Dosen Pembimbing PA</th>
                  <th className="px-5 py-3.5">Status KRS</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      Tidak ditemukan data KRS dengan kriteria pencarian saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredKrs.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{k.studentName}</p>
                        <p className="text-[11px] font-mono text-[#1E3A8A] font-semibold">{k.nim}</p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {k.studyProgram}
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-700">
                        Smtr {k.semester}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-extrabold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {k.totalSks} SKS
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {k.dosenPA}
                      </td>
                      <td className="px-5 py-3.5">
                        {renderStatusBadge(k.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedKrs(k);
                            setDetailModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-slate-700 font-bold text-xs transition-colors"
                        >
                          Lihat Mata Kuliah
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail Mata Kuliah KRS */}
        {detailModalOpen && selectedKrs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                    KARTU RENCANA STUDI (KRS) &bull; {selectedKrs.academicYear}
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedKrs.studentName}</h3>
                  <p className="text-xs font-mono text-[#1E3A8A] font-bold">
                    NIM: {selectedKrs.nim} &bull; {selectedKrs.studyProgram}
                  </p>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400">Dosen Pembimbing PA:</span>
                  <p className="font-bold text-slate-800">{selectedKrs.dosenPA}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Total SKS Diambil:</span>
                  <p className="font-extrabold text-[#1E3A8A] text-sm">{selectedKrs.totalSks} SKS</p>
                </div>
              </div>

              {/* Course List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Kode</th>
                      <th className="p-2.5">Mata Kuliah</th>
                      <th className="p-2.5 text-center">SKS</th>
                      <th className="p-2.5">Jadwal & Ruang</th>
                      <th className="p-2.5">Dosen Pengajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedKrs.courses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-[#1E3A8A]">{c.code}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{c.name}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-700">{c.sks}</td>
                        <td className="p-2.5 text-slate-600">
                          <p>{c.schedule}</p>
                          <p className="text-[10px] text-slate-400">{c.classRoom}</p>
                        </td>
                        <td className="p-2.5 text-slate-700">{c.lecturer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Status Validasi:</span>
                  {renderStatusBadge(selectedKrs.status)}
                </div>

                <div className="flex items-center gap-2">
                  {selectedKrs.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateKrsStatus(selectedKrs.id, 'APPROVED')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
                    >
                      Setujui KRS Mahasiswa
                    </button>
                  )}
                  {selectedKrs.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleUpdateKrsStatus(selectedKrs.id, 'REJECTED')}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-all border border-rose-200"
                    >
                      Tolak / Minta Revisi
                    </button>
                  )}
                  <button
                    onClick={() => setDetailModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Tutup
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
