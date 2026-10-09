import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicService } from './academic.service';

@ApiTags('Academic (Layanan Akademik, Kurikulum, Jadwal & Admin)')
@Controller('academic')
export class AcademicController {
  constructor(private academicService: AcademicService) {}

  @Get('admin-dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard administrator BAAK / Pimpinan Kampus' })
  @ApiResponse({ status: 200, description: 'Metrik dashboard admin berhasil dimuat' })
  async getAdminDashboard() {
    return this.academicService.getAdminDashboardSummary();
  }

  @Get('superadmin-dashboard')
  @ApiOperation({ summary: 'Mendapatkan data real-time dashboard Super Administrator dari database' })
  @ApiResponse({ status: 200, description: 'Metrik superadmin dashboard berhasil dimuat dari database' })
  async getSuperAdminDashboard() {
    return this.academicService.getSuperAdminDashboardData();
  }

  @Get('active-year')
  @ApiOperation({ summary: 'Mendapatkan tahun akademik aktif saat ini' })
  async getActiveYear() {
    return this.academicService.getActiveAcademicYear();
  }

  // ================= COURSES (MATA KULIAH) =================
  @Get('courses')
  @ApiOperation({ summary: 'Mendapatkan katalog mata kuliah dari basis data' })
  async getCourses(
    @Query('semester') semester?: number,
    @Query('type') type?: string,
    @Query('studyProgramId') studyProgramId?: string,
  ) {
    return this.academicService.getCourses({ semester, type, studyProgramId });
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Mendapatkan detail mata kuliah' })
  async getCourse(@Param('id') id: string) {
    return this.academicService.getCourse(id);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Menambahkan mata kuliah baru' })
  async createCourse(@Body() body: any) {
    return this.academicService.createCourse(body);
  }

  @Put('courses/:id')
  @ApiOperation({ summary: 'Memperbarui data mata kuliah' })
  async updateCourse(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateCourse(id, body);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Menghapus data mata kuliah' })
  async deleteCourse(@Param('id') id: string) {
    return this.academicService.deleteCourse(id);
  }

  // ================= CURRICULUMS (KURIKULUM) =================
  @Get('curriculums')
  @ApiOperation({ summary: 'Mendapatkan daftar kurikulum dari basis data' })
  async getCurriculums() {
    return this.academicService.getCurriculums();
  }

  @Get('curriculums/:id')
  @ApiOperation({ summary: 'Mendapatkan detail kurikulum' })
  async getCurriculum(@Param('id') id: string) {
    return this.academicService.getCurriculum(id);
  }

  @Post('curriculums')
  @ApiOperation({ summary: 'Menambahkan kurikulum baru' })
  async createCurriculum(@Body() body: any) {
    return this.academicService.createCurriculum(body);
  }

  @Put('curriculums/:id')
  @ApiOperation({ summary: 'Memperbarui data kurikulum' })
  async updateCurriculum(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateCurriculum(id, body);
  }

  @Delete('curriculums/:id')
  @ApiOperation({ summary: 'Menghapus kurikulum' })
  async deleteCurriculum(@Param('id') id: string) {
    return this.academicService.deleteCurriculum(id);
  }

  // ================= ACADEMIC YEARS (TAHUN AKADEMIK) =================
  @Get('years')
  @ApiOperation({ summary: 'Mendapatkan daftar tahun akademik dari basis data' })
  async getAcademicYears() {
    return this.academicService.getAcademicYears();
  }

  @Get('years/:id')
  @ApiOperation({ summary: 'Mendapatkan detail tahun akademik' })
  async getAcademicYear(@Param('id') id: string) {
    return this.academicService.getAcademicYear(id);
  }

  @Post('years')
  @ApiOperation({ summary: 'Menambahkan tahun akademik baru' })
  async createAcademicYear(@Body() body: any) {
    return this.academicService.createAcademicYear(body);
  }

  @Put('years/:id')
  @ApiOperation({ summary: 'Memperbarui tahun akademik' })
  async updateAcademicYear(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateAcademicYear(id, body);
  }

  @Delete('years/:id')
  @ApiOperation({ summary: 'Menghapus tahun akademik' })
  async deleteAcademicYear(@Param('id') id: string) {
    return this.academicService.deleteAcademicYear(id);
  }

  // ================= CALENDAR EVENTS =================
  @Get('calendar-events')
  @ApiOperation({ summary: 'Mendapatkan seluruh agenda kalender akademik dari basis data' })
  @ApiResponse({ status: 200, description: 'Agenda kalender berhasil dimuat' })
  async getCalendarEvents(
    @Query('semester') semester?: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.academicService.getCalendarEvents(semester, academicYear);
  }

  @Get('calendar-events/:id')
  @ApiOperation({ summary: 'Mendapatkan detail agenda kalender akademik' })
  async getCalendarEvent(@Param('id') id: string) {
    return this.academicService.getCalendarEvent(id);
  }

  @Post('calendar-events')
  @ApiOperation({ summary: 'Menambahkan agenda baru ke kalender akademik' })
  async createCalendarEvent(@Body() body: any) {
    return this.academicService.createCalendarEvent(body);
  }

  @Put('calendar-events/:id')
  @ApiOperation({ summary: 'Memperbarui agenda kalender akademik' })
  async updateCalendarEvent(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateCalendarEvent(id, body);
  }

  @Delete('calendar-events/:id')
  @ApiOperation({ summary: 'Menghapus agenda dari kalender akademik' })
  async deleteCalendarEvent(@Param('id') id: string) {
    return this.academicService.deleteCalendarEvent(id);
  }

  // ================= JADWAL PERKULIAHAN (SCHEDULES) =================
  @Get('schedules')
  @ApiOperation({ summary: 'Mendapatkan daftar jadwal perkuliahan' })
  async getSchedules(
    @Query('prodiId') prodiId?: string,
    @Query('day') day?: string,
    @Query('lecturerId') lecturerId?: string,
    @Query('semester') semester?: number,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.academicService.getSchedules({ prodiId, day, lecturerId, semester, academicYearId });
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Menambahkan jadwal perkuliahan baru' })
  async createSchedule(@Body() body: any) {
    return this.academicService.createSchedule(body);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Memperbarui data jadwal perkuliahan' })
  async updateSchedule(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateSchedule(id, body);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Menghapus jadwal perkuliahan' })
  async deleteSchedule(@Param('id') id: string) {
    return this.academicService.deleteSchedule(id);
  }

  // ================= PRESENSI & KEHADIRAN (ADMIN OVERVIEW) =================
  @Get('attendance-overview')
  @ApiOperation({ summary: 'Mendapatkan rekap kehadiran seluruh kelas (untuk monitoring BAAK/superadmin)' })
  async getAttendanceOverview(
    @Query('academicYearId') academicYearId?: string,
    @Query('studyProgramId') studyProgramId?: string,
  ) {
    return this.academicService.getAttendanceOverview({ academicYearId, studyProgramId });
  }

  // ================= INPUT & PENGELOLAAN NILAI (GRADES) =================
  @Get('grades/summary')
  @ApiOperation({ summary: 'Mendapatkan ringkasan rekapitulasi nilai akademik' })
  async getGradesSummary() {
    return this.academicService.getGradesSummary();
  }

  @Get('grades/classes')
  @ApiOperation({ summary: 'Mendapatkan daftar kelas yang memiliki entri nilai' })
  async getGradeClasses(@Query('lecturerId') lecturerId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.academicService.getGradeClasses(lecturerId, academicYearId);
  }

  @Get('grades/classes/:classId')
  @ApiOperation({ summary: 'Mendapatkan daftar mahasiswa dan nilai pada suatu kelas' })
  async getClassEnrollments(@Param('classId') classId: string) {
    return this.academicService.getClassEnrollments(classId);
  }

  @Post('grades/save')
  @ApiOperation({ summary: 'Menyimpan atau menerbitkan nilai mahasiswa suatu kelas secara batch' })
  async saveBatchGrades(@Body() body: { classId: string; grades: any[]; isFinalSubmit?: boolean }) {
    return this.academicService.saveBatchGrades(body.classId, {
      grades: body.grades,
      isFinalSubmit: body.isFinalSubmit,
    });
  }

  @Post('grades/lock')
  @ApiOperation({ summary: 'Mengunci atau membuka akses pengisian nilai semester' })
  async toggleGradeLock(@Body() body?: { academicYearId?: string }) {
    return this.academicService.toggleGradeLock(body?.academicYearId);
  }

  // ================= STATUS PERIODE KRS (berdasarkan jendela tanggal) =================
  @Get('krs-status')
  @ApiOperation({ summary: 'Mendapatkan status buka/tutup periode KRS tahun akademik aktif (dihitung dari jendela tanggal)' })
  async getKrsStatus() {
    return this.academicService.getKrsStatus();
  }

  // ================= MONITORING KRS LINTAS PRODI (BAAK) =================
  @Get('krs-overview')
  @ApiOperation({ summary: 'Monitoring KRS seluruh mahasiswa lintas program studi (BAAK)' })
  async getKrsOverview(
    @Query('academicYearId') academicYearId?: string,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.academicService.getKrsOverview({ academicYearId, studyProgramId, status, search });
  }

  @Post('krs-overview/:studentId/approve')
  @ApiOperation({ summary: 'BAAK menyetujui seluruh KRS mahasiswa untuk tahun akademik aktif' })
  async baakApproveKrs(@Param('studentId') studentId: string) {
    return this.academicService.baakSetKrsStatus(studentId, 'APPROVED');
  }

  @Post('krs-overview/:studentId/reject')
  @ApiOperation({ summary: 'BAAK menolak seluruh KRS mahasiswa untuk tahun akademik aktif' })
  async baakRejectKrs(@Param('studentId') studentId: string) {
    return this.academicService.baakSetKrsStatus(studentId, 'REJECTED');
  }

  // ================= BIMBINGAN SKRIPSI/TA, KKN, KERJA PRAKTIK (BAAK) =================
  @Get('thesis-supervisions')
  @ApiOperation({ summary: 'Daftar mahasiswa yang perlu/ sudah ditetapkan pembimbing skripsi/TA, KKN, KP, dst.' })
  async getThesisSupervisionCandidates(
    @Query('academicYearId') academicYearId?: string,
    @Query('courseId') courseId?: string,
    @Query('search') search?: string,
  ) {
    return this.academicService.getThesisSupervisionCandidates({ academicYearId, courseId, search });
  }

  @Post('thesis-supervisions')
  @ApiOperation({ summary: 'Menetapkan atau memperbarui pembimbing 1 & 2 skripsi/TA seorang mahasiswa' })
  async assignThesisSupervision(
    @Body()
    body: {
      studentId: string;
      courseId: string;
      academicYearId?: string;
      title?: string;
      supervisor1Id?: string | null;
      supervisor2Id?: string | null;
      notes?: string;
    },
  ) {
    return this.academicService.assignThesisSupervision(body);
  }

  @Get('feeder-entities')
  @ApiOperation({ summary: 'Jumlah baris data lokal per entitas Feeder PDDIKTI (data nyata, bukan status sinkronisasi)' })
  async getFeederEntityCounts() {
    return this.academicService.getFeederEntityCounts();
  }

  // ================= SKALA NILAI (GRADE SCALE) =================
  @Get('grade-scale/groups')
  @ApiOperation({ summary: 'Mendapatkan daftar grup skala nilai (dikelompokkan per tahun akademik/semester)' })
  async getGradeScaleGroups() {
    return this.academicService.getGradeScaleGroups();
  }

  @Post('grade-scale/groups')
  @ApiOperation({ summary: 'Membuat grup skala nilai baru untuk suatu tahun akademik' })
  async createGradeScaleGroup(@Body() body: { academicYearId?: string; label?: string; cloneFromVersionId?: string }) {
    return this.academicService.createGradeScaleGroup(body || {});
  }

  @Delete('grade-scale/groups/:id')
  @ApiOperation({ summary: 'Menghapus grup skala nilai (tidak berlaku untuk grup tahun akademik aktif)' })
  async deleteGradeScaleGroup(@Param('id') id: string) {
    return this.academicService.deleteGradeScaleGroup(id);
  }

  @Get('grade-scale')
  @ApiOperation({ summary: 'Mendapatkan baris skala nilai suatu grup (default: grup tahun akademik aktif)' })
  async getGradeScales(@Query('versionId') versionId?: string) {
    return this.academicService.getGradeScales(versionId);
  }

  @Post('grade-scale')
  @ApiOperation({ summary: 'Menambah baris skala nilai baru ke suatu grup' })
  async createGradeScale(@Body() body: any) {
    return this.academicService.createGradeScale(body);
  }

  @Put('grade-scale/:id')
  @ApiOperation({ summary: 'Memperbarui baris skala nilai' })
  async updateGradeScale(@Param('id') id: string, @Body() body: any) {
    return this.academicService.updateGradeScale(id, body);
  }

  @Delete('grade-scale/:id')
  @ApiOperation({ summary: 'Menghapus baris skala nilai' })
  async deleteGradeScale(@Param('id') id: string) {
    return this.academicService.deleteGradeScale(id);
  }
}

