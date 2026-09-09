export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN_BAAK' | 'ADMIN_KEUANGAN' | 'LECTURER' | 'STUDENT' | 'STAFF';
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

export function getPortalRoleFromBackend(backendRole: string): 'student' | 'lecturer' | 'admin' | 'superadmin' | 'finance' {
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
  // 1. Dashboard Keuangan HANYA boleh diakses oleh role Keuangan (ADMIN_KEUANGAN / FINANCE)
  if (pathname.startsWith('/finance')) {
    return role === 'ADMIN_KEUANGAN' || role === 'FINANCE';
  }

  // 2. Portal Dosen HANYA boleh diakses oleh role Dosen (LECTURER)
  if (pathname.startsWith('/lecturer')) {
    return role === 'LECTURER';
  }

  // 3. Portal Mahasiswa HANYA boleh diakses oleh role Mahasiswa (STUDENT)
  if (pathname.startsWith('/student')) {
    return role === 'STUDENT';
  }

  // 4. Role Keuangan (Finance) HANYA boleh mengakses area keuangan (/finance)
  if (role === 'ADMIN_KEUANGAN' || role === 'FINANCE') {
    return pathname.startsWith('/finance');
  }

  // 5. Super Admin memiliki akses penuh ke area administrasi, master data & sistem
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
