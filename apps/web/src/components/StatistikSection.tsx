import { Users, UserCheck, BookOpen, Building2 } from 'lucide-react';
import { loadPublicStats, fmtCount } from '@/lib/stats';

/** Angka dihitung dari data akademik. Bagian ini tidak tampil bila datanya belum bisa dimuat. */
export async function StatistikSection() {
  const s = await loadPublicStats();
  if (!s) return null;

  const stats = [
    { angka: fmtCount(s.students), label: 'Mahasiswa Aktif', icon: Users },
    { angka: fmtCount(s.lecturers), label: 'Dosen', icon: UserCheck },
    { angka: fmtCount(s.studyPrograms), label: 'Program Studi', icon: BookOpen },
    { angka: fmtCount(s.faculties), label: 'Fakultas', icon: Building2 },
  ].filter((x) => x.angka !== '0');
  if (stats.length === 0) return null;

  return (
    <section className="py-20 bg-[#1E3A8A] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase tracking-widest text-[#D4A017] font-bold mb-2">Kampus dalam Angka</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">Data Terkini Institusi</h2>
          <p className="text-blue-200 text-sm sm:text-base leading-relaxed">Angka berikut dihitung langsung dari data akademik kampus.</p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-8 ${stats.length >= 4 ? 'lg:grid-cols-4' : stats.length === 3 ? 'lg:grid-cols-3' : ''}`}>
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xs text-center hover:bg-white/10 transition-colors duration-300 flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-[#D4A017]">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">{item.angka}</p>
                <h3 className="text-base font-bold text-[#D4A017]">{item.label}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
