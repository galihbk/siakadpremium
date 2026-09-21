import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { SubmitKrsDto } from './dto/submit-krs.dto';

@ApiTags('Students (Mahasiswa)')
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  private extractUserId(req: any): string | undefined {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
          if (payload?.sub) return payload.sub;
        }
      } catch {}
    }
    return req?.headers?.['x-user-id'] || req?.headers?.['x-userid'];
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard akademik mahasiswa (IPK, SKS, KRS, SPP)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard mahasiswa berhasil dimuat' })
  async getDashboardSummary(@Req() req: any) {
    const userId = this.extractUserId(req);
    return this.studentsService.getDashboardSummary(userId);
  }

  @Get('krs')
  @ApiOperation({ summary: 'Mendapatkan daftar Kartu Rencana Studi (KRS) aktif semester ini' })
  async getKrs(@Req() req: any, @Query('studyProgramId') studyProgramId?: string) {
    const userId = this.extractUserId(req);
    return this.studentsService.getKrs(userId, studyProgramId);
  }

  @Post('krs')
  @ApiOperation({ summary: 'Mengajukan/memperbarui pilihan mata kuliah KRS mahasiswa' })
  async submitKrs(@Req() req: any, @Body() dto: SubmitKrsDto) {
    const userId = this.extractUserId(req);
    return this.studentsService.submitKrs(userId, dto.courseIds);
  }

  @Get('list')
  @ApiOperation({ summary: 'Mendapatkan daftar semua mahasiswa dari database' })
  async getStudentsList() {
    return this.studentsService.getStudentsList();
  }
}
