import Image from 'next/image';
import { Quote } from 'lucide-react';

interface SambutanRektorProps {
  rectorName?: string;
  rectorTitle?: string;
  rectorSpeech?: string;
  rectorImageUrl?: string;
}

export function SambutanRektor({
  rectorName = 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
  rectorTitle = 'Guru Besar Rekayasa Sistem & Rektor ITN Periode 2024–2028',
  rectorSpeech,
  rectorImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
}: SambutanRektorProps) {
  return (
    <section id="sambutan" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 sm:p-12 lg:p-16 shadow-subtle">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Foto Rektor Lingkaran */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1.5 border-4 border-[#1E3A8A] shadow-md bg-white mb-5">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={rectorImageUrl}
                    alt={`${rectorName} - ${rectorTitle}`}
                    fill
                    sizes="(max-width: 768px) 176px, 208px"
                    className="object-cover object-top"
                  />
                </div>
                {/* Badge Aksen Emas */}
                <div className="absolute -bottom-2 bg-[#D4A017] text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
                  Rektor ITN
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {rectorName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {rectorTitle}
              </p>
            </div>

            {/* Paragraf Sambutan & Tanda Tangan */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-[#1E3A8A] text-sm font-semibold uppercase tracking-wider mb-2">
                <Quote className="w-5 h-5 text-[#D4A017]" />
                <span>Pesan Dari Pimpinan</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-5">
                Selamat Datang di Institut Teknologi Nusantara
              </h2>

              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                {rectorSpeech ? (
                  rectorSpeech.split('\n\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))
                ) : (
                  <>
                    <p>
                      <em>Assalamu’alaikum Warahmatullahi Wabarakatuh, Salam Sejahtera untuk kita semua.</em>
                    </p>
                    <p>
                      Puji syukur kita panjatkan ke hadirat Tuhan Yang Maha Esa. Sebagai perguruan tinggi yang berakar pada nilai-nilai kebangsaan dan berwawasan global, Institut Teknologi Nusantara hadir bukan semata mencetak sarjana, melainkan mencetak pelopor perubahan yang memiliki keunggulan intelektual dan keluhuran budi pekerti.
                    </p>
                    <p>
                      Di era percepatan transformasi digital dan ketidakpastian global, kami memadukan kurikulum berbasis luaran (<em>Outcome-Based Education</em>), riset aplikatif, serta kemitraan strategis bersama industri terkemuka demi menjamin setiap lulusan siap berkontribusi secara nyata bagi kemandirian bangsa Indonesia.
                    </p>
                  </>
                )}
              </div>

              {/* Tanda Tangan Digital Sederhana */}
              <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Tertanda Resmi,</p>
                  {/* Signature graphic / typography */}
                  <div className="py-2 text-[#1E3A8A] font-serif italic text-2xl tracking-wide select-none">
                    Bambang Sudarmono
                  </div>
                  <p className="text-xs text-slate-500 font-medium">NIP. 19680514 199403 1 002</p>
                </div>

                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-500 max-w-xs shadow-xs">
                  <span className="font-semibold text-[#1E3A8A]">Motto Rektorat:</span> &quot;Inovasi untuk Negeri, Integritas untuk Generasi Abadi.&quot;
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
