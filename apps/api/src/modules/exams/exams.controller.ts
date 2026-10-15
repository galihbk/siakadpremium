import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ExamsService, UpsertExamDto } from './exams.service';

/** Jadwal ujian (UTS/UAS): BAAK mengelola, mahasiswa & dosen melihat. Identitas dari JWT. */
@ApiTags('Exams (Jadwal UTS & UAS)')
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ================= ADMIN (BAAK) =================
  @Get('admin/options')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Pilihan tahun akademik & ruang untuk penjadwalan ujian' })
  getOptions() {
    return this.examsService.getOptions();
  }

  @Get('admin')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar kelas beserta jadwal ujiannya per jenis (server-side)' })
  listAdmin(
    @Query('academicYearId') academicYearId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.examsService.listAdmin({ academicYearId, type, status, search, page, pageSize });
  }

  @Post('admin/schedule')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyimpan jadwal ujian sebuah kelas (cek bentrok ruang & pengawas)' })
  upsert(@Body() dto: UpsertExamDto) {
    return this.examsService.upsertSchedule(dto);
  }

  @Delete('admin/schedule/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menghapus jadwal ujian' })
  remove(@Param('id') id: string) {
    return this.examsService.removeSchedule(id);
  }

  // ================= MAHASISWA =================
  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Jadwal UTS & UAS mahasiswa yang login (dari KRS yang disetujui)' })
  getMine(@Req() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.examsService.getMine(req.user.sub, academicYearId);
  }

  // ================= DOSEN =================
  @Get('lecturer')
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Jadwal ujian kelas yang diampu dan tugas mengawas dosen yang login' })
  getForLecturer(@Req() req: any, @Query('academicYearId') academicYearId?: string) {
    return this.examsService.getForLecturer(req.user.sub, academicYearId);
  }
}
