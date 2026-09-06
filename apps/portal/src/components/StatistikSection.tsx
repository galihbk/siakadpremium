import { Users, UserCheck, BookOpen, Briefcase } from 'lucide-react';

export function StatistikSection() {
  const stats = [
    {
      angka: '8.500+',
      label: 'Mahasiswa Aktif',
      deskripsi: 'Berasal dari 34 provinsi di seluruh Indonesia dan 12 negara mitra.',
      icon: Users,
    },
    {
      angka: '320+',
      label: 'Dosen & Peneliti',
      deskripsi: 'Lebih dari 70% berpendidikan S3 Doktor dan berpredikat Guru Besar.',
      icon: UserCheck,
    },
    {
      angka: '22',
      label: 'Program Studi Terakreditasi',
      deskripsi: 'Seluruh jenjang Sarjana, Magister, dan Profesi berakreditasi A / Unggul.',
      icon: BookOpen,
    },
    {
      angka: '95%',
      label: 'Lulusan Bekerja & Berkarya',
      deskripsi: 'Terserap industri multinasional, BUMN, dan berwirausaha dalam kurun < 3 bulan.',
      icon: Briefcase,
    },
  ];

  return (
    <section className="py-20 bg-[#1E3A8A] text-white relative overflow-hidden">
      {/* Subtle Pattern / Grid lines without flashy glow */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-[#D4A017] font-bold mb-2">
            Pencapaian Institusi
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Dedikasi Nyata dalam Angka
          </h2>
          <p className="text-blue-200 text-sm sm:text-base leading-relaxed">
            Komitmen berkelanjutan menghadirkan standar mutu pendidikan tinggi terdepan dengan luaran lulusan berdaya saing global.
          </p>
        </div>

        {/* Counter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xs text-center hover:bg-white/10 transition-colors duration-300 flex flex-col items-center justify-between"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-[#D4A017]">
                  <Icon className="w-6 h-6" />
                </div>
                
                <div>
                  <p className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
                    {item.angka}
                  </p>
                  <h3 className="text-base font-bold text-[#D4A017] mb-2">
                    {item.label}
                  </h3>
                  <p className="text-xs text-blue-200/90 leading-relaxed">
                    {item.deskripsi}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
