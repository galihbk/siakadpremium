'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { UploadCloud, RefreshCw, ChevronRight, CheckCircle2, AlertCircle, BookOpen, Clock, FileCheck2 } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

interface TeachingClassItem {
  id: string;
  courseCode: string;
  courseName: string;
  className: string;
  sks: number;
  day: string;
  timeSlot: string;
}

interface TeachingYear {
  id: string;
  name: string;
  semesterType: string;
  isActive: boolean;
  classCount: number;
}

const semesterLabel = (t: string) => (t === 'ODD' ? 'Gasal' : t === 'EVEN' ? 'Genap' : 'Pendek');

const P2M_STATUS_LABEL: Record<string, string> = {
  BELUM_DIAJUKAN: 'Belum Diajukan',
  DIAJUKAN: 'Menunggu Validasi',
  DISAHKAN: 'Disahkan P2M',
  PERLU_REVISI: 'Perlu Revisi',
};

const P2M_STATUS_STYLE: Record<string, string> = {
  BELUM_DIAJUKAN: 'bg-amber-100 text-amber-700',
  DIAJUKAN: 'bg-blue-100 text-[#1E3A8A]',
  DISAHKAN: 'bg-emerald-100 text-emerald-700',
  PERLU_REVISI: 'bg-rose-100 text-rose-700',
};

export default function LecturerRpsListPage() {
  const [classes, setClasses] = useState<TeachingClassItem[]>([]);
  const [rpsStatus, setRpsStatus] = useState<Record<string, string>>({});
  const [years, setYears] = useState<TeachingYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const apiBase = getApiBaseUrl();

  // Riwayat tahun akademik dosen (default: tahun akademik aktif)
  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch(`${apiBase}/lecturers/academic-years`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list: TeachingYear[] = json.data || [];
          setYears(list);
          setSelectedYearId((list.find((y) => y.isActive) || list[0])?.id || '');
          if (list.length === 0) setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    }
    fetchYears();
  }, []);

  useEffect(() => {
    if (!selectedYearId) return;
    async function fetchClasses() {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBase}/lecturers/schedules?academicYearId=${selectedYearId}`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          const list: TeachingClassItem[] = json.data || [];
          setClasses(list);

          const statuses = await Promise.all(
            list.map(async (c) => {
              try {
                const r = await fetch(`${apiBase}/lecturers/classes/${c.id}/contract`, { headers: authHeaders() });
                if (r.ok) {
                  const j = await r.json();
                  const contract = (j.data || j)?.contract;
                  return [c.id, contract?.p2mStatus || 'BELUM_DIAJUKAN'] as const;
                }
              } catch {}
              return [c.id, 'BELUM_DIAJUKAN'] as const;
            }),
          );
          setRpsStatus(Object.fromEntries(statuses));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClasses();
  }, [selectedYearId]);

  const uploadedCount = classes.filter((c) => rpsStatus[c.id] && rpsStatus[c.id] !== 'BELUM_DIAJUKAN').length;
  const pendingCount = classes.length - uploadedCount;
  const progress = classes.length ? Math.round((uploadedCount / classes.length) * 100) : 0;

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Rencana Pembelajaran Semester</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Susun RPS untuk tiap kelas yang Anda ajar, lalu ajukan untuk divalidasi P2M.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            {years.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tahun Akademik</label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                >
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {semesterLabel(y.semesterType)} {y.name}{y.isActive ? ' (Aktif)' : ''} — {y.classCount} kelas
                    </option>
                  ))}
                </select>
              </div>
            )}
          {classes.length > 0 && (
            <div className="sm:w-56 shrink-0">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                <span>Kelengkapan RPS</span>
                <span>{uploadedCount}/{classes.length} kelas</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] mb-2" />
            <p className="text-sm">Memuat kelas yang Anda ajar...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-center">
            <UploadCloud className="w-10 h-10 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-800">Belum ada kelas yang diampu pada tahun akademik ini</h4>
          </div>
        ) : (
          <>
            {/* Ringkasan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kelas</p>
                  <p className="text-xl font-black text-slate-900 leading-tight">{classes.length}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sudah Diajukan</p>
                  <p className="text-xl font-black text-emerald-700 leading-tight">{uploadedCount}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Belum Diajukan</p>
                  <p className="text-xl font-black text-amber-700 leading-tight">{pendingCount}</p>
                </div>
              </div>
            </div>

            {/* Daftar kelas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((c) => {
                const status = rpsStatus[c.id] || 'BELUM_DIAJUKAN';
                const done = status !== 'BELUM_DIAJUKAN';
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden flex flex-col">
                    <div className={`h-1 ${done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="p-5 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                            {c.className}
                          </span>
                          <span className="text-xs font-mono text-slate-500">{c.courseCode}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${P2M_STATUS_STYLE[status]}`}>
                          {status === 'DISAHKAN' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {P2M_STATUS_LABEL[status]}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.courseName}</h3>
                      <p className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {c.day} &bull; {c.timeSlot} &bull; {c.sks} SKS
                      </p>
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
                      <Link
                        href={`/lecturer/rps/${c.id}`}
                        className={`inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                          done
                            ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-[#1E3A8A] text-white hover:bg-[#172554]'
                        }`}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{done ? 'Lihat / Perbarui RPS' : 'Susun RPS'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
