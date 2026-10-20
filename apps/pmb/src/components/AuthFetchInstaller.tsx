'use client';

/**
 * Menyisipkan token pendaftar (`pmb_applicant_token`) sebagai header Authorization pada panggilan ke
 * /api/v1 yang belum membawanya. Endpoint data pendaftar kini wajib token (bukan lagi parameter accountId).
 */
function install() {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { __pmbFetchPatched?: boolean };
  if (w.__pmbFetchPatched) return;
  w.__pmbFetchPatched = true;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('/api/v1') || url.includes('/api/v1/')) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) {
          const token = localStorage.getItem('pmb_applicant_token') ||
            localStorage.getItem('pmb_account_token') ||
            localStorage.getItem('pmb_visitor_token');
          if (token) headers.set('Authorization', `Bearer ${token}`);
        }
        return original(input, { ...init, headers });
      }
    } catch {
      /* teruskan apa adanya */
    }
    return original(input, init);
  };
}

install();

export function AuthFetchInstaller() {
  return null;
}
