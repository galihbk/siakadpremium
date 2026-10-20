'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { useInstitution } from '@/lib/useInstitution';
import { getAuthSession, AuthUser } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { downloadAcademicPdf } from '@/lib/academicPdf';
import { Download, Search, ScrollText, Loader2 } from 'lucide-react';

interface NilaiItem {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  nilaiHuruf: string;
  nilaiAngka: number;
  dosen: string;
  keterangan: string;
}

interface SemesterData {
  id: string;
  semesterNumber: number;
  namaSemester: string;
  tahunAkademik: string;
  ips: number | null;
  sksSemester: number;
  sksKumulatif: number;
  ipkKumulatif: number | null;
  nilaiList: NilaiItem[];
}

export default function TranskripPage() {
  const inst = useInstitution();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<{ id?: string; nim?: string; prodi?: string; faculty?: string; advisor?: string }>({});
  const [semesters, setSemesters] = useState<SemesterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { token, user: u } = getAuthSession();
    if (u) setUser(u);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (u?.id) headers['x-user-id'] = u.id;
    const apiBase = getApiBaseUrl();

    fetch(`${apiBase}/students/khs`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        const list = (j?.data ?? j)?.semesters;
        setSemesters(Array.isArray(list) ? list : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat transkrip.'))
      .finally(() => setLoading(false));

    fetch(`${apiBase}/auth/me`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        const d = raw?.data || raw;
        if (d?.fullName && u) setUser({ ...u, fullName: d.fullName });
        if (d?.student) {
          setProfile({
            id: d.student.id,
            nim: d.student.nim,
            prodi: d.student.studyProgram?.name,
            faculty: d.student.studyProgram?.faculty?.name,
            advisor: d.student.advisorLecturer?.user?.fullName,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  // Semua semester yang sudah punya nilai, urut dari semester pertama
  const sorted = useMemo(
    () => [...semesters].filter((s) => s.nilaiList.length > 0).sort((a, b) => a.semesterNumber - b.semesterNumber),
    [semesters],
  );
  const latest = sorted[sorted.length - 1];
  const totalCourses = sorted.reduce((a, s) => a + s.nilaiList.length, 0);
  const passedCourses = sorted.reduce((a, s) => a + s.nilaiList.filter((n) => n.keterangan === 'LULUS').length, 0);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      sorted
        .map((s) => ({
          ...s,
          rows: q ? s.nilaiList.filter((n) => n.kode.toLowerCase().includes(q) || n.nama.toLowerCase().includes(q)) : s.nilaiList,
        }))
        .filter((s) => s.rows.length > 0),
    [sorted, q],
  );

  const name = user?.fullName || 'Mahasiswa';
  const nim = profile.nim || '-';

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadAcademicPdf({
        kind: 'transcript',
        inst,
        student: {
          name,
          nim,
          prodi: profile.prodi || '-',
          faculty: profile.faculty || inst.campusName,
          advisor: profile.advisor || '-',
          id: profile.id,
        },
        semesters: sorted,
        filename: `Transkrip_Sementara_${nim.replace(/[^a-zA-Z0-9-_]+/g, '_')}.pdf`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat PDF.');
    } finally {
      setBusy(false);
    }
  };

  const tone = (point: number) =>
    point >= 3.5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : point >= 2.5 ? 'bg-blue-50 text-blue-700 border-blue-200' : point >= 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <PortalLayout role="student" userName={name} userIdText={`NIM: ${nim} • ${profile.prodi || ''}`} activeMenuHref="/student/transkrip">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <ScrollText className="w-3.5 h-3.5" /> Transkrip Nilai Sementara
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Transkrip Nilai Sementara</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Seluruh nilai mata kuliah dari semester pertama hingga terakhir, lengkap dengan IPK dan total SKS. Bukan pengganti transkrip resmi yang diterbitkan saat kelulusan.
            </p>
          </div>
          <button
            onClick={download}
            disabled={busy || sorted.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{busy ? 'Membuat PDF...' : 'Unduh Transkrip Sementara (PDF)'}</span>
          </button>
        </div>

        {error && <div className="text-xs p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">{error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'IPK Kumulatif', value: latest?.ipkKumulatif != null ? latest.ipkKumulatif.toFixed(2) : '-', sub: 'dari skala 4,00', color: 'text-[#1E3A8A]' },
            { label: 'Total SKS Ditempuh', value: String(latest?.sksKumulatif ?? 0), sub: 'SKS kumulatif', color: 'text-slate-900' },
            { label: 'Mata Kuliah Lulus', value: `${passedCourses}`, sub: `dari ${totalCourses} mata kuliah`, color: 'text-emerald-700' },
            { label: 'Semester Tercatat', value: String(sorted.length), sub: 'sudah punya nilai', color: 'text-indigo-700' },
          ].map((c) => (
            <div key={c.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</span>
              <p className={`text-2xl sm:text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
              <span className="text-[11px] text-slate-500">{c.sub}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode atau nama mata kuliah..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat transkrip...
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="font-bold text-slate-800">Belum ada nilai yang diterbitkan</p>
            <p className="text-xs text-slate-500 mt-1">Nilai akan muncul di sini setelah divalidasi oleh BAAK.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            Tidak ada mata kuliah yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Mata Kuliah</th>
                    <th className="py-3 px-4 text-center">SKS</th>
                    <th className="py-3 px-4 text-center">Huruf</th>
                    <th className="py-3 px-4 text-center">Mutu</th>
                    <th className="py-3 px-4 text-center">Bobot</th>
                    <th className="py-3 px-4 text-center">Ket.</th>
                  </tr>
                </thead>
                {(() => {
                  let counter = 0;
                  return visible.map((s) => {
                    return (
                      <tbody key={s.id} className="divide-y divide-slate-100">
                        {s.rows.map((n) => {
                          counter += 1;
                          return (
                            <tr key={n.id} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-4 text-center text-slate-400">{counter}</td>
                              <td className="py-2.5 px-4 font-mono text-[#1E3A8A] text-xs">{n.kode}</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-800">{n.nama}</td>
                              <td className="py-2.5 px-4 text-center">{n.sks}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`inline-block min-w-8 px-2 py-0.5 rounded-md border text-xs font-black ${tone(n.nilaiAngka)}`}>{n.nilaiHuruf}</span>
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono text-xs">{n.nilaiAngka.toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-center font-mono text-xs">{(n.sks * n.nilaiAngka).toFixed(2)}</td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.keterangan === 'LULUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {n.keterangan}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    );
                  });
                })()}
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right">TOTAL / IPK</td>
                    <td className="py-3 px-4 text-center text-[#1E3A8A]">{latest?.sksKumulatif ?? 0}</td>
                    <td colSpan={3} className="py-3 px-4 text-center">
                      IPK <span className="text-base font-black text-[#1E3A8A]">{latest?.ipkKumulatif != null ? latest.ipkKumulatif.toFixed(2) : '-'}</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
