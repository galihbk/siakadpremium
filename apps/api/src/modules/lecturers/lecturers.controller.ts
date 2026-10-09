import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LecturersService, CreateLecturerDto, UpdateLecturerDto } from './lecturers.service';

@ApiTags('Lecturers (Dosen)')
@Controller('lecturers')
export class LecturersController {
  constructor(
    private lecturersService: LecturersService,
    private jwtService: JwtService,
  ) {}

  // Identitas dosen HANYA dari JWT yang tervalidasi tanda tangannya (header x-lecturer-id tidak dipercaya).
  // Jika token tidak memuat lecturerId, dicari dari userId (sub) supaya sesi lama tetap valid.
  private async extractLecturerId(req: any): Promise<string | undefined> {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otentikasi tidak ditemukan.');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(authHeader.slice(7));
    } catch {
      throw new UnauthorizedException('Token otentikasi tidak valid atau telah kedaluwarsa.');
    }
    if (payload?.lecturerId) return payload.lecturerId;
    return this.lecturersService.findLecturerIdByUserId(payload?.sub);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard dosen (jadwal mengajar, bimbingan, nilai)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard dosen berhasil dimuat' })
  async getDashboardSummary() {
    return this.lecturersService.getDashboardSummary();
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Mendapatkan jadwal mengajar dosen aktif semester ini' })
  async getTeachingSchedule(@Req() req: any, @Query('academicYearId') academicYearId?: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getTeachingSchedule(lecturerId, academicYearId);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'Riwayat tahun akademik tempat dosen mengampu kelas' })
  async getTeachingYears(@Req() req: any) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getTeachingYears(lecturerId);
  }

  // ================= ABSENSI PERKULIAHAN =================
  @Get('classes/:classId/attendance')
  @ApiOperation({ summary: 'Mendapatkan roster & status kehadiran mahasiswa untuk satu pertemuan' })
  async getAttendance(@Req() req: any, @Param('classId') classId: string, @Query('meeting') meeting: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getAttendance(lecturerId, classId, Number(meeting) || 1);
  }

  @Post('classes/:classId/attendance')
  @ApiOperation({ summary: 'Menyimpan absensi kehadiran mahasiswa untuk satu pertemuan' })
  async saveAttendance(
    @Req() req: any,
    @Param('classId') classId: string,
    @Body() body: { meetingNumber: number; date?: string; topic?: string; records: Array<{ studentId: string; status: string; notes?: string }> },
  ) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.saveAttendance(lecturerId, classId, body);
  }

  @Get('classes/:classId/attendance/recap')
  @ApiOperation({ summary: 'Rekap kehadiran mahasiswa satu kelas sepanjang semester' })
  async getAttendanceRecap(@Req() req: any, @Param('classId') classId: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getAttendanceRecap(lecturerId, classId);
  }

  // ================= KONTRAK KULIAH (RPS) =================
  @Get('classes/:classId/contract')
  @ApiOperation({ summary: 'Mendapatkan kontrak kuliah (RPS) satu kelas' })
  async getCourseContract(@Req() req: any, @Param('classId') classId: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getCourseContract(lecturerId, classId);
  }

  @Put('classes/:classId/contract')
  @ApiOperation({ summary: 'Menyimpan kontrak kuliah (RPS) satu kelas' })
  async saveCourseContract(@Req() req: any, @Param('classId') classId: string, @Body() body: any) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.saveCourseContract(lecturerId, classId, body);
  }

  // ================= UPLOAD RPS (BERKAS) =================
  @Get('classes/:classId/rps')
  @ApiOperation({ summary: 'Mendapatkan berkas RPS yang sudah diunggah untuk satu kelas' })
  async getRps(@Req() req: any, @Param('classId') classId: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getRps(lecturerId, classId);
  }

  @Post('classes/:classId/rps')
  @ApiOperation({ summary: 'Mengunggah berkas RPS untuk satu kelas (URL berkas dari /storage/upload)' })
  async saveRps(@Req() req: any, @Param('classId') classId: string, @Body() body: { fileUrl: string; fileName: string }) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.saveRps(lecturerId, classId, body);
  }

  @Get('advisees')
  @ApiOperation({ summary: 'Mendapatkan daftar mahasiswa bimbingan PA & skripsi dosen' })
  async getAdvisees(
    @Req() req: any,
    @Query('angkatan') angkatan?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getAdvisees(lecturerId, {
      angkatan: angkatan ? parseInt(angkatan, 10) : undefined,
      status,
      search,
    });
  }

  @Get('advisees/:id/detail')
  @ApiOperation({ summary: 'Detail lengkap mahasiswa bimbingan: biodata, keluarga, jalur masuk, riwayat KRS' })
  async getAdviseeDetail(@Req() req: any, @Param('id') id: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.getAdviseeDetail(lecturerId, id);
  }

  @Post('advisees/:id/approve-krs')
  @ApiOperation({ summary: 'Validasi dan setujui KRS mahasiswa bimbingan' })
  async approveStudentKrs(@Req() req: any, @Param('id') id: string, @Body() body: { note?: string }) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.approveStudentKrs(lecturerId, id, body?.note);
  }

  @Post('advisees/:id/consultations')
  @ApiOperation({ summary: 'Tambahkan log/catatan konsultasi bimbingan mahasiswa' })
  async addAdviseeConsultation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { topic: string; note: string },
  ) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lecturersService.addAdviseeConsultation(lecturerId, id, body);
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

  @Put(':id/structural-position')
  @ApiOperation({ summary: 'Menetapkan/menghapus jabatan struktural dosen (Dekan/Kaprodi)' })
  async setStructuralPosition(
    @Param('id') id: string,
    @Body() body: { position: 'DEKAN' | 'KAPRODI' | null; facultyId?: string; studyProgramId?: string },
  ) {
    return this.lecturersService.setStructuralPosition(id, body);
  }
}
