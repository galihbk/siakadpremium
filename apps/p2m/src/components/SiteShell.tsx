import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { NAV } from '@/lib/nav';

interface Props {
  campus: { campusName: string; campusShortName: string };
  portalUrl: string;
  error?: boolean;
  /** Judul halaman dalam (tanpa hero beranda). */
  heading?: { eyebrow: string; title: string; description: string };
  children: React.ReactNode;
}

/** Kerangka bersama semua halaman: header, judul halaman, isi, dan footer (tanpa kontak). */
export function SiteShell({ campus, portalUrl, error, heading, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader shortName={campus.campusShortName} campusName={campus.campusName} portalUrl={portalUrl} />

      <main className="flex-1">
        {heading && (
          <section className="bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
              <p className="text-xs font-bold text-[#FDE047] uppercase tracking-wider">{heading.eyebrow}</p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-2">{heading.title}</h1>
              <p className="mt-3 text-blue-100 max-w-2xl leading-relaxed">{heading.description}</p>
            </div>
          </section>
        )}

        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Data mutu sementara tidak dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.</span>
            </div>
          </div>
        )}

        {children}
      </main>

      <footer className="bg-[#0F172A] text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-black">P2M · Penjaminan Mutu</p>
            <p className="text-sm text-slate-400 mt-1">{campus.campusName}</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-slate-400 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} {campus.campusName} — Pusat Penjaminan Mutu
        </div>
      </footer>
    </div>
  );
}
