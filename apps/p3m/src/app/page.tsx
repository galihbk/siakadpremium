import Link from 'next/link';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  HeartHandshake,
  LogIn,
  Send,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

// Data berasal dari database dan diperbarui tim LP3M lewat portal -- selalu render di server.
export const dynamic = 'force-dynamic';

const PILAR = [
  { href: '/penelitian-pengabdian', icon: FlaskConical, title: 'Penelitian', desc: 'Riset dasar dan terapan yang menghasilkan pengetahuan, teknologi, dan publikasi bermutu.' },
  { href: '/penelitian-pengabdian', icon: HeartHandshake, title: 'Pengabdian kepada Masyarakat', desc: 'Penerapan keilmuan untuk menjawab kebutuhan masyarakat, mitra, dan dunia usaha.' },
  { href: '/haki', icon: Lightbulb, title: 'Hilirisasi & HAKI', desc: 'Pelindungan kekayaan intelektual atas karya inovasi sivitas akademika.' },
];

const ALUR = [
  { title: 'Ajukan di portal', desc: 'Dosen mengisi kegiatan penelitian atau pengabdian beserta laporannya lewat portal.' },
  { title: 'Verifikasi LP3M', desc: 'Tim LP3M memeriksa kelengkapan dan memberi catatan bila perlu diperbaiki.' },
  { title: 'Terverifikasi', desc: 'Kegiatan yang lolos verifikasi tercatat resmi sebagai kinerja Tri Dharma dosen.' },
  { title: 'Tampil di situs', desc: 'Ringkasannya dapat dicari publik di halaman Penelitian & Pengabdian.' },
];

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

export default async function P3mHomePage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;
  const researches = data.researches.slice(0, 6);
  const haki = data.haki.slice(0, 4);
  const documents = [...data.documents].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4);
  const focusAreas = data.focusAreas.slice(0, 12);

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

      {/* Tiga pilar */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Tri Dharma" title="Tiga pilar kegiatan" href="/tentang" linkLabel="Tentang LP3M" />
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {PILAR.map((p) => (
            <Link key={p.title} href={p.href} className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-6 transition">
              <span className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900">{p.title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Penelitian & pengabdian */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Kegiatan" title="Penelitian & pengabdian terbaru" href="/penelitian-pengabdian" linkLabel="Telusuri semua kegiatan" />
        {focusAreas.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {focusAreas.map((f) => (
              <span key={f.name} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A]">
                {f.name} <span className="text-slate-400">· {f.count}</span>
              </span>
            ))}
          </div>
        )}
        <div className="mt-6">
          {researches.length === 0 ? (
            <Empty>Belum ada kegiatan penelitian atau pengabdian yang terverifikasi.</Empty>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researches.map((r) => (
                <Link key={r.id} href="/penelitian-pengabdian" className="group bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${r.type === 'Pengabdian' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#1E3A8A]'}`}>{r.type}</span>
                    <span className="text-[11px] text-slate-400">{r.year}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-3 leading-snug flex-1">{r.title}</h3>
                  <p className="text-xs text-slate-500 mt-3">
                    {r.leader}
                    {r.studyProgram ? ` · ${r.studyProgram}` : r.faculty ? ` · ${r.faculty}` : ''}
                  </p>
                  {r.scheme && <p className="text-[11px] text-slate-400 mt-1">Skema: {r.scheme}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HAKI */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Kekayaan intelektual" title="HAKI tersertifikasi" href="/haki" linkLabel="Lihat semua HAKI" />
        <div className="mt-8">
          {haki.length === 0 ? (
            <Empty>Belum ada karya yang tercatat memperoleh sertifikat HAKI.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {haki.map((h) => (
                <Link key={h.id} href="/haki" className="flex items-start gap-4 bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition">
                  <span className="w-11 h-11 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-900 leading-snug">{h.title}</span>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      {h.type} · {h.inventor} · {h.grantYear}
                    </span>
                    <span className="block font-mono text-[11px] text-slate-400 mt-1">{h.regNumber}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Alur */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Untuk dosen" title="Dari pengajuan sampai tercatat" />
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {ALUR.map((a, i) => (
            <li key={a.title} className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">
                {i === 0 ? <Send className="w-4 h-4" /> : i === 1 ? <ShieldCheck className="w-4 h-4" /> : i === 2 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              <h3 className="font-bold text-slate-900">{a.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{a.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Dokumen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20">
        <SectionHead eyebrow="Dokumen" title="Panduan, regulasi, dan template" href="/dokumen" linkLabel="Semua dokumen" />
        <div className="mt-8">
          {documents.length === 0 ? (
            <Empty>Belum ada dokumen publik.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {documents.map((d) => (
                <Link key={d.id} href="/dokumen" className="flex items-start gap-4 bg-white border border-slate-200 hover:border-[#1E3A8A] hover:shadow-md rounded-2xl p-5 transition">
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

      {/* Ajakan untuk dosen */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl sm:text-2xl font-black">Dosen atau tim LP3M?</h2>
            <p className="text-sm text-blue-100 mt-2 leading-relaxed">
              Masuk ke portal untuk mengajukan kegiatan penelitian dan pengabdian, mengunggah laporan, mencatat HAKI, dan memantau hasil verifikasi.
            </p>
          </div>
          <a href={portalUrl} className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-[#0F172A] bg-[#D4A017] hover:bg-[#C59114] rounded-xl shrink-0">
            <LogIn className="w-4 h-4" /> Login Tim LP3M
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
