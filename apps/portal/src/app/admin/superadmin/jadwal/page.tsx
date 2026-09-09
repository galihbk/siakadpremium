'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  CalendarDays,
  Clock,
  Search,
  Plus,
  ChevronRight,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Building2,
  GraduationCap,
  BookOpen,
  DoorOpen,
  UserCheck,
  Users,
  LayoutGrid,
  List,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';

export interface ScheduleItem {
  id: string;
  courseCode: string;
  courseName: string;
  sks: number;
  className: string;
  day: string;
  startTime: string;
  endTime: string;
  timeSlot: string;
  roomCode: string;
  roomName: string;
  buildingName: string;
  lecturerId: string;
  lecturerNidn: string;
  lecturerName: string;
  studyProgramId: string;
  studyProgramName: string;
  facultyCode: string;
  semester: number;
  academicYear: string;
  quota: number;
  enrolledCount: number;
  status: string;
}

const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function SuperAdminJadwalPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [prodis, setProdis] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'weekly'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [prodiFilter, setProdiFilter] = useState('Semua');
  const [dayFilter, setDayFilter] = useState('Semua');
  const [semesterFilter, setSemesterFilter] = useState('Semua');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    courseId: '',
    courseCode: '',
    courseName: '',
    sks: 3,
    className: '',
    day: 'Senin',
    startTime: '08:00',
    endTime: '10:30',
    roomId: '',
    roomCode: '',
    roomName: '',
    buildingName: '',
    lecturerId: '',
    lecturerNidn: '',
    lecturerName: '',
    studyProgramId: '',
    studyProgramName: '',
    semester: 1,
    quota: 40,
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [schRes, coursesRes, lecRes, roomsRes, prodiRes] = await Promise.all([
        fetch(`${apiBase}/academic/schedules`),
        fetch(`${apiBase}/academic/courses`),
        fetch(`${apiBase}/lecturers`),
        fetch(`${apiBase}/buildings/rooms`),
        fetch(`${apiBase}/study-programs`),
      ]);

      if (schRes.ok) {
        const json = await schRes.json();
        setSchedules(json.data || []);
      }
      if (coursesRes.ok) {
        const json = await coursesRes.json();
        setCourses(json.data || []);
      }
      if (lecRes.ok) {
        const json = await lecRes.json();
        setLecturers(json.data || []);
      }
      if (roomsRes.ok) {
        const json = await roomsRes.json();
        setRooms(json.data || []);
      }
      if (prodiRes.ok) {
        const json = await prodiRes.json();
        setProdis(json.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data jadwal dari server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Schedule
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseName || !formData.className || !formData.lecturerName || !formData.roomName) {
      showToast('Harap lengkapi seluruh data mata kuliah, kelas, dosen, dan ruangan.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menambahkan jadwal');

      showToast(`Jadwal kelas "${formData.className} - ${formData.courseName}" berhasil ditambahkan.`);
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat menambahkan jadwal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Schedule
  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/schedules/${editingSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal memperbarui jadwal');

      showToast(`Jadwal kelas "${formData.className}" berhasil diperbarui.`);
      setEditingSchedule(null);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan saat memperbarui jadwal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Schedule
  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/academic/schedules/${deletingSchedule.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Gagal menghapus jadwal');

      showToast(`Jadwal kelas "${deletingSchedule.className}" berhasil dihapus.`);
      setDeletingSchedule(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus jadwal.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      courseCode: '',
      courseName: '',
      sks: 3,
      className: '',
      day: 'Senin',
      startTime: '08:00',
      endTime: '10:30',
      roomId: '',
      roomCode: '',
      roomName: '',
      buildingName: '',
      lecturerId: '',
      lecturerNidn: '',
      lecturerName: '',
      studyProgramId: prodis[0]?.id || '',
      studyProgramName: prodis[0]?.name || '',
      semester: 1,
      quota: 40,
    });
  };

  const openAddModal = () => {
    resetForm();
    if (courses[0]) {
      setFormData((prev) => ({
        ...prev,
        courseId: courses[0].id,
        courseCode: courses[0].code,
        courseName: courses[0].name,
        sks: courses[0].sks || 3,
        studyProgramId: courses[0].studyProgramId || '',
        studyProgramName: courses[0].studyProgramName || '',
      }));
    }
    if (lecturers[0]) {
      setFormData((prev) => ({
        ...prev,
        lecturerId: lecturers[0].id,
        lecturerNidn: lecturers[0].nidn,
        lecturerName: lecturers[0].fullName,
      }));
    }
    if (rooms[0]) {
      setFormData((prev) => ({
        ...prev,
        roomId: rooms[0].id,
        roomCode: rooms[0].code,
        roomName: rooms[0].name,
        buildingName: rooms[0].buildingName,
      }));
    }
    setIsAddModalOpen(true);
  };

  const openEditModal = (sch: ScheduleItem) => {
    setEditingSchedule(sch);
    setFormData({
      courseId: sch.courseCode,
      courseCode: sch.courseCode,
      courseName: sch.courseName,
      sks: sch.sks,
      className: sch.className,
      day: sch.day,
      startTime: sch.startTime,
      endTime: sch.endTime,
      roomId: sch.roomCode,
      roomCode: sch.roomCode,
      roomName: sch.roomName,
      buildingName: sch.buildingName,
      lecturerId: sch.lecturerId,
      lecturerNidn: sch.lecturerNidn,
      lecturerName: sch.lecturerName,
      studyProgramId: sch.studyProgramId,
      studyProgramName: sch.studyProgramName,
      semester: sch.semester,
      quota: sch.quota,
    });
  };

  // Filtered Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.courseName.toLowerCase().includes(q) ||
        s.courseCode.toLowerCase().includes(q) ||
        s.lecturerName.toLowerCase().includes(q) ||
        s.roomName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q);

      const matchesProdi = prodiFilter === 'Semua' || s.studyProgramName === prodiFilter;
      const matchesDay = dayFilter === 'Semua' || s.day.toLowerCase() === dayFilter.toLowerCase();
      const matchesSemester = semesterFilter === 'Semua' || s.semester.toString() === semesterFilter;

      return matchesSearch && matchesProdi && matchesDay && matchesSemester;
    });
  }, [schedules, searchQuery, prodiFilter, dayFilter, semesterFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalClasses = schedules.length;
    const totalSks = schedules.reduce((acc, s) => acc + s.sks, 0);
    const uniqueRooms = new Set(schedules.map((s) => s.roomCode)).size;
    const uniqueLecturers = new Set(schedules.map((s) => s.lecturerNidn)).size;
    return { totalClasses, totalSks, uniqueRooms, uniqueLecturers };
  }, [schedules]);

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
              <span className="text-emerald-400">Jadwal Kuliah</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <CalendarDays className="w-6 h-6" />
              </span>
              Jadwal Perkuliahan & Praktikum
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Atur pembagian kelas tatap muka, penugasan dosen pengampu, alokasi ruang kelas, dan kuota mahasiswa semester berjalan.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jadwal Kelas</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Jadwal Kelas</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.totalClasses}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Semester Gasal <span className="text-emerald-400 font-medium">2026/2027</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-teal-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total SKS Terjadwal</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.totalSks}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Rata-rata <span className="text-teal-400 font-medium">{(stats.totalSks / (stats.totalClasses || 1)).toFixed(1)} SKS</span> per kelas
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-blue-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ruang Terpakai</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.uniqueRooms}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <DoorOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Ruang kelas teori & lab komputer
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-sm backdrop-blur-sm group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dosen Pengampu</p>
                <h3 className="text-2xl font-bold text-white mt-1.5">{stats.uniqueLecturers}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              Tenaga pendidik aktif bertugas
            </div>
          </div>
        </div>

        {/* Filter & Control Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari mata kuliah, kode, kelas, dosen, atau ruang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Program Studi Filter */}
            <select
              value={prodiFilter}
              onChange={(e) => setProdiFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Program Studi</option>
              {prodis.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Hari Filter */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Hari</option>
              {DAYS_ORDER.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sm) => (
                <option key={sm} value={sm.toString()}>
                  Semester {sm}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'weekly' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Mingguan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-medium">Memuat master jadwal perkuliahan...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
            <CalendarDays className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-semibold text-slate-300">Tidak ada jadwal kuliah ditemukan</h4>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Silakan sesuaikan kata kunci pencarian atau bersihkan filter jadwal yang aktif.
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Hari & Jam</th>
                    <th className="py-3.5 px-4 font-semibold">Mata Kuliah & SKS</th>
                    <th className="py-3.5 px-4 font-semibold">Kelas & Semester</th>
                    <th className="py-3.5 px-4 font-semibold">Dosen Pengampu</th>
                    <th className="py-3.5 px-4 font-semibold">Ruangan</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Peserta</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {filteredSchedules.map((sch) => (
                    <tr key={sch.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {sch.day}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{sch.timeSlot}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-100 group-hover:text-emerald-300 transition-colors">
                          {sch.courseName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-emerald-400/90">{sch.courseCode}</span>
                          <span>&bull;</span>
                          <span>{sch.sks} SKS</span>
                          <span>&bull;</span>
                          <span>{sch.studyProgramName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {sch.className}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">Semester {sch.semester}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-sm font-medium text-slate-200">{sch.lecturerName}</div>
                        <div className="text-xs text-slate-500 font-mono">NIDN: {sch.lecturerNidn}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-sm text-slate-200 font-medium">{sch.roomName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{sch.buildingName}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-semibold text-slate-200">{sch.enrolledCount}</span>
                        <span className="text-slate-500 text-xs"> / {sch.quota}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(sch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Edit Jadwal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingSchedule(sch)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Weekly View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DAYS_ORDER.map((day) => {
              const daySchedules = filteredSchedules.filter((s) => s.day === day);
              return (
                <div
                  key={day}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      {day}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                      {daySchedules.length} Kelas
                    </span>
                  </div>

                  {daySchedules.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-600">
                      Tidak ada jadwal di hari {day}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {daySchedules.map((s) => (
                        <div
                          key={s.id}
                          className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
                                {s.className} &bull; {s.sks} SKS
                              </span>
                              <h4 className="font-semibold text-slate-100 text-sm mt-1 group-hover:text-emerald-300 transition-colors">
                                {s.courseName}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1 text-slate-500 hover:text-blue-400"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingSchedule(s)}
                                className="p-1 text-slate-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{s.timeSlot}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DoorOpen className="w-3 h-3 text-slate-500" />
                              <span>{s.roomName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{s.lecturerName}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL TAMBAH JADWAL */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Jadwal Perkuliahan Baru"
        >
          <form onSubmit={handleCreateSchedule} className="space-y-4">
            {/* Mata Kuliah */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mata Kuliah <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.courseCode}
                onChange={(e) => {
                  const sel = courses.find((c) => c.code === e.target.value);
                  if (sel) {
                    setFormData({
                      ...formData,
                      courseCode: sel.code,
                      courseName: sel.name,
                      sks: sel.sks || 3,
                      studyProgramId: sel.studyProgramId || '',
                      studyProgramName: sel.studyProgramName || '',
                    });
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code} - {c.name} ({c.sks} SKS)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kelas */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Kelas <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TIF-5A, REG-A"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Semester Paket <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sm) => (
                    <option key={sm} value={sm}>
                      Semester {sm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dosen Pengampu */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dosen Pengampu <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.lecturerId}
                onChange={(e) => {
                  const sel = lecturers.find((l) => l.id === e.target.value);
                  if (sel) {
                    setFormData({
                      ...formData,
                      lecturerId: sel.id,
                      lecturerNidn: sel.nidn,
                      lecturerName: sel.fullName,
                    });
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Dosen Pengampu</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} (NIDN: {l.nidn})
                  </option>
                ))}
              </select>
            </div>

            {/* Ruangan */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ruang Kuliah / Laboratorium <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.roomCode}
                onChange={(e) => {
                  const sel = rooms.find((r) => r.code === e.target.value);
                  if (sel) {
                    setFormData({
                      ...formData,
                      roomId: sel.id,
                      roomCode: sel.code,
                      roomName: sel.name,
                      buildingName: sel.buildingName,
                    });
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Ruang Kelas</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.code}>
                    {r.name} ({r.buildingName} - Kapasitas {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Hari & Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hari</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {DAYS_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Kuota */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kapasitas Kuota Mahasiswa
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.quota}
                onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL EDIT JADWAL */}
        <Modal
          isOpen={!!editingSchedule}
          onClose={() => setEditingSchedule(null)}
          title="Edit Jadwal Perkuliahan"
        >
          <form onSubmit={handleUpdateSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nama Kelas</label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hari</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {DAYS_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kapasitas Kuota</label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.quota}
                onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Perbarui Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL HAPUS JADWAL */}
        <Modal
          isOpen={!!deletingSchedule}
          onClose={() => setDeletingSchedule(null)}
          title="Konfirmasi Hapus Jadwal Kuliah"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
              <div className="font-semibold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Peringatan Penghapusan Jadwal
              </div>
              <p>
                Apakah Anda yakin ingin menghapus jadwal perkuliahan{' '}
                <strong>{deletingSchedule?.courseName}</strong> ({deletingSchedule?.className}) pada hari{' '}
                <strong>{deletingSchedule?.day}, {deletingSchedule?.timeSlot}</strong>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSchedule}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Jadwal</span>
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
