import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@siakad/types';
import { ROLES_KEY, hasRequiredRole } from '@siakad/auth';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      throw new ForbiddenException('Akses ditolak: Pengguna tidak memiliki hak akses');
    }

    const hasPermission = hasRequiredRole(user.role, requiredRoles);
    if (!hasPermission) {
      throw new ForbiddenException('Akses ditolak: Peran Anda tidak diizinkan untuk aksi ini');
    }

    return true;
  }
}
