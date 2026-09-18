'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PmbAturanPembiayaanRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/pmb/gelombang');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Mengalihkan ke Gelombang Pendaftaran...</p>
      </div>
    </div>
  );
}
