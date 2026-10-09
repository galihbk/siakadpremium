import { Body, Controller, Get, Param, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LettersService } from './letters.service';

@ApiTags('Letters (Layanan Surat Mahasiswa)')
@Controller('letters')
export class LettersController {
  constructor(
    private readonly lettersService: LettersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // Identitas HANYA dari token JWT yang tervalidasi tanda tangannya.
  private verifyToken(req: any): { sub?: string; lecturerId?: string; email?: string } {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otentikasi tidak ditemukan.');
    }
    try {
      return this.jwtService.verify(authHeader.slice(7));
    } catch {
      throw new UnauthorizedException('Token otentikasi tidak valid atau telah kedaluwarsa.');
    }
  }

  private async extractLecturerId(req: any): Promise<string | undefined> {
    const payload = this.verifyToken(req);
    if (payload.lecturerId) return payload.lecturerId;
    if (!payload.sub) return undefined;
    const lec = await this.prisma.lecturer.findUnique({ where: { userId: payload.sub }, select: { id: true } });
    return lec?.id;
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Mendapatkan katalog jenis surat & aturan verifikasinya' })
  getCatalog() {
    return this.lettersService.getCatalog();
  }

  // ================= MAHASISWA =================
  @Get('my')
  @ApiOperation({ summary: 'Mendapatkan riwayat permohonan surat mahasiswa yang login' })
  async getMyLetters(@Req() req: any) {
    const { sub } = this.verifyToken(req);
    return this.lettersService.listForStudent(sub);
  }

  @Post()
  @ApiOperation({ summary: 'Mengajukan permohonan surat baru' })
  async createLetter(
    @Req() req: any,
    @Body() body: { typeCode: string; purpose: string; targetInstitution: string; targetPerson?: string; studentNote?: string },
  ) {
    const { sub } = this.verifyToken(req);
    return this.lettersService.createForStudent(sub, body);
  }

  // ================= DOSEN PEMBIMBING AKADEMIK =================
  @Get('advisor/queue')
  @ApiOperation({ summary: 'Mendapatkan daftar permohonan surat mahasiswa bimbingan yang menunggu verifikasi' })
  async getAdvisorQueue(@Req() req: any, @Query('status') status?: string) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lettersService.listForAdvisor(lecturerId, { status });
  }

  @Post(':id/advisor-approve')
  @ApiOperation({ summary: 'Dosen PA menyetujui permohonan surat mahasiswa bimbingan' })
  async advisorApprove(@Req() req: any, @Param('id') id: string, @Body() body?: { note?: string }) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lettersService.advisorDecision(lecturerId, id, 'APPROVE', body?.note);
  }

  @Post(':id/advisor-reject')
  @ApiOperation({ summary: 'Dosen PA menolak permohonan surat mahasiswa bimbingan' })
  async advisorReject(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    const lecturerId = await this.extractLecturerId(req);
    return this.lettersService.advisorDecision(lecturerId, id, 'REJECT', body?.reason);
  }

  // ================= BAAK =================
  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh permohonan surat mahasiswa (BAAK)' })
  async getAllForBaak(@Query('status') status?: string, @Query('search') search?: string) {
    return this.lettersService.listForBaak({ status, search });
  }

  @Post(':id/issue')
  @ApiOperation({ summary: 'BAAK menerbitkan surat resmi (nomor surat & isi surat final)' })
  async issueLetter(@Req() req: any, @Param('id') id: string, @Body() body?: { letterBody?: string }) {
    let email: string | undefined;
    try {
      email = this.verifyToken(req).email;
    } catch {
      // Endpoint BAAK belum diberi guard peran khusus (konsisten dengan modul admin lain di API ini);
      // token tetap dibaca kalau ada untuk mencatat siapa yang memproses, tapi tidak wajib.
    }
    return this.lettersService.baakIssue(id, email, body);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'BAAK menolak permohonan surat' })
  async rejectLetter(@Req() req: any, @Param('id') id: string, @Body() body: { reason: string }) {
    let email: string | undefined;
    try {
      email = this.verifyToken(req).email;
    } catch {
      // lihat catatan di issueLetter()
    }
    return this.lettersService.baakReject(id, email, body?.reason);
  }
}
