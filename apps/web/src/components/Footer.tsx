import Link from 'next/link';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer id="kontak" className="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Address (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {/* Circular Logo ITN */}
              <div className="w-12 h-12 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-lg tracking-wider border-2 border-[#D4A017] shadow-sm">
                ITN
              </div>
              <div>
                <h3 className="font-bold text-lg text-white tracking-tight leading-tight">
                  INSTITUT TEKNOLOGI NUSANTARA
                </h3>
                <p className="text-xs text-[#D4A017] font-semibold">
                  Membangun Generasi Unggul untuk Masa Depan Indonesia
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-2">
              Perguruan tinggi berbasis riset dan teknologi yang berkomitmen menghasilkan lulusan berkarakter unggul, inovatif, dan berdaya saing internasional.
            </p>

            <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4A017] shrink-0 mt-0.5" />
                <span>Kampus Terpadu ITN, Jl. Nusantara Cendekia No. 108, Jakarta Selatan 12340</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4A017] shrink-0" />
                <span>(021) 7890-1234 / (021) 7890-5678 (Hunting)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4A017] shrink-0" />
                <span>humas@itn.ac.id | pmb@itn.ac.id</span>
              </div>
            </div>
          </div>

          {/* Navigasi Akademik (Col 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#D4A017] pl-2.5">
              Akademik
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="#fakultas" className="hover:text-white transition-colors">Program Sarjana (S1)</Link></li>
              <li><Link href="#fakultas" className="hover:text-white transition-colors">Program Magister (S2)</Link></li>
              <li><Link href="#agenda" className="hover:text-white transition-colors">Kalender Akademik</Link></li>
              <li><Link href="#keunggulan" className="hover:text-white transition-colors">Akreditasi Program Studi</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Perpustakaan Digital</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Jurnal Riset Ilmiah</Link></li>
            </ul>
          </div>

          {/* Layanan & Kemahasiswaan (Col 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#D4A017] pl-2.5">
              Layanan & Kampus
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link href="#cta" className="hover:text-white transition-colors">SIAKAD Premium Mahasiswa</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Portal Dosen & Staf</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Pusat Karir & Alumni</Link></li>
              <li><Link href="#keunggulan" className="hover:text-white transition-colors">Beasiswa Pendidikan</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Layanan Konseling</Link></li>
              <li><Link href="#cta" className="hover:text-white transition-colors">Fasilitas Asrama & Olahraga</Link></li>
            </ul>
          </div>

          {/* PMB & Media Sosial (Col 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white border-l-2 border-[#D4A017] pl-2.5">
              Media Sosial & PMB
            </h4>
            <p className="text-xs text-slate-400">
              Ikuti kanal media sosial resmi untuk mendapatkan informasi kegiatan dan agenda kampus terhangat.
            </p>

            {/* Social SVG Icons */}
            <div className="flex items-center gap-2.5">
              {/* Facebook */}
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1E3A8A] flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1E3A8A] flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="X / Twitter">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1E3A8A] flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1E3A8A] flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#1E3A8A] flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>

            {/* Hotline PMB Box */}
            <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
              <p className="font-semibold text-[#D4A017]">Informasi PMB 2027</p>
              <p className="text-slate-300 mt-1">Layanan One Stop Service Gedung Rektorat Lt. 1</p>
              <p className="text-slate-400 mt-0.5">Email: pmb@itn.ac.id</p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Institut Teknologi Nusantara. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <div className="flex items-center space-x-6">
            <Link href="#" className="hover:text-slate-400 transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Syarat & Ketentuan</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Peta Situs</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
