import { UserRole } from '@siakad/types';

export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 100,
  [UserRole.ADMIN_BAAK]: 80,
  [UserRole.ADMIN_PMB]: 80,
  [UserRole.ADMIN_KEUANGAN]: 80,
  [UserRole.ADMIN_LP3M]: 80,
  [UserRole.LP3M]: 60,
  [UserRole.LECTURER]: 50,
  [UserRole.STAFF]: 40,
  [UserRole.STUDENT]: 10,
};

export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (allowedRoles.includes(userRole)) {
    return true;
  }
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  return false;
}

export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  studentId?: string | null;
  lecturerId?: string | null;
  sessionId: string;
}
