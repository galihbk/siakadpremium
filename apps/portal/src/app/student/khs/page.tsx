'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession, AuthUser } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Download,
  Printer,
  ChevronDown,
  TrendingUp,
  FileText,
  Building,
  GraduationCap,
  ShieldCheck,
  QrCode,
  Info,
  Sparkles,
  BarChart2,
  Check,
} from 'lucide-react';

interface NilaiItem {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  nilaiHuruf: string;
  nilaiAngka: number;
  dosen: string;
  keterangan: 'LULUS' | 'TIDAK LULUS' | string;
}

interface SemesterData {
  id: string;
  semesterNumber: number;
  namaSemester: string;
  tahunAkademik: string;
  ips: number | null;
  sksSemester: number;
  sksKumulatif: number;
  ipkKumulatif: number | null;
  maksSksBerikutnya: number;
  tanggalKHS: string;
  nilaiList: NilaiItem[];
}

export default function HasilStudiKHSPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<{
    id?: string;
    nim?: string;
    studyProgram?: string;
    faculty?: string;
    advisorName?: string;
    advisorNip?: string;
    currentSemester?: number;
    enrollments?: any[];
    isLoaded?: boolean;
  }>({});

  // KHS nyata dari API (per semester: IPS, SKS, IPK kumulatif, rincian nilai).
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [khsLoading, setKhsLoading] = useState(true);
  const [khsError, setKhsError] = useState<string | null>(null);

  useEffect(() => {
    const { token, user } = getAuthSession();
    if (user) {
      setCurrentUser(user);
    }
    async function fetchProfile() {
      try {
        const apiBase = getApiBaseUrl();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        else if (user?.id) headers['x-user-id'] = user.id;

        // KHS nyata
        fetch(`${apiBase}/students/khs`, { headers })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
          .then((j) => {
            const list = (j?.data ?? j)?.semesters;
            setSemesters(Array.isArray(list) ? list : []);
          })
          .catch((err) => setKhsError(err instanceof Error ? err.message : 'Gagal memuat KHS.'))
          .finally(() => setKhsLoading(false));

        const res = await fetch(`${apiBase}/auth/me`, { headers });
        if (res.ok) {
          const raw = await res.json();
          const data = raw?.data || raw;
          if (data.fullName && user) {
            setCurrentUser({ ...user, fullName: data.fullName });
          }
          if (data.student) {
            setStudentProfile({
              id: data.student.id,
              nim: data.student.nim,
              studyProgram: data.student.studyProgram?.name,
              faculty: data.student.studyProgram?.faculty?.name,
              advisorName: data.student.advisorLecturer?.user?.fullName,
              advisorNip: data.student.advisorLecturer?.nip,
              currentSemester: data.student.currentSemester || 1,
              enrollments: data.student.enrollments || [],
              isLoaded: true,
            });

          }
        }
      } catch (err) {
        console.warn('Gagal memuat profil mahasiswa:', err);
      }
    }
    fetchProfile();
  }, []);

  const studentName = currentUser?.fullName || 'Mahasiswa ITN';
  const displayNim = studentProfile.nim || 'Mahasiswa';
  const displayProdi = studentProfile.studyProgram || 'Program Studi';
  const displayFaculty = studentProfile.faculty || 'Institut Teknologi Nusantara';
  const displayAdvisor = studentProfile.advisorName || 'Dr. Aris Sudrajat, S.Ds., M.Ds.';
  const displayAdvisorNip = studentProfile.advisorNip || '198208152010121002';

  // Daftar semester dari data nyata; bila mahasiswa belum punya KRS/nilai, tampilkan satu semester kosong.
  const activeArchive = useMemo<SemesterData[]>(() => {
    if (semesters.length > 0) return semesters;
    return [
      {
        id: 'sem-kosong',
        semesterNumber: 1,
        namaSemester: `Semester ${studentProfile.currentSemester || 1} (Berjalan)`,
        tahunAkademik: 'Periode Berjalan',
        ips: null,
        sksSemester: 0,
        sksKumulatif: 0,
        ipkKumulatif: null,
        maksSksBerikutnya: 20,
        tanggalKHS: 'Periode Berjalan',
        nilaiList: [],
      },
    ];
  }, [semesters, studentProfile.currentSemester]);

  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');

  // Semester aktif: pilihan pengguna, atau semester terbaru yang sudah punya nilai.
  const currentSem = useMemo(() => {
    const chosen = activeArchive.find((s) => s.id === selectedSemesterId);
    if (chosen) return chosen;
    return activeArchive.find((s) => s.nilaiList.length > 0) || activeArchive[0];
  }, [selectedSemesterId, activeArchive]);

  // Calculations for current active semester
  const totalSksTaken = useMemo(() => {
    return currentSem.nilaiList.reduce((acc, curr) => acc + curr.sks, 0);
  }, [currentSem]);

  const totalSksPassed = useMemo(() => {
    return currentSem.nilaiList
      .filter((n) => n.keterangan === 'LULUS')
      .reduce((acc, curr) => acc + curr.sks, 0);
  }, [currentSem]);

  const totalBobotMutu = useMemo(() => {
    return currentSem.nilaiList.reduce((acc, curr) => acc + curr.sks * curr.nilaiAngka, 0);
  }, [currentSem]);

  const calculatedIPS = useMemo(() => {
    if (totalSksTaken === 0) return '-';
    return (totalBobotMutu / totalSksTaken).toFixed(2);
  }, [totalBobotMutu, totalSksTaken]);

  // Distribusi nilai semester terpilih -- dari huruf mutu sebenarnya, urut dari bobot tertinggi.
  const gradeDistribution = useMemo(() => {
    const map = new Map<string, { count: number; point: number }>();
    currentSem.nilaiList.forEach((n) => {
      const cur = map.get(n.nilaiHuruf);
      if (cur) cur.count += 1;
      else map.set(n.nilaiHuruf, { count: 1, point: n.nilaiAngka });
    });
    return Array.from(map.entries())
      .map(([letter, v]) => ({ letter, count: v.count, point: v.point }))
      .sort((a, b) => b.point - a.point);
  }, [currentSem]);

  // Tren IPS: urut dari semester terlama; hanya semester yang sudah punya nilai.
  const ipsTrend = useMemo(
    () =>
      [...activeArchive]
        .filter((s) => s.ips !== null && s.nilaiList.length > 0)
        .sort((a, b) => a.semesterNumber - b.semesterNumber),
    [activeArchive]
  );

  const gradeTone = (letter: string, point: number) => {
    if (point >= 3.75) return { bar: 'bg-emerald-500', bg: 'bg-emerald-100', chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    if (point >= 3.5) return { bar: 'bg-teal-500', bg: 'bg-teal-100', chip: 'bg-teal-50 text-teal-700 border border-teal-200' };
    if (point >= 3.0) return { bar: 'bg-blue-500', bg: 'bg-blue-100', chip: 'bg-blue-50 text-blue-700 border border-blue-200' };
    if (point >= 2.0) return { bar: 'bg-amber-500', bg: 'bg-amber-100', chip: 'bg-amber-50 text-amber-700 border border-amber-200' };
    return { bar: 'bg-rose-500', bg: 'bg-rose-100', chip: 'bg-rose-50 text-rose-700 border border-rose-200' };
  };

  const ipsPredicate = (ips: number | null) => {
    if (ips === null) return 'Status Aktif';
    if (ips >= 3.51) return 'Sangat Baik Sekali';
    if (ips >= 3.0) return 'Sangat Baik';
    if (ips >= 2.5) return 'Baik';
    if (ips >= 2.0) return 'Cukup';
    return 'Perlu Perbaikan';
  };

  const handlePrintKHS = () => {
    window.print();
  };

  const handleDownloadTranscript = () => {
    window.print();
  };

  return (
    <PortalLayout
      role="student"
      userName={studentName}
      userIdText={`NIM: ${displayNim} • ${displayProdi}`}
    >
      <div className="space-y-6">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md bg-white/10 text-[#D4A017] border border-white/10">
                <Award className="w-3.5 h-3.5" />
                <span>Kartu Hasil Studi Resmi</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terverifikasi BAAK</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Kartu Hasil Studi (KHS) Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Rincian evaluasi hasil studi, Indeks Prestasi Semester (IPS), Indeks Prestasi Kumulatif (IPK), dan transkrip akademik resmi.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleDownloadTranscript}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Unduh Transkrip Resmi</span>
            </button>
            <button
              onClick={handlePrintKHS}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak KHS (PDF)</span>
            </button>
          </div>
        </div>

        {khsError && (
          <div className="text-xs p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 print:hidden">
            Gagal memuat KHS: {khsError}
          </div>
        )}
        {khsLoading && (
          <div className="text-xs p-3 rounded-xl border bg-slate-50 border-slate-200 text-slate-500 print:hidden">
            Memuat data KHS...
          </div>
        )}

        {/* Semester Selection & Profile Card Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Pilih Semester KHS:
            </label>
            <div className="relative min-w-[280px]">
              <select
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer pr-10"
              >
                {activeArchive.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {sem.namaSemester}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-blue-50/70 border border-blue-200/60 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-[#1E3A8A] shrink-0" />
            <span>
              KHS disahkan pada: <strong className="text-slate-900">{currentSem.tanggalKHS}</strong>
            </span>
          </div>
        </div>

        {/* Printable Official Letterhead Header (Visible only when printed) */}
        <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">
                Institut Teknologi Nusantara
              </h2>
              <p className="text-xs text-slate-700">{displayFaculty} &bull; Program Studi {displayProdi}</p>
              <p className="text-[11px] text-slate-500">Jalan Soekarno Hatta No. 128, Bandung, Jawa Barat | Website: siakad.itn.ac.id</p>
            </div>
            <div className="text-right">
              <h3 className="text-base font-bold text-slate-900">KARTU HASIL STUDI (KHS)</h3>
              <p className="text-xs text-slate-700 font-semibold">{currentSem.namaSemester}</p>
              <p className="text-[11px] text-slate-500">No. Dokumen: KHS/2026/{currentSem.semesterNumber}/{displayNim}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-300 text-xs text-slate-800">
            <div className="space-y-1">
              <p><strong>Nama Mahasiswa:</strong> {studentName}</p>
              <p><strong>Nomor Induk Mahasiswa (NIM):</strong> {displayNim}</p>
              <p><strong>Program Studi:</strong> {displayProdi}</p>
            </div>
            <div className="space-y-1">
              <p><strong>Tahun Akademik:</strong> {currentSem.tahunAkademik}</p>
              <p><strong>Dosen Pembimbing Akademik:</strong> {displayAdvisor}</p>
              <p><strong>Status Mahasiswa:</strong> Aktif</p>
            </div>
          </div>
        </div>

        {/* 4 Academic Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 print:hidden">
          {/* IPS Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                IPS Semester Ini
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#1E3A8A]">{calculatedIPS}</p>
              <span className="text-xs font-semibold text-slate-400">/ 4.00</span>
            </div>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-3 h-3" />
              <span>{totalSksTaken > 0 ? ipsPredicate(currentSem.ips) : 'Status Aktif'}</span>
            </div>
          </div>

          {/* IPK Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                IPK Kumulatif
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{totalSksTaken > 0 && currentSem.ipkKumulatif !== null ? currentSem.ipkKumulatif.toFixed(2) : '-'}</p>
              <span className="text-xs font-semibold text-slate-400">/ 4.00</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Dari total <strong className="text-slate-700">{currentSem.sksKumulatif} SKS</strong> yang diselesaikan
            </p>
          </div>

          {/* SKS Semester Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                SKS Semester Ini
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-slate-900">{totalSksPassed}</p>
              <span className="text-xs font-semibold text-slate-400">/ {totalSksTaken} SKS</span>
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{totalSksTaken > 0 ? `${Math.round((totalSksPassed / totalSksTaken) * 100)}% SKS Lulus` : 'Belum Ada SKS'}</span>
            </p>
          </div>

          {/* Max SKS Next Semester */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Beban Maks SKS
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#D4A017]">{currentSem.maksSksBerikutnya}</p>
              <span className="text-xs font-semibold text-slate-400">SKS</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Hak pengambilan SKS semester depan
            </p>
          </div>
        </div>

        {/* KHS GRADES TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Rincian Nilai Mata Kuliah &bull; {currentSem.namaSemester}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi nilai akhir hasil belajar yang telah divalidasi oleh Program Studi.
              </p>
            </div>
            <span className="text-xs font-bold text-[#1E3A8A] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 w-fit">
              {currentSem.nilaiList.length} Mata Kuliah ({totalSksTaken} SKS)
            </span>
          </div>

          {currentSem.nilaiList.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E3A8A]">
                <BookOpen className="w-7 h-7 text-[#1E3A8A]/70" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Belum Ada Nilai KHS yang Diterbitkan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                Nilai Kartu Hasil Studi untuk {currentSem.namaSemester} belum diterbitkan. Nilai akan muncul setelah masa perkuliahan dan evaluasi Ujian Akhir Semester (UAS) diselesaikan serta divalidasi oleh BAAK.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-12">No.</th>
                    <th className="py-3.5 px-4">Kode MK</th>
                    <th className="py-3.5 px-4">Nama Mata Kuliah</th>
                    <th className="py-3.5 px-4 text-center">SKS (K)</th>
                    <th className="py-3.5 px-4 text-center">Nilai Huruf</th>
                    <th className="py-3.5 px-4 text-center">Angka Mutu (M)</th>
                    <th className="py-3.5 px-4 text-center">Bobot (K &times; M)</th>
                    <th className="py-3.5 px-4">Dosen Pengampu</th>
                    <th className="py-3.5 px-4 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {currentSem.nilaiList.map((item, idx) => {
                    const bobot = item.sks * item.nilaiAngka;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1E3A8A]">
                          {item.kode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {item.nama}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {item.sks}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-black ${gradeTone(item.nilaiHuruf, item.nilaiAngka).chip}`}
                          >
                            {item.nilaiHuruf}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {item.nilaiAngka.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                          {bobot.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {item.dosen}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              item.keterangan === 'LULUS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.keterangan}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4 text-right">
                      TOTAL EVALUASI SEMESTER:
                    </td>
                    <td className="py-3.5 px-4 text-center text-sm font-black text-[#1E3A8A]">
                      {totalSksTaken} SKS
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-normal">
                      —
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-normal">
                      —
                    </td>
                    <td className="py-3.5 px-4 text-center text-sm font-black text-slate-900">
                      {totalBobotMutu.toFixed(2)}
                    </td>
                    <td colSpan={2} className="py-3.5 px-4 text-right">
                      <span className="text-xs text-slate-600 font-normal mr-2">IPS:</span>
                      <span className="text-base font-black text-[#1E3A8A] bg-blue-100/70 px-2.5 py-1 rounded-lg">
                        {calculatedIPS}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* PERFORMANCE & GRADE DISTRIBUTION CHART BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
          {/* IPS Semester Progression (data nyata) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Tren Indeks Prestasi Semester (IPS)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ipsTrend.length > 0
                    ? `Rekam jejak IPS dari Semester ${ipsTrend[0].semesterNumber} s/d Semester ${ipsTrend[ipsTrend.length - 1].semesterNumber} (${ipsTrend.length} semester).`
                    : 'Belum ada semester dengan nilai yang diterbitkan.'}
                </p>
              </div>
              {ipsTrend.length >= 2 && (() => {
                const last = ipsTrend[ipsTrend.length - 1].ips as number;
                const prev = ipsTrend[ipsTrend.length - 2].ips as number;
                const diff = last - prev;
                const label = diff > 0.005 ? 'Meningkat' : diff < -0.005 ? 'Menurun' : 'Stabil';
                const tone =
                  diff > 0.005
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : diff < -0.005
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-blue-700 bg-blue-50 border-blue-200';
                return (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${tone}`}>
                    {label} ({diff >= 0 ? '+' : ''}
                    {diff.toFixed(2)})
                  </span>
                );
              })()}
            </div>

            {ipsTrend.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-slate-400 border-b border-slate-100">
                Grafik akan tampil setelah nilai semester diterbitkan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="pt-6 pb-2 flex items-end gap-3 h-48 border-b border-slate-100"
                  style={{ minWidth: `${Math.max(ipsTrend.length * 64, 320)}px` }}
                >
                  {ipsTrend.map((s) => {
                    const val = s.ips as number;
                    const heightPercent = Math.max((val / 4.0) * 100, 2);
                    const active = s.id === currentSem.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSemesterId(s.id)}
                        title={s.namaSemester}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                      >
                        <span className="text-[11px] font-mono font-bold text-slate-700 group-hover:text-[#1E3A8A] transition-colors">
                          {val.toFixed(2)}
                        </span>
                        <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                          <div
                            className={`w-full rounded-t-xl transition-all duration-500 group-hover:opacity-90 ${
                              active ? 'bg-gradient-to-t from-[#1E3A8A] to-[#3B82F6]' : 'bg-slate-300'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${active ? 'text-[#1E3A8A]' : 'text-slate-500'}`}>
                          Sem {s.semesterNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Batas Minimum Kelulusan: 2.00</span>
              <span className="font-semibold text-slate-700">
                IPK Kumulatif:{' '}
                {ipsTrend.length > 0 && ipsTrend[ipsTrend.length - 1].ipkKumulatif !== null
                  ? (ipsTrend[ipsTrend.length - 1].ipkKumulatif as number).toFixed(2)
                  : '-'}
              </span>
            </div>
          </div>

          {/* Grade Distribution (data nyata) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1E3A8A]" />
              <span>Distribusi Nilai Semester {currentSem.semesterNumber}</span>
            </h3>
            <p className="text-[11px] text-slate-400 -mt-2">{currentSem.namaSemester}</p>

            {gradeDistribution.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Belum ada nilai pada semester ini.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {gradeDistribution.map((g) => {
                  const percent = (g.count / currentSem.nilaiList.length) * 100;
                  const tone = gradeTone(g.letter, g.point);
                  return (
                    <div key={g.letter} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Nilai {g.letter} ({g.point.toFixed(2)})
                        </span>
                        <span className="font-bold text-slate-900">
                          {g.count} Mata Kuliah ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${tone.bg} overflow-hidden`}>
                        <div className={`h-full ${tone.bar} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {gradeDistribution.length > 0 && (() => {
              const failed = currentSem.nilaiList.filter((n) => n.nilaiAngka < 2).length;
              const top = currentSem.nilaiList.filter((n) => n.nilaiAngka >= 3.5).length;
              const allTop = top === currentSem.nilaiList.length;
              return (
                <div
                  className={`rounded-xl p-3 border text-xs mt-4 ${
                    failed > 0 ? 'bg-rose-50/70 border-rose-100 text-rose-900' : 'bg-blue-50/60 border-blue-100 text-blue-900'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
                    {failed > 0 ? 'Perlu Perbaikan Nilai' : allTop ? 'Kinerja Akademik Unggul' : 'Kinerja Akademik Baik'}
                  </p>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${failed > 0 ? 'text-rose-700' : 'text-blue-700'}`}>
                    {failed > 0
                      ? `${failed} mata kuliah belum mencapai nilai lulus minimal (C). Pertimbangkan mengulang di semester berikutnya.`
                      : allTop
                      ? 'Seluruh mata kuliah diselesaikan dengan nilai di atas B+ tanpa perbaikan nilai.'
                      : `${top} dari ${currentSem.nilaiList.length} mata kuliah meraih nilai B+ ke atas. Pertahankan dan tingkatkan.`}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </PortalLayout>
  );
}
