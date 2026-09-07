import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('siakad_token')?.value;
  const role = request.cookies.get('siakad_role')?.value;

  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer');

  // 1. Kalo belum login dan mengakses halaman yang dilindungi: Keluarkan dan arahkan ke /login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Kalo sudah login dan membuka halaman /login atau root /: Arahkan ke dashboard sesuai role
  if ((pathname === '/login' || pathname === '/') && token && role) {
    let target = '/student';
    if (role === 'SUPER_ADMIN') target = '/admin/superadmin';
    else if (role === 'ADMIN_BAAK' || role === 'ADMIN_KEUANGAN' || role === 'STAFF') target = '/admin';
    else if (role === 'LECTURER') target = '/lecturer';
    else if (role === 'STUDENT') target = '/student';

    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Batasi akses halaman jika peran (role) tidak sesuai
  if (token && role) {
    // Jika Super Admin membuka /admin (BAAK), arahkan otomatis ke dashboard super admin
    if (pathname === '/admin' && role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/superadmin', request.url));
    }

    // Hanya Super Admin yang boleh membuka dashboard super admin
    if (pathname.startsWith('/admin/superadmin') && role !== 'SUPER_ADMIN') {
      const home = ['ADMIN_BAAK', 'ADMIN_KEUANGAN', 'STAFF'].includes(role) ? '/admin' : role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Super Admin yang boleh membuka CMS Landing Page
    if (pathname.startsWith('/admin/cms') && role !== 'SUPER_ADMIN') {
      const home = ['ADMIN_BAAK', 'ADMIN_KEUANGAN', 'STAFF'].includes(role) ? '/admin' : role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Administrator yang boleh membuka halaman /admin
    if (pathname.startsWith('/admin') && !['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'STAFF'].includes(role)) {
      const home = role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Mahasiswa (dan Super Admin) yang boleh membuka /student
    if (pathname.startsWith('/student') && role !== 'STUDENT' && role !== 'SUPER_ADMIN') {
      const home = ['ADMIN_BAAK', 'ADMIN_KEUANGAN', 'STAFF'].includes(role) ? '/admin' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Dosen (dan Super Admin) yang boleh membuka /lecturer
    if (pathname.startsWith('/lecturer') && role !== 'LECTURER' && role !== 'SUPER_ADMIN') {
      const home = role === 'STUDENT' ? '/student' : '/admin';
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
