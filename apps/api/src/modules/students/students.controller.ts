import { Controller, Get, Post, Put, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { StudentsService, CreateStudentDto, UpdateStudentDto } from './students.service';
import { SubmitKrsDto } from './dto/submit-krs.dto';

@ApiTags('Students (Mahasiswa)')
@Controller('students')
export class StudentsController {
  constructor(
    private studentsService: StudentsService,
    private jwtService: JwtService,
  ) {}

  // Identitas HANYA dari token JWT yang tervalidasi tanda tangannya — header x-user-id
  // tidak lagi dipercaya karena bisa dipalsukan bebas oleh klien mana pun.
  private requireUserId(req: any): string {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otentikasi tidak ditemukan.');
    }
    try {
      const token = authHeader.slice(7);
      const decoded: any = this.jwtService.verify(token);
      if (decoded?.sub) return decoded.sub;
    } catch {
      // fall through to throw below
    }
    throw new UnauthorizedException('Token otentikasi tidak valid atau telah kedaluwarsa.');
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard akademik mahasiswa (IPK, SKS, KRS, SPP)' })
  @ApiResponse({ status: 200, description: 'Ringkasan dashboard mahasiswa berhasil dimuat' })
  async getDashboardSummary(@Req() req: any) {
    const userId = this.requireUserId(req);
    return this.studentsService.getDashboardSummary(userId);
  }

  @Get('krs')
  @ApiOperation({ summary: 'Mendapatkan daftar Kartu Rencana Studi (KRS) aktif semester ini' })
  async getKrs(@Req() req: any, @Query('studyProgramId') studyProgramId?: string) {
    const userId = this.requireUserId(req);
    return this.studentsService.getKrs(userId, studyProgramId);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Mendapatkan jadwal kuliah mingguan mahasiswa dari KRS yang sudah disetujui' })
  async getSchedule(@Req() req: any) {
    const userId = this.requireUserId(req);
    return this.studentsService.getSchedule(userId);
  }

  @Post('krs')
  @ApiOperation({ summary: 'Mengajukan/memperbarui pilihan mata kuliah KRS mahasiswa' })
  async submitKrs(@Req() req: any, @Body() dto: SubmitKrsDto) {
    const userId = this.requireUserId(req);
    return this.studentsService.submitKrs(userId, dto.courseIds);
  }

  @Get('list')
  @ApiOperation({ summary: 'Mendapatkan daftar semua mahasiswa dari database' })
  async getStudentsList() {
    return this.studentsService.getStudentsList();
  }

  @Get('advisor-counts')
  @ApiOperation({ summary: 'Jumlah mahasiswa bimbingan aktif per dosen PA (mahasiswa cuti/lulus/DO/pindah tidak dihitung)' })
  async getActiveAdvisorCounts() {
    return this.studentsService.getActiveAdvisorCounts();
  }

  @Post()
  @ApiOperation({ summary: 'Membuat akun mahasiswa baru secara manual' })
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail satu mahasiswa berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui data satu mahasiswa berdasarkan ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }
}
