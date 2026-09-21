'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  ClipboardCheck,
  RefreshCw,
  Save,
  Check,
  X,
  BarChart3,
} from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if ((user as any)?.lecturerId) headers['x-lecturer-id'] = (user as any).lecturerId;
  return headers;
}

type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA';

interface AttendanceStudent {
  studentId: string;
  nim: string;
  fullName: string;
  status: AttendanceStatus;
  notes: string;
}

interface RecapStudent {
  studentId: string;
  nim: string;
  fullName: string;
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALFA: number;
  percentage: number;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; className: string }[] = [
  { value: 'HADIR', label: 'Hadir', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'IZIN', label: 'Izin', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'SAKIT', label: 'Sakit', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'ALFA', label: 'Alfa', className: 'bg-rose-100 text-rose-700 border-rose-300' },
];

const MEETINGS = Array.from({ length: 16 }, (_, i) => i + 1);

export default function LecturerAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const apiBase = getApiBaseUrl();

  const [meetingNumber, setMeetingNumber] = useState(1);
  const [courseName, setCourseName] = useState('');
  const [className, setClassName] = useState('');
  const [topic, setTopic] = useState('');
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'absensi' | 'rekap'>('absensi');
  const [recap, setRecap] = useState<RecapStudent[]>([]);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [loadingRecap, setLoadingRecap] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAttendance = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/attendance?meeting=${meetingNumber}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setCourseName(data.courseName || '');
        setClassName(data.className || '');
        setTopic(data.topic || '');
        setStudents(data.students || []);
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || 'Gagal memuat data absensi.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classId, meetingNumber]);

  const loadRecap = useCallback(async () => {
    if (!classId) return;
    setLoadingRecap(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/attendance/recap`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setRecap(data.students || []);
        setTotalMeetings(data.totalMeetings || 0);
      }
    } catch {
      // biarkan rekap kosong kalau gagal
    } finally {
      setLoadingRecap(false);
    }
  }, [classId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (activeTab === 'rekap') loadRecap();
  }, [activeTab, loadRecap]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, status } : s)));
  };

  const setNotes = (studentId: string, notes: string) => {
    setStudents((prev) => prev.map((s) => (s.studentId === studentId ? { ...s, notes } : s)));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/attendance`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          meetingNumber,
          topic,
          records: students.map((s) => ({ studentId: s.studentId, status: s.status, notes: s.notes })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.data?.message || json?.message || 'Absensi berhasil disimpan.');
      } else {
        showToast(json?.message || 'Gagal menyimpan absensi.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const summary = students.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        <button
          onClick={() => router.push('/lecturer/absensi')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Kelas
        </button>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            {courseName || 'Absensi Perkuliahan'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">{className}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'absensi' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Input Absensi
          </button>
          <button
            onClick={() => setActiveTab('rekap')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rekap' ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Rekap Kehadiran
          </button>
        </div>

        {activeTab === 'absensi' ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Pertemuan Ke-</label>
                  <select
                    value={meetingNumber}
                    onChange={(e) => setMeetingNumber(Number(e.target.value))}
                    className="text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-semibold min-w-[140px]"
                  >
                    {MEETINGS.map((m) => (
                      <option key={m} value={m}>
                        Pertemuan {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Materi / Topik Pertemuan</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Mis. Pengenalan Konsep Dasar..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                {STATUS_OPTIONS.map((opt) => (
                  <span key={opt.value} className={`px-2.5 py-1 rounded-lg border font-semibold ${opt.className}`}>
                    {opt.label}: {summary[opt.value] || 0}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#1E3A8A]" />
                  <p className="text-xs">Memuat roster mahasiswa...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Belum ada mahasiswa terdaftar (KRS disetujui) di kelas ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">NIM</th>
                        <th className="px-4 py-3 text-left font-semibold">Nama Mahasiswa</th>
                        <th className="px-4 py-3 text-center font-semibold">Status Kehadiran</th>
                        <th className="px-4 py-3 text-left font-semibold">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s) => (
                        <tr key={s.studentId}>
                          <td className="px-4 py-3 font-mono text-slate-500">{s.nim}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{s.fullName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => setStatus(s.studentId, opt.value)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                    s.status === opt.value ? opt.className : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={s.notes}
                              onChange={(e) => setNotes(s.studentId, e.target.value)}
                              placeholder="Opsional..."
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-200"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && students.length > 0 && (
                <div className="p-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Simpan Absensi Pertemuan {meetingNumber}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {loadingRecap ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#1E3A8A]" />
                <p className="text-xs">Memuat rekap kehadiran...</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-100 text-xs text-slate-500">
                  Total pertemuan tercatat: <strong className="text-slate-700">{totalMeetings}</strong>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">NIM</th>
                        <th className="px-4 py-3 text-left font-semibold">Nama Mahasiswa</th>
                        <th className="px-4 py-3 text-center font-semibold">Hadir</th>
                        <th className="px-4 py-3 text-center font-semibold">Izin</th>
                        <th className="px-4 py-3 text-center font-semibold">Sakit</th>
                        <th className="px-4 py-3 text-center font-semibold">Alfa</th>
                        <th className="px-4 py-3 text-center font-semibold">% Kehadiran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recap.map((r) => (
                        <tr key={r.studentId}>
                          <td className="px-4 py-3 font-mono text-slate-500">{r.nim}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{r.fullName}</td>
                          <td className="px-4 py-3 text-center text-emerald-700 font-bold">{r.HADIR}</td>
                          <td className="px-4 py-3 text-center text-blue-700 font-bold">{r.IZIN}</td>
                          <td className="px-4 py-3 text-center text-amber-700 font-bold">{r.SAKIT}</td>
                          <td className="px-4 py-3 text-center text-rose-700 font-bold">{r.ALFA}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                r.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {r.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
