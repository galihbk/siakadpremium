import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Scale,
  Target,
  Users,
} from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';
import { PPEPP } from '@/lib/ppepp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tentang P2M | Penjaminan Mutu' };

const SCOPE = [
  { icon: GraduationCap, title: 'Pendidikan', desc: 'Kurikulum, pembelajaran, penilaian, kompetensi lulusan, dosen dan tenaga kependidikan, serta sarana prasarana.' },
  { icon: FlaskConical, title: 'Penelitian', desc: 'Perencanaan, pelaksanaan, dan luaran penelitian dosen serta pemanfaatannya bagi pembelajaran.' },
  { icon: HeartHandshake, title: 'Pengabdian kepada Masyarakat', desc: 'Kegiatan pengabdian yang relevan dengan keilmuan dan kebutuhan masyarakat sekitar.' },
  { icon: Landmark, title: 'Tata Kelola', desc: 'Kepemimpinan, sistem informasi, pembiayaan, dan pengelolaan organisasi yang akuntabel.' },
];

const RESULTS = [
  { label: 'Sesuai', tone: 'bg-emerald-500', text: 'text-emerald-700', desc: 'Pelaksanaan memenuhi standar; tidak ada tindakan korektif.' },
  { label: 'Temuan Minor', tone: 'bg-amber-500', text: 'text-amber-700', desc: 'Ada ketidaksesuaian ringan yang tidak mengganggu mutu secara keseluruhan; diperbaiki dalam batas waktu yang ditetapkan.' },
  { label: 'Temuan Mayor', tone: 'bg-rose-500', text: 'text-rose-700', desc: 'Ketidaksesuaian berdampak pada pencapaian standar; perlu tindakan korektif segera dan dipantau ketat.' },
];

const ROLES = [
  { who: 'Pimpinan kampus', what: 'Menetapkan kebijakan mutu dan memastikan sumber daya untuk pelaksanaannya.' },
  { who: 'P2M', what: 'Menyusun dan memelihara standar, menjadwalkan audit, memantau tindak lanjut, dan mengelola dokumen mutu.' },
  { who: 'Program studi', what: 'Menjalankan standar, menyiapkan bukti pelaksanaan, mengesahkan RPS, dan menindaklanjuti temuan audit.' },
  { who: 'Dosen', what: 'Menyusun RPS tiap mata kuliah dan mengumpulkannya tepat waktu, serta melaksanakan pembelajaran sesuai standar.' },
  { who: 'Auditor internal', what: 'Menilai kesesuaian pelaksanaan terhadap standar secara objektif dan melaporkannya.' },
];

const FAQ = [
  { q: 'Apa itu SPMI?', a: 'Sistem Penjaminan Mutu Internal adalah kegiatan sistemik penjaminan mutu pendidikan tinggi yang dijalankan sendiri oleh perguruan tinggi untuk menetapkan, memenuhi, dan meningkatkan mutunya secara berkelanjutan.' },
  { q: 'Apa bedanya SPMI dengan akreditasi?', a: 'SPMI dijalankan kampus secara internal dan terus-menerus. Akreditasi adalah penilaian eksternal oleh lembaga akreditasi pada waktu tertentu. Data dan bukti dari SPMI menjadi bahan utama saat akreditasi.' },
  { q: 'Siapa yang diaudit dalam AMI?', a: 'Program studi dan unit pendukung. Rincian temuan per unit bersifat internal; situs ini hanya menampilkan ringkasan agregat dan jadwal.' },
  { q: 'Di mana saya bisa mengunduh dokumen mutu?', a: 'Dokumen berakses publik tersedia di halaman Dokumen. Dokumen yang bersifat internal hanya dapat diakses tim terkait lewat portal.' },
];

export default async function TentangPage() {
  const { data, error, campus, portalUrl } = await loadSite();
  const { stats } = data;

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
      {/* Profil */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div>
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Profil</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Pusat Penjaminan Mutu {campus.campusName}</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>
                P2M adalah unit yang bertugas menjalankan Sistem Penjaminan Mutu Internal (SPMI) di {campus.campusName}. Tujuannya memastikan
                bahwa pendidikan, penelitian, pengabdian kepada masyarakat, dan tata kelola berjalan sesuai standar yang kita tetapkan sendiri
                dan terus membaik dari waktu ke waktu.
              </p>
              <p>
                Pekerjaan P2M bertumpu pada tiga hal: standar yang jelas dan terukur, audit yang objektif, serta tindak lanjut yang
                terdokumentasi sampai tuntas. Semuanya dikelola di portal sehingga setiap tahap dapat ditelusuri.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { icon: Target, label: 'Standar mutu aktif', value: stats.activeStandards },
              { icon: ClipboardCheck, label: 'Audit selesai', value: stats.completedAudits },
              { icon: FileText, label: 'Dokumen publik', value: stats.publicDocuments },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4">
                <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PPEPP */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Siklus</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Lima tahap, berputar terus</h2>
          <p className="text-slate-600 mt-3 max-w-2xl">
            Tahap terakhir tidak mengakhiri proses: hasil peningkatan menjadi masukan bagi penetapan standar pada siklus berikutnya.
          </p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
            {PPEPP.map((p, i) => (
              <li key={p.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
                <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">{i + 1}</span>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed flex-1">{p.desc}</p>
                <p className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-bold text-[#1E3A8A]">Keluaran:</span> {p.output}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ruang lingkup */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Ruang lingkup</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Apa saja yang dijaminmutunya</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {SCOPE.map((s) => (
            <div key={s.title} className="bg-white border border-slate-200 rounded-2xl p-5">
              <span className="w-11 h-11 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-3">
                <s.icon className="w-5 h-5" />
              </span>
              <h3 className="font-bold text-slate-900">{s.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/standar-mutu" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline">
            Lihat standar yang berlaku <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Audit */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 grid lg:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Audit Mutu Internal</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Bagaimana audit berjalan</h2>
            <ol className="mt-6 space-y-4">
              {[
                ['Penjadwalan', 'P2M menjadwalkan audit untuk tiap program studi dan unit.'],
                ['Pelaksanaan', 'Auditor memeriksa bukti pelaksanaan terhadap standar yang berlaku.'],
                ['Pelaporan', 'Hasil dicatat sebagai Sesuai, Temuan Minor, atau Temuan Mayor beserta batas waktu tindak lanjut.'],
                ['Tindak lanjut', 'Unit memperbaiki temuan; P2M memantau statusnya sampai selesai.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full border-2 border-[#1E3A8A] text-[#1E3A8A] text-sm font-black flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-bold text-slate-900">{t}</p>
                    <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Hasil audit</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Arti tiap kategori</h2>
            <div className="mt-6 space-y-3">
              {RESULTS.map((r) => (
                <div key={r.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3">
                  <span className={`w-1.5 rounded-full shrink-0 ${r.tone}`} />
                  <div>
                    <p className={`font-bold ${r.text}`}>{r.label}</p>
                    <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/audit-mutu" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline mt-5">
              Ringkasan dan jadwal audit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Peran */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Peran</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Mutu adalah tugas bersama</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {ROLES.map((r) => (
            <div key={r.who} className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5">
              <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-slate-900">{r.who}</p>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{r.what}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dasar hukum */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-16">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-10">
          <p className="text-xs font-bold text-[#FDE047] uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4" /> Dasar hukum
          </p>
          <ul className="mt-4 space-y-2 text-sm text-blue-100 leading-relaxed">
            <li className="flex gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-[#FDE047]" />
              Undang-Undang Nomor 12 Tahun 2012 tentang Pendidikan Tinggi.
            </li>
            <li className="flex gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-[#FDE047]" />
              Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 53 Tahun 2023 tentang Penjaminan Mutu Pendidikan Tinggi.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Pertanyaan umum</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Yang sering ditanyakan</h2>
        <div className="mt-6 space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group bg-white border border-slate-200 rounded-xl open:shadow-sm">
              <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none">
                <span className="flex-1 text-sm font-semibold text-slate-900">{f.q}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p className="px-4 pb-4 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
