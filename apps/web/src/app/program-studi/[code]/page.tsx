import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, FileCheck2, GraduationCap, UserRound, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AccreditationBadge, initialsOf } from '@/components/AccreditationBadge';
import { VisiMisi } from '@/components/VisiMisi';
import { loadProdi, type PublicCourse } from '@/lib/faculties';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await loadProdi(code);
  return { title: data ? `${data.prodi.name} (${data.prodi.degreeLevel}) | Institut Teknologi Nusantara` : 'Program studi tidak ditemukan' };
}

/** Kelompokkan mata kuliah per kurikulum, lalu per semester. Kurikulum terbaru (nama terurut menurun) tampil pertama. */
function groupByCurriculum(courses: PublicCourse[]) {
  const map = new Map<string, PublicCourse[]>();
  for (const c of courses) {
    const key = c.curriculumName ?? 'Mata Kuliah Umum';
    map.set(key, [...(map.get(key) ?? []), c]);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([name, list]) => {
      const bySemester = new Map<number, PublicCourse[]>();
      for (const c of list) bySemester.set(c.semester, [...(bySemester.get(c.semester) ?? []), c]);
      return {
        name,
        totalSks: list.reduce((n, c) => n + c.sks, 0),
        count: list.length,
        semesters: Array.from(bySemester.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([semester, items]) => ({
            semester,
            sks: items.reduce((n, c) => n + c.sks, 0),
            items: items.sort((x, y) => x.code.localeCompare(y.code)),
          })),
      };
    });
}

export default async function ProgramStudiPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const data = await loadProdi(code);
  if (!data) notFound();
  const { faculty, prodi, courses } = data;
  const curricula = groupByCurriculum(courses);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white">
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]" />
          <span
            aria-hidden
            className="absolute -right-4 -bottom-10 text-[12rem] sm:text-[18rem] leading-none font-black tracking-tighter text-white/[0.05] select-none"
          >
            {prodi.degreeLevel}
          </span>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32">
            <nav className="flex flex-wrap items-center gap-2 text-xs text-blue-200/80 mb-8">
              <Link href="/" className="hover:text-white">Beranda</Link>
              <span>/</span>
              <Link href="/fakultas" className="hover:text-white">Fakultas</Link>
              <span>/</span>
              <Link href={`/fakultas/${faculty.code}`} className="hover:text-white inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {faculty.code}
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">Program Studi</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex px-3 py-1 rounded-full bg-[#D4A017] text-slate-950 text-xs font-extrabold tracking-wide">
                Program {prodi.degreeLevel}
              </span>
              <AccreditationBadge value={prodi.accreditation} className="!bg-white/10 !text-white !border-white/25" />
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] max-w-4xl">{prodi.name}</h1>
            <p className="mt-4 text-sm sm:text-base text-blue-100/90">
              {faculty.name}
              {prodi.degreeTitle ? ` · Gelar lulusan ${prodi.degreeTitle}` : ''}
            </p>
          </div>
        </section>

        {/* Statistik melayang */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: Users, label: 'Mahasiswa', value: prodi.studentsCount.toLocaleString('id-ID') },
              { icon: UserRound, label: 'Dosen', value: prodi.lecturersCount.toLocaleString('id-ID') },
              { icon: BookOpen, label: 'Mata Kuliah', value: courses.length.toLocaleString('id-ID') },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-4 sm:p-6 text-center sm:text-left">
                <span className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] items-center justify-center mb-3">
                  <s.icon className="w-5 h-5" />
                </span>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-[11px] sm:text-sm font-semibold text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-14">
          {/* Info ringkas */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#172554] text-white font-black flex items-center justify-center shrink-0">
                {initialsOf(prodi.headOfProgram)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ketua Program Studi</p>
                <p className={`font-bold leading-snug ${prodi.headOfProgram ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {prodi.headOfProgram ?? 'Belum ditetapkan'}
                </p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lembaga Akreditasi</p>
                <p className="font-bold text-slate-900 break-words">{prodi.accreditationAgency ?? '-'}</p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-amber-50 text-[#B45309] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gelar Lulusan</p>
                <p className="font-bold text-slate-900">{prodi.degreeTitle ?? '-'}</p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kode PDDIKTI</p>
                <p className="font-bold font-mono text-slate-900">{prodi.diktiCode ?? '-'}</p>
              </div>
            </div>
          </section>

          <VisiMisi vision={prodi.vision} mission={prodi.mission} />

          {/* Kurikulum */}
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B45309]">Akademik</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Kurikulum & Mata Kuliah</h2>
            <p className="text-sm text-slate-500 mt-1.5 mb-6">Daftar mata kuliah aktif per kurikulum, dikelompokkan menurut semester.</p>

            {curricula.length === 0 ? (
              <p className="text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                Data kurikulum belum tersedia.
              </p>
            ) : (
              <div className="space-y-4">
                {curricula.map((cur, i) => (
                  <details
                    key={cur.name}
                    open={i === 0}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle open:shadow-md"
                  >
                    <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 leading-snug">{cur.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {cur.count} mata kuliah · {cur.totalSks} SKS
                            {i === 0 && curricula.length > 1 && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">Terbaru</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                    </summary>

                    <div className="border-t border-slate-100 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {cur.semesters.map((sem) => (
                        <div key={sem.semester} className="rounded-xl border border-slate-200 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-sm font-extrabold text-[#1E3A8A]">Semester {sem.semester}</h3>
                            <span className="text-[11px] font-bold text-slate-500">{sem.sks} SKS</span>
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {sem.items.map((c) => (
                              <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 leading-snug">{c.name}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    <span className="font-mono">{c.code}</span> · {c.type}
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-md px-2 py-0.5 shrink-0">{c.sks} SKS</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white p-8 sm:p-10">
            <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xl sm:text-2xl font-black">Tertarik dengan {prodi.name}?</p>
                <p className="text-sm text-blue-200 mt-1.5">Daftarkan diri Anda melalui portal Penerimaan Mahasiswa Baru.</p>
              </div>
              <Link
                href="/#cta"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-sm font-extrabold shadow-lg shadow-black/20 transition-colors"
              >
                Daftar PMB <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
