import type { Metadata } from 'next';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tentang P2M | Penjaminan Mutu' };

const PPEPP = [
  { title: 'Penetapan', desc: 'Menetapkan standar mutu yang harus dicapai di bidang akademik, penelitian, pengabdian, dan tata kelola.' },
  { title: 'Pelaksanaan', desc: 'Seluruh unit menjalankan kegiatan sesuai standar yang telah ditetapkan.' },
  { title: 'Evaluasi', desc: 'Audit Mutu Internal (AMI) menilai kesesuaian pelaksanaan terhadap standar di tiap program studi.' },
  { title: 'Pengendalian', desc: 'Temuan audit ditindaklanjuti dan dipantau sampai tuntas oleh unit terkait.' },
  { title: 'Peningkatan', desc: 'Hasil evaluasi menjadi dasar peningkatan standar pada siklus berikutnya.' },
];

export default async function TentangPage() {
  const { error, campus, portalUrl } = await loadSite();
  return (
    <SiteShell
      campus={campus}
      portalUrl={portalUrl}
      error={!!error}
      heading={{
        eyebrow: 'Tentang P2M',
        title: 'Siklus penjaminan mutu PPEPP',
        description:
          'Penjaminan mutu internal dijalankan sebagai siklus berkelanjutan lima tahap sesuai Permendikbudristek tentang Standar Nasional Pendidikan Tinggi.',
      }}
    >
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PPEPP.map((p, i) => (
            <div key={p.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">{i + 1}</span>
              <h3 className="font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
