import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, ChevronDown, FileText, FlaskConical, HeartHandshake, Lightbulb, Scale, Users } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { loadSite } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Tentang LP3M | Penelitian & Pengabdian' };

const PILAR = [
  {
    icon: FlaskConical,
    title: 'Penelitian',
    desc: 'Riset dasar dan terapan yang menghasilkan pengetahuan, teknologi, dan publikasi bermutu.',
    points: ['Pendaftaran dan verifikasi kegiatan penelitian dosen', 'Pencatatan skema, bidang fokus, tahun, dan luaran', 'Pelaporan hasil sebagai bagian kinerja dosen'],
  },
  {
    icon: HeartHandshake,
    title: 'Pengabdian kepada Masyarakat',
    desc: 'Penerapan keilmuan untuk menjawab kebutuhan masyarakat, mitra, dan dunia usaha.',
    points: ['Pencatatan kegiatan, mitra sasaran, dan target luaran', 'Keterlibatan dosen dan mahasiswa', 'Pelaporan dan verifikasi hasil kegiatan'],
  },
  {
    icon: Lightbulb,
    title: 'Hilirisasi & HAKI',
    desc: 'Pelindungan kekayaan intelektual atas karya inovasi sivitas akademika.',
    points: ['Pencatatan karya yang telah bersertifikat', 'Rujukan nomor pendaftaran dan tahun terbit', 'Panduan pengajuan HAKI bagi dosen'],
  },
];

const ALUR = [
  ['Pengajuan', 'Dosen mengisi kegiatan beserta laporannya lewat portal.'],
  ['Verifikasi', 'LP3M memeriksa kelengkapan dan memberi catatan perbaikan bila perlu.'],
  ['Pencatatan', 'Kegiatan yang terverifikasi tercatat sebagai kinerja Tri Dharma dosen.'],
  ['Publikasi', 'Ringkasan kegiatan tampil di situs ini dan dapat ditelusuri publik.'],
];

const ROLES = [
  { who: 'Pimpinan kampus', what: 'Menetapkan arah dan kebijakan penelitian serta pengabdian, dan memastikan dukungan sumber dayanya.' },
  { who: 'LP3M', what: 'Mengoordinasikan kegiatan, memverifikasi laporan, mengelola dokumen panduan, dan memfasilitasi pelindungan HAKI.' },
  { who: 'Dosen', what: 'Merencanakan dan melaksanakan penelitian serta pengabdian, lalu melaporkannya tepat waktu.' },
  { who: 'Mahasiswa', what: 'Terlibat sebagai anggota tim dalam kegiatan penelitian dan pengabdian sesuai arahan dosen.' },
];

const FAQ = [
  { q: 'Bagaimana cara mengajukan kegiatan penelitian atau pengabdian?', a: 'Dosen masuk ke portal, membuka menu LP3M, lalu mengisi data kegiatan dan mengunggah laporannya. LP3M akan memverifikasinya.' },
  { q: 'Mengapa kegiatan saya belum tampil di situs?', a: 'Hanya kegiatan yang sudah diverifikasi LP3M yang ditampilkan. Periksa status pengajuan Anda di portal dan perhatikan catatan perbaikan bila ada.' },
  { q: 'Apakah LP3M mengurus pendaftaran HAKI?', a: 'LP3M memfasilitasi dan mencatat karya yang bersertifikat. Rincian prosedur pengajuan tersedia pada dokumen panduan di halaman Dokumen.' },
  { q: 'Di mana saya bisa mengunduh panduan dan template?', a: 'Seluruh dokumen berakses publik tersedia di halaman Dokumen.' },
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
        eyebrow: 'Tentang LP3M',
        title: 'Tiga pilar kegiatan',
        description:
          'Sebagai bagian dari Tri Dharma Perguruan Tinggi, LP3M mengoordinasikan penelitian dan pengabdian serta memfasilitasi pelindungan hasil karya.',
      }}
    >
      {/* Profil */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div>
            <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Profil</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Lembaga Penelitian dan Pengabdian kepada Masyarakat {campus.campusName}</h2>
            <div className="mt-4 space-y-3 text-slate-600 leading-relaxed">
              <p>
                LP3M mendorong dan mengoordinasikan dharma penelitian dan pengabdian kepada masyarakat di {campus.campusName}, agar kegiatan dosen
                terarah, terdokumentasi, dan memberi manfaat nyata bagi masyarakat serta pengembangan keilmuan.
              </p>
              <p>
                Seluruh kegiatan dikelola lewat portal: dosen mengajukan, LP3M memverifikasi, dan hasil yang terverifikasi dapat ditelusuri di
                situs ini. Hasil karya inovasi yang memperoleh sertifikat HAKI juga dicatat dan ditampilkan.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {[
              { icon: FlaskConical, label: 'Penelitian', value: stats.penelitian },
              { icon: HeartHandshake, label: 'Pengabdian', value: stats.pengabdian },
              { icon: Award, label: 'HAKI tersertifikasi', value: stats.haki },
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

      {/* Pilar */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Kegiatan</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Apa yang dikerjakan LP3M</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {PILAR.map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-2xl p-6">
                <span className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{p.desc}</p>
                <ul className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {p.points.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-5 mt-6">
            <Link href="/penelitian-pengabdian" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline">
              Telusuri penelitian & pengabdian <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/haki" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline">
              Lihat HAKI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Alur */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Alur kerja</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Dari pengajuan sampai publikasi</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {ALUR.map(([t, d], i) => (
            <li key={t} className="bg-white border border-slate-200 rounded-2xl p-5">
              <span className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white text-sm font-black flex items-center justify-center mb-3">{i + 1}</span>
              <h3 className="font-bold text-slate-900">{t}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Peran */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
          <p className="text-xs font-bold text-[#B45309] uppercase tracking-wider">Peran</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Siapa berperan apa</h2>
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
        </div>
      </section>

      {/* Dasar hukum */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
        <div className="bg-[#0F172A] text-white rounded-3xl p-8 sm:p-10">
          <p className="text-xs font-bold text-[#FDE047] uppercase tracking-wider flex items-center gap-2">
            <Scale className="w-4 h-4" /> Dasar hukum
          </p>
          <ul className="mt-4 space-y-2 text-sm text-blue-100 leading-relaxed">
            {[
              'Undang-Undang Nomor 12 Tahun 2012 tentang Pendidikan Tinggi.',
              'Undang-Undang Nomor 11 Tahun 2019 tentang Sistem Nasional Ilmu Pengetahuan dan Teknologi.',
              'Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta.',
              'Undang-Undang Nomor 13 Tahun 2016 tentang Paten.',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <BookOpen className="w-4 h-4 mt-0.5 shrink-0 text-[#FDE047]" />
                {t}
              </li>
            ))}
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
        <div className="mt-6">
          <Link href="/dokumen" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E3A8A] hover:underline">
            <FileText className="w-4 h-4" /> Unduh panduan dan template
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
