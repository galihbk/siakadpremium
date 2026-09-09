'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  Calendar,
  Clock,
  BookOpen,
  DoorOpen,
  Users,
  Award,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  Loader2,
  FileCheck2,
} from 'lucide-react';

export interface TeachingClassItem {
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
  buildingName?: string;
  lecturerName: string;
  lecturerNidn: string;
  enrolledCount: number;
  quota: number;
}

const DAYS = ['Semua Hari', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function LecturerJadwalPage() {
  const [schedules, setSchedules] = useState<TeachingClassItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState('Semua Hari');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) setCurrentUser(user);

    const fetchSchedules = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBase}/academic/schedules`);
        if (res.ok) {
          const json = await res.json();
          const allSchedules: TeachingClassItem[] = json.data || [];
          const lecturerClasses = allSchedules.filter((s) => {
            if (user?.email === 'dosen@itn.ac.id' || !user) {
              return s.lecturerNidn === '0412088501' || s.lecturerName.includes('Bayu');
            }
            return (
              s.lecturerNidn === (user as any)?.nidn ||
              s.lecturerName.toLowerCase().includes((user.fullName || '').toLowerCase())
            );
          });

          setSchedules(lecturerClasses.length > 0 ? lecturerClasses : allSchedules.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const filteredSchedules = useMemo(() => {
    if (selectedDay === 'Semua Hari') return schedules;
    return schedules.filter((s) => s.day.toLowerCase() === selectedDay.toLowerCase());
  }, [schedules, selectedDay]);

  // Statistics
  const stats = useMemo(() => {
    const totalClasses = schedules.length;
    const totalSks = schedules.reduce((acc, s) => acc + (s.sks || 0), 0);
    const totalStudents = schedules.reduce((acc, s) => acc + (s.enrolledCount || 30), 0);
    return { totalClasses, totalSks, totalStudents };
  }, [schedules]);

  // Export iCal (.ics)
  const handleExportIcs = () => {
    let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ITN Siakad Premium//Jadwal Mengajar Dosen//ID\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Jadwal Mengajar Dosen ITN\n`;
    schedules.forEach((item) => {
      ics += `BEGIN:VEVENT\nSUMMARY:${item.courseName} (${item.className})\nDESCRIPTION:Mata Kuliah: ${item.courseName}\\nKelas: ${item.className}\\nSKS: ${item.sks}\\nRuang: ${item.roomName}\nLOCATION:${item.roomName}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });
    ics += `END:VCALENDAR`;

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Jadwal_Mengajar_Dosen_ITN.ics');
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
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/lecturer" className="hover:text-[#1E3A8A] transition-colors">
            Dashboard Dosen
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Perkuliahan</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[#1E3A8A] font-semibold">Jadwal Mengajar</span>
        </div>

        {/* Header Banner (Signature ITN Blue Gradient) */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-md bg-white/10 text-[#D4A017] border border-white/10">
                <Calendar className="w-3.5 h-3.5" />
                <span>Semester Gasal 2026/2027</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Jadwal Aktif</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Jadwal Mengajar Dosen
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Informasi jadwal tatap muka kelas reguler, praktikum laboratorium, dan ruangan mengajar semester berjalan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Ekspor Kalender (.ics)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Kelas Diampu</span>
              <p className="text-2xl font-black text-[#1E3A8A] mt-1">{stats.totalClasses} Kelas</p>
              <p className="text-xs text-slate-500 mt-0.5">Termasuk kelas paralel</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Beban SKS Semester</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalSks} SKS</p>
              <p className="text-xs text-slate-500 mt-0.5">Sesuai standar BKD & Tridharma</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mahasiswa Diajar</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalStudents} Orang</p>
              <p className="text-xs text-slate-500 mt-0.5">Terdaftar aktif di kelas</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Status Nilai Semester</span>
              <p className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" /> Terbuka
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Batas: 28 Februari 2027</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Day Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDay === day
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-subtle'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Class Cards Grid */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-subtle">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mb-3" />
            <p className="text-sm font-medium">Memuat jadwal mengajar dosen...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-center shadow-subtle">
            <Calendar className="w-12 h-12 text-slate-300 mb-3 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Tidak ada jadwal mengajar pada hari {selectedDay}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan pilih hari lainnya untuk meninjau jadwal perkuliahan Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSchedules.map((sch) => (
              <div
                key={sch.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#1E3A8A]/50 transition-all flex flex-col justify-between group shadow-subtle"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          {sch.className}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-500">{sch.courseCode}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-xs font-bold text-slate-600">{sch.sks} SKS</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">
                        {sch.courseName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{sch.studyProgramName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1E3A8A] block">{sch.day}</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">{sch.timeSlot}</span>
                    </div>
                  </div>

                  {/* Room & Students info */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" /> Ruang Kuliah
                      </span>
                      <strong className="text-slate-800 font-bold block">{sch.roomName}</strong>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Mahasiswa Terdaftar
                      </span>
                      <strong className="text-slate-800 font-bold block">
                        {sch.enrolledCount || 35} <span className="text-slate-500 font-normal">/ {sch.quota || 40} Mahasiswa</span>
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> TA 2026/2027 Gasal
                  </span>

                  <Link
                    href={`/lecturer/nilai?classId=${sch.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 text-xs font-bold transition-all shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Input Nilai Kelas</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
