import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FacultiesService } from './faculties.service';

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
}
