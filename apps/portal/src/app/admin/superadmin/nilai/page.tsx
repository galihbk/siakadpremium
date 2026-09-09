'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Award,
  Lock,
  Unlock,
  Search,
  ChevronRight,
  CheckCircle2,
  X,
  BookOpen,
  UserCheck,
  Users,
  AlertCircle,
  Loader2,
  FileCheck2,
  Eye,
  Download,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export interface GradeClassItem {
  id: string;
  courseCode: string;
  courseName: string;
  className: string;
  sks: number;
  studyProgramName: string;
  semester: number;
  academicYear: string;
  day: string;
  timeSlot: string;
  roomName: string;
  lecturerName: string;
  lecturerNidn: string;
  totalStudents: number;
  gradedCount: number;
  gradeStatus: string;
  isLocked: boolean;
  gradeDeadline: string;
}

export default function SuperAdminNilaiPage() {
  const [classes, setClasses] = useState<GradeClassItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prodiFilter, setProdiFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  // Modals
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [summaryRes, classesRes] = await Promise.all([
        fetch(`${apiBase}/academic/grades/summary`),
        fetch(`${apiBase}/academic/grades/classes?lecturerId=all`),
      ]);

      if (summaryRes.ok) {
        const json = await summaryRes.json();
        setSummary(json.data);
      }
      if (classesRes.ok) {
        const json = await classesRes.json();
        setClasses(json.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data rekapitulasi nilai.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Class Student Grades Detail
  const handleOpenDetail = async (classId: string) => {
    setViewingClassId(classId);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`${apiBase}/academic/grades/classes/${classId}`);
      if (res.ok) {
        const json = await res.json();
        setClassDetail(json.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat detail nilai mahasiswa kelas.', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Toggle Grade Lock
  const handleToggleLock = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/grades/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal mengubah status kunci nilai');

      showToast(result.message || 'Status penguncian nilai berhasil diperbarui.');
      setIsLockModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat mengubah status penguncian.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.courseName.toLowerCase().includes(q) ||
        c.courseCode.toLowerCase().includes(q) ||
        c.className.toLowerCase().includes(q) ||
        c.lecturerName.toLowerCase().includes(q);

      const matchesProdi = prodiFilter === 'Semua' || c.studyProgramName === prodiFilter;
      const matchesStatus = statusFilter === 'Semua' || c.gradeStatus === statusFilter;

      return matchesSearch && matchesProdi && matchesStatus;
    });
  }, [classes, searchQuery, prodiFilter, statusFilter]);

  const prodiOptions = useMemo(() => {
    const list = Array.from(new Set(classes.map((c) => c.studyProgramName).filter(Boolean)));
    return ['Semua', ...list];
  }, [classes]);

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator"
    >
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
                : 'bg-rose-950/90 text-rose-200 border-rose-500/30'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-80 p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
              <Link href="/admin/superadmin" className="hover:text-slate-200 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Akademik</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-emerald-400">Rekapitulasi & Kunci Nilai</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <Award className="w-6 h-6" />
              </span>
              Monitoring & Penguncian Nilai
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pantau kepatuhan entri nilai dosen per program studi, kelola status kunci semester, dan inspeksi rincian nilai akhir.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLockModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                summary?.isGradeLocked
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
              }`}
            >
              {summary?.isGradeLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{summary?.isGradeLocked ? 'Buka Akses Pengisian Nilai' : 'Kunci Nilai Semester'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Kelas Kuliah</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{summary?.totalClasses ?? 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              {summary?.activeSemesterName || 'Semester Gasal 2026/2027'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nilai Telah Terbit</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">
                  {summary?.finishedClasses ?? 0}{' '}
                  <span className="text-sm font-normal text-teal-400">({summary?.percentage ?? 0}%)</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              <span className="text-teal-400 font-medium">{summary?.inProgressClasses ?? 0} kelas</span> dalam proses draf
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mahasiswa Dinilai</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">
                  {summary?.gradedStudents ?? 0}{' '}
                  <span className="text-sm font-normal text-slate-400">/ {summary?.totalStudents ?? 0}</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Data evaluasi UTS, UAS, dan Tugas terinput
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status Akses Dosen</p>
                <div className="mt-1.5">
                  {summary?.isGradeLocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <Lock className="w-3.5 h-3.5" /> Terkunci Resmi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Unlock className="w-3.5 h-3.5" /> Akses Dibuka
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Batas Waktu: <span className="text-amber-400 font-medium">{summary?.gradeDeadline}</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah, kelas, dosen pengampu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              {prodiOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Status Entri</option>
              <option value="Selesai & Terbit">Selesai & Terbit</option>
              <option value="Draf Proses">Draf Proses</option>
              <option value="Belum Diisi">Belum Diisi</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Memuat data monitoring nilai...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <Award className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-300">Tidak ada kelas ditemukan</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Sesuaikan kata kunci pencarian atau bersihkan filter yang sedang aktif.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Mata Kuliah & SKS</th>
                    <th className="py-3.5 px-4 font-semibold">Kelas & Semester</th>
                    <th className="py-3.5 px-4 font-semibold">Program Studi</th>
                    <th className="py-3.5 px-4 font-semibold">Dosen Pengampu</th>
                    <th className="py-3.5 px-4 font-semibold">Progres Mahasiswa</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Status Entri</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {filteredClasses.map((cls) => {
                    const pct = cls.totalStudents
                      ? Math.round((cls.gradedCount / cls.totalStudents) * 100)
                      : 0;

                    return (
                      <tr key={cls.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-100 group-hover:text-emerald-300 transition-colors">
                            {cls.courseName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {cls.courseCode} &bull; {cls.sks} SKS
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {cls.className}
                          </span>
                          <div className="text-xs text-slate-500 mt-1">Semester {cls.semester}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-sm text-slate-200">{cls.studyProgramName}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-sm font-medium text-slate-200">{cls.lecturerName}</div>
                          <div className="text-xs text-slate-500 font-mono">NIDN: {cls.lecturerNidn}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>{cls.gradedCount} / {cls.totalStudents}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {cls.gradeStatus === 'Selesai & Terbit' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Selesai & Terbit
                            </span>
                          ) : cls.gradeStatus === 'Draf Proses' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3" /> Draf Proses
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Belum Diisi
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDetail(cls.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Rincian</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DETAIL NILAI KELAS */}
        <Modal
          isOpen={!!viewingClassId}
          onClose={() => setViewingClassId(null)}
          title="Rincian Nilai Mahasiswa Kelas"
        >
          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs">Memuat daftar nilai mahasiswa...</p>
            </div>
          ) : classDetail ? (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Mata Kuliah</span>
                  <strong className="text-slate-200">{classDetail.classInfo.courseName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Kelas & SKS</span>
                  <strong className="text-emerald-400">
                    {classDetail.classInfo.className} ({classDetail.classInfo.sks} SKS)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Dosen Pengampu</span>
                  <strong className="text-slate-200">{classDetail.classInfo.lecturerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Penguncian</span>
                  <span
                    className={`font-semibold ${
                      classDetail.classInfo.isLocked ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {classDetail.classInfo.isLocked ? 'Terkunci Resmi' : 'Akses Terbuka'}
                  </span>
                </div>
              </div>

              {/* Student Scores Table */}
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">NIM & Mahasiswa</th>
                      <th className="py-2.5 px-2 text-center">Presensi (10%)</th>
                      <th className="py-2.5 px-2 text-center">Tugas (20%)</th>
                      <th className="py-2.5 px-2 text-center">UTS (30%)</th>
                      <th className="py-2.5 px-2 text-center">UAS (40%)</th>
                      <th className="py-2.5 px-2 text-center">Nilai Akhir</th>
                      <th className="py-2.5 px-2 text-center">Mutu</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {classDetail.students.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-sans">
                          <div className="font-semibold text-slate-200">{st.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{st.nim}</div>
                        </td>
                        <td className="py-2 px-2 text-center">{st.attendance ?? '-'}</td>
                        <td className="py-2 px-2 text-center">{st.assignment ?? '-'}</td>
                        <td className="py-2 px-2 text-center">{st.midterm ?? '-'}</td>
                        <td className="py-2 px-2 text-center">{st.finalExam ?? '-'}</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-400">
                          {st.totalScore ?? '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-200">
                            {st.gradeLetter || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              st.status === 'Final'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setViewingClassId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : null}
        </Modal>

        {/* MODAL KONFIRMASI KUNCI NILAI */}
        <Modal
          isOpen={isLockModalOpen}
          onClose={() => setIsLockModalOpen(false)}
          title="Konfirmasi Penguncian Nilai Semester"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-2">
              <div className="font-semibold text-amber-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {summary?.isGradeLocked
                  ? 'Buka Akses Pengisian Nilai Dosen'
                  : 'Kunci Pengisian Nilai Semester'}
              </div>
              <p>
                {summary?.isGradeLocked
                  ? 'Anda akan membuka kembali akses pengisian nilai bagi seluruh dosen pengampu. Dosen dapat menyunting dan memperbarui nilai mahasiswa kembali.'
                  : 'Anda akan mengunci akses pengisian nilai semester ini secara resmi. Seluruh dosen tidak dapat lagi menyunting draf atau nilai mahasiswa setelah dikunci.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleToggleLock}
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all ${
                  summary?.isGradeLocked
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    {summary?.isGradeLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{summary?.isGradeLocked ? 'Buka Kunci Nilai' : 'Kunci Nilai Sekarang'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PortalLayout>
  );
}
