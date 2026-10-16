import { headers } from 'next/headers';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  FileText,
  FlaskConical,
  HeartHandshake,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  Lightbulb,
} from 'lucide-react';
import { DocumentLibrary } from '@/components/DocumentLibrary';
import { ResearchExplorer } from '@/components/ResearchExplorer';
import { loadCampus, loadLanding } from '@/lib/data';

// Data berasal dari database dan diperbarui tim LP3M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

const PILAR = [
  { icon: FlaskConical, title: 'Penelitian', desc: 'Riset dasar dan terapan yang menghasilkan pengetahuan, teknologi, dan publikasi bermutu.' },
  { icon: HeartHandshake, title: 'Pengabdian kepada Masyarakat', desc: 'Penerapan keilmuan untuk menjawab kebutuhan masyarakat, mitra, dan dunia usaha.' },
  { icon: Lightbulb, title: 'Hilirisasi & HAKI', desc: 'Pelindungan kekayaan intelektual atas karya inovasi sivitas akademika.' },
];

/** Alamat portal diturunkan dari host saat ini: p3m.<domain> -> portal.<domain>. */
async function resolvePortalUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || '').toLowerCase();
  const hostname = host.split(':')[0];
  if (!host || hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002';
  }
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  const parts = hostname.split('.');
  if (parts[0] === 'p3m' || parts[0] === 'www') parts.shift();
  return `${proto}://portal.${parts.join('.')}/login`;
}

export default async function P3mHomePage() {
  const [{ data, error }, campus, portalUrl] = await Promise.all([loadLanding(), loadCampus(), resolvePortalUrl()]);
  const { stats } = data;
  const maxFocus = Math.max(1, ...data.focusAreas.map((f) => f.count));

  const nav = [
    { href: '#tentang', label: 'Tentang' },
    { href: '#kegiatan', label: 'Penelitian & Pengabdian' },
    { href: '#haki', label: 'HAKI' },
    { href: '#dokumen', label: 'Dokumen' },
    { href: '#kontak', label: 'Kontak' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-black shrink-0">
              {campus.campusShortName.slice(0, 3)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-slate-900 leading-tight">LP3M · Penelitian & Pengabdian</span>
              <span className="block text-[11px] text-slate-500 truncate">{campus.campusName}</span>
            </span>
          </a>
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1E3A8A] rounded-lg hover:bg-slate-50">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href={portalUrl}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login Tim LP3M
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-[#FDE047] mb-5">
              <FlaskConical className="w-3.5 h-3.5" />
              Lembaga Penelitian, Pengabdian & Penjaminan
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl leading-tight">
              Riset yang berdampak, pengabdian yang bermanfaat.
            </h1>
            <p className="mt-5 text-blue-100 max-w-2xl leading-relaxed">
              LP3M {campus.campusName} mendorong sivitas akademika menghasilkan penelitian, pengabdian kepada masyarakat, dan karya
              inovasi yang terlindungi kekayaan intelektualnya.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#kegiatan" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl">
                Lihat Kegiatan <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#dokumen" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white border border-white/30 hover:bg-white/10 rounded-xl">
                <FileText className="w-4 h-4" /> Unduh Panduan
              </a>
            </div>
          </div>
        </section>

        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Data LP3M sementara tidak dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.</span>
            </div>
          </div>
        )}

        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FlaskConical, label: 'Penelitian', value: stats.penelitian },
              { icon: HeartHandshake, label: 'Pengabdian', value: stats.pengabdian },
              { icon: Award, label: 'HAKI Tersertifikasi', value: stats.haki },
              { icon: FileText, label: 'Dokumen Publik', value: stats.publicDocuments },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
                <s.icon className="w-5 h-5 text-[#1E3A8A] mb-3" />
                <p className="text-2xl sm:text-3xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tentang" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Tentang LP3M</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Tiga pilar kegiatan</h2>
            <p className="text-slate-600 mt-3 leading-relaxed">
              Sebagai bagian dari Tri Dharma Perguruan Tinggi, LP3M mengoordinasikan penelitian dan pengabdian serta memfasilitasi pelindungan hasil karya.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
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

        <section id="kegiatan" className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Penelitian & Pengabdian</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Kegiatan yang telah terverifikasi</h2>
            <p className="text-slate-600 mt-3 mb-8 max-w-2xl leading-relaxed">
              Hanya kegiatan yang laporannya sudah diverifikasi LP3M yang ditampilkan.
            </p>

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
          </div>
        </section>

        <section id="haki" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Kekayaan Intelektual</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">HAKI & Paten tersertifikasi</h2>
          <p className="text-slate-600 mt-3 mb-8 max-w-2xl leading-relaxed">Karya inovasi sivitas akademika yang telah memperoleh sertifikat.</p>

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

        <section id="dokumen" className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Dokumen</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Panduan, regulasi & template</h2>
            <p className="text-slate-600 mt-3 mb-8 max-w-2xl leading-relaxed">
              Panduan penelitian dan pengabdian, regulasi, template proposal, dan instrumen yang dibuka untuk publik.
            </p>
            <DocumentLibrary documents={data.documents} />
          </div>
        </section>
      </main>

      <footer id="kontak" className="bg-[#0F172A] text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-white font-black">LP3M · Penelitian & Pengabdian</p>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{campus.campusName}</p>
          </div>
          <div className="space-y-2.5 text-sm md:col-span-2">
            <p className="text-white font-bold mb-3">Hubungi Kami</p>
            {campus.contactAddress && (
              <p className="flex gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#D4A017]" />
                {campus.contactAddress}
              </p>
            )}
            {campus.contactPhone && (
              <p className="flex gap-2.5">
                <Phone className="w-4 h-4 shrink-0 mt-0.5 text-[#D4A017]" />
                {campus.contactPhone}
              </p>
            )}
            {campus.contactEmail && (
              <p className="flex gap-2.5">
                <Mail className="w-4 h-4 shrink-0 mt-0.5 text-[#D4A017]" />
                {campus.contactEmail}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} {campus.campusName} — Lembaga Penelitian & Pengabdian kepada Masyarakat
        </div>
      </footer>
    </div>
  );
}
