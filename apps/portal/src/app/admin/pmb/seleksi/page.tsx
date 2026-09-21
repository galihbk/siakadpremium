'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { RefreshCw } from 'lucide-react';

export default function SeleksiPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/pmb/pendaftar');
  }, [router]);

  return (
    <PortalLayout role="pmb" activeMenuHref="/admin/pmb/pendaftar">
      <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-600" />
        <p className="text-sm font-medium">Mengalihkan ke Data Pendaftar...</p>
      </div>
    </PortalLayout>
  );
}
