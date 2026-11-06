import Image from 'next/image';
import Link from 'next/link';
import type { PublicStats } from '@/lib/stats';
import { fmtCount } from '@/lib/stats';
import { ArrowRight, Users, Award, BookOpen, CheckCircle, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  campusName?: string;
  stats?: PublicStats | null;
}

export function HeroSection({
  badge = 'Penerimaan Mahasiswa Baru 2027 | Gelombang 1 Dibuka',
  title = 'Membangun Generasi Unggul untuk Masa Depan Indonesia',
  subtitle = 'Berkomitmen menyelenggarakan pendidikan tinggi bermutu dengan kurikulum adaptif, riset terapan berkelanjutan, dan pembentukan integritas karakter lulusan.',
  ctaText = 'Daftar PMB Sekarang',
  ctaLink = '/pmb',
  campusName = 'Kampus',
  stats = null,
}: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pt-12 pb-20 overflow-hidden border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Kolom Kiri: Teks & Aksi */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            {/* Badge PMB */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#1E3A8A] text-xs sm:text-sm font-semibold mb-6 w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse"></span>
              <span>{badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-6">
              {title}
            </h1>

            {/* Deskripsi */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl font-normal">
              {subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                href={ctaLink}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E3A8A] hover:bg-[#172554] text-white font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4 text-[#D4A017]" />
              </Link>
              <Link
                href="#sambutan"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base rounded-xl border border-slate-300 shadow-sm transition-all"
              >
                <span>Profil Kampus</span>
              </Link>
            </div>

            {/* Micro Highlights */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Akreditasi Institusi Unggul (BAN-PT)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                <span>Kampus Bebas Narkoba & Anti-Kekerasan</span>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Foto Gedung Kampus Nyata & 3 Kartu Statistik */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
              {/* Foto Nyata Kampus Modern */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
                  alt={`Kampus ${campusName}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs uppercase tracking-widest text-[#D4A017] font-semibold">Kampus Utama</p>
                  <p className="text-sm sm:text-base font-bold">{campusName}</p>
                </div>
              </div>

              {/* Kartu Statistik di Bawah Foto -- dari data akademik; disembunyikan bila belum termuat */}
              {stats && (
                <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white p-4 sm:p-5">
                  {[
                    { n: stats.students, label: 'Mahasiswa Aktif' },
                    { n: stats.lecturers, label: 'Dosen' },
                    { n: stats.studyPrograms, label: 'Program Studi' },
                  ].map((x) => (
                    <div key={x.label} className="text-center px-1 sm:px-2">
                      <p className="text-xl sm:text-2xl font-extrabold text-[#1E3A8A]">{fmtCount(x.n)}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{x.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
