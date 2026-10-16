import { Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BackupsService } from './backups.service';

@ApiTags('Backups')
@Controller('backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class BackupsController {
  constructor(private readonly service: BackupsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar berkas backup database + info jadwal (Super Admin)' })
  async list() {
    return { ...this.service.info(), items: await this.service.list() };
  }

  @Post()
  @ApiOperation({ summary: 'Membuat backup database sekarang (Super Admin)' })
  create() {
    return this.service.create('manual');
  }

  @Get(':name/download')
  @ApiOperation({ summary: 'Mengunduh berkas backup (Super Admin)' })
  download(@Param('name') name: string, @Res() res: Response) {
    return res.download(this.service.pathFor(name), name);
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Menghapus berkas backup (Super Admin)' })
  remove(@Param('name') name: string) {
    return this.service.remove(name);
  }
}
