export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN_BAAK' | 'ADMIN_KEUANGAN' | 'ADMIN_LP3M' | 'LP3M' | 'LECTURER' | 'STUDENT' | 'STAFF';
  avatarUrl?: string | null;
  studentId?: string | null;
  lecturerId?: string | null;
}

const TOKEN_KEY = 'siakad_token';
const USER_KEY = 'siakad_user';

export function saveAuthSession(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // Set cookies for Next.js middleware / SSR
  document.cookie = `siakad_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `siakad_role=${user.role}; path=/; max-age=86400; SameSite=Lax`;
}

export function getAuthSession(): { token: string | null; user: AuthUser | null } {
  if (typeof window === 'undefined') {
    return { token: null, user: null };
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  let user: AuthUser | null = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }

  return { token, user };
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Clear cookies
  document.cookie = 'siakad_token=; path=/; max-age=0';
  document.cookie = 'siakad_role=; path=/; max-age=0';
}

export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/superadmin';
    case 'ADMIN_LP3M':
    case 'LP3M':
      return '/admin/p3m';
    case 'ADMIN_KEUANGAN':
    case 'FINANCE':
      return '/finance';
    case 'ADMIN_BAAK':
    case 'STAFF':
      return '/admin';
    case 'LECTURER':
      return '/lecturer';
    case 'STUDENT':
      return '/student';
    default:
      return '/student';
  }
}

export function getPortalRoleFromBackend(backendRole: string, email?: string): 'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' | 'lp3m' {
  if (email === 'lp3m@itn.ac.id' || email === 'p3m@itn.ac.id' || backendRole === 'ADMIN_LP3M' || backendRole === 'LP3M') {
    return 'lp3m';
  }
  switch (backendRole) {
    case 'SUPER_ADMIN':
      return 'superadmin';
    case 'ADMIN_KEUANGAN':
    case 'FINANCE':
      return 'finance';
    case 'ADMIN_BAAK':
    case 'STAFF':
      return 'admin';
    case 'LECTURER':
      return 'lecturer';
    case 'STUDENT':
    default:
      return 'student';
  }
}

export function isRouteAllowedForRole(pathname: string, role: string): boolean {
  // 1. Dashboard LP3M HANYA boleh diakses oleh role LP3M (ADMIN_LP3M / LP3M) dan Super Admin
  if (pathname.startsWith('/admin/p3m') || pathname.startsWith('/p3m')) {
    return role === 'ADMIN_LP3M' || role === 'LP3M' || role === 'SUPER_ADMIN';
  }

  // Role LP3M HANYA boleh mengakses area LP3M (/admin/p3m)
  if (role === 'ADMIN_LP3M' || role === 'LP3M') {
    return pathname.startsWith('/admin/p3m') || pathname.startsWith('/p3m');
  }

  // 2. Dashboard Keuangan HANYA boleh diakses oleh role Keuangan (ADMIN_KEUANGAN / FINANCE)
  if (pathname.startsWith('/finance')) {
    return role === 'ADMIN_KEUANGAN' || role === 'FINANCE';
  }

  // 3. Portal Dosen HANYA boleh diakses oleh role Dosen (LECTURER)
  if (pathname.startsWith('/lecturer')) {
    return role === 'LECTURER';
  }

  // 4. Portal Mahasiswa HANYA boleh diakses oleh role Mahasiswa (STUDENT)
  if (pathname.startsWith('/student')) {
    return role === 'STUDENT';
  }

  // 5. Role Keuangan (Finance) HANYA boleh mengakses area keuangan (/finance)
  if (role === 'ADMIN_KEUANGAN' || role === 'FINANCE') {
    return pathname.startsWith('/finance');
  }

  // 6. Super Admin memiliki akses penuh ke area administrasi, master data & sistem
  if (role === 'SUPER_ADMIN') {
    return true;
  }

  if (pathname.startsWith('/admin/superadmin')) {
    if (pathname === '/admin/superadmin/laporan') {
      return role === 'SUPER_ADMIN' || role === 'ADMIN_BAAK';
    }
    return role === 'SUPER_ADMIN';
  }

  if (pathname.startsWith('/admin/cms')) {
    return role === 'SUPER_ADMIN';
  }

  if (pathname.startsWith('/admin')) {
    return role === 'ADMIN_BAAK' || role === 'STAFF';
  }

  return true;
}
