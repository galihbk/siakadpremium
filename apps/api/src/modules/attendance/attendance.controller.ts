import { Controller, Get, Post, Body, Query, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance (Absensi Harian)')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private jwtService: JwtService,
  ) {}

  // Identitas pengguna HANYA dari JWT yang tervalidasi tanda tangannya.
  private extractUserId(req: any): string {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otentikasi tidak ditemukan.');
    }
    try {
      const payload = this.jwtService.verify(authHeader.slice(7));
      if (!payload?.sub) throw new UnauthorizedException('Token tidak valid.');
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Token otentikasi tidak valid atau telah kedaluwarsa.');
    }
  }

  @Get('today')
  @ApiOperation({ summary: 'Status absensi harian (pagi/sore) milik pengguna yang login' })
  async getToday(@Req() req: any) {
    const userId = this.extractUserId(req);
    return await this.attendanceService.getToday(userId);
  }

  @Post('check-in')
  @ApiOperation({ summary: 'Absen pagi atau sore untuk pengguna yang login' })
  async checkIn(@Req() req: any, @Body() body: { session: 'PAGI' | 'SORE' }) {
    const userId = this.extractUserId(req);
    return await this.attendanceService.checkIn(userId, body.session);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat absensi harian milik pengguna yang login per bulan' })
  async getHistory(@Req() req: any, @Query('month') month?: string, @Query('year') year?: string) {
    const userId = this.extractUserId(req);
    return await this.attendanceService.getHistory(userId, month ? Number(month) : undefined, year ? Number(year) : undefined);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import massal data absensi harian dari Excel (untuk SDM)' })
  async bulkImport(@Body() body: { rows: { email: string; date: string; pagi?: string; sore?: string }[] }) {
    return await this.attendanceService.bulkImportAttendance(body.rows || []);
  }

  @Get('recap')
  @ApiOperation({ summary: 'Rekap kehadiran seluruh dosen & karyawan dalam satu bulan (untuk SDM)' })
  async getMonthlyRecap(@Query('month') month?: string, @Query('year') year?: string) {
    return await this.attendanceService.getMonthlyRecapAllEmployees(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Get('recap-tahunan')
  @ApiOperation({ summary: 'Rekap kehadiran seluruh dosen & karyawan dalam satu tahun, untuk evaluasi tahunan SDM' })
  async getYearlyRecap(@Query('year') year?: string) {
    return await this.attendanceService.getYearlyRecapAllEmployees(year ? Number(year) : undefined);
  }
}
