import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FacultiesService } from './faculties.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@siakad/types';

@ApiTags('Faculties (Fakultas)')
@Controller('faculties')
export class FacultiesController {
  constructor(private facultiesService: FacultiesService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar seluruh fakultas beserta program studinya' })
  @ApiResponse({ status: 200, description: 'Daftar fakultas berhasil dimuat' })
  async findAll() {
    return this.facultiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail satu fakultas berdasarkan ID atau Kode' })
  async findOne(@Param('id') id: string) {
    return this.facultiesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Menghapus fakultas (hanya jika sudah tidak punya program studi) -- Khusus Super Admin' })
  async remove(@Param('id') id: string) {
    return this.facultiesService.remove(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Membuat fakultas baru -- Khusus Super Admin' })
  async create(
    @Body()
    body: {
      code: string;
      name: string;
      description?: string;
      building?: string;
      establishedYear?: number;
      accreditation?: string;
      skAkreditasi?: string;
    }
  ) {
    return this.facultiesService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Memperbarui data fakultas -- Khusus Super Admin' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string;
      name?: string;
      description?: string;
      building?: string;
      establishedYear?: number;
      accreditation?: string;
      skAkreditasi?: string;
    }
  ) {
    return this.facultiesService.update(id, body);
  }
}
