'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileCheck,
  GraduationCap,
  MapPin,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';

interface ScheduleItem {
  id: string; courseCode: string; courseName: string; className: string; sks: number;
  day: string; timeSlot: string; roomName: string; enrolledCount: number; academicYear: string;
}
interface AdviseeItem {
  id: string; nim: string; fullName: string; angkatan: number; studyProgramName: string;
  sksSemesterIni: number; krsStatus: string;
}

export default function LecturerDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [advisees, setAdvisees] = useState<AdviseeItem[]>([]);
  const [thesisCount, setThesisCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { token } = getAuthSession();
    const apiBase = getApiBaseUrl();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const unwrap = async (res: Response) => {
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data?.data ?? json?.data ?? json;
    };
    Promise.all([
      fetch(`${apiBase}/auth/me`, { headers }).then(unwrap).catch(() => null),
      fetch(`${apiBase}/lecturers/schedules`, { headers }).then(unwrap).catch(() => null),
      fetch(`${apiBase}/lecturers/advisees`, { headers }).then(unwrap).catch(() => null),
    ]).then(([me, sch, adv]) => {
      setProfile(me);
      setSchedules(Array.isArray(sch) ? sch : []);
      setAdvisees(Array.isArray(adv?.students) ? adv.students : []);
      setThesisCount(adv?.summary?.thesisStudents ?? 0);
      setIsLoading(false);
    });
  }, []);

  const lec = profile?.lecturer;
  const fullName: string = profile?.fullName || 'Dosen';
  const nidn: string = lec?.nidn || '-';
  const prodiName: string = lec?.studyProgram?.name || '-';
  const totalStudents = schedules.reduce((acc, c) => acc + c.enrolledCount, 0);
  const totalSks = schedules.reduce((acc, c) => acc + (c.sks || 0), 0);
  const angkatanList = useMemo(
    () => Array.from(new Set(advisees.map((a) => a.angkatan))).sort().join(', '),
    [advisees],
  );
  const pendingApprovals = advisees.filter((a) => a.krsStatus === 'Menunggu Persetujuan');
  const activeYear = schedules[0]?.academicYear;
  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const sortedSchedules = [...schedules].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return (
    <PortalLayout
      role="lecturer"
      userName={fullName}
      userIdText={`NIDN: ${nidn} • ${prodiName}`}
    >
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Jabatan Fungsional: {lec?.functionalPosition || 'Belum diatur'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, {fullName}!
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              {lec?.employmentStatus || 'Dosen'} Program Studi {prodiName} &bull; {lec?.studyProgram?.faculty?.name || ''}
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/lecturer/nilai"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Input Nilai UTS/UAS</span>
            </Link>
            <Link
              href="/lecturer/bimbingan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Validasi KRS Online</span>
            </Link>
          </div>
        </div>

        {/* 4 Lecturer Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kelas Mengajar</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">{schedules.length} <span className="text-base font-normal text-slate-500">Kelas</span></p>
            <p className="text-xs text-slate-500 mt-1">Total Mahasiswa: <strong className="text-slate-700">{totalStudents} Orang</strong></p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bimbingan Akademik (PA)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{advisees.length} <span className="text-base font-normal text-slate-500">Mahasiswa</span></p>
            <p className="text-xs text-slate-500 mt-1">{advisees.length ? `Angkatan ${angkatanList}` : 'Belum ada mahasiswa bimbingan'}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bimbingan Tugas Akhir</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{thesisCount} <span className="text-base font-normal text-slate-500">Mahasiswa</span></p>
            <p className="text-xs text-slate-500 mt-1">Data bimbingan skripsi belum tersedia</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Beban Kinerja Dosen (BKD)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalSks} <span className="text-base font-normal text-slate-500">SKS</span></p>
            <p className="text-xs text-slate-500 mt-1">Status: <strong className={totalSks >= 12 ? 'text-emerald-700' : 'text-amber-700'}>{totalSks >= 12 ? 'MEMENUHI SYARAT' : 'BELUM MEMENUHI (min. 12 SKS)'}</strong></p>
          </div>
        </div>

        {/* Teaching Schedule Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Jadwal Perkuliahan {activeYear || ''}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar kelas reguler dan praktikum yang diampu semester ini</p>
            </div>
            <Link
              href="/lecturer/jadwal"
              className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua Jadwal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode MK</th>
                  <th className="py-3 px-4">Nama Mata Kuliah</th>
                  <th className="py-3 px-4 text-center">Kelas</th>
                  <th className="py-3 px-4">Jadwal & Ruang</th>
                  <th className="py-3 px-4 text-center">Peserta</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedSchedules.length === 0 && (
                  <tr><td colSpan={6} className="py-8 px-4 text-center text-slate-400">{isLoading ? 'Memuat jadwal...' : 'Belum ada kelas yang diampu semester ini.'}</td></tr>
                )}
                {sortedSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#1E3A8A]">{item.courseCode}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{item.courseName}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{item.className}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.day}, {item.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.roomName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">{item.enrolledCount} Orang</td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href="/lecturer/nilai"
                        className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                      >
                        Input Nilai
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6">
          <h3 className="text-base font-bold text-slate-900 mb-1">Permintaan Persetujuan Bimbingan Akademik ({pendingApprovals.length} Menunggu)</h3>
          <p className="text-xs text-slate-500 mb-4">Mahasiswa bimbingan yang membutuhkan verifikasi KRS atau permohonan skripsi</p>

          <div className="space-y-3">
            {pendingApprovals.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">Tidak ada KRS mahasiswa bimbingan yang menunggu persetujuan.</p>
            )}
            {pendingApprovals.map((req) => (
              <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">{req.fullName} <span className="font-mono text-slate-500 font-normal">({req.nim})</span></p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{req.studyProgramName} &bull; Beban: {req.sksSemesterIni} SKS &bull; <span className="text-[#1E3A8A] font-semibold">Menunggu Persetujuan KRS</span></p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href="/lecturer/bimbingan"
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg inline-flex items-center"
                  >
                    Setujui
                  </Link>
                  <Link
                    href="/lecturer/bimbingan"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg inline-flex items-center"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
