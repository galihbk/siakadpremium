'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  Users,
  CheckCircle2,
  Clock,
  GraduationCap,
  Search,
  Filter,
  FileCheck,
  MessageSquare,
  ChevronRight,
  BookOpen,
  Award,
  AlertCircle,
  X,
  Send,
  Calendar,
  Phone,
  Mail,
  RefreshCw,
  Eye,
  Check,
  FileText,
  UserCheck,
} from 'lucide-react';

export interface CourseTaken {
  code: string;
  name: string;
  sks: number;
  class: string;
  schedule: string;
}

export interface ConsultationLog {
  id: string;
  date: string;
  topic: string;
  note: string;
}

export interface AdviseeStudent {
  id: string;
  nim: string;
  fullName: string;
  gender: string;
  angkatan: number;
  currentSemester: number;
  studyProgramName: string;
  facultyName: string;
  ipk: number;
  totalSksLulus: number;
  sksSemesterIni: number;
  krsStatus: 'Menunggu Persetujuan' | 'Disetujui';
  phone: string;
  email: string;
  statusBimbingan: 'KRS' | 'Skripsi';
  skripsiTitle: string | null;
  skripsiProgress: string | null;
  courses: CourseTaken[];
  consultations: ConsultationLog[];
}

export default function LecturerBimbinganPage() {
  const [students, setStudents] = useState<AdviseeStudent[]>([]);
  const [summary, setSummary] = useState({
    totalStudents: 7,
    pendingKrs: 3,
    approvedKrs: 4,
    thesisStudents: 3,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAngkatan, setSelectedAngkatan] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal states
  const [krsModalStudent, setKrsModalStudent] = useState<AdviseeStudent | null>(null);
  const [consultModalStudent, setConsultModalStudent] = useState<AdviseeStudent | null>(null);
  const [detailModalStudent, setDetailModalStudent] = useState<AdviseeStudent | null>(null);

  // Form states inside modals
  const [approvalNote, setApprovalNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isSavingConsult, setIsSavingConsult] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchAdvisees = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAngkatan !== 'Semua') params.append('angkatan', selectedAngkatan);
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`${apiBase}/lecturers/advisees?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (data.students) {
          setStudents(data.students);
          if (data.summary) {
            setSummary(data.summary);
          }
        } else if (Array.isArray(data)) {
          setStudents(data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat data bimbingan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) setCurrentUser(user);
    fetchAdvisees();
  }, [selectedAngkatan, selectedStatus]);

  // Handle live search
  const filteredStudents = useMemo(() => {
    return students.filter((m) => {
      const matchSearch =
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.nim.includes(searchTerm);
      const matchAngkatan =
        selectedAngkatan === 'Semua' || m.angkatan.toString() === selectedAngkatan;
      const matchStatus =
        selectedStatus === 'Semua' ||
        (selectedStatus === 'KRS Menunggu' && m.krsStatus === 'Menunggu Persetujuan') ||
        (selectedStatus === 'KRS Disetujui' && m.krsStatus === 'Disetujui') ||
        (selectedStatus === 'Bimbingan Skripsi' && m.statusBimbingan === 'Skripsi');

      return matchSearch && matchAngkatan && matchStatus;
    });
  }, [students, searchTerm, selectedAngkatan, selectedStatus]);

  // Action: Approve KRS
  const handleApproveKrs = async () => {
    if (!krsModalStudent) return;
    setIsApproving(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/advisees/${krsModalStudent.id}/approve-krs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: approvalNote }),
      });

      if (res.ok) {
        showNotification(
          `KRS mahasiswa ${krsModalStudent.fullName} (${krsModalStudent.nim}) berhasil disetujui & disahkan.`
        );

        // Update local state
        setStudents((prev) =>
          prev.map((s) => (s.id === krsModalStudent.id ? { ...s, krsStatus: 'Disetujui' } : s))
        );
        setSummary((prev) => ({
          ...prev,
          pendingKrs: Math.max(0, prev.pendingKrs - 1),
          approvedKrs: prev.approvedKrs + 1,
        }));
        setKrsModalStudent(null);
        setApprovalNote('');
      } else {
        showNotification('Terjadi kendala saat validasi KRS. Silakan coba kembali.');
      }
    } catch (error) {
      showNotification('Gagal menghubungi server. Silakan periksa jaringan Anda.');
    } finally {
      setIsApproving(false);
    }
  };

  // Action: Add Consultation Note
  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultModalStudent || !newTopic.trim() || !newNote.trim()) return;

    setIsSavingConsult(true);
    try {
      const res = await fetch(
        `${apiBase}/lecturers/advisees/${consultModalStudent.id}/consultations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: newTopic, note: newNote }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const addedLog: ConsultationLog = json.data || {
          id: `cs-${Date.now()}`,
          date: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          topic: newTopic,
          note: newNote,
        };

        // Update local state
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === consultModalStudent.id) {
              return {
                ...s,
                consultations: [addedLog, ...(s.consultations || [])],
              };
            }
            return s;
          })
        );

        setConsultModalStudent((prev) =>
          prev ? { ...prev, consultations: [addedLog, ...(prev.consultations || [])] } : null
        );

        setNewTopic('');
        setNewNote('');
        showNotification('Catatan konsultasi bimbingan akademik berhasil disimpan.');
      } else {
        showNotification('Gagal menyimpan catatan konsultasi. Silakan ulangi.');
      }
    } catch (err) {
      showNotification('Gagal menghubungi server saat menyimpan catatan.');
    } finally {
      setIsSavingConsult(false);
    }
  };

  return (
    <PortalLayout
      role="lecturer"
      userName={currentUser?.fullName || 'Dr. Bayu Wicaksono, M.Kom.'}
      userIdText="NIDN: 0412088501 • Dosen Tetap Informatika"
    >
      <div className="space-y-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Header Banner - Signature University Blue Gradient */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 mb-2">
              <Link href="/lecturer" className="hover:text-white transition-colors">
                Dashboard Dosen
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#D4A017]">Mahasiswa Bimbingan Akademik</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Bimbingan Akademik (PA) & Skripsi
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Pantau kemajuan studi mahasiswa perwalian, validasi pengajuan Kartu Rencana Studi
              (KRS) online semester aktif, serta riwayat bimbingan tugas akhir.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchAdvisees()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
            </button>
            <div className="px-4 py-2 bg-blue-900/60 border border-blue-400/30 rounded-xl text-center">
              <span className="block text-[10px] text-blue-200 uppercase font-semibold">
                Tahun Ajaran
              </span>
              <span className="text-xs font-extrabold text-white">2026/2027 Gasal</span>
            </div>
          </div>
        </div>

        {/* Metric Cards (Clean Light Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Advisees */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Mahasiswa PA
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{summary.totalStudents}</span>
              <span className="text-xs text-slate-500 font-medium">Mahasiswa Terdaftar</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Program Studi:</span>
              <strong className="text-slate-700">Teknik Informatika</strong>
            </div>
          </div>

          {/* Card 2: Pending KRS */}
          <div
            onClick={() => setSelectedStatus('KRS Menunggu')}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle flex flex-col justify-between ${
              selectedStatus === 'KRS Menunggu'
                ? 'border-amber-500 ring-2 ring-amber-100'
                : 'border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                KRS Menunggu Validasi
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600">{summary.pendingKrs}</span>
              <span className="text-xs text-amber-700 font-medium">Perlu Disetujui</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-amber-700 flex items-center justify-between font-semibold">
              <span>Klik untuk saring</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3: Approved KRS */}
          <div
            onClick={() => setSelectedStatus('KRS Disetujui')}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle flex flex-col justify-between ${
              selectedStatus === 'KRS Disetujui'
                ? 'border-emerald-500 ring-2 ring-emerald-100'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                KRS Disetujui
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{summary.approvedKrs}</span>
              <span className="text-xs text-slate-500 font-medium">Telah Divalidasi</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-700 flex items-center justify-between font-semibold">
              <span>Status Aktif Kuliah</span>
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4: Skripsi / Tugas Akhir */}
          <div
            onClick={() => setSelectedStatus('Bimbingan Skripsi')}
            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle flex flex-col justify-between ${
              selectedStatus === 'Bimbingan Skripsi'
                ? 'border-[#1E3A8A] ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Bimbingan Skripsi / TA
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1E3A8A]">{summary.thesisStudents}</span>
              <span className="text-xs text-slate-500 font-medium">Mahasiswa Akhir</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-[#1E3A8A] flex items-center justify-between font-semibold">
              <span>Proposal & Sidang</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-subtle flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan Nama Mahasiswa atau NIM..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 placeholder:text-slate-400"
              />
            </div>

            {/* Filter Angkatan */}
            <div className="w-full sm:w-48">
              <select
                value={selectedAngkatan}
                onChange={(e) => setSelectedAngkatan(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
              >
                <option value="Semua">Semua Angkatan</option>
                <option value="2024">Angkatan 2024 (Smt 3)</option>
                <option value="2023">Angkatan 2023 (Smt 5)</option>
                <option value="2022">Angkatan 2022 (Smt 7)</option>
                <option value="2021">Angkatan 2021 (Smt 9)</option>
              </select>
            </div>

            {/* Filter Status */}
            <div className="w-full sm:w-52">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800 font-medium"
              >
                <option value="Semua">Semua Status</option>
                <option value="KRS Menunggu">KRS Menunggu Validasi</option>
                <option value="KRS Disetujui">KRS Disetujui</option>
                <option value="Bimbingan Skripsi">Bimbingan Skripsi / TA</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedAngkatan !== 'Semua' || selectedStatus !== 'Semua') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAngkatan('Semua');
                setSelectedStatus('Semua');
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Advisees Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Mahasiswa Bimbingan Akademik
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {filteredStudents.length} dari {students.length} mahasiswa bimbingan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[220px]">Mahasiswa</th>
                  <th className="py-3 px-4 text-center">Angkatan / Smt</th>
                  <th className="py-3 px-4 text-center">SKS Lulus</th>
                  <th className="py-3 px-4 text-center">IPK</th>
                  <th className="py-3 px-4 text-center">SKS Smt Ini</th>
                  <th className="py-3 px-4 text-center">Status KRS</th>
                  <th className="py-3 px-4 text-center">Jenis Bimbingan</th>
                  <th className="py-3 px-4 text-center min-w-[180px]">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-7 h-7 rounded-full border-2 border-slate-300 border-t-[#1E3A8A] animate-spin"></div>
                        <span className="text-xs font-semibold">Memuat daftar mahasiswa bimbingan...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-sm text-slate-700">Tidak ada mahasiswa yang sesuai</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Coba ubah kata kunci pencarian atau sesuaikan pilihan filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((m, idx) => (
                    <tr
                      key={m.id}
                      className="hover:bg-blue-50/40 transition-colors group text-slate-800"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>

                      {/* Mahasiswa Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {m.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors line-clamp-1">
                              {m.fullName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              NIM: {m.nim} &bull; {m.gender}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Angkatan & Semester */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {m.angkatan} (Smt {m.currentSemester})
                        </span>
                      </td>

                      {/* Total SKS Lulus */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {m.totalSksLulus} SKS
                      </td>

                      {/* IPK */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                            m.ipk >= 3.75
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.ipk >= 3.5
                              ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.ipk.toFixed(2)}
                        </span>
                      </td>

                      {/* SKS Semester Berjalan */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-900">
                        {m.sksSemesterIni} SKS
                      </td>

                      {/* Status KRS */}
                      <td className="py-3.5 px-4 text-center">
                        {m.krsStatus === 'Menunggu Persetujuan' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Menunggu</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui</span>
                          </span>
                        )}
                      </td>

                      {/* Jenis Bimbingan */}
                      <td className="py-3.5 px-4 text-center">
                        {m.statusBimbingan === 'Skripsi' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <GraduationCap className="w-3 h-3" />
                            <span>Skripsi / TA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <UserCheck className="w-3 h-3" />
                            <span>Perwalian PA</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Validasi / Lihat KRS */}
                          <button
                            onClick={() => {
                              setKrsModalStudent(m);
                              setApprovalNote('');
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                              m.krsStatus === 'Menunggu Persetujuan'
                                ? 'bg-[#1E3A8A] text-white hover:bg-[#172554]'
                                : 'bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Tinjau & Validasi KRS"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>{m.krsStatus === 'Menunggu Persetujuan' ? 'Validasi' : 'KRS'}</span>
                          </button>

                          {/* Catatan Bimbingan / Konsultasi */}
                          <button
                            onClick={() => setConsultModalStudent(m)}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer relative"
                            title="Riwayat & Tambah Catatan Bimbingan"
                          >
                            <MessageSquare className="w-4 h-4 text-slate-600" />
                            {m.consultations && m.consultations.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1E3A8A] text-white text-[9px] font-black flex items-center justify-center">
                                {m.consultations.length}
                              </span>
                            )}
                          </button>

                          {/* Detail Profil & Skripsi */}
                          <button
                            onClick={() => setDetailModalStudent(m)}
                            className="p-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                            title="Lihat Detail Profil Akademik"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
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

        {/* MODAL 1: VALIDASI & RENCANA STUDI (KRS) */}
        {krsModalStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">
                      Kartu Rencana Studi (KRS) Semester Gasal
                    </h3>
                    <p className="text-xs text-blue-100">
                      Tinjauan Mata Kuliah & Persetujuan Dosen Pembimbing Akademik
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setKrsModalStudent(null)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Student Info Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Mahasiswa
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block">
                      {krsModalStudent.fullName}
                    </strong>
                    <span className="text-slate-500 font-mono">
                      NIM: {krsModalStudent.nim} &bull; Angkatan {krsModalStudent.angkatan}
                    </span>
                  </div>
                  <div className="flex gap-4 sm:text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        IPK Kumulatif
                      </span>
                      <strong className="text-sm font-bold text-[#1E3A8A]">
                        {krsModalStudent.ipk.toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        SKS Diambil
                      </span>
                      <strong className="text-sm font-bold text-emerald-700">
                        {krsModalStudent.sksSemesterIni} SKS
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Status Saat Ini
                      </span>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          krsModalStudent.krsStatus === 'Menunggu Persetujuan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {krsModalStudent.krsStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course List Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                    <span>Mata Kuliah Pilihan Rencana Studi</span>
                    <span className="text-slate-700">
                      Total:{' '}
                      <strong>
                        {krsModalStudent.courses.reduce((acc, c) => acc + c.sks, 0)} SKS
                      </strong>
                    </span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Kode</th>
                          <th className="py-2.5 px-3">Mata Kuliah</th>
                          <th className="py-2.5 px-3 text-center">Kelas</th>
                          <th className="py-2.5 px-3 text-center">SKS</th>
                          <th className="py-2.5 px-3">Jadwal Perkuliahan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {krsModalStudent.courses.map((course, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500 font-semibold">
                              {course.code}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{course.name}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                              {course.class}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#1E3A8A]">
                              {course.sks} SKS
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                              {course.schedule}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Advisor Feedback Note (if pending) */}
                {krsModalStudent.krsStatus === 'Menunggu Persetujuan' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Catatan atau Rekomendasi Pembimbing Akademik (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Contoh: Rencana studi disetujui. Pastikan kehadiran praktikum terjaga dengan baik."
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Rencana studi (KRS) mahasiswa ini telah diverifikasi dan disetujui secara resmi
                      oleh Dosen Pembimbing Akademik.
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => setKrsModalStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                {krsModalStudent.krsStatus === 'Menunggu Persetujuan' && (
                  <button
                    onClick={handleApproveKrs}
                    disabled={isApproving}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Memproses Validasi...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Setujui & Sahkan KRS</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CATATAN KONSULTASI & BIMBINGAN */}
        {consultModalStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-[#D4A017]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">
                      Log Konsultasi Bimbingan Akademik
                    </h3>
                    <p className="text-xs text-blue-100">
                      {consultModalStudent.fullName} &bull; NIM {consultModalStudent.nim}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConsultModalStudent(null)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Form Input Konsultasi Baru */}
                <form
                  onSubmit={handleAddConsultation}
                  className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Tambah Catatan Bimbingan Baru</span>
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Topik Bimbingan / Konsultasi
                    </label>
                    <input
                      type="text"
                      required
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Contoh: Evaluasi Nilai Semester & Pemilihan Mata Kuliah Pilihan"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Catatan, Saran, atau Arahan Dosen Pembimbing
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Tuliskan arahan hasil konsultasi..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingConsult}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSavingConsult ? (
                        <>
                          <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Simpan Catatan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Riwayat Konsultasi Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Riwayat Konsultasi Sebelumnya ({consultModalStudent.consultations?.length || 0})
                  </h4>
                  {(!consultModalStudent.consultations ||
                    consultModalStudent.consultations.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                      Belum ada riwayat catatan konsultasi untuk mahasiswa ini.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {consultModalStudent.consultations.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                            <span className="font-bold text-[#1E3A8A] text-xs">{item.topic}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {item.date}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                            {item.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setConsultModalStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: DETAIL PROFIL & SKRIPSI MAHASISWA */}
        {detailModalStudent && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold text-base flex items-center justify-center border-2 border-white/40">
                    {detailModalStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base">{detailModalStudent.fullName}</h3>
                    <p className="text-xs text-blue-100 font-mono">NIM: {detailModalStudent.nim}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalStudent(null)}
                  className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Academic Highlights */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Program Studi
                    </span>
                    <strong className="text-slate-800">{detailModalStudent.studyProgramName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Fakultas
                    </span>
                    <strong className="text-slate-800">{detailModalStudent.facultyName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Semester Aktif
                    </span>
                    <strong className="text-slate-800">
                      Semester {detailModalStudent.currentSemester} (Angkatan{' '}
                      {detailModalStudent.angkatan})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Indeks Prestasi Kumulatif
                    </span>
                    <strong className="text-[#1E3A8A] text-sm">
                      {detailModalStudent.ipk.toFixed(2)} / 4.00
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Total SKS Lulus
                    </span>
                    <strong className="text-slate-800">
                      {detailModalStudent.totalSksLulus} SKS
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Beban Semester Ini
                    </span>
                    <strong className="text-emerald-700">
                      {detailModalStudent.sksSemesterIni} SKS
                    </strong>
                  </div>
                </div>

                {/* Thesis / Skripsi Info (if applicable) */}
                {detailModalStudent.skripsiTitle && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider block flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Bimbingan Tugas Akhir / Skripsi</span>
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        Judul Skripsi
                      </span>
                      <p className="font-bold text-slate-900 leading-snug">
                        &quot;{detailModalStudent.skripsiTitle}&quot;
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        Tahapan / Progres
                      </span>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-[#1E3A8A] text-white">
                        {detailModalStudent.skripsiProgress}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Kontak Mahasiswa
                  </span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{detailModalStudent.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{detailModalStudent.phone}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setDetailModalStudent(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl transition-colors cursor-pointer"
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
