'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { useInstitution } from '@/lib/useInstitution';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { ObeRadar } from '@/components/student/ObeRadar';
import { ObeCourse, useObe } from '@/lib/obe';
import { CheckCircle2, ChevronDown, Download, Info, Loader2, Target, XCircle } from 'lucide-react';

const CATEGORY: Record<string, string> = {
  SIKAP: 'Sikap',
  PENGETAHUAN: 'Pengetahuan',
  KETERAMPILAN_UMUM: 'Keterampilan Umum',
  KETERAMPILAN_KHUSUS: 'Keterampilan Khusus',
};

function StatusBadge({ status, value }: { status: string; value: number | null }) {
  if (value === null) return <span className="text-xs font-semibold text-slate-400">Belum ada nilai</span>;
  const ok = status === 'ACHIEVED';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {ok ? 'Tercapai' : 'Belum tercapai'}
    </span>
  );
}

function CourseCard({ course }: { course: ObeCourse }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {course.code} &bull; {course.name}
          </p>
          <p className="text-xs text-slate-500">
            {course.credits} SKS{course.period ? ` · ${course.period}` : ''}
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100 bg-slate-50/50">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nilai komponen</p>
            <div className="flex flex-wrap gap-2">
              {course.assessments.map((a) => (
                <span key={a.name} className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                  <span className="text-slate-500">{a.name}</span> <strong className="text-slate-900">{a.score ?? '-'}</strong>
                </span>
              ))}
            </div>
          </div>
          {([['Sub-CPMK', course.subCpmk], ['CPMK', course.cpmk], ['CPL', course.cpl]] as const).map(([title, rows]) => (
            <div key={title}>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{title}</p>
              <ul className="space-y-1">
                {rows.map((r) => (
                  <li key={r.code} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-700">
                      <strong>{r.code}</strong> <span className="text-slate-500">{r.description}</span>
                    </span>
                    <span className={`font-bold shrink-0 ${r.achievement === null ? 'text-slate-400' : r.status === 'ACHIEVED' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {r.achievement === null ? '-' : r.achievement.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Profile {
  id?: string;
  name: string;
  nim: string;
  prodi: string;
  faculty: string;
  advisor: string;
}

export default function CapaianObePage() {
  const obe = useObe();
  const inst = useInstitution();
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  // Identitas untuk kop dokumen: sama dengan yang dipakai KHS dan transkrip.
  useEffect(() => {
    const { token } = getAuthSession();
    fetch(`${getApiBaseUrl()}/auth/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const d = raw?.data || raw;
        if (!d?.student) return;
        setProfile({
          id: d.student.id,
          name: d.fullName || 'Mahasiswa',
          nim: d.student.nim,
          prodi: d.student.studyProgram?.name || '-',
          faculty: d.student.studyProgram?.faculty?.name || '-',
          advisor: d.student.advisorLecturer?.user?.fullName || '-',
        });
      })
      .catch(() => undefined);
  }, []);

  const print = async (currentId: string) => {
    if (obe.status !== 'ready') return;
    setPrinting(true);
    setPrintError(null);
    try {
      const { downloadObePdf } = await import('@/lib/academicPdf');
      const who = profile ?? { name: obe.data.student.name, nim: obe.data.student.studentNumber, prodi: obe.data.student.studyProgram, faculty: inst.campusName, advisor: '-' };
      await downloadObePdf({
        inst,
        student: { name: who.name, nim: who.nim, prodi: who.prodi, faculty: who.faculty || inst.campusName, advisor: who.advisor, id: profile?.id },
        data: obe.data,
        curriculumId: currentId,
        filename: `Capaian_CPL_${who.nim.replace(/[^a-zA-Z0-9-_]+/g, '_')}.pdf`,
      });
    } catch (e) {
      setPrintError(e instanceof Error ? e.message : 'Gagal membuat PDF.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <PortalLayout role="student" userName="Mahasiswa" userIdText="Portal Mahasiswa">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
            <Target className="w-3.5 h-3.5" /> Outcome-Based Education
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Capaian Pembelajaran Lulusan (CPL)</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Sejauh mana kemampuan lulusan yang ditetapkan program studi sudah Anda capai, dihitung dari nilai komponen mata kuliah Anda.</p>
        </div>

        {obe.status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat capaian...
          </div>
        )}

        {obe.status === 'off' && <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">Kampus ini belum memakai OBE.</div>}

        {obe.status === 'unavailable' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800 flex gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            {obe.reason === 'NOT_IN_OBE'
              ? 'Data Anda belum tersedia di OBE. Capaian akan tampil setelah data akademik Anda diperbarui di OBE.'
              : 'Capaian OBE sedang tidak dapat dimuat. Silakan coba lagi beberapa saat lagi.'}
          </div>
        )}

        {obe.status === 'ready' && (() => {
          const { data } = obe;
          const current = data.curricula.find((k) => k.id === (curriculumId ?? data.primaryCurriculumId)) ?? data.curricula[0];
          if (!current) {
            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
                Belum ada capaian yang dapat dihitung. Capaian muncul setelah dosen mengisi nilai komponen pada mata kuliah yang memakai RPS OBE.
              </div>
            );
          }
          const measured = current.cpl.filter((c) => c.achievement !== null);
          const courses = data.courses.filter((c) => c.curriculumId === current.id);
          return (
            <>
              {data.curricula.length > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="kurikulum" className="font-semibold text-slate-700">
                    Kurikulum
                  </label>
                  <select id="kurikulum" value={current.id} onChange={(e) => setCurriculumId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm">
                    {data.curricula.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                {printError && <span className="text-sm text-rose-600">{printError}</span>}
                <button
                  type="button"
                  onClick={() => print(current.id)}
                  disabled={printing}
                  className="inline-flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e40af] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
                >
                  {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {printing ? 'Menyiapkan PDF...' : 'Cetak / Unduh PDF'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5">
                  <h2 className="font-bold text-slate-900">Jaring laba-laba CPL</h2>
                  <p className="text-xs text-slate-500 mb-2">
                    {data.student.name} · {data.student.studyProgram} · {current.name}
                  </p>
                  {measured.length >= 3 ? (
                    <ObeRadar axes={current.cpl.map((c) => ({ label: c.code, value: c.achievement }))} target={current.target.value} />
                  ) : (
                    <p className="text-sm text-slate-500 py-6">Jaring laba-laba tampil bila minimal tiga CPL sudah memiliki nilai. Rincian ada di tabel.</p>
                  )}
                  <div className="flex items-center justify-center gap-5 text-xs text-slate-500 mt-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 h-2 rounded-sm bg-[#1E3A8A]/30 border border-[#1E3A8A]" /> Capaian Anda
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-4 border-t-2 border-dashed border-amber-500" /> Target {current.target.value}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5">
                  <h2 className="font-bold text-slate-900 mb-3">Capaian per CPL</h2>
                  <ul className="divide-y divide-slate-100">
                    {current.cpl.map((c) => (
                      <li key={c.code} className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {c.code} <span className="text-xs font-medium text-slate-400">· {CATEGORY[c.category] ?? c.category}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-slate-900">{c.achievement === null ? '-' : c.achievement.toFixed(1)}</p>
                            <StatusBadge status={c.status} value={c.achievement} />
                          </div>
                        </div>
                        {c.courses.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-1.5">Dari: {c.courses.map((x) => `${x.name} (${x.achievement.toFixed(1)})`).join(', ')}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5">
                <h2 className="font-bold text-slate-900 mb-3">Rincian per mata kuliah</h2>
                <div className="space-y-2">
                  {courses.length === 0 ? <p className="text-sm text-slate-500">Belum ada mata kuliah dengan nilai OBE.</p> : courses.map((c) => <CourseCard key={`${c.code}-${c.period}`} course={c} />)}
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Diperbarui {new Date(data.generatedAt).toLocaleString('id-ID')}. Angka dihitung OBE dengan rumus yang sama seperti yang dipakai dosen dan program studi.</p>
            </>
          );
        })()}
      </div>
    </PortalLayout>
  );
}
