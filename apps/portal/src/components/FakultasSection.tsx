import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, GraduationCap } from 'lucide-react';

export function FakultasSection() {
  const fakultasList = [
    {
      nama: 'Fakultas Teknik',
      singkatan: 'FT',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Mengembangkan inovasi rekayasa dan teknologi infrastruktur berkelanjutan untuk kebutuhan peradaban modern.',
      prodi: ['Teknik Mesin', 'Teknik Elektro', 'Teknik Sipil', 'Teknik Industri'],
      jenjang: 'S1 & S2',
    },
    {
      nama: 'Fakultas Ilmu Komputer',
      singkatan: 'FIK',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Pusat keunggulan kecerdasan buatan, keamanan siber, rekayasa perangkat lunak, dan sains data tingkat nasional.',
      prodi: ['Teknik Informatika', 'Sistem Informasi', 'Rekayasa Perangkat Lunak'],
      jenjang: 'S1 & S2',
    },
    {
      nama: 'Fakultas Ekonomi & Bisnis',
      singkatan: 'FEB',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Mencetak pemimpin bisnis, akuntan profesional, serta wirausahawan tangguh berwawasan keberlanjutan dan digital.',
      prodi: ['Manajemen', 'Akuntansi', 'Bisnis Digital'],
      jenjang: 'S1 & Profesi',
    },
    {
      nama: 'Fakultas Hukum',
      singkatan: 'FH',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Menghasilkan ahli hukum berintegritas tinggi dengan keahlian hukum teknologi, korporasi, dan advokasi publik.',
      prodi: ['Ilmu Hukum', 'Hukum Bisnis Internasional'],
      jenjang: 'S1 & Magister',
    },
    {
      nama: 'Fakultas Pertanian & Biosains',
      singkatan: 'FPB',
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Pengembangan teknologi pangan modern, ketahanan agrikultur presisi, dan bioteknologi ramah lingkungan.',
      prodi: ['Agroteknologi', 'Agribisnis', 'Teknologi Pangan'],
      jenjang: 'S1',
    },
    {
      nama: 'Fakultas Sains & Desain',
      singkatan: 'FSD',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=700&q=80',
      deskripsi: 'Memadukan ketajaman sains murni dengan estetika visual digital dan perancangan produk kreatif berkelas dunia.',
      prodi: ['Desain Komunikasi Visual', 'Desain Produk', 'Matematika Komputasi'],
      jenjang: 'S1',
    },
  ];

  return (
    <section id="fakultas" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Pendidikan Berkualitas
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Fakultas & Program Studi
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Pilihan fakultas terkemuka dengan kurikulum mutakhir yang diselaraskan dengan kebutuhan dunia profesional abad ke-21.
            </p>
          </div>

          <Link
            href="#cta"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A8A] hover:text-[#172554] px-4 py-2 rounded-xl border border-slate-200 hover:border-[#1E3A8A] transition-colors w-fit"
          >
            <span>Unduh Brosur Lengkap</span>
            <ArrowUpRight className="w-4 h-4 text-[#D4A017]" />
          </Link>
        </div>

        {/* Grid Card Fakultas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fakultasList.map((fakultas, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <Image
                  src={fakultas.image}
                  alt={`Gedung & Aktivitas ${fakultas.nama}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#1E3A8A] text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-blue-700">
                  {fakultas.singkatan}
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>{fakultas.jenjang}</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#1E3A8A] transition-colors">
                    {fakultas.nama}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {fakultas.deskripsi}
                  </p>
                  
                  {/* List Prodi */}
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Program Studi Utama:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {fakultas.prodi.map((p, i) => (
                        <span
                          key={i}
                          className="inline-block text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200/60"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#1E3A8A]">
                  <span>Lihat Detail Kurikulum</span>
                  <ArrowUpRight className="w-4 h-4 text-[#D4A017] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
