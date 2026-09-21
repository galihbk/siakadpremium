'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
import { Search, Printer, X } from 'lucide-react';

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
  attendanceRate: number;
  date: string;
  time: string;
  day: string;
  academicYearId: string;
  academicYearName: string;
  semesterLabel: string;
  status: 'BERJALAN' | 'SELESAI' | 'TERJADWAL';
}

export interface AcademicYearOption {
  id: string;
  name: string;
  semesterLabel: string;
  isActive: boolean;
}

export function PresensiTable({
  initialAttendances,
  years,
  initialYearId,
}: {
  initialAttendances: ClassAttendance[];
  years: AcademicYearOption[];
  initialYearId: string;
}) {
  const apiBase = getApiBaseUrl();
  const [attendances, setAttendances] = useState<ClassAttendance[]>(initialAttendances);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProdi, setFilterProdi] = useState('ALL');
  const [filterYearId, setFilterYearId] = useState(initialYearId);
  const [selectedClass, setSelectedClass] = useState<ClassAttendance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAttendances = async (yearId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearId) params.set('academicYearId', yearId);
      const res = await fetch(`${apiBase}/academic/attendance-overview${params.toString() ? `?${params.toString()}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        setAttendances(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.warn('Gagal memuat presensi:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchAttendances(filterYearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterYearId]);

  const studyPrograms = Array.from(new Set(attendances.map((a) => a.studyProgram).filter((p) => p && p !== '-')));

  const filtered = attendances.filter((a) => {
    if (filterProdi !== 'ALL' && a.studyProgram !== filterProdi) return false;
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

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } = useSortedPagination<ClassAttendance>(
    filtered,
    'courseName',
  );

  const avgAttendance = attendances.length ? (attendances.reduce((sum, curr) => sum + curr.attendanceRate, 0) / attendances.length).toFixed(1) : '0';

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1E3A8A] border border-blue-200">
              MONITORING KELAS & PERKULIAHAN
            </span>
            <span className="text-xs text-slate-400 font-medium">&bull; Syarat Kehadiran UAS Min. 75%</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Presensi & Kehadiran Mahasiswa</h1>
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
          <span className="text-[11px] text-slate-500 font-medium">Sesuai filter periode</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-subtle">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Rata-rata Kehadiran</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{avgAttendance}%</p>
          <span className="text-[11px] text-emerald-700 font-semibold">Tingkat disiplin</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-subtle">
          <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider">Kelas Selesai Sesuai RPS</span>
          <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] mt-1">{attendances.filter((a) => a.status === 'SELESAI').length}</p>
          <span className="text-[11px] text-blue-700 font-semibold">16 pertemuan tuntas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-subtle">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Peringatan Kehadiran &lt; 75%</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{attendances.filter((a) => a.attendanceRate < 75 && a.totalEnrolled > 0).length} Kelas</p>
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
            value={filterYearId}
            onChange={(e) => setFilterYearId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="">Semua Tahun Akademik</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} {y.semesterLabel} {y.isActive ? '(Aktif)' : ''}
              </option>
            ))}
          </select>
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-[#1E3A8A]"
          >
            <option value="ALL">Semua Program Studi</option>
            {studyPrograms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <SortableTh<ClassAttendance> label="Mata Kuliah & Kode" column="courseName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-5 py-3.5" />
                <SortableTh<ClassAttendance> label="Dosen Pengajar" column="lecturerName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="px-5 py-3.5" />
                <th className="px-5 py-3.5">Ruang & Jadwal</th>
                <SortableTh<ClassAttendance> label="Pertemuan Ke" column="meetingNumber" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="px-5 py-3.5" />
                <SortableTh<ClassAttendance> label="Hadir / Total" column="presentCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="px-5 py-3.5" />
                <SortableTh<ClassAttendance> label="Persentase" column="attendanceRate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="px-5 py-3.5" />
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Memuat data presensi...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada kelas yang cocok dengan pencarian/filter.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{a.courseName}</p>
                      <p className="text-[11px] font-mono text-[#1E3A8A] font-semibold">
                        {a.courseCode} &bull; {a.studyProgram} &bull; {a.academicYearName} {a.semesterLabel}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{a.lecturerName}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <p className="font-semibold text-slate-800">{a.classRoom}</p>
                      <p className="text-[11px] text-slate-400">{a.day}, {a.time}</p>
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
                          a.attendanceRate >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} itemLabel="kelas" />
        )}
      </div>

      {/* Modal Berita Acara Presensi */}
      {modalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E3A8A]">BERITA ACARA PERKULIAHAN & PRESENSI (BAP)</span>
                <h3 className="text-lg font-black text-slate-900">{selectedClass.courseName}</h3>
                <p className="text-xs font-mono text-[#1E3A8A] font-bold">Kode: {selectedClass.courseCode}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Tahun Akademik:</span>
                <span className="font-bold text-slate-900">{selectedClass.academicYearName} {selectedClass.semesterLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dosen Pengampu:</span>
                <span className="font-bold text-slate-900">{selectedClass.lecturerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pertemuan Kuliah:</span>
                <span className="font-bold text-slate-900">
                  Pertemuan ke-{selectedClass.meetingNumber} dari {selectedClass.totalMeetings}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ruangan & Waktu:</span>
                <span className="font-medium text-slate-800">
                  {selectedClass.classRoom} ({selectedClass.day}, {selectedClass.time})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Mahasiswa Terdaftar:</span>
                <span className="font-bold text-slate-900">{selectedClass.totalEnrolled} Orang</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Kehadiran Tercatat:</span>
                <span className="font-bold text-emerald-700">{selectedClass.presentCount} Slot</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Ketidakhadiran (Alfa/Izin/Sakit):</span>
                <span className="font-bold text-rose-700">{selectedClass.absentCount} Slot</span>
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
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
