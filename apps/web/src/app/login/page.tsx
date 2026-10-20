'use client';

import { useEffect } from 'react';
import { useServiceUrl } from '@/lib/publicUrls';

export default function LoginPage() {
  const portalUrl = useServiceUrl('portal', '');

  useEffect(() => {
    // tunggu alamat portal terhitung (dari konfigurasi server atau domain yang sedang dibuka)
    if (portalUrl) window.location.replace(`${portalUrl}/login`);
  }, [portalUrl]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#1E3A8A] animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-700">Mengarahkan ke Portal Akademik SIAKAD...</p>
      <p className="text-xs text-slate-400 mt-1">Silakan tunggu beberapa saat.</p>
    </div>
  );
}
