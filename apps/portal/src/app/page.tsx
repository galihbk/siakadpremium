'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[#1E3A8A] border-t-transparent animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Mengalihkan ke Portal SIAKAD...</p>
      </div>
    </div>
  );
}
