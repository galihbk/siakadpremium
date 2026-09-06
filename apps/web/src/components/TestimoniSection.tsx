'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Quote, Building } from 'lucide-react';

export function TestimoniSection() {
  const alumniList = [
    {
      nama: 'Anindya Pratiwi, S.Kom.',
      lulusan: 'Alumni Teknik Informatika, Angkatan 2020',
      posisi: 'Senior Software Engineer di Tech Unicorn Jakarta',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      kutipan: 'Kurikulum berbasis proyek riil di ITN memberikan pondasi engineering yang luar biasa kuat. Sejak semester 6, saya sudah dibimbing dosen untuk magang di industri sehingga transisi ke dunia kerja profesional berjalan sangat mulus tanpa kendala adaptasi.',
    },
    {
      nama: 'Dimas Wicaksono, S.T., M.Eng.',
      lulusan: 'Alumni Teknik Elektro, Angkatan 2018',
      posisi: 'Lead Automation Specialist di BUMN Energi Nasional',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
      kutipan: 'Fasilitas laboratorium mekatronika dan sistem kendali di ITN setara dengan peralatan yang digunakan di industri migas. Dosen pengajar bukan hanya mengajarkan rumus teoritis, melainkan menanamkan pola pikir pemecahan masalah dan integritas profesional.',
    },
    {
      nama: 'Sarah Nabila, S.E.',
      lulusan: 'Alumni Manajemen Bisnis Digital, Angkatan 2021',
      posisi: 'Risk & Strategy Analyst di Perbankan Nasional',
      foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
      kutipan: 'Keluasan jaringan kerja sama karir ITN adalah salah satu kekuatan terbesar. Melalui Career Center kampus, saya mendapatkan tawaran Management Trainee bahkan 2 bulan sebelum pelaksanaan sidang skripsi kelulusan.',
    },
    {
      nama: 'Rizky Ramadhan, S.H.',
      lulusan: 'Alumni Ilmu Hukum, Angkatan 2019',
      posisi: 'Corporate Legal Counsel di Firma Hukum Internasional',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
      kutipan: 'Pendidikan hukum di ITN sangat progresif dengan penekanan pada Cyber Law dan Hukum Kekayaan Intelektual. Mahasiswa dilatih berdebat dan menyusun kontrak bisnis riil dalam simulasi peradilan semu berstandar nasional.',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? alumniList.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === alumniList.length - 1 ? 0 : prev + 1));
  };

  const current = alumniList[currentIndex];

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
            Kisah Sukses Alumni
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Jejak Karya Alumni Nusantara
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Ribuan alumni Institut Teknologi Nusantara telah berkontribusi memimpin inovasi di kancah industri nasional maupun internasional.
          </p>
        </div>

        {/* Testimonial Card Display */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-subtle relative">
          <Quote className="absolute top-6 right-8 w-12 h-12 text-[#D4A017]/20 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Foto Alumni */}
            <div className="md:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden border-4 border-[#1E3A8A]/20 shadow-md mb-4 bg-slate-100">
                <Image
                  src={current.foto}
                  alt={current.nama}
                  fill
                  sizes="(max-width: 768px) 144px, 176px"
                  className="object-cover"
                />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {current.nama}
              </h3>
              <p className="text-xs text-[#1E3A8A] font-semibold mt-1">
                {current.lulusan}
              </p>
            </div>

            {/* Kutipan & Posisi */}
            <div className="md:col-span-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                  <Building className="w-3.5 h-3.5 text-[#D4A017]" />
                  <span>{current.posisi}</span>
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic font-serif">
                  &ldquo;{current.kutipan}&rdquo;
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                {/* Dots indicator */}
                <div className="flex gap-2">
                  {alumniList.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2.5 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'w-8 bg-[#1E3A8A]'
                          : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`Lihat alumni ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#1E3A8A] transition-colors"
                    aria-label="Alumni Sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#1E3A8A] transition-colors"
                    aria-label="Alumni Selanjutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
