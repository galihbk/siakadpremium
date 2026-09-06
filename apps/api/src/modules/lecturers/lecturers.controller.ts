import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LecturersService } from './lecturers.service';

@ApiTags('Lecturers (Dosen)')
@Controller('lecturers')
export class LecturersController {
  constructor(private lecturersService: LecturersService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard dosen (jadwal mengajar, bimbingan, nilai)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard dosen berhasil dimuat' })
  async getDashboardSummary() {
    return this.lecturersService.getDashboardSummary();
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Mendapatkan jadwal mengajar dosen aktif semester ini' })
  async getTeachingSchedule() {
    return this.lecturersService.getTeachingSchedule();
  }
}
