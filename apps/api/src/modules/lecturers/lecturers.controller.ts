import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LecturersService, CreateLecturerDto, UpdateLecturerDto } from './lecturers.service';

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

  @Get('advisees')
  @ApiOperation({ summary: 'Mendapatkan daftar mahasiswa bimbingan PA & skripsi dosen' })
  async getAdvisees(
    @Query('angkatan') angkatan?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.lecturersService.getAdvisees({
      angkatan: angkatan ? parseInt(angkatan, 10) : undefined,
      status,
      search,
    });
  }

  @Post('advisees/:id/approve-krs')
  @ApiOperation({ summary: 'Validasi dan setujui KRS mahasiswa bimbingan' })
  async approveStudentKrs(@Param('id') id: string, @Body() body: { note?: string }) {
    return this.lecturersService.approveStudentKrs(id, body?.note);
  }

  @Post('advisees/:id/consultations')
  @ApiOperation({ summary: 'Tambahkan log/catatan konsultasi bimbingan mahasiswa' })
  async addAdviseeConsultation(
    @Param('id') id: string,
    @Body() body: { topic: string; note: string },
  ) {
    return this.lecturersService.addAdviseeConsultation(id, body);
  }

  // ================= P3M ENDPOINTS =================
  @Get('p3m')
  @ApiOperation({ summary: 'Mendapatkan daftar laporan penelitian & pengabdian (P3M)' })
  async getP3mReports(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.lecturersService.getP3mReports({
      type,
      year: year ? parseInt(year, 10) : undefined,
      status,
      search,
    });
  }

  @Post('p3m')
  @ApiOperation({ summary: 'Mendaftarkan usulan / laporan kegiatan P3M baru' })
  async createP3mReport(@Body() body: any) {
    return this.lecturersService.createP3mReport(body);
  }

  @Put('p3m/:id')
  @ApiOperation({ summary: 'Memperbarui laporan kegiatan P3M' })
  async updateP3mReport(@Param('id') id: string, @Body() body: any) {
    return this.lecturersService.updateP3mReport(id, body);
  }

  @Delete('p3m/:id')
  @ApiOperation({ summary: 'Menghapus laporan kegiatan P3M' })
  async deleteP3mReport(@Param('id') id: string) {
    return this.lecturersService.deleteP3mReport(id);
  }

  @Get()
  @ApiOperation({ summary: 'Mengambil daftar seluruh akun dosen' })
  async findAll() {
    return this.lecturersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mengambil detail satu dosen berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.lecturersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Membuat akun dosen baru' })
  async create(@Body() dto: CreateLecturerDto) {
    return this.lecturersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui profil & akun dosen' })
  async update(@Param('id') id: string, @Body() dto: UpdateLecturerDto) {
    return this.lecturersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus akun dosen' })
  async remove(@Param('id') id: string) {
    return this.lecturersService.remove(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset password akun dosen' })
  async resetPassword(@Param('id') id: string, @Body() body: { newPassword?: string }) {
    return this.lecturersService.resetPassword(id, body?.newPassword);
  }
}
