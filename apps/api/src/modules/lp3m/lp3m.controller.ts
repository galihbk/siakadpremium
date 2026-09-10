import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Lp3mService } from './lp3m.service';

@ApiTags('LP3M (Lembaga Penelitian & Pengabdian kepada Masyarakat)')
@Controller('lp3m')
export class Lp3mController {
  constructor(private readonly lp3mService: Lp3mService) {}

  // ================= 1. OVERVIEW =================
  @Get('overview')
  @ApiOperation({ summary: 'Mendapatkan statistik ringkasan dan KPI LP3M dari basis data' })
  @ApiResponse({ status: 200, description: 'Statistik LP3M berhasil dimuat' })
  async getOverview() {
    return this.lp3mService.getOverview();
  }

  // ================= 2. RESEARCH & PKM =================
  @Get('research')
  @ApiOperation({ summary: 'Mendapatkan daftar usulan penelitian dan pengabdian dari database' })
  async getResearches(
    @Query('type') type?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('faculty') faculty?: string,
  ) {
    return this.lp3mService.getResearches({ type, year, status, search, faculty });
  }

  @Get('research/:id')
  @ApiOperation({ summary: 'Mendapatkan detail usulan riset berdasarkan ID' })
  async getResearchById(@Param('id') id: string) {
    return this.lp3mService.getResearchById(id);
  }

  @Post('research')
  @ApiOperation({ summary: 'Mendaftarkan usulan kegiatan penelitian atau pengabdian baru ke database' })
  async createResearch(@Body() body: any) {
    return this.lp3mService.createResearch(body);
  }

  @Put('research/:id')
  @ApiOperation({ summary: 'Memperbarui usulan atau menyimpan catatan review evaluasi' })
  async updateResearch(@Param('id') id: string, @Body() body: any) {
    return this.lp3mService.updateResearch(id, body);
  }

  @Delete('research/:id')
  @ApiOperation({ summary: 'Menghapus usulan kegiatan LP3M dari database' })
  async deleteResearch(@Param('id') id: string) {
    return this.lp3mService.deleteResearch(id);
  }

  // ================= 3. SENTRA HAKI =================
  @Get('haki')
  @ApiOperation({ summary: 'Mendapatkan daftar permohonan sertifikat HAKI & Paten dari database' })
  async getHakiList(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.lp3mService.getHakiList({ status, search });
  }

  @Post('haki')
  @ApiOperation({ summary: 'Mendaftarkan permohonan HAKI/Paten baru ke database' })
  async createHaki(@Body() body: any) {
    return this.lp3mService.createHaki(body);
  }

  @Delete('haki/:id')
  @ApiOperation({ summary: 'Menghapus data HAKI dari database' })
  async deleteHaki(@Param('id') id: string) {
    return this.lp3mService.deleteHaki(id);
  }

  // ================= 4. BANK DOKUMEN =================
  @Get('documents')
  @ApiOperation({ summary: 'Mendapatkan daftar repositori dokumen & regulasi LP3M dari database' })
  async getDocuments(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.lp3mService.getDocuments({ category, search });
  }

  @Post('documents')
  @ApiOperation({ summary: 'Mengunggah dan mencatat dokumen regulasi/panduan baru ke database' })
  async createDocument(@Body() body: any) {
    return this.lp3mService.createDocument(body);
  }

  @Post('documents/:id/download')
  @ApiOperation({ summary: 'Menambah counter unduhan dokumen' })
  async incrementDownload(@Param('id') id: string) {
    return this.lp3mService.incrementDocumentDownload(id);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Menghapus dokumen dari bank dokumen LP3M' })
  async deleteDocument(@Param('id') id: string) {
    return this.lp3mService.deleteDocument(id);
  }

  // ================= 5. REKAP BORANG =================
  @Get('borang')
  @ApiOperation({ summary: 'Mendapatkan rekapitulasi data borang akreditasi C.6 & C.7 dari database' })
  async getBorangRecords(
    @Query('faculty') faculty?: string,
    @Query('search') search?: string,
  ) {
    return this.lp3mService.getBorangRecords({ faculty, search });
  }
}
