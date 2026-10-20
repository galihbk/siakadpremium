import Link from 'next/link';
import { ArrowRight, Award, FileText, FlaskConical, HeartHandshake, Info } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

// Data berasal dari database dan diperbarui tim LP3M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

export default async function P3mHomePage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;

  const menus = [
    { href: '/tentang', icon: Info, title: 'Tentang LP3M', desc: 'Tiga pilar kegiatan: penelitian, pengabdian, dan hilirisasi HAKI.' },
    {
      href: '/penelitian-pengabdian',
      icon: FlaskConical,
      title: 'Penelitian & Pengabdian',
      desc: `${stats.penelitian + stats.pengabdian} kegiatan terverifikasi yang dapat dicari dan disaring.`,
    },
    { href: '/haki', icon: Award, title: 'HAKI', desc: `${stats.haki} karya inovasi yang telah memperoleh sertifikat.` },
    { href: '/dokumen', icon: FileText, title: 'Dokumen', desc: `${stats.publicDocuments} panduan, regulasi, dan template yang dapat diunduh.` },
  ];

  return (
    <SiteShell campus={campus} portalUrl={portalUrl} error={!!error}>
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-[#FDE047] mb-5">
            <FlaskConical className="w-3.5 h-3.5" />
            Lembaga Penelitian, Pengabdian &amp; Penjaminan
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            Riset yang berdampak, pengabdian yang bermanfaat.
          </h1>
          <p className="mt-5 text-blue-100 max-w-2xl leading-relaxed">
            LP3M {campus.campusName} mendorong sivitas akademika menghasilkan penelitian, pengabdian kepada masyarakat, dan karya inovasi
            yang terlindungi kekayaan intelektualnya.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/penelitian-pengabdian" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl">
              Lihat Kegiatan <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dokumen" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white border border-white/30 hover:bg-white/10 rounded-xl">
              <FileText className="w-4 h-4" /> Unduh Panduan
            </Link>
          </div>
        </div>
      </section>

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

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Jelajahi</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Informasi LP3M</h2>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="group flex items-start gap-4 bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition"
            >
              <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <m.icon className="w-5 h-5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-slate-900">{m.title}</span>
                <span className="block text-sm text-slate-500 mt-1 leading-relaxed">{m.desc}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1E3A8A] mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
