'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { ExamScheduleView, ExamType, formatExamDate, examsFetch } from '@/lib/exams';
import { CalendarClock, AlertTriangle } from 'lucide-react';

interface LecturerExam extends ExamScheduleView {
  courseCode: string;
  courseName: string;
  className: string;
  studentCount: number;
  roles: ('PENGAMPU' | 'PENGAWAS')[];
}

export default function LecturerUjianPage() {
  const user = getAuthSession().user;
  const [items, setItems] = useState<LecturerExam[]>([]);
  const [yearName, setYearName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'ALL' | ExamType>('ALL');
  const [role, setRole] = useState<'ALL' | 'PENGAMPU' | 'PENGAWAS'>('ALL');

  useEffect(() => {
    examsFetch<{ year: { name: string; code: string }; items: LecturerExam[] }>('/lecturer')
      .then((d) => {
        setItems(d.items);
        setYearName(`${d.year.name} (${d.year.code})`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat jadwal ujian.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => (type === 'ALL' || i.type === type) && (role === 'ALL' || i.roles.includes(role))),
    [items, type, role]
  );

  return (
    <PortalLayout role="lecturer" userName={user?.fullName || 'Dosen'} userIdText="Jadwal Ujian & Pengawasan">
      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Jadwal Ujian &amp; Pengawasan</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Jadwal UTS/UAS kelas yang Anda ampu dan tugas mengawas{yearName ? ` semester ${yearName}` : ''}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'UTS', 'UAS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                type === t ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t === 'ALL' ? 'Semua ujian' : t}
            </button>
          ))}
          <span className="w-px bg-slate-200 mx-1" />
          {(['ALL', 'PENGAMPU', 'PENGAWAS'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                role === r ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {r === 'ALL' ? 'Semua peran' : r === 'PENGAMPU' ? 'Dosen pengampu' : 'Pengawas'}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="py-2.5 px-3">Ujian</th>
                <th className="py-2.5 px-3">Mata Kuliah</th>
                <th className="py-2.5 px-3">Hari / Tanggal</th>
                <th className="py-2.5 px-3">Jam</th>
                <th className="py-2.5 px-3">Ruang</th>
                <th className="py-2.5 px-3 text-center">Peserta</th>
                <th className="py-2.5 px-3">Peran Anda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada jadwal ujian untuk filter ini.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70 align-top">
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        e.type === 'UTS' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-900">{e.courseName}</p>
                    <p className="text-[11px] text-slate-400">
                      {e.courseCode} · Kelas {e.className}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{formatExamDate(e.examDate)}</td>
                  <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                    {e.startTime} - {e.endTime}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{e.roomName || '-'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{e.studentCount}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {e.roles.map((r) => (
                        <span
                          key={r}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            r === 'PENGAMPU'
                              ? 'bg-teal-50 text-teal-700 border-teal-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {r === 'PENGAMPU' ? 'Pengampu' : 'Pengawas'}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalLayout>
  );
}
