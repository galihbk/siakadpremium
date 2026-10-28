import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ChargeDto, FieldActivityService, GroupDto, PartnerDto, PeriodDto, RegistrationDto, ReviewDto } from './field-activity.service';

/**
 * Kegiatan Lapangan (PLP, KKN, Kerja Praktik, Magang): mahasiswa (/field-activities/me)
 * dan BAAK (/field-activities/admin). Identitas mahasiswa selalu dari JWT.
 */
@ApiTags('Field Activities (Kegiatan Lapangan)')
@Controller('field-activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldActivityController {
  constructor(private readonly service: FieldActivityService) {}

  // ================= MAHASISWA =================
  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Kegiatan lapangan mahasiswa yang login (pendaftaran, kelompok, pembimbing)' })
  getMine(@Req() req: any) {
    return this.service.getMine(req.user.sub);
  }

  @Post('me/registrations')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mendaftar kegiatan lapangan (hanya pada periode pendaftaran & bila MK sudah diambil)' })
  submitRegistration(@Req() req: any, @Body() dto: RegistrationDto) {
    return this.service.submitRegistration(req.user.sub, dto);
  }

  // ================= BAAK =================
  @Get('admin/pending-count')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Pekerjaan kegiatan lapangan yang belum diproses BAAK, total dan per jenis (lencana sidebar & tab)' })
  pendingCount() {
    return this.service.pendingSummary();
  }

  @Get('admin/charges')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Ringkasan biaya khusus satu jenis (belum ditagih, belum bayar, menunggu verifikasi, lunas)' })
  chargeSummary(@Query('categoryId') categoryId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.service.chargeSummary(categoryId, academicYearId);
  }

  @Post('admin/charges/issue')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menerbitkan tagihan biaya khusus bagi mahasiswa yang berhak ditagih dan belum punya tagihan' })
  issueCharges(@Body() dto: ChargeDto) {
    return this.service.issueCharges(dto);
  }

  @Get('admin/history')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Riwayat kegiatan lapangan satu mahasiswa pada satu mata kuliah' })
  history(@Query('studentId') studentId?: string, @Query('courseId') courseId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.service.history({ studentId, courseId, academicYearId });
  }

  @Get('admin/partners')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar mitra tempat kegiatan satu jenis' })
  listPartners(@Query('categoryId') categoryId?: string) {
    return this.service.listPartners(categoryId);
  }

  @Post('admin/partners')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menambah mitra untuk satu jenis kegiatan' })
  createPartner(@Body() dto: PartnerDto) {
    return this.service.createPartner(dto);
  }

  @Put('admin/partners/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Mengubah data atau status aktif mitra' })
  updatePartner(@Param('id') id: string, @Body() dto: PartnerDto) {
    return this.service.updatePartner(id, dto);
  }

  @Delete('admin/partners/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menghapus mitra (bila belum dipilih pendaftaran)' })
  deletePartner(@Param('id') id: string) {
    return this.service.deletePartner(id);
  }

  @Get('admin/periods')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Periode pendaftaran tiap jenis kegiatan lapangan pada satu tahun akademik' })
  listPeriods(@Query('academicYearId') academicYearId?: string) {
    return this.service.listPeriods(academicYearId || undefined);
  }

  @Put('admin/periods')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menetapkan periode pendaftaran satu jenis pada satu tahun akademik' })
  savePeriod(@Body() dto: PeriodDto) {
    return this.service.savePeriod(dto);
  }

  @Delete('admin/periods/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menghapus periode pendaftaran' })
  deletePeriod(@Param('id') id: string) {
    return this.service.deletePeriod(id);
  }

  @Get('admin/registrations')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar pendaftaran kegiatan lapangan (filter jenis, tahun akademik, status)' })
  listRegistrations(
    @Query('categoryId') categoryId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listRegistrations({ categoryId, academicYearId, status, search });
  }

  @Post('admin/registrations/:id/review')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyetujui (opsional sekaligus menetapkan pembimbing) atau menolak pendaftaran' })
  review(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.service.reviewRegistration(id, dto);
  }

  @Get('admin/groups')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Kelompok kegiatan lapangan satu jenis pada satu tahun akademik' })
  listGroups(@Query('categoryId') categoryId?: string, @Query('academicYearId') academicYearId?: string) {
    return this.service.listGroups({ categoryId, academicYearId });
  }

  @Get('admin/groups/available-students')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Mahasiswa yang mengambil MK jenis ini dan belum masuk kelompok' })
  availableStudents(
    @Query('categoryId') categoryId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('groupId') groupId?: string,
    @Query('search') search?: string,
    @Query('studyProgramId') studyProgramId?: string,
  ) {
    return this.service.availableStudents({ categoryId, academicYearId, groupId, search, studyProgramId });
  }

  @Post('admin/groups')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Membuat kelompok (anggota & satu pembimbing)' })
  createGroup(@Body() dto: GroupDto) {
    return this.service.createGroup(dto);
  }

  @Put('admin/groups/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Mengubah nama, anggota, atau pembimbing kelompok' })
  updateGroup(@Param('id') id: string, @Body() dto: GroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('admin/groups/:id')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menghapus kelompok (pembimbing anggota ikut dilepas)' })
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }
}
