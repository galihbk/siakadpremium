import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Standar Mutu | P2M' };

export default async function StandarMutuPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const byCategory = data.categories.map((c) => ({ category: c, items: data.standards.filter((s) => s.category === c) }));

  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Standar Mutu',
        title: 'Standar yang berlaku saat ini',
        description: 'Daftar standar mutu berstatus aktif beserta indikator dan target capaiannya.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {byCategory.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl bg-white">
            Belum ada standar mutu yang dipublikasikan.
          </p>
        ) : (
          <div className="space-y-8">
            {byCategory.map((g) => (
              <div key={g.category}>
                <h3 className="text-sm font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                  {g.category}
                  <span className="text-[11px] font-semibold text-slate-400">{g.items.length} standar</span>
                </h3>
                <div className="space-y-2">
                  {g.items.map((s) => (
                    <details key={s.id} className="group bg-white border border-slate-200 rounded-xl open:shadow-sm">
                      <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none">
                        <span className="font-mono text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">{s.code}</span>
                        <span className="flex-1 text-sm font-semibold text-slate-900">{s.name}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                      </summary>
                      <div className="px-4 pb-4 pt-1 text-sm text-slate-600 space-y-3 border-t border-slate-100">
                        {s.description && <p className="leading-relaxed mt-3">{s.description}</p>}
                        {(s.indicator || s.targetValue) && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            {s.indicator && (
                              <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-[11px] font-bold text-slate-400 uppercase">Indikator</p>
                                <p className="text-xs mt-1">{s.indicator}</p>
                              </div>
                            )}
                            {s.targetValue && (
                              <div className="bg-emerald-50 rounded-lg p-3">
                                <p className="text-[11px] font-bold text-emerald-700 uppercase">Target</p>
                                <p className="text-xs mt-1 text-emerald-900 font-semibold">{s.targetValue}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400">Tahun akademik {s.academicYear}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
