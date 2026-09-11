'use client';

import React, { useState, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  UserCheck,
  Search,
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Printer,
  Download,
  BookOpen,
  Users,
  Eye,
  BarChart3,
  Percent,
} from 'lucide-react';

export interface ClassAttendance {
  id: string;
  courseCode: string;
  courseName: string;
  studyProgram: string;
  classRoom: string;
  lecturerName: string;
  meetingNumber: number;
  totalMeetings: number;
  totalEnrolled: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number; // percentage e.g. 92.5
  date: string;
  time: string;
  status: 'BERJALAN' | 'SELESAI' | 'TERJADWAL';
}

const INITIAL_ATTENDANCE: ClassAttendance[] = [
  {
    id: 'att-1',
    courseCode: 'TIF-301',
    courseName: 'Pemrograman Web Lanjut (Fullstack)',
    studyProgram: 'Teknik Informatika (S1)',
    classRoom: 'Lab Komputasi A',
    lecturerName: 'Dr. Bayu Wicaksono, M.Kom.',
    meetingNumber: 8,
    totalMeetings: 16,
    totalEnrolled: 38,
    presentCount: 36,
    absentCount: 2,
    attendanceRate: 94.7,
    date: '10 Sep 2026',
    time: '08.00 - 10.30 WIB',
    status: 'SELESAI',
  },
  {
    id: 'att-2',
    courseCode: 'TIF-303',
    courseName: 'Kecerdasan Buatan (AI & ML)',
    studyProgram: 'Teknik Informatika (S1)',
    classRoom: 'Lab AI & Data',
    lecturerName: 'Dr. Eng. Satria Pratama, M.T.',
    meetingNumber: 7,
    totalMeetings: 16,
    totalEnrolled: 40,
    presentCount: 39,
    absentCount: 1,
    attendanceRate: 97.5,
    date: '10 Sep 2026',
    time: '10.00 - 12.30 WIB',
    status: 'BERJALAN',
  },
  {
    id: 'att-3',
    courseCode: 'SI-201',
    courseName: 'Analisis & Perancangan Sistem Informasi',
    studyProgram: 'Sistem Informasi (S1)',
    classRoom: 'R. Teori 302',
    lecturerName: 'Ir. Anita Rahmawati, M.T.',
    meetingNumber: 7,
    totalMeetings: 16,
    totalEnrolled: 35,
    presentCount: 32,
    absentCount: 3,
    attendanceRate: 91.4,
    date: '10 Sep 2026',
    time: '10.00 - 12.30 WIB',
    status: 'SELESAI',
  },
  {
    id: 'att-4',
    courseCode: 'TM-401',
    courseName: 'Perancangan Sistem Mekatronika & Otomasi',
    studyProgram: 'Teknik Mesin (S1)',
    classRoom: 'Workshop Mesin',
    lecturerName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
    meetingNumber: 8,
    totalMeetings: 16,
    totalEnrolled: 28,
    presentCount: 26,
    absentCount: 2,
    attendanceRate: 92.8,
    date: '10 Sep 2026',
    time: '08.00 - 11.20 WIB',
    status: 'SELESAI',
  },
  {
    id: 'att-5',
    courseCode: 'BD-201',
    courseName: 'E-Commerce Platform Development',
    studyProgram: 'Bisnis Digital (S1)',
    classRoom: 'Lab Bisnis Digital',
    lecturerName: 'Dr. Nurul Hidayati, S.E., M.M.',
    meetingNumber: 6,
    totalMeetings: 16,
    totalEnrolled: 32,
    presentCount: 30,
    absentCount: 2,
    attendanceRate: 93.7,
    date: '10 Sep 2026',
    time: '13.00 - 15.30 WIB',
    status: 'TERJADWAL',
  },
  {
    id: 'att-6',
    courseCode: 'TIF-304',
    courseName: 'Keamanan Siber & Kriptografi',
    studyProgram: 'Teknik Informatika (S1)',
    classRoom: 'Lab Jaringan',
    lecturerName: 'Dr. Eng. Satria Pratama, M.T.',
    meetingNumber: 8,
    totalMeetings: 16,
    totalEnrolled: 36,
    presentCount: 25,
    absentCount: 11,
    attendanceRate: 69.4,
    date: '09 Sep 2026',
    time: '08.00 - 10.30 WIB',
    status: 'SELESAI',
  },
];

export default function SuperAdminPresensiPage() {
  const [attendances, setAttendances] = useState<ClassAttendance[]>(INITIAL_ATTENDANCE);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredAttendances = useMemo(() => {
    return attendances.filter((a) => {
      if (filterProdi !== 'ALL' && !a.studyProgram.includes(filterProdi)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.courseName.toLowerCase().includes(q) ||
          a.courseCode.toLowerCase().includes(q) ||
          a.lecturerName.toLowerCase().includes(q) ||
          a.classRoom.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [attendances, searchQuery, filterProdi]);

  const avgAttendance = useMemo(() => {
    if (!attendances.length) return 0;
    return (attendances.reduce((sum, curr) => sum + curr.attendanceRate, 0) / attendances.length).toFixed(1);
  }, [attendances]);

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
      activeMenuHref="/admin/superadmin/presensi"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
                MONITORING KELAS & PERKULIAHAN
              </span>
              <span className="text-xs text-slate-400 font-medium">&bull; Syarat Kehadiran UAS Min. 75%</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Presensi & Kehadiran Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau jalannya tatap muka perkuliahan, rekapitulasi absensi mahasiswa, dan verifikasi kehadiran dosen pengajar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap Presensi</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sesi Perkuliahan</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">{attendances.length} Kelas</p>
            <span className="text-[11px] text-slate-500 font-medium">Semester berjalan</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Rata-rata Kehadiran</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{avgAttendance}%</p>
            <span className="text-[11px] text-emerald-700 font-semibold">Tingkat disiplin tinggi</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider">Kelas Selesai Sesuai RPS</span>
            <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">
              {attendances.filter((a) => a.status === 'SELESAI').length}
            </p>
            <span className="text-[11px] text-blue-700 font-semibold">Berita acara tervalidasi</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-subtle">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Peringatan Kehadiran &lt; 75%</span>
            <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
              {attendances.filter((a) => a.attendanceRate < 75).length} Kelas
            </p>
            <span className="text-[11px] text-rose-600 font-semibold">Perlu teguran dosen PA</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mata kuliah, kode, dosen pengajar, atau ruang kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Mata Kuliah & Kode</th>
                  <th className="px-5 py-3.5">Dosen Pengajar</th>
                  <th className="px-5 py-3.5">Ruang & Jadwal</th>
                  <th className="px-5 py-3.5 text-center">Pertemuan Ke</th>
                  <th className="px-5 py-3.5 text-center">Hadir / Total</th>
                  <th className="px-5 py-3.5 text-center">Persentase</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendances.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{a.courseName}</p>
                      <p className="text-[11px] font-mono text-[#1E3A8A] font-semibold">{a.courseCode} &bull; {a.studyProgram}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {a.lecturerName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-semibold text-slate-800">{a.classRoom}</p>
                      <p className="text-[11px] text-slate-400">{a.date} ({a.time})</p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                      Ke-{a.meetingNumber} / {a.totalMeetings}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-extrabold text-slate-900">{a.presentCount}</span>
                      <span className="text-slate-400 text-[10px] ml-1">/ {a.totalEnrolled} mhs</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                          a.attendanceRate >= 75
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {a.attendanceRate}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedClass(a);
                          setModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1E3A8A] hover:text-white text-slate-700 font-bold text-xs transition-colors"
                      >
                        BAP Presensi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Berita Acara Presensi */}
        {modalOpen && selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">
                    BERITA ACARA PERKULIAHAN & PRESENSI (BAP)
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedClass.courseName}</h3>
                  <p className="text-xs font-mono text-[#1E3A8A] font-bold">Kode: {selectedClass.courseCode}</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dosen Pengampu:</span>
                  <span className="font-bold text-slate-900">{selectedClass.lecturerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pertemuan Kuliah:</span>
                  <span className="font-bold text-slate-900">Pertemuan ke-{selectedClass.meetingNumber} dari {selectedClass.totalMeetings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ruangan & Waktu:</span>
                  <span className="font-medium text-slate-800">{selectedClass.classRoom} ({selectedClass.time})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Mahasiswa Terdaftar:</span>
                  <span className="font-bold text-slate-900">{selectedClass.totalEnrolled} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mahasiswa Hadir:</span>
                  <span className="font-bold text-emerald-700">{selectedClass.presentCount} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mahasiswa Tidak Hadir (Alfa/Izin):</span>
                  <span className="font-bold text-rose-700">{selectedClass.absentCount} Orang</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">Persentase Kehadiran Kelas:</span>
                  <span className={`font-black text-sm ${selectedClass.attendanceRate >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {selectedClass.attendanceRate}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                <p className="font-bold">Ketentuan Akademik ITN:</p>
                <p>Mahasiswa wajib memenuhi minimal 75% kehadiran untuk berhak mengikuti Ujian Akhir Semester (UAS).</p>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554] flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>Cetak Lembar Presensi</span>
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
