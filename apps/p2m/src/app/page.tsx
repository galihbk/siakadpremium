import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  LogIn,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';
import { PPEPP } from '@/lib/ppepp';

// Data berasal dari database dan diubah oleh tim P2M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

const RESULT_TONE: Record<string, string> = {
  Sesuai: 'bg-emerald-500',
  'Temuan Minor': 'bg-amber-500',
  'Temuan Mayor': 'bg-rose-500',
};

const fmtDate = (v: string) => new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

function SectionHead({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">{eyebrow}</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline">
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-300 rounded-2xl bg-white">{children}</p>;
}

export default async function P2mHomePage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;
  const followUpPct = stats.completedAudits > 0 ? Math.round((stats.followUpDone / stats.completedAudits) * 100) : null;
  const resultTotal = data.auditSummary.reduce((n, r) => n + r.count, 0);
  const standards = data.standards.slice(0, 6);
  const documents = [...data.documents].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4);
  const upcoming = data.upcomingAudits.slice(0, 4);

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

      {/* Siklus PPEPP */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Cara kerja" title="Siklus penjaminan mutu PPEPP" href="/tentang" linkLabel="Pelajari selengkapnya" />
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
          {PPEPP.map((p, i) => (
            <li key={p.title} className="relative bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">{i + 1}</span>
              <h3 className="font-bold text-slate-900">{p.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Standar mutu */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Standar" title="Standar mutu yang berlaku" href="/standar-mutu" linkLabel="Lihat semua standar" />
        {data.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {data.categories.map((c) => (
              <span key={c} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A]">
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6">
          {standards.length === 0 ? (
            <Empty>Belum ada standar mutu yang dipublikasikan.</Empty>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standards.map((s) => (
                <Link key={s.id} href="/standar-mutu" className="group bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md">{s.code}</span>
                    <span className="text-[11px] text-slate-400 truncate">{s.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-3 leading-snug">{s.name}</h3>
                  {s.targetValue && (
                    <p className="mt-3 text-xs text-emerald-800 bg-emerald-50 rounded-lg px-3 py-2">
                      <span className="font-bold">Target:</span> {s.targetValue}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Audit */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Evaluasi" title="Audit Mutu Internal" href="/audit-mutu" linkLabel="Ringkasan audit" />
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hasil audit selesai
            </h3>
            {resultTotal === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada audit yang selesai.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.auditSummary.map((r) => (
                  <div key={r.result}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700">{r.result}</span>
                      <span className="text-slate-500">
                        {r.count} audit · {Math.round((r.count / resultTotal) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${RESULT_TONE[r.result] ?? 'bg-slate-400'}`} style={{ width: `${(r.count / resultTotal) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {followUpPct !== null && (
                  <p className="text-xs text-slate-500 pt-2 flex items-center gap-2">
                    <RefreshCcw className="w-3.5 h-3.5" /> {stats.followUpDone} dari {stats.completedAudits} audit sudah ditindaklanjuti tuntas.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#1E3A8A]" /> Jadwal audit mendatang
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada jadwal audit mendatang.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{a.studyProgram}</p>
                      {a.faculty && <p className="text-[11px] text-slate-400 truncate">{a.faculty}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-slate-700">{fmtDate(a.auditDate)}</p>
                      <p className="text-[10px] text-slate-400">{a.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Dokumen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Dokumen" title="Dokumen mutu terbaru" href="/dokumen" linkLabel="Semua dokumen" />
        <div className="mt-8">
          {documents.length === 0 ? (
            <Empty>Belum ada dokumen mutu publik.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map((d) => (
                <Link key={d.id} href="/dokumen" className="group flex items-start gap-4 bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition">
                  <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-900 leading-snug">{d.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      {d.category} · {d.fileType}
                      {d.fileSize ? ` · ${d.fileSize}` : ''} · v{d.version}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                      <Download className="w-3 h-3" /> {d.downloadsCount} unduhan
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ajakan untuk tim mutu */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black">Bagian dari tim penjaminan mutu?</h2>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Masuk ke portal untuk mengelola standar mutu, menjadwalkan audit, memantau pengumpulan RPS, dan menindaklanjuti temuan.
            </p>
          </div>
          <a href={portalUrl} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl shrink-0">
            <LogIn className="w-4 h-4" /> Login Tim P2M
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
