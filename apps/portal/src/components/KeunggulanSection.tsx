import { Award, GraduationCap, Microscope, Banknote, Building2, Briefcase, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function KeunggulanSection() {
  const keunggulanList = [
    {
      icon: Award,
      title: 'Akreditasi Unggul',
      desc: 'Institusi dan seluruh program studi terakreditasi Unggul & A oleh BAN-PT serta LAM-PT, memenuhi standar penjaminan mutu mutu nasional & internasional.',
      tag: 'Kualitas Terjamin',
    },
    {
      icon: GraduationCap,
      title: 'Dosen Berpengalaman',
      desc: 'Lebih dari 70% tenaga pengajar bergelar Doktor (S3) lulusan universitas terkemuka dunia dan praktisi senior dari berbagai sektor industri.',
      tag: 'Tenaga Ahli',
    },
    {
      icon: Microscope,
      title: 'Laboratorium Modern',
      desc: 'Fasilitas praktikum berstandar industri dengan pusat riset robotika, komputasi awan, mekatronika, bioteknologi, dan studio multimedia.',
      tag: 'Fasilitas Riset',
    },
    {
      icon: Banknote,
      title: 'Dukungan Beasiswa Luas',
      desc: 'Tersedia beragam program beasiswa prestasi, KIP-Kuliah, beasiswa korporasi BUMN, hingga bantuan riset skripsi dan magang internasional.',
      tag: 'Bebas Biaya',
    },
    {
      icon: Building2,
      title: 'Kerja Sama Industri Luas',
      desc: 'Menjalin kolaborasi strategis dengan lebih dari 150 perusahaan BUMN, multinasional, dan instansi kementerian untuk program magang bersertifikat.',
      tag: '150+ Mitra',
    },
    {
      icon: Briefcase,
      title: 'Lulusan Kompetitif',
      desc: '95% lulusan terserap kerja dalam waktu kurang dari 3 bulan pasca kelulusan dengan gaji awal di atas rata-rata industri nasional.',
      tag: 'Karir Cepat',
    },
  ];

  return (
    <section id="keunggulan" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
            Mengapa Memilih ITN?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Keunggulan Akademik & Lingkungan Kampus
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Menyediakan ekosistem pembelajaran holistik yang menggabungkan penguasaan sains teknologi, soft skills kepemimpinan, dan etika profesi yang kuat.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {keunggulanList.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl p-7 border border-slate-200/90 shadow-subtle hover:shadow-card-hover hover:border-[#1E3A8A]/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-[#1E3A8A] flex items-center justify-center group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-[#1E3A8A] transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-[#1E3A8A] group-hover:text-[#D4A017] transition-colors">
                  <span>Pelajari lebih lanjut</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
