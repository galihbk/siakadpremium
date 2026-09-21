export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN_BAAK' | 'ADMIN_PMB' | 'ADMIN_KEUANGAN' | 'ADMIN_LP3M' | 'LP3M' | 'LECTURER' | 'STUDENT' | 'STAFF';
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
    case 'ADMIN_PMB':
    case 'PMB':
      return '/admin/pmb';
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
