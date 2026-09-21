'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RolesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/superadmin/users');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-3" />
      <p className="text-xs font-semibold text-slate-600">Mengarahkan ke Manajemen User...</p>
    </div>
  );
}
