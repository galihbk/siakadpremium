'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { UserCheck, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Info } from 'lucide-react';

type AttStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALFA';

interface Meeting {
  meetingNumber: number;
  date: string;
  topic: string | null;
  status: AttStatus | null;
  notes: string | null;
}

interface CourseAttendance {
  courseCode: string;
  courseName: string;
  sks: number;
  className: string;
  lecturerName: string;
  totalMeetings: number;
  recorded: number;
  hadir: number;
  izin: number;
  sakit: number;
  alfa: number;
  percentage: number | null;
  minPercent: number;
  eligible: boolean | null;
  meetings: Meeting[];
}

interface Recap {
  years: { id: string; code: string; name: string; isActive: boolean }[];
  selectedYearId: string | null;
  summary: {
    courses: number;
    totalMeetings: number;
    recorded: number;
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
    percentage: number | null;
    belowMinimum: number;
    minPercent: number;
  } | null;
  courses: CourseAttendance[];
}

const STATUS_STYLE: Record<AttStatus, { label: string; chip: string }> = {
  HADIR: { label: 'Hadir', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IZIN: { label: 'Izin', chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  SAKIT: { label: 'Sakit', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  ALFA: { label: 'Alfa', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

export default function StudentPresensiPage() {
  const user = getAuthSession().user;
  const [data, setData] = useState<Recap | null>(null);
  const [yearId, setYearId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (academicYearId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token } = getAuthSession();
      const qs = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '';
      const res = await fetch(`${getApiBaseUrl()}/students/attendance${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => null);
      const body = json?.data ?? json;
      if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
      setData(body as Recap);
      if (body?.selectedYearId) setYearId(body.selectedYearId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data presensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary;
  const barTone = (p: number | null, min: number) =>
    p === null ? 'bg-slate-300' : p >= min ? 'bg-emerald-500' : p >= min - 10 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <PortalLayout
      role="student"
      userName={user?.fullName || 'Mahasiswa'}
      userIdText={user?.nim ? `NIM: ${user.nim}` : 'Portal Mahasiswa'}
    >
      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Presensi &amp; Kehadiran</h1>
              <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                Rekap kehadiran Anda per mata kuliah dan per pertemuan. Kehadiran minimal{' '}
                <b>{summary?.minPercent ?? 75}%</b> umumnya menjadi syarat mengikuti ujian akhir semester.
              </p>
            </div>
          </div>
        </div>

        {/* Pilih semester */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Semester:</label>
          <select
            value={yearId}
            onChange={(e) => {
              setYearId(e.target.value);
              setOpen(null);
              load(e.target.value);
            }}
            disabled={!data || data.years.length === 0}
            className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 sm:min-w-[300px]"
          >
            {data?.years.length === 0 && <option value="">Belum ada KRS</option>}
            {data?.years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.isActive ? ' -- aktif' : ''}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat...</div>
        ) : (
          data && (
            <>
              {/* Ringkasan */}
              {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kehadiran Total</p>
                    <p className="text-3xl font-black text-[#1E3A8A] mt-1">
                      {summary.percentage !== null ? `${summary.percentage}%` : '-'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{summary.recorded} pertemuan tercatat</p>
                  </div>
                  {(['hadir', 'izin', 'sakit', 'alfa'] as const).map((k) => {
                    const st = STATUS_STYLE[k.toUpperCase() as AttStatus];
                    return (
                      <div key={k} className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{st.label}</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">{summary[k]}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${st.chip}`}>
                          pertemuan
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {summary && summary.belowMinimum > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border bg-rose-50 border-rose-200 text-rose-800 text-[13px]">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>
                    <b>{summary.belowMinimum} mata kuliah</b> kehadirannya di bawah {summary.minPercent}%. Tingkatkan kehadiran agar
                    memenuhi syarat mengikuti ujian.
                  </span>
                </div>
              )}

              {/* Per mata kuliah */}
              {data.courses.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
                  <Info className="w-6 h-6" />
                  Belum ada mata kuliah dengan KRS disetujui pada semester ini.
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.courses.map((c) => {
                    const key = `${c.courseCode}-${c.className}`;
                    const isOpen = open === key;
                    return (
                      <li key={key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => setOpen(isOpen ? null : key)}
                          className="w-full text-left p-5 grid sm:grid-cols-[1fr_auto] gap-4 items-center cursor-pointer hover:bg-slate-50/60"
                        >
                          <div className="min-w-0 space-y-2">
                            <div>
                              <p className="text-[13px] font-bold text-slate-900">{c.courseName}</p>
                              <p className="text-[11px] text-slate-400">
                                {c.courseCode} · Kelas {c.className} · {c.sks} SKS · {c.lecturerName}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                  className={`h-full rounded-full ${barTone(c.percentage, c.minPercent)}`}
                                  style={{ width: `${c.percentage ?? 0}%` }}
                                />
                                <span
                                  className="absolute top-0 bottom-0 w-px bg-slate-400"
                                  style={{ left: `${c.minPercent}%` }}
                                  title={`Batas minimal ${c.minPercent}%`}
                                />
                              </div>
                              <span className="text-sm font-black text-slate-900 w-14 text-right">
                                {c.percentage !== null ? `${c.percentage}%` : '-'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Hadir {c.hadir} · Izin {c.izin} · Sakit {c.sakit} · Alfa {c.alfa} · {c.recorded}/{c.totalMeetings}{' '}
                              pertemuan tercatat
                            </p>
                          </div>
                          <div className="flex items-center gap-3 justify-between sm:justify-end">
                            {c.eligible === null ? (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-md border bg-slate-100 text-slate-500 border-slate-200">
                                Belum ada data
                              </span>
                            ) : c.eligible ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Memenuhi syarat ujian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border bg-rose-50 text-rose-700 border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5" /> Di bawah {c.minPercent}%
                              </span>
                            )}
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 overflow-x-auto">
                            {c.meetings.length === 0 ? (
                              <p className="p-5 text-[13px] text-slate-400">Belum ada pertemuan yang dicatat dosen.</p>
                            ) : (
                              <table className="w-full min-w-[560px] text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500">
                                  <tr>
                                    <th className="py-2.5 px-4 w-20">Pertemuan</th>
                                    <th className="py-2.5 px-4">Tanggal</th>
                                    <th className="py-2.5 px-4">Materi</th>
                                    <th className="py-2.5 px-4">Status</th>
                                    <th className="py-2.5 px-4">Keterangan</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {c.meetings.map((m) => (
                                    <tr key={m.meetingNumber}>
                                      <td className="py-2.5 px-4 font-mono text-slate-500">{m.meetingNumber}</td>
                                      <td className="py-2.5 px-4 text-slate-700">{fmtDate(m.date)}</td>
                                      <td className="py-2.5 px-4 text-slate-600">{m.topic || '-'}</td>
                                      <td className="py-2.5 px-4">
                                        {m.status ? (
                                          <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${STATUS_STYLE[m.status].chip}`}
                                          >
                                            {STATUS_STYLE[m.status].label}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">Belum dicatat</span>
                                        )}
                                      </td>
                                      <td className="py-2.5 px-4 text-slate-500">{m.notes || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )
        )}
      </div>
    </PortalLayout>
  );
}
