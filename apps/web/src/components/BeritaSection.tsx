import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight } from 'lucide-react';

export function BeritaSection() {
  const beritaList = [
    {
      kategori: 'Prestasi Mahasiswa',
      tanggal: '3 September 2026',
      judul: 'Tim Robotika ITN Raih Medali Emas di Ajang International Autonomous Robotics Competition 2026',
      ringkasan: 'Mengalahkan 48 universitas dari 14 negara, robot karya mahasiswa FIK & FT ITN berhasil memukau dewan juri dengan efisiensi sistem navigasi cerdas.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80',
    },
    {
      kategori: 'Riset & Inovasi',
      tanggal: '28 Agustus 2026',
      judul: 'Dosen ITN Kembangkan Panel Surya Berbasis Material Organik Ramah Lingkungan untuk Daerah Terpencil',
      ringkasan: 'Riset unggulan yang didanai Kemendikbudristek ini menawarkan solusi efisiensi energi terbarukan dengan biaya produksi 40% lebih terjangkau bagi masyarakat kepulauan.',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=700&q=80',
    },
    {
      kategori: 'Kerja Sama Global',
      tanggal: '20 Agustus 2026',
      judul: 'ITN Resmi Gandeng Konsorsium Industri Jerman untuk Program Magang dan Double Degree S2',
      ringkasan: 'Kesepakatan strategis ini membuka peluang 50 mahasiswa ITN setiap semester untuk mengikuti transfer kredit akademik dan penempatan magang profesional di Stuttgart.',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=80',
    },
  ];

  return (
    <section id="berita" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Kabar Nusantara
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Berita & Informasi Terkini
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Ikuti perkembangan terbaru, pencapaian akademik, riset terobosan, dan aktivitas civitas akademika ITN.
            </p>
          </div>

          <Link
            href="#cta"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#172554] transition-colors"
          >
            <span>Lihat Semua Berita</span>
            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
          </Link>
        </div>

        {/* Grid 3 Berita */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {beritaList.map((berita, idx) => (
            <article
              key={idx}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col group"
            >
              {/* Thumbnail */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                <Image
                  src={berita.image}
                  alt={berita.judul}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E3A8A]/90 backdrop-blur-xs text-white text-xs font-medium px-2.5 py-1 rounded-md">
                  {berita.kategori}
                </div>
              </div>

              {/* Text */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#D4A017]" />
                    <time>{berita.tanggal}</time>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-[#1E3A8A] transition-colors">
                    {berita.judul}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6">
                    {berita.ringkasan}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href="#cta"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3A8A] hover:text-[#D4A017] transition-colors"
                  >
                    <span>Baca Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}
