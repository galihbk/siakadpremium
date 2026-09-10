import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('siakad_token')?.value;
  const role = request.cookies.get('siakad_role')?.value;

  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/lecturer') ||
    pathname.startsWith('/finance');

  // 1. Kalo belum login dan mengakses halaman yang dilindungi: Keluarkan dan arahkan ke /login
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Kalo membuka root /: Arahkan ke dashboard jika sudah login, atau ke /login jika belum login
  if (pathname === '/') {
    if (token && role) {
      let target = '/student';
      if (role === 'SUPER_ADMIN') target = '/admin/superadmin';
      else if (['ADMIN_LP3M', 'LP3M'].includes(role)) target = '/admin/p3m';
      else if (['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) target = '/finance';
      else if (role === 'ADMIN_BAAK' || role === 'STAFF') target = '/admin';
      else if (role === 'LECTURER') target = '/lecturer';
      else if (role === 'STUDENT') target = '/student';

      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2b. Kalo sudah login dan membuka halaman /login: Arahkan ke dashboard sesuai role
  if (pathname === '/login' && token && role) {
    let target = '/student';
    if (role === 'SUPER_ADMIN') target = '/admin/superadmin';
    else if (['ADMIN_LP3M', 'LP3M'].includes(role)) target = '/admin/p3m';
    else if (['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) target = '/finance';
    else if (role === 'ADMIN_BAAK' || role === 'STAFF') target = '/admin';
    else if (role === 'LECTURER') target = '/lecturer';
    else if (role === 'STUDENT') target = '/student';

    return NextResponse.redirect(new URL(target, request.url));
  }

  // 3. Batasi akses halaman jika peran (role) tidak sesuai
  if (token && role) {
    // 3a. HANYA Pengelola LP3M (role ADMIN_LP3M / LP3M) dan Super Admin yang boleh membuka /admin/p3m
    if (pathname.startsWith('/admin/p3m') && !['ADMIN_LP3M', 'LP3M', 'SUPER_ADMIN'].includes(role)) {
      let home = '/login';
      if (['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) home = '/finance';
      else if (['ADMIN_BAAK', 'STAFF'].includes(role)) home = '/admin';
      else if (role === 'LECTURER') home = '/lecturer';
      else if (role === 'STUDENT') home = '/student';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // 3b. Role LP3M HANYA boleh membuka /admin/p3m (jika mencoba ke rute admin lain, kembalikan ke /admin/p3m)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/p3m') && ['ADMIN_LP3M', 'LP3M'].includes(role)) {
      return NextResponse.redirect(new URL('/admin/p3m', request.url));
    }

    // Hanya Finance (role ADMIN_KEUANGAN / FINANCE) yang boleh membuka /finance
    if (pathname.startsWith('/finance') && !['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) {
      let home = '/login';
      if (role === 'SUPER_ADMIN') home = '/admin/superadmin';
      else if (['ADMIN_LP3M', 'LP3M'].includes(role)) home = '/admin/p3m';
      else if (['ADMIN_BAAK', 'STAFF'].includes(role)) home = '/admin';
      else if (role === 'LECTURER') home = '/lecturer';
      else if (role === 'STUDENT') home = '/student';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Jika Super Admin membuka /admin (BAAK), arahkan otomatis ke dashboard super admin
    if (pathname === '/admin' && role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/superadmin', request.url));
    }

    // Hanya Super Admin yang boleh membuka dashboard super admin
    if (pathname.startsWith('/admin/superadmin') && role !== 'SUPER_ADMIN') {
      const home = ['ADMIN_LP3M', 'LP3M'].includes(role) ? '/admin/p3m' : ['ADMIN_BAAK', 'STAFF'].includes(role) ? '/admin' : ['ADMIN_KEUANGAN', 'FINANCE'].includes(role) ? '/finance' : role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Super Admin yang boleh membuka CMS Landing Page
    if (pathname.startsWith('/admin/cms') && role !== 'SUPER_ADMIN') {
      const home = ['ADMIN_LP3M', 'LP3M'].includes(role) ? '/admin/p3m' : ['ADMIN_BAAK', 'STAFF'].includes(role) ? '/admin' : ['ADMIN_KEUANGAN', 'FINANCE'].includes(role) ? '/finance' : role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Administrator BAAK/Staff yang boleh membuka halaman /admin (kecuali /admin/p3m)
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/p3m') && !['SUPER_ADMIN', 'ADMIN_BAAK', 'STAFF'].includes(role)) {
      const home = ['ADMIN_LP3M', 'LP3M'].includes(role) ? '/admin/p3m' : ['ADMIN_KEUANGAN', 'FINANCE'].includes(role) ? '/finance' : role === 'STUDENT' ? '/student' : '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Mahasiswa (role STUDENT) yang boleh membuka /student
    if (pathname.startsWith('/student') && role !== 'STUDENT') {
      let home = '/login';
      if (role === 'SUPER_ADMIN') home = '/admin/superadmin';
      else if (['ADMIN_LP3M', 'LP3M'].includes(role)) home = '/admin/p3m';
      else if (['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) home = '/finance';
      else if (['ADMIN_BAAK', 'STAFF'].includes(role)) home = '/admin';
      else if (role === 'LECTURER') home = '/lecturer';
      return NextResponse.redirect(new URL(home, request.url));
    }

    // Hanya Dosen (role LECTURER) yang boleh membuka /lecturer
    if (pathname.startsWith('/lecturer') && role !== 'LECTURER') {
      let home = '/login';
      if (role === 'SUPER_ADMIN') home = '/admin/superadmin';
      else if (['ADMIN_LP3M', 'LP3M'].includes(role)) home = '/admin/p3m';
      else if (['ADMIN_KEUANGAN', 'FINANCE'].includes(role)) home = '/finance';
      else if (['ADMIN_BAAK', 'STAFF'].includes(role)) home = '/admin';
      else if (role === 'STUDENT') home = '/student';
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
