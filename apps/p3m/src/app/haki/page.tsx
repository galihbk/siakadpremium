import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'HAKI & Paten | LP3M' };

export default async function HakiPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Kekayaan Intelektual',
        title: 'HAKI & Paten tersertifikasi',
        description: 'Karya inovasi sivitas akademika yang telah memperoleh sertifikat.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        {data.haki.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl">
            Belum ada HAKI yang dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.haki.map((h) => (
              <article key={h.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-[#B45309]">
                    <ScrollText className="w-3 h-3" /> {h.type}
                  </span>
                  <span className="text-[11px] text-slate-400">{h.grantYear}</span>
                </div>
                <h3 className="font-bold text-slate-900 leading-snug">{h.title}</h3>
                {h.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{h.description}</p>}
                <p className="text-xs text-slate-500 mt-3">
                  Inventor: {h.inventor} · {h.faculty}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">No. {h.regNumber}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
