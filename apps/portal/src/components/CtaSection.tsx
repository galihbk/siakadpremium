import Link from 'next/link';
import { ArrowRight, FileText, MessageCircle, HelpCircle } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="cta" className="py-20 bg-[#1E3A8A] text-white relative overflow-hidden">
      {/* Decorative subtle border line in gold */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4A017] to-transparent"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#D4A017] text-xs sm:text-sm font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#D4A017]"></span>
          <span>Penerimaan Mahasiswa Baru Tahun Akademik 2027/2028</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Bergabung Bersama Institut Teknologi Nusantara
        </h2>

        <p className="text-base sm:text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed mb-10">
          Wujudkan cita-cita akademik dan kembangkan potensi terbaikmu bersama dosen berkelas dunia, fasilitas riset mutakhir, serta ekosistem kampus yang suportif dan inklusif.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
          <Link
            href="#cta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <span>Daftar Sekarang</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="#cta"
            className="inline-flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-base rounded-xl border border-white/20 backdrop-blur-xs transition-all"
          >
            <FileText className="w-4 h-4 text-[#D4A017]" />
            <span>Unduh Buku Panduan PMB</span>
          </Link>
        </div>

        {/* Help desk note */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-blue-200">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#D4A017]" />
            <span>Helpdesk PMB (WhatsApp): <strong>0812-3456-7890</strong></span>
          </div>
          <span className="hidden sm:inline text-blue-400">&bull;</span>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#D4A017]" />
            <span>Senin – Jumat, 08.00 – 16.00 WIB</span>
          </div>
        </div>

      </div>
    </section>
  );
}
