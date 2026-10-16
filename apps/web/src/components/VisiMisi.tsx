import { Quote, Target } from 'lucide-react';

/** Visi & misi dari database (diisi Super Admin). Misi: satu poin per baris. Tidak tampil jika keduanya kosong. */
export function VisiMisi({ vision, mission }: { vision: string | null; mission: string | null }) {
  const points = (mission ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
  const hasVision = Boolean(vision?.trim());
  if (!hasVision && points.length === 0) return null;

  return (
    <section className={`grid grid-cols-1 gap-6 ${hasVision && points.length > 0 ? 'lg:grid-cols-5' : ''}`}>
      {hasVision && (
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#0F172A] text-white p-8 sm:p-10 shadow-lg ${
            points.length > 0 ? 'lg:col-span-2' : ''
          }`}
        >
          <Quote className="absolute -top-2 -right-2 w-32 h-32 text-white/[0.06] rotate-12" />
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FDE047]">
              <span className="w-6 h-px bg-[#FDE047]" /> Visi
            </span>
            <p className="mt-5 text-xl sm:text-2xl font-bold leading-snug whitespace-pre-line">{vision!.trim()}</p>
            <p className="mt-6 text-xs text-blue-200/80">Pandangan jauh ke depan yang menjadi arah seluruh kegiatan.</p>
          </div>
        </div>
      )}

      {points.length > 0 && (
        <div className={`rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-subtle ${hasVision ? 'lg:col-span-3' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </span>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-[#B45309]">Misi</span>
              <span className="block text-sm text-slate-500">Langkah mewujudkan visi</span>
            </div>
          </div>
          <ol className="relative space-y-5">
            {points.length > 1 && <span className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-200" aria-hidden />}
            {points.map((m, i) => (
              <li key={i} className="relative flex gap-4">
                <span className="relative z-10 w-8 h-8 rounded-full bg-[#1E3A8A] text-white text-sm font-bold flex items-center justify-center shrink-0 ring-4 ring-white">
                  {i + 1}
                </span>
                <p className="text-slate-700 leading-relaxed pt-1">{m}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
