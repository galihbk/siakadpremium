import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { P2mService } from './p2m.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('P2M (Penjaminan Mutu)')
@Controller('p2m')
export class P2mController {
  constructor(private readonly p2mService: P2mService) {}

  // ================= OVERVIEW =================
  @Get('overview')
  @ApiOperation({ summary: 'Mendapatkan statistik ringkasan P2M (standar mutu, audit, tindak lanjut)' })
  async getOverview() {
    return this.p2mService.getOverview();
  }

  // ================= STANDAR MUTU =================
  @Get('standards')
  @ApiOperation({ summary: 'Mendapatkan daftar standar mutu (SPMI) dari database' })
  async getStandards(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.p2mService.getStandards({ category, status, search });
  }

  @Post('standards')
  @ApiOperation({ summary: 'Menambahkan standar mutu baru' })
  async createStandard(@Body() body: any) {
    return this.p2mService.createStandard(body);
  }

  @Put('standards/:id')
  @ApiOperation({ summary: 'Memperbarui standar mutu' })
  async updateStandard(@Param('id') id: string, @Body() body: any) {
    return this.p2mService.updateStandard(id, body);
  }

  @Delete('standards/:id')
  @ApiOperation({ summary: 'Menghapus standar mutu' })
  async deleteStandard(@Param('id') id: string) {
    return this.p2mService.deleteStandard(id);
  }

  // ================= AUDIT MUTU INTERNAL (AMI) =================
  @Get('audits')
  @ApiOperation({ summary: 'Mendapatkan daftar pelaksanaan Audit Mutu Internal (AMI) dari database' })
  async getAudits(
    @Query('studyProgram') studyProgram?: string,
    @Query('status') status?: string,
    @Query('result') result?: string,
    @Query('search') search?: string,
  ) {
    return this.p2mService.getAudits({ studyProgram, status, result, search });
  }

  @Post('audits')
  @ApiOperation({ summary: 'Menjadwalkan/mencatat pelaksanaan Audit Mutu Internal baru' })
  async createAudit(@Body() body: any) {
    return this.p2mService.createAudit(body);
  }

  @Put('audits/:id')
  @ApiOperation({ summary: 'Memperbarui hasil audit / status tindak lanjut' })
  async updateAudit(@Param('id') id: string, @Body() body: any) {
    return this.p2mService.updateAudit(id, body);
  }

  @Delete('audits/:id')
  @ApiOperation({ summary: 'Menghapus data audit mutu' })
  async deleteAudit(@Param('id') id: string) {
    return this.p2mService.deleteAudit(id);
  }

  // ================= VALIDASI RPS =================
  @Get('rps')
  @ApiOperation({ summary: 'Mendapatkan daftar RPS yang perlu/sudah divalidasi P2M' })
  async getRpsForValidation(
    @Query('status') status?: string,
    @Query('studyProgram') studyProgram?: string,
    @Query('search') search?: string,
  ) {
    return this.p2mService.getRpsForValidation({ status, studyProgram, search });
  }

  @Get('rps/:id')
  @ApiOperation({ summary: 'Mendapatkan detail lengkap satu RPS untuk ditinjau P2M' })
  async getRpsDetail(@Param('id') id: string) {
    return this.p2mService.getRpsDetail(id);
  }

  @Post('rps/:id/validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mengesahkan atau meminta revisi RPS -- validator diambil dari akun yang login' })
  async validateRps(@Param('id') id: string, @Body() body: { status: 'DISAHKAN' | 'PERLU_REVISI'; note?: string }, @Req() req: any) {
    const validatorName = req.user?.fullName || 'P2M';
    return this.p2mService.validateRps(id, { status: body.status, note: body.note, validatorName });
  }

  // ================= DOKUMEN MUTU =================
  @Get('documents')
  @ApiOperation({ summary: 'Mendapatkan daftar dokumen/panduan mutu dari database' })
  async getDocuments(@Query('category') category?: string, @Query('search') search?: string) {
    return this.p2mService.getDocuments({ category, search });
  }

  @Post('documents')
  @ApiOperation({ summary: 'Mengunggah dan mencatat dokumen mutu baru ke database' })
  async createDocument(@Body() body: any) {
    return this.p2mService.createDocument(body);
  }

  @Post('documents/:id/download')
  @ApiOperation({ summary: 'Menambah counter unduhan dokumen' })
  async incrementDownload(@Param('id') id: string) {
    return this.p2mService.incrementDocumentDownload(id);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Menghapus dokumen dari bank dokumen mutu' })
  async deleteDocument(@Param('id') id: string) {
    return this.p2mService.deleteDocument(id);
  }
}
