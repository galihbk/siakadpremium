import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Building,
  CheckCircle2,
  Compass,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'Profil Institusi - Institut Teknologi Nusantara (ITN)',
  description:
    'Sejarah, Visi, Misi, Pimpinan, dan Nilai-Nilai Dasar Institut Teknologi Nusantara (ITN). Menjadi Perguruan Tinggi Berstandar Dunia yang Berbudaya dan Berdaya Saing Global.',
};

export default function ProfilPage() {
  const leadership = [
    {
      name: 'Prof. Dr. Ir. H. Muhammad Arif, M.Sc., IPU.',
      role: 'Rektor Institut Teknologi Nusantara',
      bidang: 'Guru Besar Teknik Sistem Energi & Komputasi Lanjut',
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      pendidikan: 'S3 Imperial College London • S2 TU Delft • S1 ITB',
    },
    {
      name: 'Dr. Anita Rahmawati, S.T., M.T.',
      role: 'Wakil Rektor I (Bidang Akademik & Riset)',
      bidang: 'Pengembangan Kurikulum OBE & Inovasi Pembelajaran Digital',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      pendidikan: 'S3 Universitas Indonesia • S2 ITB • S1 UGM',
    },
    {
      name: 'Dr. Hendra Saputra, S.E., M.Ak., Ak., CA.',
      role: 'Wakil Rektor II (Bidang Keuangan & SDM)',
      bidang: 'Tata Kelola Keuangan Modern & Transformasi SDM Berkelanjutan',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      pendidikan: 'S3 Universitas Gadjah Mada • S2 UI • S1 Undip',
    },
    {
      name: 'Dr. Bayu Wicaksono, S.Kom., M.Kom.',
      role: 'Wakil Rektor III (Kemahasiswaan & Kerjasama)',
      bidang: 'Pengembangan Karir, Kewirausahaan & Kemitraan Internasional',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      pendidikan: 'S3 Nanyang Technological Univ. • S2 ITS • S1 ITN',
    },
  ];

  const values = [
    {
      title: 'Integritas Luhur',
      desc: 'Menjunjung tinggi kejujuran moral, etika akademik yang kokoh, dan tanggung jawab profesional dalam setiap karya.',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-[#1E3A8A]',
    },
    {
      title: 'Keunggulan Akademik',
      desc: 'Berkomitmen menghasilkan riset dan pembelajaran berkualitas internasional yang relevan dengan kebutuhan industri masa depan.',
      icon: Award,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'Inovasi Berdampak',
      desc: 'Mendorong daya cipta solutif yang memecahkan problematika nyata masyarakat, bangsa, dan peradaban global.',
      icon: Lightbulb,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Kepedulian Sosial',
      desc: 'Berjiwa kerakyatan, membumi, dan berkomitmen melayani masyarakat melalui hilirisasi keilmuan serta beasiswa merata.',
      icon: HeartHandshake,
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  const milestones = [
    {
      year: '1988',
      title: 'Pendirian Akademi Teknologi',
      desc: 'Dirintis oleh tokoh cendekiawan nasional dengan 3 program studi keteknikan awal guna mencetak insinyur unggul tanah air.',
    },
    {
      year: '2004',
      title: 'Transformasi Menjadi Institut',
      desc: 'Meningkatkan status kelembagaan menjadi Institut Teknologi Nusantara dengan peresmian 4 Fakultas utama dan kampus terpadu.',
    },
    {
      year: '2016',
      title: 'Akreditasi Institusi "A" & Pusat Riset',
      desc: 'Meraih predikat Akreditasi Unggul dari BAN-PT serta mendirikan Pusat Kolaborasi Riset Energi Terbarukan & AI.',
    },
    {
      year: '2026',
      title: 'Era Kampus Digital Berstandar Global',
      desc: 'Implementasi menyeluruh SIAKAD Premium enterprise, kurikulum Outcome-Based Education (OBE), dan jejaring 45 mitra universitas dunia.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Header Hero Section */}
        <section className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold uppercase tracking-wider mb-4">
                <Building className="w-3.5 h-3.5" />
                <span>Tentang Kami</span>
              </span>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Profil Institut Teknologi Nusantara
              </h1>

              <p className="mt-4 text-sm sm:text-base text-blue-100/90 leading-relaxed">
                Membangun generasi cerdas berkarakter, berdaya saing global, dan berakar pada
                nilai-nilai kebudayaan luhur bangsa sejak 1988.
              </p>

              <div className="mt-4">
                <Link
                  href="/profil/edit"
                  className="inline-block text-sm px-3 py-2 bg-[#1E3A8A] text-white rounded-md"
                >
                  Edit Profil
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Facts Strip */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="pt-3 md:pt-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">Unggul (A)</p>
                <p className="text-xs text-slate-500 mt-0.5">Akreditasi BAN-PT</p>
              </div>
              <div className="pt-3 md:pt-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">24 Program</p>
                <p className="text-xs text-slate-500 mt-0.5">Studi Sarjana & Pascasarjana</p>
              </div>
              <div className="pt-3 md:pt-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">8.500+</p>
                <p className="text-xs text-slate-500 mt-0.5">Mahasiswa Aktif</p>
              </div>
              <div className="pt-3 md:pt-0">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1E3A8A]">38.000+</p>
                <p className="text-xs text-slate-500 mt-0.5">Alumni Berkarir Global</p>
              </div>
            </div>
          </div>
        </section>

        {/* Visi & Misi Section */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Visi Card */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center mb-6">
                  <Compass className="w-6 h-6 text-[#1E3A8A]" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                  Pandangan Jauh ke Depan
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">
                  Visi Institusi 2035
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base italic">
                  &ldquo;Menjadi perguruan tinggi riset berbasis teknologi terkemuka di tingkat Asia
                  yang unggul, berbudaya, berintegritas tinggi, dan berperan aktif memajukan
                  kesejahteraan bangsa pada tahun 2035.&rdquo;
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">
                  Tersertifikasi ISO 9001:2015 & IABEE Engineering
                </span>
              </div>
            </div>

            {/* Misi Card */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-card">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D4A017] flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-[#D4A017]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
                Pilar Pelaksanaan Tridharma
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1 mb-4">
                Misi Utama Kampus
              </h2>
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Menyelenggarakan pendidikan tinggi bertaraf internasional yang memadukan
                    keunggulan sains terapan, teknologi modern, dan etika kemanusiaan.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Mengembangkan riset inovatif multidisiplin yang terpublikasi bereputasi dan
                    menghasilkan produk paten bernilai industri.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Melaksanakan pengabdian kepada masyarakat berbasis teknologi tepat guna untuk
                    mengentaskan persoalan riil bangsa.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1E3A8A] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <span>
                    Mewujudkan tata kelola perguruan tinggi modern (*Good University Governance*)
                    yang transparan, akuntabel, dan berbasis digital.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Nilai-Nilai Dasar */}
        <section className="bg-white py-16 sm:py-20 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                Budaya & Karakter
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Nilai-Nilai Dasar Institut
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Empat fondasi moral yang menjiwai setiap langkah civitas akademika ITN dalam
                berkarya.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v, idx) => {
                const Icon = v.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:shadow-card transition-shadow"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${v.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{v.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pimpinan Universitas */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A]">
              Kepemimpinan Kampus
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Pimpinan Rektorat ITN
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Dipimpin oleh akademisi dan praktisi berkaliber internasional yang berdedikasi
              memajukan pendidikan tinggi Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((leader, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden flex flex-col"
              >
                <div className="relative h-64 w-full bg-slate-200">
                  <Image
                    src={leader.image}
                    alt={leader.name}
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="inline-block text-[10px] font-bold text-[#D4A017] bg-slate-950/70 px-2 py-0.5 rounded">
                      {leader.role}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{leader.name}</h3>
                    <p className="text-xs text-[#1E3A8A] font-semibold mt-1">{leader.bidang}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    {leader.pendidikan}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sejarah & Milestones */}
        <section className="bg-slate-100/70 py-16 sm:py-20 border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                Napak Tilas Perjalanan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Lintas Sejarah ITN
              </h2>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-8 md:before:left-1/2 before:w-0.5 before:bg-slate-300">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="relative flex flex-col md:flex-row items-start md:items-center gap-6"
                >
                  <div
                    className={`w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pr-10 md:text-right' : 'md:pl-10 md:order-last'}`}
                  >
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-card">
                      <span className="inline-block text-xs font-bold text-[#1E3A8A] bg-blue-50 px-2.5 py-0.5 rounded-md mb-1.5">
                        Tahun {m.year}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>

                  {/* Timeline Badge */}
                  <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#1E3A8A] border-4 border-white text-white flex items-center justify-center shadow-xs">
                    <span className="w-2 h-2 bg-[#D4A017] rounded-full"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
