'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { Users, GraduationCap, BookOpen, CalendarDays, Award, RefreshCw, AlertCircle } from 'lucide-react';

interface ProdiSummary {
  id: string;
  code: string;
  name: string;
  degreeLevel: string;
  facultyName: string | null;
  accreditation: string;
  status: string;
  headOfProgram: string | null;
  totalStudents: number;
  activeStudents: number;
  studentStatusBreakdown: { status: string; count: number }[];
  totalLecturers: number;
  totalCourses: number;
  activeClasses: number;
}

const STATUS_COLORS: Record<string, string> = {
  Aktif: 'bg-emerald-500',
  Cuti: 'bg-amber-500',
  Lulus: 'bg-blue-500',
  DO: 'bg-rose-500',
  Pindah: 'bg-slate-400',
};

export default function AdminProdiDashboardPage() {
  const [summary, setSummary] = useState<ProdiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    const { user } = getAuthSession();
    const studyProgramId = user?.studyProgramId;
    if (!studyProgramId) {
      setError('Akun ini belum ditautkan ke program studi manapun. Hubungi Super Admin untuk menetapkannya.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/study-programs/${studyProgramId}/summary`);
      if (!res.ok) throw new Error('Gagal memuat ringkasan program studi.');
      const json = await res.json();
      setSummary(json.data || json);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <PortalLayout role="prodi" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Admin Program Studi
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{summary?.name || 'Dashboard Program Studi'}</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              {summary?.facultyName || 'Monitoring data akademik satu program studi'}
            </p>
          </div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1E3A8A] text-xs font-bold rounded-xl shadow-xs hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!error && (
          <>
            {/* Identitas Prodi */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <div>
                  <p className="text-slate-400">Kode Prodi</p>
                  <p className="font-bold text-slate-800">{loading ? '-' : summary?.code}</p>
                </div>
                <div>
                  <p className="text-slate-400">Jenjang</p>
                  <p className="font-bold text-slate-800">{loading ? '-' : summary?.degreeLevel}</p>
                </div>
                <div>
                  <p className="text-slate-400">Akreditasi</p>
                  <p className="font-bold text-slate-800">{loading ? '-' : summary?.accreditation}</p>
                </div>
                <div>
                  <p className="text-slate-400">Ketua Program Studi</p>
                  <p className="font-bold text-slate-800">{loading ? '-' : summary?.headOfProgram || 'Belum ditetapkan'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    {loading ? '-' : summary?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mahasiswa Aktif</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-[#1E3A8A]">{loading ? '-' : summary?.activeStudents ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">dari {summary?.totalStudents ?? 0} total terdaftar</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dosen</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.totalLecturers ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">Dosen tetap & pengajar</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mata Kuliah</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.totalCourses ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">Dalam katalog kurikulum</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kelas Berjalan</span>
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{loading ? '-' : summary?.activeClasses ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">Semester berjalan</p>
              </div>
            </div>

            {/* Status Mahasiswa */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-3.5 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#1E3A8A]" />
                Status Mahasiswa
              </h3>
              {loading ? (
                <p className="text-xs text-slate-400">Memuat...</p>
              ) : (summary?.studentStatusBreakdown?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-400">Belum ada data mahasiswa.</p>
              ) : (
                <>
                  <div className="h-2.5 rounded-full overflow-hidden flex w-full bg-slate-100 mb-3">
                    {summary!.studentStatusBreakdown.map((s) => {
                      const total = summary!.totalStudents || 1;
                      const pct = Math.max(2, (s.count / total) * 100);
                      return (
                        <div
                          key={s.status}
                          className={STATUS_COLORS[s.status] || 'bg-slate-400'}
                          style={{ width: `${pct}%` }}
                          title={`${s.status}: ${s.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {summary!.studentStatusBreakdown.map((s) => (
                      <div key={s.status} className="flex items-center gap-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s.status] || 'bg-slate-400'}`} />
                        <span className="text-slate-600">{s.status}</span>
                        <span className="ml-auto font-bold text-slate-800">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
