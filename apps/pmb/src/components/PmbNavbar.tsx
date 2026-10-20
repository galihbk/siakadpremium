'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useServiceUrl } from '@/lib/publicUrls';
import { ArrowLeft, LogIn, Mail, Menu, Phone, Sparkles, X } from 'lucide-react';

const LINKS = [
  { href: '#gelombang', label: 'Gelombang' },
  { href: '#jalur', label: 'Jalur Masuk' },
  { href: '#alur', label: 'Alur Daftar' },
  { href: '#biaya', label: 'Biaya Kuliah' },
  { href: '#faq', label: 'FAQ' },
];

/**
 * Navbar PMB yang responsif:
 *  - top bar: hotline selalu tampil, email dan label panjang hanya di layar lebar;
 *  - header: menu tautan mulai layar xl, di bawah itu jadi menu hamburger; tombol Masuk/Register
 *    mengecil di ponsel dan pindah ke dalam menu bila terlalu sempit.
 */
export function PmbNavbar({ webUrl: webUrlFallback }: { webUrl: string }) {
  const [open, setOpen] = useState(false);
  const webUrl = useServiceUrl('web', webUrlFallback);

  // tutup menu saat layar dilebarkan / tombol Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 1280 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="bg-[#0F172A] text-white text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-slate-300 min-w-0">
            <span className="flex items-center gap-1.5 min-w-0">
              <Phone className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">Hotline PMB: </span>
                <strong>(021) 7890-1234 ext. 101</strong>
              </span>
            </span>
            <span className="hidden lg:inline text-slate-600">|</span>
            <span className="hidden lg:flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Email: pmb@itn.ac.id</span>
            </span>
          </div>
          <a
            href={webUrl}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Kembali ke Website Utama ITN</span>
            <span className="sm:hidden">Website ITN</span>
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1E3A8A] border-2 border-[#D4A017] flex items-center justify-center text-white font-black text-sm sm:text-base shadow-xs shrink-0">
                ITN
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-[#1E3A8A] tracking-tight leading-tight truncate">
                  <span className="sm:hidden">PMB ITN</span>
                  <span className="hidden sm:inline">PMB INSTITUT TEKNOLOGI NUSANTARA</span>
                </span>
                <span className="hidden sm:block text-[10px] md:text-xs font-semibold text-[#D4A017] tracking-wider uppercase truncate">
                  Penerimaan Mahasiswa Baru TA 2027/2028
                </span>
              </div>
            </Link>

            <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold text-slate-700">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} className="hover:text-[#1E3A8A] transition-colors whitespace-nowrap">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-[#1E3A8A] hover:bg-blue-50 rounded-xl transition-colors whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </Link>
              <Link
                href="/daftar"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-[#D4A017] hover:bg-[#C59114] rounded-xl shadow-sm transition-all whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 hidden min-[380px]:block" />
                <span>
                  <span className="sm:hidden">Daftar</span>
                  <span className="hidden sm:inline">Register Akun</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Tutup menu' : 'Buka menu'}
                aria-expanded={open}
                className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="xl:hidden border-t border-slate-200 bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A]"
                >
                  {l.label}
                </a>
              ))}
              <div className="sm:hidden pt-2 mt-2 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-[#1E3A8A] border border-[#1E3A8A] rounded-xl"
                >
                  <LogIn className="w-4 h-4" /> Masuk ke Akun PMB
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
