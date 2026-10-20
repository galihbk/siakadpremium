'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Mail, UserCircle, ArrowRight, ChevronDown, ShieldCheck, LayoutGrid, FlaskConical } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { useServiceUrl } from '@/lib/publicUrls';
import { getInstitutionProfile, FALLBACK_INSTITUTION_PROFILE, type InstitutionProfile } from '@/lib/institution';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const portalUrl = useServiceUrl('portal', '#');
  const p2mUrl = useServiceUrl('p2m', '#');
  const p3mUrl = useServiceUrl('p3m', '#');
  const [layananOpen, setLayananOpen] = useState(false);
  const [fakultasOpen, setFakultasOpen] = useState(false);
  const [mobileFakultasOpen, setMobileFakultasOpen] = useState(false);
  const [faculties, setFaculties] = useState<{ code: string; name: string; prodiCount: number }[]>([]);
  const [profile, setProfile] = useState<InstitutionProfile>(FALLBACK_INSTITUTION_PROFILE);

  useEffect(() => {
    getInstitutionProfile().then(setProfile);
  }, []);

  // Daftar fakultas untuk dropdown menu (dari database).
  useEffect(() => {
    fetch(`${getApiBaseUrl()}/faculties`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = j?.data ?? j;
        if (!Array.isArray(list)) return;
        setFaculties(
          list
            .map((f: any) => ({
              code: f.code as string,
              name: f.name as string,
              prodiCount: (f.studyPrograms ?? []).filter((p: any) => p.status === 'Aktif').length as number,
            }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => undefined);
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
    { name: 'Fakultas', href: '/fakultas' },
    { name: 'PMB', href: '/#cta' },
    { name: 'Berita', href: '/berita' },
    { name: 'Kontak', href: '/kontak' },
  ];

  const layananLinks = [
    { name: 'Portal Akademik', desc: 'Login mahasiswa, dosen, dan staf (SIAKAD)', href: portalUrl, icon: UserCircle },
    { name: 'Penjaminan Mutu (P2M)', desc: 'Standar mutu, audit, dan dokumen mutu', href: p2mUrl, icon: ShieldCheck },
    { name: 'Penelitian & Pengabdian (LP3M)', desc: 'Kegiatan riset, pengabdian, HAKI, dan panduan', href: p3mUrl, icon: FlaskConical },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white transition-all duration-300">
      {/* Top Bar - Informasi & Layanan Kampus */}
      <div className="bg-[#1E3A8A] text-white text-xs py-1.5 px-4 border-b border-blue-900">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4 sm:space-x-6 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-blue-100">
              <Phone className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
              <span className="whitespace-nowrap">{profile.contactPhone}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-blue-100">
              <Mail className="w-3.5 h-3.5 text-[#D4A017] shrink-0" />
              <span>{profile.contactEmail}</span>
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
                {profile.logoInitials}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#1E3A8A] leading-tight whitespace-nowrap">
                  {profile.campusName.toUpperCase()}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide hidden md:block whitespace-nowrap">
                  {profile.tagline}
                </span>
              </div>
            </Link>

            {/* Nav Menu Desktop (Layar lg & xl) */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-5 2xl:gap-6">
              {navLinks.map((link) =>
                link.name === 'Fakultas' ? (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => setFakultasOpen(true)}
                    onMouseLeave={() => setFakultasOpen(false)}
                  >
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-[#1E3A8A] font-semibold text-xs xl:text-sm whitespace-nowrap transition-colors py-1"
                    >
                      {link.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${fakultasOpen ? 'rotate-180' : ''}`} />
                    </Link>
                    {fakultasOpen && (
                      <div className="absolute left-0 top-full pt-2 w-72 z-50">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-2">
                          {faculties.length === 0 && (
                            <p className="px-3 py-2 text-xs text-slate-400">Belum ada data fakultas.</p>
                          )}
                          {faculties.map((f) => (
                            <Link
                              key={f.code}
                              href={`/fakultas/${f.code}`}
                              onClick={() => setFakultasOpen(false)}
                              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <span className="text-sm font-semibold text-slate-800 leading-snug">{f.name}</span>
                              <span className="text-[11px] font-bold text-[#1E3A8A] bg-blue-50 rounded-md px-2 py-0.5 shrink-0">
                                {f.prodiCount} prodi
                              </span>
                            </Link>
                          ))}
                          <Link
                            href="/fakultas"
                            onClick={() => setFakultasOpen(false)}
                            className="mt-1 flex items-center justify-between px-3 py-2.5 rounded-lg border-t border-slate-100 text-sm font-bold text-[#1E3A8A] hover:bg-blue-50"
                          >
                            Lihat Semua Fakultas
                            <ArrowRight className="w-4 h-4 text-[#D4A017]" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-slate-700 hover:text-[#1E3A8A] font-semibold text-xs xl:text-sm whitespace-nowrap transition-colors relative py-1 hover:text-[#1E3A8A]"
                  >
                    {link.name}
                  </Link>
                ),
              )}

              {/* Grup Layanan: portal-portal layanan kampus (PMB tetap di luar grup) */}
              <div
                className="relative"
                onMouseEnter={() => setLayananOpen(true)}
                onMouseLeave={() => setLayananOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setLayananOpen((o) => !o)}
                  aria-expanded={layananOpen}
                  className="inline-flex items-center gap-1 text-slate-700 hover:text-[#1E3A8A] font-semibold text-xs xl:text-sm whitespace-nowrap transition-colors py-1"
                >
                  Layanan
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${layananOpen ? 'rotate-180' : ''}`} />
                </button>
                {layananOpen && (
                  <div className="absolute right-0 top-full pt-2 w-64 z-50">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-2">
                      {layananLinks.map((l) => (
                        <a
                          key={l.name}
                          href={l.href}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <l.icon className="w-4 h-4 text-[#1E3A8A] mt-0.5 shrink-0" />
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{l.name}</span>
                            <span className="block text-[11px] text-slate-500 leading-snug">{l.desc}</span>
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Kanan */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
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
              {navLinks.map((link) =>
                link.name === 'Fakultas' ? (
                  <div key={link.name}>
                    <button
                      type="button"
                      onClick={() => setMobileFakultasOpen((o) => !o)}
                      aria-expanded={mobileFakultasOpen}
                      className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors"
                    >
                      {link.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileFakultasOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileFakultasOpen && (
                      <div className="ml-3 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-1">
                        {faculties.map((f) => (
                          <Link
                            key={f.code}
                            href={`/fakultas/${f.code}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-blue-50"
                          >
                            {f.name} <span className="text-[11px] text-slate-400">· {f.prodiCount} prodi</span>
                          </Link>
                        ))}
                        <Link
                          href="/fakultas"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-lg text-sm font-bold text-[#1E3A8A] hover:bg-blue-50"
                        >
                          Lihat Semua Fakultas
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A] transition-colors"
                  >
                    {link.name}
                  </Link>
                ),
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <p className="px-3.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <LayoutGrid className="w-3 h-3" /> Layanan
              </p>
              {layananLinks.map((l) => (
                <a
                  key={l.name}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full px-4 py-2.5 text-xs font-bold text-[#1E3A8A] border border-[#1E3A8A] rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <l.icon className="w-4 h-4" />
                  <span>{l.name}</span>
                </a>
              ))}
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
