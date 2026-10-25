import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ObeStatus, ObeStatusService } from './obe-status.service';

/** Status integrasi dengan OBE untuk halaman Super Admin (berbeda dari endpoint data OBE, yang dijaga API key). */
@ApiTags('Integrasi OBE')
@Controller('obe-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class ObeStatusController {
  constructor(private readonly service: ObeStatusService) {}

  @Get()
  @ApiOperation({ summary: 'Status integrasi dengan OBE: terintegrasi atau belum, dan data yang tersedia untuk OBE (Khusus Super Admin)' })
  status(): Promise<ObeStatus> {
    return this.service.status();
  }
}
