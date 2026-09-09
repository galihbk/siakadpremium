'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getAuthSession } from '@/lib/auth';
import {
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Download,
  Printer,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
  Sparkles,
  Check,
  X,
  FileCheck2,
  Calendar,
  Clock,
  DoorOpen,
} from 'lucide-react';

interface StudentGradeItem {
  id: string;
  nim: string;
  studentName: string;
  attendance: number;
  assignment: number;
  midterm: number;
  finalExam: number;
  totalScore: number;
  gradeLetter: string;
  gradePoint: number;
  status: 'Draf' | 'Final';
}

function LecturerNilaiContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<StudentGradeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modals & Feedback
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Classes for logged-in lecturer
  useEffect(() => {
    const { user } = getAuthSession();
    if (user) setCurrentUser(user);

    const fetchClasses = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBase}/academic/grades/classes`);
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setClasses(list);

          const targetId =
            initialClassId && list.some((c: any) => c.id === initialClassId)
              ? initialClassId
              : list[0]?.id || '';

          if (targetId) {
            setSelectedClassId(targetId);
          }
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat daftar kelas mengajar.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [initialClassId]);

  // Fetch Students & Scores when selected class changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchClassDetails = async () => {
      setIsLoadingStudents(true);
      try {
        const res = await fetch(`${apiBase}/academic/grades/classes/${selectedClassId}`);
        if (res.ok) {
          const json = await res.json();
          setClassInfo(json.data.classInfo);
          setStudents(json.data.students || []);
        }
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat nilai mahasiswa untuk kelas ini.', 'error');
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchClassDetails();
  }, [selectedClassId]);

  // Calculate scores
  const calculateRow = (attendance: number, assignment: number, midterm: number, finalExam: number) => {
    const total = Number((attendance * 0.1 + assignment * 0.2 + midterm * 0.3 + finalExam * 0.4).toFixed(1));
    let letter = 'E';
    let point = 0.0;

    if (total >= 85) { letter = 'A'; point = 4.0; }
    else if (total >= 80) { letter = 'A-'; point = 3.7; }
    else if (total >= 75) { letter = 'B+'; point = 3.3; }
    else if (total >= 70) { letter = 'B'; point = 3.0; }
    else if (total >= 65) { letter = 'B-'; point = 2.7; }
    else if (total >= 60) { letter = 'C+'; point = 2.3; }
    else if (total >= 55) { letter = 'C'; point = 2.0; }
    else if (total >= 40) { letter = 'D'; point = 1.0; }
    else { letter = 'E'; point = 0.0; }

    return { totalScore: total, gradeLetter: letter, gradePoint: point };
  };

  // Handle Score Input Change
  const handleScoreChange = (
    index: number,
    field: 'attendance' | 'assignment' | 'midterm' | 'finalExam',
    value: number
  ) => {
    const clampedVal = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
    setStudents((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: clampedVal };
      const computed = calculateRow(item.attendance, item.assignment, item.midterm, item.finalExam);
      next[index] = { ...item, ...computed };
      return next;
    });
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedClassId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/grades/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          grades: students,
          isFinalSubmit: false,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menyimpan nilai draf');

      showToast('Draf nilai mahasiswa berhasil disimpan.');
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menyimpan nilai.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Final
  const handleFinalSubmit = async () => {
    if (!selectedClassId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/grades/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          grades: students,
          isFinalSubmit: true,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menerbitkan nilai resmi');

      showToast('Nilai mahasiswa berhasil disahkan dan diterbitkan ke portal.');
      setIsConfirmSubmitOpen(false);
      const refreshRes = await fetch(`${apiBase}/academic/grades/classes/${selectedClassId}`);
      if (refreshRes.ok) {
        const json = await refreshRes.json();
        setStudents(json.data.students || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat mengesahkan nilai.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary statistics for current class
  const classStats = useMemo(() => {
    if (students.length === 0) return { avg: 0, countA: 0, countB: 0, countC: 0, countD: 0, countE: 0 };
    const sum = students.reduce((acc, s) => acc + (s.totalScore || 0), 0);
    const avg = Number((sum / students.length).toFixed(1));

    const countA = students.filter((s) => s.gradeLetter.startsWith('A')).length;
    const countB = students.filter((s) => s.gradeLetter.startsWith('B')).length;
    const countC = students.filter((s) => s.gradeLetter.startsWith('C')).length;
    const countD = students.filter((s) => s.gradeLetter === 'D').length;
    const countE = students.filter((s) => s.gradeLetter === 'E').length;

    return { avg, countA, countB, countC, countD, countE };
  }, [students]);

  // Export CSV
  const handleExportCsv = () => {
    if (!classInfo || students.length === 0) return;
    let csv = 'No,NIM,Nama Mahasiswa,Presensi (10%),Tugas (20%),UTS (30%),UAS (40%),Nilai Akhir,Huruf Mutu,Bobot IPK,Status\n';
    students.forEach((s, idx) => {
      csv += `${idx + 1},"${s.nim}","${s.studentName}",${s.attendance},${s.assignment},${s.midterm},${s.finalExam},${s.totalScore},${s.gradeLetter},${s.gradePoint},${s.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nilai_${classInfo.courseCode}_${classInfo.className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PortalLayout
      role="lecturer"
      userName={currentUser?.fullName || 'Dr. Bayu Wicaksono, M.Kom.'}
      userIdText="NIDN: 0412088501 • Dosen Tetap Informatika"
    >
      <div className="space-y-6 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-5 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
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

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/lecturer" className="hover:text-[#1E3A8A] transition-colors">
            Dashboard Dosen
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Pengajaran & Nilai</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#1E3A8A] font-semibold">Input Nilai Semester</span>
        </div>

        {/* Top Header Banner (Signature ITN Blue Gradient) */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md bg-white/10 text-[#D4A017] border border-white/10">
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester Gasal 2026/2027</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Masa Entri Nilai Aktif</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Input & Pengesahan Nilai Mahasiswa
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Kelola entri nilai evaluasi semester Gasal 2026/2027 dengan kalkulasi bobot otomatis dan penerbitan nilai resmi ke KHS mahasiswa.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCsv}
              disabled={students.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Ekspor Nilai (CSV)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Class Selector Box */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-xl">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Kelas Mata Kuliah
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName} ({c.className}) &bull; {c.gradeStatus}
                  </option>
                ))}
              </select>
            </div>

            {classInfo && (
              <div className="flex items-center gap-2 flex-wrap text-xs self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#1E3A8A] font-bold border border-blue-200">
                  {classInfo.sks} SKS
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  {classInfo.day}, {classInfo.timeSlot}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  {classInfo.roomName}
                </span>
              </div>
            )}
          </div>

          {/* Formula weight reminder badge */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1E3A8A] shrink-0" />
              <span>
                Rumus Evaluasi Resmi:{' '}
                <strong className="text-[#1E3A8A]">Presensi 10%</strong> +{' '}
                <strong className="text-[#1E3A8A]">Tugas 20%</strong> +{' '}
                <strong className="text-[#1E3A8A]">UTS 30%</strong> +{' '}
                <strong className="text-[#1E3A8A]">UAS 40%</strong>
              </span>
            </div>

            <div className="text-xs text-slate-600 font-medium">
              Batas Entri: <span className="text-rose-600 font-bold">{classInfo?.gradeDeadline || '28 Februari 2027'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats on Current Class Grade Distribution */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rata-rata Kelas</p>
            <p className="text-2xl font-black text-[#1E3A8A] mt-1">{classStats.avg}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai A / A-</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{classStats.countA} Mhs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai B / B+</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{classStats.countB} Mhs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai C / C+</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{classStats.countC} Mhs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai D</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{classStats.countD} Mhs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle text-center">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nilai E</p>
            <p className="text-2xl font-black text-slate-400 mt-1">{classStats.countE} Mhs</p>
          </div>
        </div>

        {/* Grade Entry Table */}
        {isLoadingStudents ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-subtle">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mb-3" />
            <p className="text-sm font-medium">Memuat lembar nilai kelas...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">NIM & Nama Mahasiswa</th>
                    <th className="py-3.5 px-3 text-center w-28">Presensi (10%)</th>
                    <th className="py-3.5 px-3 text-center w-28">Tugas (20%)</th>
                    <th className="py-3.5 px-3 text-center w-28">UTS (30%)</th>
                    <th className="py-3.5 px-3 text-center w-28">UAS (40%)</th>
                    <th className="py-3.5 px-3 text-center w-28">Nilai Akhir</th>
                    <th className="py-3.5 px-3 text-center w-24">Huruf Mutu</th>
                    <th className="py-3.5 px-4 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {students.map((st, index) => (
                    <tr key={st.id || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{index + 1}</td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{st.studentName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">NIM: {st.nim}</div>
                      </td>

                      {/* Presensi */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={st.attendance}
                          onChange={(e) => handleScoreChange(index, 'attendance', parseFloat(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A]"
                        />
                      </td>

                      {/* Tugas */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={st.assignment}
                          onChange={(e) => handleScoreChange(index, 'assignment', parseFloat(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A]"
                        />
                      </td>

                      {/* UTS */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={st.midterm}
                          onChange={(e) => handleScoreChange(index, 'midterm', parseFloat(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A]"
                        />
                      </td>

                      {/* UAS */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={st.finalExam}
                          onChange={(e) => handleScoreChange(index, 'finalExam', parseFloat(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1E3A8A]"
                        />
                      </td>

                      {/* Nilai Akhir Angka */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono font-black text-sm text-[#1E3A8A]">
                          {st.totalScore.toFixed(1)}
                        </span>
                      </td>

                      {/* Huruf Mutu */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                            st.gradeLetter.startsWith('A')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : st.gradeLetter.startsWith('B')
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : st.gradeLetter.startsWith('C')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {st.gradeLetter} ({st.gradePoint.toFixed(1)})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            st.status === 'Final'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
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

            {/* Bottom Action Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                Menampilkan <strong>{students.length}</strong> mahasiswa terdaftar pada kelas ini.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 text-slate-700 text-xs font-bold transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4 text-slate-500" />
                  <span>Simpan Draf</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsConfirmSubmitOpen(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Sahkan & Terbitkan Nilai</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI TERBITKAN NILAI */}
        <Modal
          isOpen={isConfirmSubmitOpen}
          onClose={() => setIsConfirmSubmitOpen(false)}
          title="Konfirmasi Pengesahan Nilai Semester"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-[#1E3A8A] flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Pengesahan Nilai Resmi
              </div>
              <p>
                Apakah Anda yakin ingin mengesahkan dan menerbitkan nilai untuk kelas{' '}
                <strong>{classInfo?.courseName} ({classInfo?.className})</strong>?
              </p>
              <p className="text-slate-600">
                Nilai yang disahkan akan langsung tampil pada Kartu Hasil Studi (KHS) mahasiswa dan masuk dalam transkrip akademik resmi.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengesahkan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Terbitkan Nilai</span>
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

export default function LecturerNilaiPage() {
  return (
    <Suspense fallback={<div className="p-12 text-slate-500 text-center">Memuat lembar nilai...</div>}>
      <LecturerNilaiContent />
    </Suspense>
  );
}
