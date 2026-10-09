'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { useSortedPagination } from '@/lib/useSortedPagination';
import { SortableTh } from '@/components/common/SortableTh';
import { TablePagination } from '@/components/common/TablePagination';
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
  SlidersHorizontal,
  Calendar,
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
  const [academicYears, setAcademicYears] = useState<{ id: string; code: string; name: string; semesterLabel: string; isActive: boolean }[]>([]);
  const [filterAcademicYearId, setFilterAcademicYearId] = useState('');

  // Modals
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [classDetail, setClassDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editedGrades, setEditedGrades] = useState<Record<string, { assignment: string; midterm: string; finalExam: string }>>({});
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal pengaturan jendela tanggal input nilai (untuk tahun akademik aktif)
  const [isGradeWindowModalOpen, setIsGradeWindowModalOpen] = useState(false);
  const [gradeWindowStart, setGradeWindowStart] = useState('');
  const [gradeWindowEnd, setGradeWindowEnd] = useState('');
  const [isSavingGradeWindow, setIsSavingGradeWindow] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const classesParams = new URLSearchParams({ lecturerId: 'all' });
      if (filterAcademicYearId) classesParams.set('academicYearId', filterAcademicYearId);
      const [summaryRes, classesRes] = await Promise.all([
        fetch(`${apiBase}/academic/grades/summary`),
        fetch(`${apiBase}/academic/grades/classes?${classesParams.toString()}`),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAcademicYearId]);

  useEffect(() => {
    fetch(`${apiBase}/academic/years`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (!Array.isArray(result)) return;
        setAcademicYears(result);
        const active = result.find((y: { isActive: boolean }) => y.isActive);
        if (active) setFilterAcademicYearId(active.id);
      })
      .catch((e) => console.warn('Gagal memuat daftar tahun akademik:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const initial: Record<string, { assignment: string; midterm: string; finalExam: string }> = {};
        for (const st of json.data?.students || []) {
          initial[st.id] = {
            assignment: st.assignment != null ? String(st.assignment) : '',
            midterm: st.midterm != null ? String(st.midterm) : '',
            finalExam: st.finalExam != null ? String(st.finalExam) : '',
          };
        }
        setEditedGrades(initial);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat detail nilai mahasiswa kelas.', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const updateEditedGrade = (studentId: string, field: 'assignment' | 'midterm' | 'finalExam', value: string) => {
    setEditedGrades((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  // Simpan koreksi nilai dari Admin -- pakai endpoint batch yang sama dengan entri dosen
  // (POST /academic/grades/save), jadi totalScore/gradeLetter/gradePoint dihitung ulang
  // server-side dari bobot penilaian kelas, bukan ditimpa manual dari frontend.
  const handleSaveGrades = async (isFinalSubmit: boolean) => {
    if (!viewingClassId || !classDetail) return;
    setIsSavingGrades(true);
    try {
      const grades = classDetail.students.map((st: any) => ({
        id: st.id,
        assignment: editedGrades[st.id]?.assignment || 0,
        midterm: editedGrades[st.id]?.midterm || 0,
        finalExam: editedGrades[st.id]?.finalExam || 0,
      }));
      const res = await fetch(`${apiBase}/academic/grades/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: viewingClassId, grades, isFinalSubmit }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || 'Gagal menyimpan perbaikan nilai.');

      showToast(isFinalSubmit ? 'Nilai berhasil diperbaiki & diterbitkan.' : 'Draf perbaikan nilai berhasil disimpan.');
      await handleOpenDetail(viewingClassId);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perbaikan nilai.', 'error');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');

  const handleOpenGradeWindowModal = () => {
    setGradeWindowStart(toDateInput(summary?.gradeInputStartDate));
    setGradeWindowEnd(toDateInput(summary?.gradeInputEndDate));
    setIsGradeWindowModalOpen(true);
  };

  const handleSaveGradeWindow = async () => {
    if (!activeAcademicYear) return;
    setIsSavingGradeWindow(true);
    try {
      const res = await fetch(`${apiBase}/academic/years/${activeAcademicYear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeInputStartDate: gradeWindowStart || null,
          gradeInputEndDate: gradeWindowEnd || null,
        }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan jendela tanggal input nilai.');
      showToast('Jendela tanggal input nilai berhasil disimpan.');
      setIsGradeWindowModalOpen(false);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan jendela tanggal input nilai.', 'error');
    } finally {
      setIsSavingGradeWindow(false);
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

  const activeAcademicYear = academicYears.find((y) => y.isActive);
  const activeFilterCount =
    (prodiFilter !== 'Semua' ? 1 : 0) +
    (statusFilter !== 'Semua' ? 1 : 0) +
    (activeAcademicYear && filterAcademicYearId !== activeAcademicYear.id ? 1 : 0);
  const resetFilters = () => {
    setProdiFilter('Semua');
    setStatusFilter('Semua');
    if (activeAcademicYear) setFilterAcademicYearId(activeAcademicYear.id);
  };

  const { paginated, sortKey, sortDir, handleSort, page, setPage, totalPages, pageSize } =
    useSortedPagination<GradeClassItem>(filteredClasses, 'courseName');

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
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-5 bg-slate-900 text-white ${
              toastMessage.type === 'success' ? 'border-emerald-500/30' : 'border-rose-500/30'
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
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
              <Link href="/admin/superadmin" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span>Akademik</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Rekapitulasi & Kunci Nilai</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <Award className="w-6 h-6" />
              </span>
              Monitoring & Penguncian Nilai
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau kepatuhan entri nilai dosen per program studi, kelola status kunci semester, dan inspeksi rincian nilai akhir.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenGradeWindowModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Atur Jendela Input Nilai</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kelas Kuliah</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1.5">{summary?.totalClasses ?? 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {summary?.activeSemesterName || 'Semester Gasal 2026/2027'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs group hover:border-teal-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Telah Terbit</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1.5">
                  {summary?.finishedClasses ?? 0}{' '}
                  <span className="text-sm font-normal text-teal-600">({summary?.percentage ?? 0}%)</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              <span className="text-teal-600 font-medium">{summary?.inProgressClasses ?? 0} kelas</span> dalam proses draf
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mahasiswa Dinilai</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1.5">
                  {summary?.gradedStudents ?? 0}{' '}
                  <span className="text-sm font-normal text-slate-400">/ {summary?.totalStudents ?? 0}</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1E3A8A] group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Data evaluasi UTS, UAS, dan Tugas terinput
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Akses Dosen</p>
                <div className="mt-1.5">
                  {summary?.isGradeLocked ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3.5 h-3.5" /> Terkunci Resmi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Unlock className="w-3.5 h-3.5" /> Akses Dibuka
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              {summary?.gradeInputStartDate && summary?.gradeInputEndDate ? (
                <>
                  Jendela:{' '}
                  <span className="text-amber-700 font-medium">
                    {new Date(summary.gradeInputStartDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} &ndash;{' '}
                    {new Date(summary.gradeInputEndDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </>
              ) : (
                'Belum ada jendela tanggal diatur -- akses nilai selalu terbuka.'
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah, kelas, dosen pengampu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>

          </div>

          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Memuat data monitoring nilai...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-center">
            <Award className="w-12 h-12 text-slate-300 mb-3" />
            <h4 className="text-base font-semibold text-slate-700">Tidak ada kelas ditemukan</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              Sesuaikan kata kunci pencarian atau bersihkan filter yang sedang aktif.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <SortableTh<GradeClassItem> label="Mata Kuliah & SKS" column="courseName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-4" />
                    <SortableTh<GradeClassItem> label="Kelas & Semester" column="semester" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-4" />
                    <SortableTh<GradeClassItem> label="Program Studi" column="studyProgramName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-4" />
                    <SortableTh<GradeClassItem> label="Dosen Pengampu" column="lecturerName" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-4" />
                    <SortableTh<GradeClassItem> label="Progres Mahasiswa" column="gradedCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="py-3.5 px-4" />
                    <SortableTh<GradeClassItem> label="Status Entri" column="gradeStatus" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="center" className="py-3.5 px-4" />
                    <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {paginated.map((cls) => {
                    const pct = cls.totalStudents
                      ? Math.round((cls.gradedCount / cls.totalStudents) * 100)
                      : 0;

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {cls.courseName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            {cls.courseCode} &bull; {cls.sks} SKS
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {cls.className}
                          </span>
                          <div className="text-xs text-slate-400 mt-1">Semester {cls.semester}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-sm text-slate-700">{cls.studyProgramName}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-sm font-medium text-slate-800">{cls.lecturerName}</div>
                          <div className="text-xs text-slate-400 font-mono">NIDN: {cls.lecturerNidn}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>{cls.gradedCount} / {cls.totalStudents}</span>
                              <span className="font-mono">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {cls.gradeStatus === 'Selesai & Terbit' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" /> Selesai & Terbit
                            </span>
                          ) : cls.gradeStatus === 'Draf Proses' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Draf Proses
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Belum Diisi
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDetail(cls.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-[#1E3A8A] text-slate-700 hover:text-white transition-colors"
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
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredClasses.length} pageSize={pageSize} itemLabel="kelas" />
          </div>
        )}

        {/* MODAL FILTER */}
        <Modal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          title="Filter Kelas Kuliah"
          icon={<SlidersHorizontal className="w-5 h-5" />}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tahun Akademik</label>
              <select
                value={filterAcademicYearId}
                onChange={(e) => setFilterAcademicYearId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.semesterLabel}
                    {y.isActive ? ' (Aktif)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi</label>
              <select
                value={prodiFilter}
                onChange={(e) => setProdiFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
              >
                {prodiOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Entri</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-medium"
              >
                <option value="Semua">Semua Status Entri</option>
                <option value="Selesai & Terbit">Selesai & Terbit</option>
                <option value="Draf Proses">Draf Proses</option>
                <option value="Belum Diisi">Belum Diisi</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 transition-colors cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL DETAIL NILAI KELAS */}
        <Modal
          isOpen={!!viewingClassId}
          onClose={() => setViewingClassId(null)}
          title="Rincian Nilai Mahasiswa Kelas"
          maxWidth="3xl"
        >
          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">Memuat daftar nilai mahasiswa...</p>
            </div>
          ) : classDetail ? (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Mata Kuliah</span>
                  <strong className="text-slate-800">{classDetail.classInfo.courseName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Kelas & SKS</span>
                  <strong className="text-emerald-700">
                    {classDetail.classInfo.className} ({classDetail.classInfo.sks} SKS)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Dosen Pengampu</span>
                  <strong className="text-slate-800">{classDetail.classInfo.lecturerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Penguncian</span>
                  <span
                    className={`font-semibold ${
                      classDetail.classInfo.isLocked ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {classDetail.classInfo.isLocked ? 'Terkunci Resmi' : 'Akses Terbuka'}
                  </span>
                </div>
              </div>

              {/* Student Scores Table */}
              <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
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
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {classDetail.students.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{st.studentName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{st.nim}</div>
                        </td>
                        <td className="py-2 px-2 text-center">{st.attendance ?? '-'}</td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={classDetail.classInfo.isLocked}
                            value={editedGrades[st.id]?.assignment ?? ''}
                            onChange={(e) => updateEditedGrade(st.id, 'assignment', e.target.value)}
                            className="w-14 px-1.5 py-1 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={classDetail.classInfo.isLocked}
                            value={editedGrades[st.id]?.midterm ?? ''}
                            onChange={(e) => updateEditedGrade(st.id, 'midterm', e.target.value)}
                            className="w-14 px-1.5 py-1 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            disabled={classDetail.classInfo.isLocked}
                            value={editedGrades[st.id]?.finalExam ?? ''}
                            onChange={(e) => updateEditedGrade(st.id, 'finalExam', e.target.value)}
                            className="w-14 px-1.5 py-1 text-center rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700">
                          {st.totalScore ?? '-'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                            {st.gradeLetter || '-'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              st.status === 'Final'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
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

              {classDetail.classInfo.isLocked && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Nilai semester ini terkunci resmi -- buka dulu lewat tombol &ldquo;Buka Akses Pengisian Nilai&rdquo; di pojok kanan atas
                    sebelum bisa memperbaiki nilai.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setViewingClassId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGrades(false)}
                  disabled={isSavingGrades || classDetail.classInfo.isLocked}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50"
                >
                  {isSavingGrades && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Draf</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGrades(true)}
                  disabled={isSavingGrades || classDetail.classInfo.isLocked}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSavingGrades && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan & Terbitkan</span>
                </button>
              </div>
            </div>
          ) : null}
        </Modal>

        {/* MODAL JENDELA TANGGAL INPUT NILAI */}
        <Modal
          isOpen={isGradeWindowModalOpen}
          onClose={() => setIsGradeWindowModalOpen(false)}
          title="Jendela Waktu Input Nilai"
          subtitle={summary?.activeSemesterName ? `Berlaku untuk ${summary.activeSemesterName}` : undefined}
          icon={<Calendar className="w-5 h-5" />}
          maxWidth="sm"
        >
          {!activeAcademicYear ? (
            <p className="text-xs text-slate-500">Tidak ada tahun akademik aktif yang ditemukan.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mulai Input Nilai</label>
                  <input
                    type="date"
                    value={gradeWindowStart}
                    onChange={(e) => setGradeWindowStart(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Akhir Input Nilai</label>
                  <input
                    type="date"
                    value={gradeWindowEnd}
                    onChange={(e) => setGradeWindowEnd(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Di luar rentang tanggal ini, dosen otomatis tidak bisa menyimpan nilai. Kosongkan keduanya untuk membiarkan akses selalu
                terbuka (tidak ada batasan tanggal).
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGradeWindowModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveGradeWindow}
                  disabled={isSavingGradeWindow}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSavingGradeWindow && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PortalLayout>
  );
}
