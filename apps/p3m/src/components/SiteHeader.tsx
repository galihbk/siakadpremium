'use client';

import { CampusLogo } from '@/components/CampusLogo';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, Menu, X } from 'lucide-react';
import { NAV } from '@/lib/nav';

export function SiteHeader({ shortName, logoUrl, campusName, portalUrl }: { shortName: string; logoUrl?: string | null; campusName: string; portalUrl: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <CampusLogo url={logoUrl} initials={shortName.slice(0, 3)} className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center text-xs font-black shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm font-black text-slate-900 leading-tight">LP3M · Penelitian &amp; Pengabdian</span>
            <span className="block text-[11px] text-slate-500 truncate">{campusName}</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                active(n.href) ? 'text-[#1E3A8A] bg-blue-50 font-semibold' : 'text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-50'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={portalUrl}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Login Tim LP3M</span>
            <span className="sm:hidden">Login</span>
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <nav className="max-w-6xl mx-auto px-4 py-2 flex flex-col">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2.5 text-sm rounded-lg ${active(n.href) ? 'text-[#1E3A8A] bg-blue-50 font-semibold' : 'text-slate-700'}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
