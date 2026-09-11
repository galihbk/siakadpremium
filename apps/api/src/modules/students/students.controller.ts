import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudentsService } from './students.service';

@ApiTags('Students (Mahasiswa)')
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard akademik mahasiswa (IPK, SKS, KRS, SPP)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard mahasiswa berhasil dimuat' })
  async getDashboardSummary() {
    return this.studentsService.getDashboardSummary();
  }

  @Get('krs')
  @ApiOperation({ summary: 'Mendapatkan daftar Kartu Rencana Studi (KRS) aktif semester ini' })
  async getKrs() {
    return this.studentsService.getKrs();
  }

  @Get('list')
  @ApiOperation({ summary: 'Mendapatkan daftar semua mahasiswa dari database' })
  async getStudentsList() {
    return this.studentsService.getStudentsList();
  }
}
