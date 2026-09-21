'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession, AuthUser } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  GraduationCap,
  MapPin,
  Plus,
  Printer,
  UserCheck,
} from 'lucide-react';

interface StudentAcademicData {
  nim?: string;
  studyProgram?: string;
  degreeLevel?: string;
  faculty?: string;
  angkatan?: string;
  currentSemester: number;
  advisorLecturerName?: string;
  advisorLecturerNip?: string;
  advisorLecturerNidn?: string;
  enrollments: any[];
  payments: any[];
  isLoaded: boolean;
}

export default function StudentDashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [studentData, setStudentData] = useState<StudentAcademicData>({
    currentSemester: 1,
    enrollments: [],
    payments: [],
    isLoaded: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#khs') {
        router.push('/student/khs');
      } else if (window.location.hash === '#jadwal') {
        router.push('/student/jadwal');
      }
    }

    const { token, user } = getAuthSession();
    if (user) {
      setCurrentUser(user);
      const userNim = (user as any).nim || (user as any).student?.nim || user.studentId;
      if (userNim) {
        setStudentData((prev) => ({
          ...prev,
          nim: userNim,
          angkatan: `20${userNim.slice(0, 2)}`,
        }));
      }
    }

    async function fetchMe() {
      try {
        const apiBase = getApiBaseUrl();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        else if (user?.id) headers['x-user-id'] = user.id;

        const res = await fetch(`${apiBase}/auth/me`, { headers });
        if (res.ok) {
          const raw = await res.json();
          const data = raw?.data || raw;
          if (data.fullName && user) {
            setCurrentUser({ ...user, fullName: data.fullName });
          }
          if (data.student) {
            const s = data.student;
            const allPayments: any[] = [];
            if (Array.isArray(s.admissionApplications)) {
              for (const app of s.admissionApplications) {
                if (Array.isArray(app.payments)) {
                  allPayments.push(...app.payments);
                }
              }
            }

            setStudentData({
              nim: s.nim || undefined,
              studyProgram: s.studyProgram?.name || undefined,
              degreeLevel: s.studyProgram?.degreeLevel || 'S1',
              faculty: s.studyProgram?.faculty?.name || undefined,
              angkatan: s.entryYear ? String(s.entryYear) : (s.nim ? `20${s.nim.slice(0, 2)}` : '2026'),
              currentSemester: s.currentSemester || 1,
              advisorLecturerName: s.advisorLecturer?.user?.fullName || undefined,
              advisorLecturerNip: s.advisorLecturer?.nip || undefined,
              advisorLecturerNidn: s.advisorLecturer?.nidn || undefined,
              enrollments: Array.isArray(s.enrollments) ? s.enrollments : [],
              payments: allPayments,
              isLoaded: true,
            });
          }
        }
      } catch {
        // use cached info
      }
    }

    fetchMe();
  }, [router]);

  const fullName = currentUser?.fullName || 'Mahasiswa';
  const firstName = fullName.trim().split(' ')[0] || 'Mahasiswa';
  const displayNim = studentData.nim ? `NIM: ${studentData.nim}` : 'Mahasiswa Aktif';
  const displayProdi = studentData.studyProgram || 'Program Studi';
  const displayFaculty = studentData.faculty || 'Institut Teknologi Nusantara';
  const displayAngkatan = studentData.angkatan || '2026';
  const currentSemester = studentData.currentSemester || 1;

  // Real academic metrics calculated from database
  const enrollments = studentData.enrollments || [];
  const completedCourses = enrollments.filter(
    (e: any) => e.gradePoint !== null && e.gradePoint !== undefined
  );

  const totalSksTaken = enrollments.reduce(
    (sum: number, e: any) => sum + (e.course?.sks || e.course?.totalSks || 3),
    0
  );

  const sksLulus = completedCourses
    .filter((e: any) => (e.gradePoint ?? 0) >= 2.0)
    .reduce((sum: number, e: any) => sum + (e.course?.sks || e.course?.totalSks || 3), 0);

  const hasGrades = completedCourses.length > 0;
  const ipkValue = hasGrades
    ? (
        completedCourses.reduce(
          (sum: number, e: any) =>
            sum + (e.gradePoint || 0) * (e.course?.sks || e.course?.totalSks || 3),
          0
        ) /
        completedCourses.reduce(
          (sum: number, e: any) => sum + (e.course?.sks || e.course?.totalSks || 3),
          0
        )
      ).toFixed(2)
    : '-';

  const ipsSubtext = hasGrades
    ? `IPS Semester Lalu: ${ipkValue}`
    : `Semester ${currentSemester} (Belum Ada Nilai KHS)`;

  // Check UKT / SPP payment status
  const reRegPayment = studentData.payments.find(
    (p: any) => p.type === 'RE_REGISTRATION' && p.status === 'PAID'
  );
  const tuitionPayment = studentData.payments.find(
    (p: any) => p.type === 'TUITION' && p.status === 'PAID'
  );
  const isPaid = !!reRegPayment || !!tuitionPayment;
  const paymentBadge = isPaid
    ? reRegPayment
      ? 'LUNAS (DAFTAR ULANG)'
      : 'LUNAS (TERVERIFIKASI)'
    : 'MENUNGGU TAGIHAN';
  const paymentProofNo = isPaid
    ? studentData.nim
      ? `DU-${studentData.nim}`
      : 'DU-VERIFIED'
    : '-';

  // KRS status
  const hasKrs = enrollments.length > 0;
  const allApproved = hasKrs && enrollments.every((e: any) => e.status === 'APPROVED');

  return (
    <PortalLayout
      role="student"
      userName={fullName}
      userIdText={`${displayNim} • ${displayProdi}`}
    >
      <div className="space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Status Akademik: Mahasiswa Aktif
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Selamat Datang, {firstName}!
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Program Studi {displayProdi} &bull; {displayFaculty} &bull; Angkatan {displayAngkatan}
            </p>
          </div>
          <div className="flex gap-2.5">
            <Link
              href="/student/khs"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak KHS</span>
            </Link>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D4A017] text-slate-950 text-xs font-bold rounded-xl shadow-xs hover:bg-[#C59114] transition-colors">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Unduh Kartu Ujian</span>
            </button>
          </div>
        </div>

        {/* 4 Academic Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card IPK */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">IPK Kumulatif</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#1E3A8A]">{ipkValue}</p>
            <p className="text-xs text-slate-500 mt-1">{ipsSubtext}</p>
          </div>

          {/* Card SKS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total SKS Lulus</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{sksLulus} <span className="text-base font-normal text-slate-500">/ 144 SKS</span></p>
            <p className="text-xs text-slate-500 mt-1">Beban SKS Semester {currentSemester}: <strong className="text-slate-700">{totalSksTaken} SKS</strong></p>
          </div>

          {/* Card Status KRS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status KRS Gasal</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            {hasKrs ? (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                allApproved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{allApproved ? 'DISETUJUI DOSEN PA' : 'MENUNGGU VALIDASI'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>BELUM MENGISI KRS</span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">
              Dosen PA: <strong className="text-slate-700">{studentData.advisorLecturerName || 'Belum Ditentukan'}</strong>
            </p>
          </div>

          {/* Card SPP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status UKT / SPP</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
              isPaid
                ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span>{paymentBadge}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Nomor Bukti: <strong className="text-slate-700">{paymentProofNo}</strong>
            </p>
          </div>
        </div>

        {/* KRS Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kartu Rencana Studi (KRS) &bull; Semester Gasal 2026/2027
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasKrs
                  ? `Total ${enrollments.length} Mata Kuliah terdaftar (${totalSksTaken} SKS) • Dosen Pembimbing Akademik: ${studentData.advisorLecturerName || 'Dosen PA'}`
                  : `Total 0 Mata Kuliah terdaftar (0 SKS) • Dosen Pembimbing Akademik: ${studentData.advisorLecturerName || 'Dosen PA'}`}
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1 rounded-lg border border-blue-200/80 w-fit">
              Tahun Akademik 2026/2027
            </span>
          </div>

          {hasKrs ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode MK</th>
                    <th className="py-3 px-4">Nama Mata Kuliah</th>
                    <th className="py-3 px-4 text-center">SKS</th>
                    <th className="py-3 px-4">Dosen Pengampu</th>
                    <th className="py-3 px-4">Jadwal & Ruang</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {enrollments.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1E3A8A]">
                        {item.course?.code || item.code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {item.course?.name || item.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.course?.sks || item.course?.totalSks || 3}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.course?.coordinator || studentData.advisorLecturerName || 'Tim Dosen'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Menunggu Jadwal Perkuliahan</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status === 'APPROVED' ? 'Aktif' : 'Menunggu'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E3A8A]">
                <BookOpen className="w-7 h-7 text-[#1E3A8A]/70" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Belum Ada Mata Kuliah yang Diambil
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Anda belum mengisi Kartu Rencana Studi (KRS) untuk Semester {currentSemester} (Gasal 2026/2027). Silakan lakukan pengisian KRS untuk memilih mata kuliah program studi {displayProdi}.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/student/krs"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#172554] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buka Pengisian KRS</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Academic Announcement Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-amber-900">
          <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#D4A017]"></span>
            Pengumuman BAAK & Ketentuan Akademik
          </p>
          <p className="leading-relaxed text-amber-800">
            Batas pengubahan KRS (KPRS) berakhir pada tanggal 15 September 2026. Pastikan presensi kuliah minimal 75% sebagai syarat mutlak mengikuti Ujian Akhir Semester (UAS). Untuk konsultasi riset dan tugas akhir, silakan hubungi Dosen Pembimbing Akademik ({studentData.advisorLecturerName || 'Dosen PA'}) di menu Portal.
          </p>
        </div>

      </div>
    </PortalLayout>
  );
}
