import Link from 'next/link';
import { ArrowUpRight, GraduationCap, UserRound, Building2 } from 'lucide-react';
import { loadFaculties } from '@/lib/faculties';

/** Fakultas & prodi diambil dari database (menu Fakultas / Program Studi di portal admin). */
export async function FakultasSection() {
  const { items, failed } = await loadFaculties();

  return (
    <section id="fakultas" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Pendidikan Berkualitas
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Fakultas & Program Studi</h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Pilihan fakultas dan program studi dengan kurikulum yang diselaraskan dengan kebutuhan dunia profesional.
            </p>
          </div>

          <Link
            href="/fakultas"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#172554] px-4 py-2 rounded-xl border border-slate-200 hover:border-[#1E3A8A] transition-colors w-fit"
          >
            <span>Lihat Semua Fakultas</span>
            <ArrowUpRight className="w-4 h-4 text-[#D4A017]" />
          </Link>
        </div>

        {items.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl">
            {failed ? 'Data fakultas sementara tidak dapat dimuat.' : 'Belum ada data fakultas.'}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((f) => {
            const levels = Array.from(new Set(f.prodi.map((p) => p.degreeLevel))).join(' & ');
            return (
              <Link
                key={f.id}
                href={`/fakultas/${f.code}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col group"
              >
                <div className="relative h-32 w-full bg-gradient-to-br from-[#1E3A8A] to-[#172554] flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white/25" />
                  <div className="absolute top-3 left-3 bg-white/15 text-white text-xs font-bold px-2.5 py-1 rounded-md border border-white/20">
                    {f.code}
                  </div>
                  {levels && (
                    <div className="absolute top-3 right-3 bg-white/95 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#D4A017]" />
                      <span>{levels}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#1E3A8A] transition-colors">{f.name}</h3>
                    {f.description && <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">{f.description}</p>}
                    <ul className="space-y-1.5 mb-4">
                      {f.prodi.length === 0 && <li className="text-xs text-slate-400">Belum ada program studi aktif.</li>}
                      {f.prodi.slice(0, 5).map((p) => (
                        <li key={p.id} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#D4A017] shrink-0" />
                          <span>{p.name}</span>
                        </li>
                      ))}
                      {f.prodi.length > 5 && <li className="text-xs text-slate-400 pl-3.5">+{f.prodi.length - 5} program studi lainnya</li>}
                    </ul>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <UserRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{f.deanName ? `Dekan: ${f.deanName}` : 'Dekan belum ditetapkan'}</span>
                    </span>
                    <span className="font-bold text-[#1E3A8A] shrink-0">{f.prodi.length} Prodi</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
