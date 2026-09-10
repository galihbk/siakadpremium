import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdmissionsService } from './admissions.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';

@ApiTags('Admissions (Penerimaan Mahasiswa Baru / PMB)')
@Controller('admissions')
export class AdmissionsController {
  constructor(private admissionsService: AdmissionsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Pendaftaran calon mahasiswa baru (PMB)' })
  @ApiResponse({ status: 201, description: 'Pendaftaran berhasil dan nomor registrasi diterbitkan' })
  async register(@Body() dto: RegisterApplicantDto) {
    return this.admissionsService.register(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Mendapatkan informasi gelombang dan statistik PMB aktif' })
  async getSummary() {
    return this.admissionsService.getSummary();
  }

  @Get('status/:regNumber')
  @ApiOperation({ summary: 'Mengecek status seleksi & kelulusan calon mahasiswa' })
  async checkStatus(@Param('regNumber') regNumber: string) {
    return this.admissionsService.checkStatus(regNumber);
  }
}
