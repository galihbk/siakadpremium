'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Mail, UserCircle, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalUrl, setPortalUrl] = useState('http://portal.siakadpremium.ac.id');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      if (hostname === 'siakadpremium.ac.id' || hostname.endsWith('.siakadpremium.ac.id')) {
        setPortalUrl('http://portal.siakadpremium.ac.id');
      } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        setPortalUrl('http://localhost:3002');
      } else if (hostname === 'galihjp.com' || hostname.endsWith('.galihjp.com')) {
        setPortalUrl('https://portal.galihjp.com');
      } else if (process.env.NEXT_PUBLIC_PORTAL_URL) {
        setPortalUrl(process.env.NEXT_PUBLIC_PORTAL_URL);
      } else {
        const protocol = window.location.protocol;
        setPortalUrl(`${protocol}//portal.${hostname}`);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Profil', href: '/profil' },
    { name: 'Akademik', href: '/#keunggulan' },
    { name: 'Fakultas', href: '/#fakultas' },
    { name: 'PMB', href: '/#cta' },
    { name: 'Berita', href: '/berita' },
    { name: 'Kontak', href: '/kontak' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white transition-all duration-300">
      {/* Top Bar - Informasi & Layanan Kampus */}
      <div className="bg-[#1E3A8A] text-white text-xs py-1.5 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 sm:space-x-6 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-blue-100">
              <Phone className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
              <span className="whitespace-nowrap">(021) 7890-1234</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-blue-100">
              <Mail className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
              <span>humas@itn.ac.id</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-blue-100">
              <span className="inline-block w-2 h-2 rounded-full bg-[#D4A017]"></span>
              <span>Penerimaan Mahasiswa Baru 2027 Telah Dibuka</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4 text-[11px] sm:text-xs text-blue-100">
            <a
              href={portalUrl}
              className="hover:text-white font-semibold transition-colors flex items-center gap-1 text-[#D4A017]"
            >
              <span>Portal SIAKAD</span>
              <ArrowRight className="w-3 h-3" />
            </a>
            <span className="text-blue-400">|</span>
            <Link href="#kontak" className="hover:text-white transition-colors hidden xs:inline">
              Perpustakaan
            </Link>
            <span className="text-blue-400 hidden xs:inline">|</span>
            <Link href="#kontak" className="hover:text-white transition-colors hidden xs:inline">
              E-Learning
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`w-full bg-white transition-all duration-300 ${
          isScrolled ? 'shadow-md py-2.5' : 'shadow-xs py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-2">
            
            {/* Logo Kiri */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white font-extrabold text-base sm:text-lg tracking-wider border-2 border-[#D4A017] shadow-xs group-hover:bg-[#172554] transition-colors shrink-0">
                ITN
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#1E3A8A] leading-tight whitespace-nowrap">
                  INSTITUT TEKNOLOGI NUSANTARA
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide hidden md:block whitespace-nowrap">
                  Unggul, Berbudaya & Berdaya Saing Global
                </span>
              </div>
            </Link>

            {/* Nav Menu Desktop (Layar lg & xl) */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-5 2xl:gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-700 hover:text-[#1E3A8A] font-semibold text-xs xl:text-sm whitespace-nowrap transition-colors relative py-1 hover:text-[#1E3A8A]"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Action Buttons Kanan */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
              <a
                href={portalUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs xl:text-sm font-bold text-[#1E3A8A] border border-[#1E3A8A] rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shadow-xs"
              >
                <UserCircle className="w-4 h-4 text-[#1E3A8A]" />
                <span>Portal Akademik</span>
              </a>
              <Link
                href="#cta"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs xl:text-sm font-bold text-slate-950 bg-[#D4A017] hover:bg-[#C59114] rounded-xl shadow-xs hover:shadow transition-all whitespace-nowrap"
              >
                <span>Daftar PMB</span>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:text-[#1E3A8A] hover:bg-slate-100 focus:outline-none transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={portalUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-xs font-bold text-[#1E3A8A] border border-[#1E3A8A] rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <UserCircle className="w-4 h-4" />
                <span>Masuk Portal Akademik</span>
              </a>
              <Link
                href="#cta"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#D4A017] hover:bg-[#C59114] rounded-xl shadow-xs"
              >
                Daftar PMB 2027
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
