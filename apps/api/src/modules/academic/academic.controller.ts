import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicService } from './academic.service';

@ApiTags('Academic (Layanan Akademik & Admin)')
@Controller('academic')
export class AcademicController {
  constructor(private academicService: AcademicService) {}

  @Get('admin-dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard administrator BAAK / Pimpinan Kampus' })
  @ApiResponse({ status: 200, description: 'Metrik dashboard admin berhasil dimuat' })
  async getAdminDashboard() {
    return this.academicService.getAdminDashboardSummary();
  }

  @Get('active-year')
  @ApiOperation({ summary: 'Mendapatkan tahun akademik aktif saat ini' })
  async getActiveYear() {
    return this.academicService.getActiveAcademicYear();
  }

  @Get('courses')
  @ApiOperation({ summary: 'Mendapatkan katalog mata kuliah' })
  async getCourses() {
    return this.academicService.getCourses();
  }
}
