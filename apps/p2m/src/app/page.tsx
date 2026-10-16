import { headers } from 'next/headers';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  LogIn,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { DocumentLibrary } from '@/components/DocumentLibrary';
import { loadCampus, loadLanding } from '@/lib/data';

// Data berasal dari database dan diubah oleh tim P2M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

const fmtDate = (v: string) =>
  new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

const PPEPP = [
  { title: 'Penetapan', desc: 'Menetapkan standar mutu yang harus dicapai di bidang akademik, penelitian, pengabdian, dan tata kelola.' },
  { title: 'Pelaksanaan', desc: 'Seluruh unit menjalankan kegiatan sesuai standar yang telah ditetapkan.' },
  { title: 'Evaluasi', desc: 'Audit Mutu Internal (AMI) menilai kesesuaian pelaksanaan terhadap standar di tiap program studi.' },
  { title: 'Pengendalian', desc: 'Temuan audit ditindaklanjuti dan dipantau sampai tuntas oleh unit terkait.' },
  { title: 'Peningkatan', desc: 'Hasil evaluasi menjadi dasar peningkatan standar pada siklus berikutnya.' },
];

const RESULT_TONE: Record<string, string> = {
  Sesuai: 'bg-emerald-500',
  'Temuan Minor': 'bg-amber-500',
  'Temuan Mayor': 'bg-rose-500',
};

/** Alamat portal diturunkan dari host saat ini: p2m.<domain> -> portal.<domain>. */
async function resolvePortalUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || '').toLowerCase();
  const hostname = host.split(':')[0];
  if (!host || hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3002';
  }
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  const parts = hostname.split('.');
  if (parts[0] === 'p2m' || parts[0] === 'www') parts.shift();
  return `${proto}://portal.${parts.join('.')}/login`;
}

export default async function P2mHomePage() {
  const [{ data, error }, campus, portalUrl] = await Promise.all([loadLanding(), loadCampus(), resolvePortalUrl()]);
  const { stats } = data;
  const resultTotal = data.auditSummary.reduce((n, r) => n + r.count, 0);
  const followUpPct = stats.completedAudits > 0 ? Math.round((stats.followUpDone / stats.completedAudits) * 100) : null;
  const byCategory = data.categories.map((c) => ({ category: c, items: data.standards.filter((s) => s.category === c) }));

  const nav = [
    { href: '#tentang', label: 'Tentang' },
    { href: '#standar', label: 'Standar Mutu' },
    { href: '#audit', label: 'Audit Mutu' },
    { href: '#dokumen', label: 'Dokumen' },
    { href: '#kontak', label: 'Kontak' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-black shrink-0">
              {campus.campusShortName.slice(0, 3)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-slate-900 leading-tight">P2M · Penjaminan Mutu</span>
              <span className="block text-[11px] text-slate-500 truncate">{campus.campusName}</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
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
            Login Tim P2M
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
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
              <a href="#standar" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl">
                Lihat Standar Mutu <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#dokumen" className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white border border-white/30 hover:bg-white/10 rounded-xl">
                <FileText className="w-4 h-4" /> Unduh Dokumen
              </a>
            </div>
          </div>
        </section>

        {error && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
            <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Data mutu sementara tidak dapat dimuat. Silakan muat ulang halaman beberapa saat lagi.</span>
            </div>
          </div>
        )}

        {/* Statistik */}
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

        {/* Tentang */}
        <section id="tentang" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Tentang P2M</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Siklus penjaminan mutu PPEPP</h2>
            <p className="text-slate-600 mt-3 leading-relaxed">
              Penjaminan mutu internal dijalankan sebagai siklus berkelanjutan lima tahap sesuai Permendikbudristek tentang Standar Nasional Pendidikan Tinggi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            {PPEPP.map((p, i) => (
              <div key={p.title} className="relative bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">{i + 1}</span>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Standar mutu */}
        <section id="standar" className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Standar Mutu</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Standar yang berlaku saat ini</h2>
            <p className="text-slate-600 mt-3 max-w-2xl leading-relaxed">
              Daftar standar mutu berstatus aktif beserta indikator dan target capaiannya.
            </p>

            {byCategory.length === 0 ? (
              <p className="mt-8 text-center text-sm text-slate-400 py-12 border border-dashed border-slate-300 rounded-2xl bg-white">
                Belum ada standar mutu yang dipublikasikan.
              </p>
            ) : (
              <div className="mt-8 space-y-8">
                {byCategory.map((g) => (
                  <div key={g.category}>
                    <h3 className="text-sm font-bold text-[#1E3A8A] mb-3 flex items-center gap-2">
                      {g.category}
                      <span className="text-[11px] font-semibold text-slate-400">{g.items.length} standar</span>
                    </h3>
                    <div className="space-y-2">
                      {g.items.map((s) => (
                        <details key={s.id} className="group bg-white border border-slate-200 rounded-xl open:shadow-sm">
                          <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none">
                            <span className="font-mono text-[11px] font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">{s.code}</span>
                            <span className="flex-1 text-sm font-semibold text-slate-900">{s.name}</span>
                            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                          </summary>
                          <div className="px-4 pb-4 pt-1 text-sm text-slate-600 space-y-3 border-t border-slate-100">
                            {s.description && <p className="leading-relaxed mt-3">{s.description}</p>}
                            {(s.indicator || s.targetValue) && (
                              <div className="grid sm:grid-cols-2 gap-3">
                                {s.indicator && (
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase">Indikator</p>
                                    <p className="text-xs mt-1">{s.indicator}</p>
                                  </div>
                                )}
                                {s.targetValue && (
                                  <div className="bg-emerald-50 rounded-lg p-3">
                                    <p className="text-[11px] font-bold text-emerald-700 uppercase">Target</p>
                                    <p className="text-xs mt-1 text-emerald-900 font-semibold">{s.targetValue}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400">Tahun akademik {s.academicYear}</p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Audit */}
        <section id="audit" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Audit Mutu Internal</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Ringkasan hasil &amp; jadwal audit</h2>
          <p className="text-slate-600 mt-3 max-w-2xl leading-relaxed">
            Ringkasan disajikan secara agregat. Rincian temuan per program studi bersifat internal dan hanya diakses tim P2M.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Hasil audit selesai
              </h3>
              {resultTotal === 0 ? (
                <p className="text-sm text-slate-400 mt-6 text-center py-6">Belum ada audit yang selesai.</p>
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
                        <div
                          className={`h-full rounded-full ${RESULT_TONE[r.result] ?? 'bg-slate-400'}`}
                          style={{ width: `${(r.count / resultTotal) * 100}%` }}
                        />
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
              {data.upcomingAudits.length === 0 ? (
                <p className="text-sm text-slate-400 mt-6 text-center py-6">Belum ada jadwal audit mendatang.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {data.upcomingAudits.map((a) => (
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
        <section id="dokumen" className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Dokumen Mutu</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Unduh dokumen publik</h2>
            <p className="text-slate-600 mt-3 mb-8 max-w-2xl leading-relaxed">
              Pedoman, regulasi, template borang, dan instrumen AMI yang dibuka untuk publik.
            </p>
            <DocumentLibrary documents={data.documents} />
          </div>
        </section>
      </main>

      {/* Kontak & footer */}
      <footer id="kontak" className="bg-[#0F172A] text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-white font-black">P2M · Penjaminan Mutu</p>
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
          © {new Date().getFullYear()} {campus.campusName} — Pusat Penjaminan Mutu
        </div>
      </footer>
    </div>
  );
}
