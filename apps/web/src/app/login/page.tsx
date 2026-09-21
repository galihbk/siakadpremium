'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      let target = 'http://localhost:3002/login';

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        target = 'http://localhost:3002/login';
      } else if (hostname === 'siakadpremium.ac.id' || hostname.endsWith('.siakadpremium.ac.id')) {
        target = 'http://portal.siakadpremium.ac.id/login';
      } else if (hostname === 'galihjp.com' || hostname.endsWith('.galihjp.com')) {
        target = 'https://portal.galihjp.com/login';
      } else if (process.env.NEXT_PUBLIC_PORTAL_URL) {
        target = `${process.env.NEXT_PUBLIC_PORTAL_URL}/login`;
      } else {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        target = `${protocol}//portal.${rootDomain}/login`;
      }

      window.location.replace(target);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#1E3A8A] animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">Mengarahkan ke Portal Akademik SIAKAD...</p>
      <p className="text-xs text-slate-400 mt-1">Silakan tunggu beberapa saat.</p>
    </div>
  );
}
