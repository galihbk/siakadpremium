import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApproveGraduationDto, GraduationService } from './graduation.service';

/** Yudisium & kelulusan: mahasiswa (/graduation/me) dan BAAK (/graduation/admin). Identitas dari JWT. */
@ApiTags('Graduation (Yudisium & Kelulusan)')
@Controller('graduation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GraduationController {
  constructor(private readonly graduationService: GraduationService) {}

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Syarat yudisium, ringkasan akademik, dan status pendaftaran mahasiswa yang login' })
  getMine(@Req() req: any) {
    return this.graduationService.getMine(req.user.sub);
  }

  @Post('me/apply')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mendaftar yudisium (syarat dicek ulang di server)' })
  apply(@Req() req: any) {
    return this.graduationService.apply(req.user.sub);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar pendaftar yudisium (filter status & pencarian, server-side)' })
  listAdmin(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.graduationService.listAdmin({ status, search, page, pageSize });
  }

  @Post('admin/:id/approve')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menetapkan kelulusan (status mahasiswa menjadi GRADUATED)' })
  approve(@Param('id') id: string, @Body() dto: ApproveGraduationDto) {
    return this.graduationService.approve(id, dto);
  }

  @Post('admin/:id/reject')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menolak pendaftaran yudisium' })
  reject(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.graduationService.reject(id, body?.note);
  }
}
