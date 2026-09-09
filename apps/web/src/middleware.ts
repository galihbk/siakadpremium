import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();
  const url = request.nextUrl.clone();

  // 1. Subdomain Portal (e.g. portal.galihjp.com or portal.itn.ac.id)
  // Dedicated to Login, Mahasiswa (/student), Dosen (/lecturer), and BAAK (/admin)
  if (host.startsWith('portal.')) {
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // 2. Subdomain PMB (e.g. pmb.galihjp.com or pmb.itn.ac.id)
  // Dedicated to Penerimaan Mahasiswa Baru
  if (host.startsWith('pmb.')) {
    if (url.pathname === '/') {
      url.pathname = '/pmb';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
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
