import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();
  const url = request.nextUrl.clone();

  // 1. Subdomain Portal (e.g. portal.siakadpremium.ac.id or portalsiakadpremium.ac.id)
  // Dedicated to Login, Mahasiswa (/student), Dosen (/lecturer), and BAAK (/admin)
  if (host.startsWith('portal.') || host.startsWith('portalsiakadpremium')) {
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Subdomain PMB (e.g. pmb.siakadpremium.ac.id or pmbsiakadpremium.ac.id or pmb.*)
  // Dedicated to Penerimaan Mahasiswa Baru
  if (host.startsWith('pmb.') || host.startsWith('pmbsiakadpremium') || host.includes('pmb')) {
    if (url.pathname === '/') {
      url.pathname = '/pmb';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/login') {
      url.pathname = '/pmb/login';
      return NextResponse.rewrite(url);
    }
    if (
      url.pathname === '/daftar' ||
      url.pathname === '/register' ||
      url.pathname === '/pmb/register'
    ) {
      url.pathname = '/pmb/daftar';
      return NextResponse.rewrite(url);
    }
    if (url.pathname === '/dashboard' || url.pathname === '/portal') {
      url.pathname = '/pmb/dashboard';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Global redirect/rewrite for /register or /daftar to PMB registration
  if (url.pathname === '/daftar' || url.pathname === '/register') {
    url.pathname = '/pmb/daftar';
    return NextResponse.rewrite(url);
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
