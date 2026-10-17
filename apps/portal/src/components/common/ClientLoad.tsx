'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Memuat data di browser (dengan token login) lalu menyerahkannya ke anak.
 *
 * Dipakai untuk halaman yang dulu mengambil data di server (SSR). Setelah API mewajibkan login,
 * server tidak punya token (token ada di browser), jadi pengambilan data pindah ke sini.
 */
export function ClientLoad<T>({ load, children }: { load: () => Promise<T>; children: (data: T) => React.ReactNode }) {
  const [state, setState] = useState<{ value: T } | null>(null);

  useEffect(() => {
    let live = true;
    load().then((value) => {
      if (live) setState({ value });
    });
    return () => {
      live = false;
    };
    // load sengaja hanya dijalankan sekali saat halaman dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <RefreshCw className="w-4 h-4 animate-spin text-[#1E3A8A]" />
        Memuat data...
      </div>
    );
  }
  return <>{children(state.value)}</>;
}
