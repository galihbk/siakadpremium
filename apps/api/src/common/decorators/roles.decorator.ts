import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@siakad/types';
import { ROLES_KEY } from '@siakad/auth';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
