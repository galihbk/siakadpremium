import type { Metadata } from 'next';
import { ResearchExplorer } from '@/components/ResearchExplorer';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Penelitian & Pengabdian | LP3M' };

export default async function PenelitianPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const maxFocus = Math.max(1, ...data.focusAreas.map((f) => f.count));

  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Penelitian & Pengabdian',
        title: 'Kegiatan yang telah terverifikasi',
        description: 'Hanya kegiatan yang laporannya sudah diverifikasi LP3M yang ditampilkan.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {data.focusAreas.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Sebaran bidang fokus</h3>
            <div className="space-y-3">
              {data.focusAreas.slice(0, 6).map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">{f.name}</span>
                    <span className="text-slate-500">{f.count} kegiatan</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#1E3A8A]" style={{ width: `${(f.count / maxFocus) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <ResearchExplorer items={data.researches} years={data.years} />
      </section>
    </SiteShell>
  );
}
