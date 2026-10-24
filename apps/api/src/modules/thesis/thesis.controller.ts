import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AddGuidanceDto,
  AssignSupervisorsDto,
  DefenseResultDto,
  RecordGuidanceDto,
  RegisterDefenseDto,
  ScheduleDefenseDto,
  SubmitProposalDto,
  ThesisService,
  UpdateThesisSettingsDto,
} from './thesis.service';

/**
 * Alur Tugas Akhir/Skripsi: mahasiswa (/thesis/me), dosen pembimbing/penguji
 * (/thesis/lecturer), dan BAAK (/thesis/admin). Identitas selalu dari JWT.
 */
@ApiTags('Thesis (Tugas Akhir / Skripsi)')
@Controller('thesis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThesisController {
  constructor(private readonly thesisService: ThesisService) {}

  // ================= MAHASISWA =================
  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Status tugas akhir mahasiswa yang login (tahap, pembimbing, bimbingan, seminar/ujian)' })
  getMine(@Req() req: any) {
    return this.thesisService.getMine(req.user.sub);
  }

  @Post('me/proposal')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mengajukan proposal (atau mengajukan ulang setelah ditolak)' })
  submitProposal(@Req() req: any, @Body() dto: SubmitProposalDto) {
    return this.thesisService.submitProposal(req.user.sub, dto);
  }

  @Post('me/guidance')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mencatat bimbingan dengan dosen pembimbing' })
  addGuidance(@Req() req: any, @Body() dto: AddGuidanceDto) {
    return this.thesisService.addGuidance(req.user.sub, dto);
  }

  @Post('me/defense')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mendaftar seminar proposal atau ujian skripsi' })
  registerDefense(@Req() req: any, @Body() dto: RegisterDefenseDto) {
    return this.thesisService.registerDefense(req.user.sub, dto);
  }

  // ================= DOSEN =================
  @Get('lecturer')
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Mahasiswa bimbingan skripsi (dan yang diuji) milik dosen yang login' })
  listForLecturer(@Req() req: any) {
    return this.thesisService.listForLecturer(req.user.sub);
  }

  @Post('lecturer/guidance/:id/review')
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Menanggapi catatan bimbingan mahasiswa' })
  reviewGuidance(@Req() req: any, @Param('id') id: string, @Body() body: { feedback?: string }) {
    return this.thesisService.reviewGuidance(req.user.sub, id, body?.feedback);
  }

  @Post('lecturer/:projectId/guidance')
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'Dosen pembimbing mencatat sesi bimbingan (tanggal, bab, deskripsi)' })
  recordGuidance(@Req() req: any, @Param('projectId') projectId: string, @Body() dto: RecordGuidanceDto) {
    return this.thesisService.recordGuidance(req.user.sub, projectId, dto);
  }

  @Get('settings')
  @Roles(UserRole.LECTURER, UserRole.STUDENT, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Pengaturan bimbingan tugas akhir (minimal bimbingan & daftar bab)' })
  getSettings() {
    return this.thesisService.getSettings();
  }

  @Put('admin/settings')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Mengubah pengaturan bimbingan tugas akhir' })
  updateSettings(@Body() dto: UpdateThesisSettingsDto) {
    return this.thesisService.updateSettings(dto);
  }

  @Post('lecturer/:projectId/approve')
  @Roles(UserRole.LECTURER)
  @ApiOperation({ summary: 'ACC proposal atau skripsi oleh dosen pembimbing' })
  approve(@Req() req: any, @Param('projectId') projectId: string, @Body() body: { phase?: string }) {
    return this.thesisService.approve(req.user.sub, projectId, body?.phase || '');
  }

  // ================= ADMIN (BAAK) =================
  @Get('admin/grades/pending')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Jumlah nilai sidang yang tertunda ditulis ke KRS' })
  pendingGrades() {
    return this.thesisService.pendingGradeCount();
  }

  @Post('admin/grades/sync')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Terapkan ulang nilai sidang yang tertunda ke KRS' })
  syncGrades() {
    return this.thesisService.syncPendingGrades();
  }

  @Post('admin/defenses/:defenseId/grade')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Terapkan ulang nilai satu sidang ke KRS' })
  applyGrade(@Param('defenseId') defenseId: string) {
    return this.thesisService.applyDefenseGrade(defenseId);
  }

  @Get('admin/supervisor-load')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Jumlah mahasiswa bimbingan aktif per dosen (untuk plotting pembimbing)' })
  supervisorLoad() {
    return this.thesisService.supervisorLoad();
  }

  @Get('admin/pending-count')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Jumlah tugas akhir yang menunggu tindakan BAAK (lencana sidebar)' })
  pendingCount() {
    return this.thesisService.pendingCountForAdmin();
  }

  @Get('admin')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar tugas akhir seluruh mahasiswa (filter tahap & pencarian, server-side)' })
  listAdmin(
    @Query('stage') stage?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.thesisService.listAdmin({ stage, search, page, pageSize });
  }

  @Post('admin/:projectId/supervisors')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Plotting dosen pembimbing 1 & 2' })
  assignSupervisors(@Param('projectId') projectId: string, @Body() dto: AssignSupervisorsDto) {
    return this.thesisService.assignSupervisors(projectId, dto);
  }

  @Post('admin/:projectId/reject')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menolak proposal (mahasiswa mengajukan ulang)' })
  rejectProposal(@Param('projectId') projectId: string, @Body() body: { note?: string }) {
    return this.thesisService.rejectProposal(projectId, body?.note);
  }

  @Post('admin/defenses/:defenseId/schedule')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menjadwalkan seminar proposal/ujian skripsi dan memilih dosen penguji' })
  scheduleDefense(@Param('defenseId') defenseId: string, @Body() dto: ScheduleDefenseDto) {
    return this.thesisService.scheduleDefense(defenseId, dto);
  }

  @Post('admin/defenses/:defenseId/result')
  @Roles(UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Input hasil seminar proposal / nilai ujian skripsi' })
  inputDefenseResult(@Param('defenseId') defenseId: string, @Body() dto: DefenseResultDto) {
    return this.thesisService.inputDefenseResult(defenseId, dto);
  }
}
