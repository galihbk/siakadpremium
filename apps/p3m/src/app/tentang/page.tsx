import type { Metadata } from 'next';
import { FlaskConical, HeartHandshake, Lightbulb } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tentang LP3M | Penelitian & Pengabdian' };

const PILAR = [
  { icon: FlaskConical, title: 'Penelitian', desc: 'Riset dasar dan terapan yang menghasilkan pengetahuan, teknologi, dan publikasi bermutu.' },
  { icon: HeartHandshake, title: 'Pengabdian kepada Masyarakat', desc: 'Penerapan keilmuan untuk menjawab kebutuhan masyarakat, mitra, dan dunia usaha.' },
  { icon: Lightbulb, title: 'Hilirisasi & HAKI', desc: 'Pelindungan kekayaan intelektual atas karya inovasi sivitas akademika.' },
];

export default async function TentangPage() {
  const { error, campus, portalUrl } = await loadSite();
  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Tentang LP3M',
        title: 'Tiga pilar kegiatan',
        description:
          'Sebagai bagian dari Tri Dharma Perguruan Tinggi, LP3M mengoordinasikan penelitian dan pengabdian serta memfasilitasi pelindungan hasil karya.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILAR.map((p) => (
            <div key={p.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <span className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900">{p.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
