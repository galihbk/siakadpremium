'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      const target = isLocalhost
        ? 'http://localhost:3002/login'
        : 'https://portal.galihjp.com/login';
      window.location.replace(target);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#1E3A8A] animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">Mengarahkan ke Portal SIAKAD...</p>
      <p className="text-xs text-slate-400 mt-1">Silakan tunggu beberapa saat.</p>
    </div>
  );
}
