'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { FieldGrade, LogbookCounts, fieldFetch } from '@/lib/fieldActivity';
import { LecturerLogbookModal } from '@/components/field/LecturerLogbookModal';
import { AlertTriangle, Briefcase, MapPin, RefreshCw, Search, User, Users } from 'lucide-react';

interface Placement {
  placeName: string | null;
  placeAddress: string | null;
  fieldSupervisorName: string | null;
}
interface GroupMember extends Placement {
  studentId: string;
  nim: string;
  name: string;
  studyProgram: string;
  courseId: string | null;
  logbook: LogbookCounts;
  grade: FieldGrade | null;
}
interface MyStudent extends GroupMember {
  courseName: string;
  title: string | null;
  role: string;
  canGrade: boolean;
}
interface MyCategory {
  id: string;
  name: string;
  isGroup: boolean;
  minLogbook: number;
  groups: { id: string; name: string; notes: string | null; members: GroupMember[] }[];
  students: MyStudent[];
}
interface Overview {
  academicYearId: string;
  academicYearName: string;
  years: { id: string; name: string; isActive: boolean }[];
  total: number;
  categories: MyCategory[];
}

const inputCls = 'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

function WorkChips({ m, onOpen, canGrade }: { m: GroupMember; onOpen: () => void; canGrade: boolean }) {
  if (!m.courseId) return null;
  const waiting = m.logbook.submitted;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
        Logbook disetujui {m.logbook.approved}
        {m.logbook.min > 0 ? `/${m.logbook.min}` : ''}
      </span>
      {waiting > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{waiting} menunggu tanggapan</span>}
      {m.grade && (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] text-[10px] font-bold">
          Nilai {m.grade.score}
          {m.grade.letter ? ` (${m.grade.letter})` : ''}
        </span>
      )}
      <button onClick={onOpen} className="px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer">
        {canGrade ? 'Logbook & nilai' : 'Logbook'}
      </button>
    </div>
  );
}

function Place({ p }: { p: Placement }) {
  if (!p.placeName) return <span className="text-slate-400">Belum ada tempat kegiatan</span>;
  return (
    <span className="inline-flex items-start gap-1 text-slate-600">
      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
      <span>
        {p.placeName}
        {p.fieldSupervisorName ? <span className="text-slate-400"> · Pembimbing lapangan: {p.fieldSupervisorName}</span> : null}
      </span>
    </span>
  );
}

export default function LecturerFieldActivityPage() {
  const user = getAuthSession().user;
  const [data, setData] = useState<Overview | null>(null);
  const [yearId, setYearId] = useState('');
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState<{ m: GroupMember; canGrade: boolean } | null>(null);

  const load = useCallback(async (academicYearId?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fieldFetch<Overview>(`/lecturer${academicYearId ? `?academicYearId=${academicYearId}` : ''}`);
      setData(res);
      setYearId(res.academicYearId);
      setTab((t) => (res.categories.some((c) => c.id === t) ? t : res.categories[0]?.id ?? ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat bimbingan kegiatan lapangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = data?.categories.find((c) => c.id === tab) ?? null;
  const q = search.trim().toLowerCase();
  const groups = useMemo(() => {
    const hit = (m: { name: string; nim: string }) => !q || m.name.toLowerCase().includes(q) || m.nim.includes(q);
    return (active?.groups ?? [])
      .map((g) => ({ ...g, shown: g.members.filter(hit) }))
      .filter((g) => !q || g.shown.length || g.name.toLowerCase().includes(q));
  }, [active, q]);
  const students = (active?.students ?? []).filter((m) => !q || m.name.toLowerCase().includes(q) || m.nim.includes(q));
  const countOf = (c: MyCategory) => c.students.length + c.groups.reduce((n, g) => n + g.members.length, 0);

  return (
    <PortalLayout role="lecturer" userName={user?.fullName || 'Dosen'} userIdText="Bimbingan Kegiatan Lapangan">
      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700/50">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Bimbingan Kegiatan Lapangan</h1>
                <p className="text-xs text-blue-100 mt-1 max-w-xl leading-relaxed">
                  Kelompok dan mahasiswa yang Anda bimbing pada kegiatan lapangan, terpisah dari bimbingan skripsi.
                </p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 min-w-[170px]">
              <p className="text-[10px] font-extrabold uppercase text-slate-300">Mahasiswa Bimbingan</p>
              <p className="text-2xl font-black mt-1">{data?.total ?? 0}</p>
              <p className="text-[10px] text-slate-300 mt-1">TA {data?.academicYearName ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau NIM mahasiswa" className={`${inputCls} w-full pl-9`} />
          </div>
          <select value={yearId} onChange={(e) => load(e.target.value)} className={inputCls} aria-label="Tahun akademik">
            {(data?.years ?? []).map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
                {y.isActive ? ' (aktif)' : ''}
              </option>
            ))}
          </select>
          <button onClick={() => load(yearId || undefined)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer" aria-label="Muat ulang">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {data && data.categories.length > 0 && (
          <>
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-200">
              {data.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTab(c.id)}
                  className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px cursor-pointer ${
                    tab === c.id ? 'border-[#1E3A8A] text-[#1E3A8A]' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {c.name} <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">{countOf(c)}</span>
                </button>
              ))}
            </div>

            {groups.map((g) => (
              <div key={g.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="font-extrabold text-sm text-slate-800">{g.name}</span>
                  <span className="text-xs text-slate-500">· {g.members.length} anggota</span>
                </div>
                {g.notes && <p className="px-5 pt-3 text-xs text-slate-500">{g.notes}</p>}
                <ul className="divide-y divide-slate-100">
                  {g.shown.map((m) => (
                    <li key={m.studentId} className="px-5 py-3 text-xs">
                      <p className="font-bold text-slate-800 text-sm">
                        {m.name} <span className="font-mono font-normal text-slate-500 text-xs">{m.nim}</span>
                      </p>
                      <p className="text-slate-500 mt-0.5">{m.studyProgram}</p>
                      <p className="mt-1">
                        <Place p={m} />
                      </p>
                      <WorkChips m={m} canGrade onOpen={() => setReview({ m, canGrade: true })} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {students.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#1E3A8A]" />
                  <span className="font-extrabold text-sm text-slate-800">Mahasiswa bimbingan individu</span>
                </div>
                <ul className="divide-y divide-slate-100">
                  {students.map((m) => (
                    <li key={m.studentId} className="px-5 py-3 text-xs">
                      <p className="font-bold text-slate-800 text-sm">
                        {m.name} <span className="font-mono font-normal text-slate-500 text-xs">{m.nim}</span>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">{m.role}</span>
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {m.studyProgram} · {m.courseName}
                      </p>
                      {m.title && <p className="text-slate-600 mt-0.5">Judul/topik: {m.title}</p>}
                      <p className="mt-1">
                        <Place p={m} />
                      </p>
                      <WorkChips m={m} canGrade={m.canGrade} onOpen={() => setReview({ m, canGrade: m.canGrade })} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {active && groups.length === 0 && students.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
                {countOf(active) === 0
                  ? `Belum ada kelompok atau mahasiswa ${active.name} yang Anda bimbing pada TA ${data.academicYearName}.`
                  : 'Tidak ada yang cocok dengan pencarian.'}
              </div>
            )}
          </>
        )}
      </div>
      {review && review.m.courseId && data && (
        <LecturerLogbookModal
          student={review.m}
          courseId={review.m.courseId}
          academicYearId={data.academicYearId}
          canGrade={review.canGrade}
          grade={review.m.grade}
          onClose={() => setReview(null)}
          onChanged={() => load(yearId || undefined)}
        />
      )}
    </PortalLayout>
  );
}
