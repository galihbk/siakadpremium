import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ObePortalResult, ObePortalService } from './obe-portal.service';

/** Capaian OBE mahasiswa yang sedang login (hanya miliknya sendiri), untuk portal mahasiswa. */
@ApiTags('Integrasi OBE')
@Controller('students/me/obe')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class ObePortalController {
  constructor(private readonly service: ObePortalService) {}

  @Get('enabled')
  @ApiOperation({ summary: 'Apakah kampus ini memakai OBE (menu Capaian OBE tampil)' })
  enabled() {
    return { enabled: this.service.enabled() };
  }

  @Get()
  @ApiOperation({ summary: 'Capaian CPL, CPMK, dan nilai komponen mahasiswa yang login, dari OBE' })
  mine(@Req() req: { user?: { sub?: string } }): Promise<ObePortalResult> {
    return this.service.forUser(req.user?.sub as string);
  }
}
