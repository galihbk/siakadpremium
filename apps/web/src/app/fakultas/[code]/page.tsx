import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, CalendarDays, GraduationCap, Users, UserRound } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AccreditationBadge, initialsOf } from '@/components/AccreditationBadge';
import { VisiMisi } from '@/components/VisiMisi';
import { loadFaculties } from '@/lib/faculties';

export const dynamic = 'force-dynamic';

async function find(code: string) {
  const { items } = await loadFaculties();
  return items.find((f) => f.code.toLowerCase() === decodeURIComponent(code).toLowerCase()) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const f = await find(code);
  return { title: f ? `${f.name} | Institut Teknologi Nusantara` : 'Fakultas tidak ditemukan' };
}

export default async function FakultasDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const f = await find(code);
  if (!f) notFound();

  const totalMhs = f.prodi.reduce((n, p) => n + p.studentsCount, 0);
  const totalDosen = f.prodi.reduce((n, p) => n + p.lecturersCount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white">
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]" />
          <span
            aria-hidden
            className="absolute -right-6 -bottom-10 text-[11rem] sm:text-[16rem] leading-none font-black tracking-tighter text-white/[0.05] select-none"
          >
            {f.code}
          </span>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 sm:pb-32">
            <nav className="flex items-center gap-2 text-xs text-blue-200/80 mb-8">
              <Link href="/" className="hover:text-white">Beranda</Link>
              <span>/</span>
              <Link href="/fakultas" className="hover:text-white inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Fakultas
              </Link>
              <span>/</span>
              <span className="text-white font-semibold">{f.code}</span>
            </nav>

            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A017] text-slate-950 text-xs font-extrabold tracking-wide">
              <Building2 className="w-3.5 h-3.5" /> {f.code}
            </span>
            <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-[1.1] max-w-4xl">{f.name}</h1>
            {f.description && <p className="mt-4 max-w-2xl text-sm sm:text-base text-blue-100/90 leading-relaxed">{f.description}</p>}
            {f.accreditation && (
              <div className="mt-5">
                <AccreditationBadge value={f.accreditation} className="!bg-white/10 !text-white !border-white/25" />
              </div>
            )}
          </div>
        </section>

        {/* Statistik melayang di atas batas hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            {[
              { icon: GraduationCap, label: 'Program Studi', value: f.prodi.length.toLocaleString('id-ID') },
              { icon: Users, label: 'Mahasiswa', value: totalMhs.toLocaleString('id-ID') },
              { icon: UserRound, label: 'Dosen', value: totalDosen.toLocaleString('id-ID') },
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
          <section className="bg-white rounded-2xl border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#172554] text-white font-black flex items-center justify-center shrink-0">
                {initialsOf(f.deanName)}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dekan</p>
                <p className={`font-bold leading-snug ${f.deanName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                  {f.deanName ?? 'Belum ditetapkan'}
                </p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-amber-50 text-[#B45309] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lokasi</p>
                <p className="font-bold text-slate-900">{f.building ?? '-'}</p>
              </div>
            </div>
            <div className="p-6 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Berdiri sejak</p>
                <p className="font-bold text-slate-900">{f.establishedYear ?? '-'}</p>
              </div>
            </div>
          </section>

          <VisiMisi vision={f.vision} mission={f.mission} />

          {/* Program studi */}
          <section>
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B45309]">Pilihan studi</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Program Studi</h2>
              </div>
              <span className="text-sm font-semibold text-slate-500">{f.prodi.length} program</span>
            </div>

            {f.prodi.length === 0 ? (
              <p className="text-sm text-slate-400 bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                Belum ada program studi aktif.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {f.prodi.map((p) => (
                  <Link
                    key={p.id}
                    href={`/program-studi/${p.code}`}
                    className="group relative block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-0.5 hover:border-[#1E3A8A]/40 transition-all duration-300"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1E3A8A] to-[#D4A017] opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="p-6 pl-7">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-block text-[11px] font-extrabold px-2.5 py-1 rounded-md bg-[#1E3A8A] text-white">
                            {p.degreeLevel}
                          </span>
                          <h3 className="mt-2.5 text-lg font-extrabold text-slate-900 leading-snug group-hover:text-[#1E3A8A] transition-colors">
                            {p.name}
                          </h3>
                          {p.degreeTitle && <p className="text-xs text-slate-500 mt-0.5">Gelar lulusan {p.degreeTitle}</p>}
                        </div>
                        <AccreditationBadge value={p.accreditation} className="shrink-0" />
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-xl font-black text-slate-900 tabular-nums">{p.studentsCount.toLocaleString('id-ID')}</p>
                          <p className="text-[11px] font-semibold text-slate-500">Mahasiswa</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-4 py-3">
                          <p className="text-xl font-black text-slate-900 tabular-nums">{p.lecturersCount}</p>
                          <p className="text-[11px] font-semibold text-slate-500">Dosen</p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-full bg-blue-50 text-[#1E3A8A] text-[11px] font-black flex items-center justify-center shrink-0">
                            {initialsOf(p.headOfProgram)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ketua Prodi</p>
                            <p className={`text-xs font-semibold truncate ${p.headOfProgram ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                              {p.headOfProgram ?? 'Belum ditetapkan'}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] shrink-0 group-hover:gap-2 transition-all">
                          Lihat detail <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white p-8 sm:p-10">
            <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xl sm:text-2xl font-black">Tertarik bergabung di {f.name}?</p>
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
