import Link from 'next/link';
import { ArrowRight, Building2, GraduationCap, Users, BookOpen, Award, UserRound } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { loadFaculties } from '@/lib/faculties';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fakultas & Program Studi | Institut Teknologi Nusantara' };

export default async function FakultasPage() {
  const { items, failed } = await loadFaculties();
  const totalProdi = items.reduce((n, f) => n + f.prodi.length, 0);
  const totalMhs = items.reduce((n, f) => n + f.prodi.reduce((m, p) => m + p.studentsCount, 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5" /> Akademik
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Fakultas & Program Studi</h1>
            <p className="mt-3 max-w-2xl text-sm sm:text-base text-blue-100/90 leading-relaxed">
              Jelajahi fakultas dan program studi di Institut Teknologi Nusantara beserta pimpinan, akreditasi, dan jenjang pendidikannya.
            </p>
            {items.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 font-semibold">{items.length} Fakultas</span>
                <span className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 font-semibold">{totalProdi} Program Studi</span>
                <span className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 font-semibold">
                  {totalMhs.toLocaleString('id-ID')} Mahasiswa
                </span>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
          {items.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h2 className="text-base font-bold text-slate-700">
                {failed ? 'Data fakultas sementara tidak dapat dimuat' : 'Belum ada data fakultas'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Silakan kembali beberapa saat lagi.</p>
            </div>
          )}

          {items.map((f) => (
            <section key={f.id} id={f.code.toLowerCase()} className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-md bg-[#1E3A8A] text-white mb-3">{f.code}</span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{f.name}</h2>
                    {f.description && <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">{f.description}</p>}
                  </div>
                  <Link
                    href={`/fakultas/${f.code}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#1E3A8A] px-4 py-2 rounded-xl border border-slate-200 hover:border-[#1E3A8A] transition-colors shrink-0"
                  >
                    Lihat Detail <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                  </Link>
                </div>

                <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 text-sm">
                  {[
                    { icon: UserRound, label: 'Dekan', value: f.deanName ?? 'Belum ditetapkan' },
                    { icon: Award, label: 'Akreditasi', value: f.accreditation ?? '-' },
                    { icon: Building2, label: 'Gedung', value: f.building ?? '-' },
                    { icon: BookOpen, label: 'Berdiri', value: f.establishedYear ? String(f.establishedYear) : '-' },
                  ].map((x) => (
                    <div key={x.label} className="flex items-start gap-2.5">
                      <x.icon className="w-4 h-4 text-[#D4A017] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{x.label}</dt>
                        <dd className="font-semibold text-slate-800 truncate">{x.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="p-6 sm:p-8 bg-slate-50/60">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#D4A017]" /> Program Studi ({f.prodi.length})
                </h3>
                {f.prodi.length === 0 ? (
                  <p className="text-sm text-slate-400">Belum ada program studi aktif.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {f.prodi.map((p) => (
                      <Link
                        key={p.id}
                        href={`/program-studi/${p.code}`}
                        className="bg-white rounded-xl border border-slate-200 p-4 hover:border-[#1E3A8A] hover:shadow-card transition-all group block"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900 leading-snug group-hover:text-[#1E3A8A]">{p.name}</p>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] shrink-0">{p.degreeLevel}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {p.degreeTitle ? `Gelar ${p.degreeTitle} · ` : ''}Akreditasi {p.accreditation}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {p.studentsCount.toLocaleString('id-ID')} mahasiswa · {p.lecturersCount} dosen
                        </p>
                        {p.headOfProgram && <p className="text-xs text-slate-500 mt-1">Kaprodi: {p.headOfProgram}</p>}
                        <p className="text-xs font-bold text-[#1E3A8A] mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Lihat Program Studi <ArrowRight className="w-3.5 h-3.5 text-[#D4A017]" />
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
