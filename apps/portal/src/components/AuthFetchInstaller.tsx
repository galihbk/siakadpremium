'use client';

import { getAuthSession } from '@/lib/auth';

/**
 * Menyisipkan header `Authorization: Bearer <token>` secara otomatis pada setiap panggilan fetch
 * ke API (`/api/v1/...`) yang belum membawa header itu.
 *
 * API sekarang mewajibkan login untuk semua endpoint non-publik. Dengan satu pemasangan di sini,
 * seluruh halaman portal (yang memanggil fetch langsung) tetap berfungsi tanpa mengubah satu per satu.
 * Panggilan ke domain lain tidak disentuh.
 */
function install() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __siakadFetchPatched?: boolean };
  if (w.__siakadFetchPatched) return;
  w.__siakadFetchPatched = true;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const isApi = url.startsWith('/api/v1') || url.includes('/api/v1/');
      if (isApi) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) {
          const { token } = getAuthSession();
          if (token) headers.set('Authorization', `Bearer ${token}`);
        }
        return original(input, { ...init, headers });
      }
    } catch {
      /* gagal menyisipkan token -> teruskan permintaan apa adanya */
    }
    return original(input, init);
  };
}

install();

export function AuthFetchInstaller() {
  return null;
}
