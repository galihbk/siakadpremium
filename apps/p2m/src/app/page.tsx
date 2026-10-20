import Link from 'next/link';
import { ArrowRight, ClipboardCheck, FileText, Info, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

// Data berasal dari database dan diubah oleh tim P2M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

export default async function P2mHomePage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;
  const followUpPct = stats.completedAudits > 0 ? Math.round((stats.followUpDone / stats.completedAudits) * 100) : null;

  const menus = [
    { href: '/tentang', icon: Info, title: 'Tentang P2M', desc: 'Siklus penjaminan mutu PPEPP yang dijalankan di kampus.' },
    { href: '/standar-mutu', icon: Target, title: 'Standar Mutu', desc: `${stats.activeStandards} standar aktif beserta indikator dan targetnya.` },
    { href: '/audit-mutu', icon: ClipboardCheck, title: 'Audit Mutu', desc: 'Ringkasan hasil dan jadwal Audit Mutu Internal (AMI).' },
    { href: '/dokumen', icon: FileText, title: 'Dokumen', desc: `${stats.publicDocuments} dokumen mutu publik yang dapat diunduh.` },
  ];

  return (
    <SiteShell campus={campus} portalUrl={portalUrl} error={!!error}>
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-[#FDE047] mb-5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sistem Penjaminan Mutu Internal (SPMI)
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl leading-tight">
            Mutu yang terukur, transparan, dan terus meningkat.
          </h1>
          <p className="mt-5 text-blue-100 max-w-2xl leading-relaxed">
            Pusat Penjaminan Mutu (P2M) {campus.campusName} memastikan seluruh layanan akademik, penelitian, dan tata kelola berjalan sesuai
            standar — lewat penetapan standar, audit mutu internal, dan tindak lanjut yang terdokumentasi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/standar-mutu" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl">
              Lihat Standar Mutu <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dokumen" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white border border-white/30 hover:bg-white/10 rounded-xl">
              <FileText className="w-4 h-4" /> Unduh Dokumen
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Target, label: 'Standar Mutu Aktif', value: stats.activeStandards },
            { icon: ClipboardCheck, label: 'Audit Mutu Selesai', value: stats.completedAudits },
            { icon: TrendingUp, label: 'Tindak Lanjut Tuntas', value: followUpPct === null ? '-' : `${followUpPct}%` },
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
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Informasi penjaminan mutu</h2>
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
