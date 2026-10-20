import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isPortalHost(host: string) {
  return host.startsWith('portal.') || host.startsWith('portal-') || host.startsWith('portalsiakadpremium');
}

/** Host lokal/IP (dev) tidak punya subdomain -- jangan dipaksa pindah. */
function isLocalHost(host: string) {
  const hostname = host.split(':')[0];
  return hostname === 'localhost' || hostname.endsWith('.localhost') || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

/**
 * Host subdomain PMB tujuan, diturunkan dari host saat ini (tanpa konfigurasi env, sama
 * seperti subdomain portal): label depan `siakad.`/`www.` diganti `pmb.`, atau `pmb.`
 * ditambahkan di depan domain polos. Host lokal/IP tidak dialihkan.
 *
 * Halaman PMB sendiri sudah dipindah ke aplikasi terpisah (apps/pmb) -- middleware ini cuma
 * mengalihkan link lama (/pmb, /pmb/login, /daftar, /register) supaya tetap berfungsi.
 */
function resolvePmbHost(host: string): string | null {
  if (isLocalHost(host)) return null;
  // Alamat PMB eksplisit dari konfigurasi server (mis. https://pmb-kudus.contoh.com) selalu didahulukan.
  const explicit = process.env.PUBLIC_PMB_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).host;
    } catch {
      /* abaikan, pakai penurunan dari host */
    }
  }
  const withoutPort = host.split(':')[0];
  const parts = withoutPort.split('.');
  if (parts.length < 2) return null;
  if (parts.length >= 3 && ['siakad', 'www', 'web'].includes(parts[0])) parts.shift();
  return `pmb.${parts.join('.')}`;
}

export function middleware(request: NextRequest) {
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Subdomain Portal (e.g. portal.siakadpremium.ac.id or portalsiakadpremium.ac.id)
  // Dedicated to Login, Mahasiswa (/student), Dosen (/lecturer), and BAAK (/admin)
  if (isPortalHost(host)) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Link PMB lama di domain utama -> subdomain pmb. (aplikasi PMB terpisah).
  const isPmbPath = pathname === '/pmb' || pathname.startsWith('/pmb/');
  const isLegacyRegister = pathname === '/daftar' || pathname === '/register';
  if (isPmbPath || isLegacyRegister) {
    const pmbHost = resolvePmbHost(host);
    if (pmbHost) {
      const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
      let targetPath = pathname;
      if (isLegacyRegister) targetPath = '/daftar';
      else if (pathname === '/pmb' || pathname === '/pmb/') targetPath = '/';
      else targetPath = pathname.replace(/^\/pmb/, '');
      return NextResponse.redirect(`${proto}://${pmbHost}${targetPath}${url.search}`, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
