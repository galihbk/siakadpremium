import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Put,
  Delete,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AdmissionsService } from './admissions.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { QueryApplicantsDto, UpdateApplicantStatusDto } from './dto/admin-applicant.dto';

@ApiTags('Admissions (Penerimaan Mahasiswa Baru / PMB)')
@Controller('admissions')
export class AdmissionsController {
  constructor(private admissionsService: AdmissionsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Pendaftaran calon mahasiswa baru (PMB)' })
  @ApiResponse({ status: 201, description: 'Pendaftaran berhasil dan tautan verifikasi dikirim ke email' })
  async register(@Body() dto: RegisterApplicantDto, @Req() req: any) {
    const origin = req.headers?.origin || (req.headers?.referer ? new URL(req.headers.referer).origin : undefined);
    return this.admissionsService.register(dto, origin);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verifikasi alamat email akun calon mahasiswa' })
  async verifyEmail(@Query('token') token: string, @Query('email') email: string) {
    return this.admissionsService.verifyEmail(token, email);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Kirim ulang email verifikasi akun pendaftaran PMB' })
  async resendVerification(@Body() body: { email: string }, @Req() req: any) {
    const origin = req.headers?.origin || (req.headers?.referer ? new URL(req.headers.referer).origin : undefined);
    return this.admissionsService.resendVerification(body.email, origin);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Mendapatkan informasi gelombang dan ringkasan PMB' })
  async getSummary() {
    return this.admissionsService.getSummary();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Mendapatkan statistik lengkap PMB langsung dari PostgreSQL' })
  async getStats() {
    return this.admissionsService.getStats();
  }

  @Get('affiliates')
  @ApiOperation({ summary: 'Mendapatkan daftar mitra affiliate dan rekap pendaftar referral' })
  async getAffiliates() {
    return this.admissionsService.getAffiliates();
  }

  @Post('affiliates')
  @ApiOperation({ summary: 'Menambahkan mitra affiliate baru' })
  async createAffiliate(@Body() body: any) {
    return this.admissionsService.createAffiliatePartner(body);
  }

  @Patch('affiliates/:code/toggle')
  @ApiOperation({ summary: 'Ubah status aktif mitra affiliate' })
  async toggleAffiliate(@Param('code') code: string) {
    return this.admissionsService.toggleAffiliateStatus(code);
  }

  @Get('batches')
  @ApiOperation({ summary: 'Mengambil daftar gelombang pendaftaran PMB' })
  async getBatches() {
    return this.admissionsService.getBatches();
  }

  @Post('batches')
  @ApiOperation({ summary: 'Menambahkan gelombang pendaftaran baru' })
  async createBatch(@Body() body: any): Promise<any> {
    return this.admissionsService.createBatch(body);
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: 'Memperbarui data gelombang pendaftaran' })
  async updateBatch(@Param('id') id: string, @Body() body: any): Promise<any> {
    return this.admissionsService.updateBatch(id, body);
  }

  @Patch('batches/:id/activate')
  @ApiOperation({ summary: 'Menjadikan gelombang sebagai periode pendaftaran aktif (Default)' })
  async activateBatch(@Param('id') id: string): Promise<any> {
    return this.admissionsService.activateBatch(id);
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: 'Menghapus gelombang pendaftaran' })
  async deleteBatch(@Param('id') id: string) {
    return this.admissionsService.deleteBatch(id);
  }

  @Get('brochure')
  @ApiOperation({ summary: 'Mengambil informasi brosur resmi PMB terbaru berdasarkan jenjang' })
  async getBrochure(@Query('jenjang') jenjang?: string) {
    return this.admissionsService.getBrochure(jenjang);
  }

  @Get('brochures')
  @ApiOperation({ summary: 'Mengambil seluruh daftar brosur resmi PMB semua jenjang' })
  async getAllBrochures() {
    return this.admissionsService.getAllBrochures();
  }

  @Post('brochure')
  @ApiOperation({ summary: 'Upload dan publikasikan brosur resmi PMB baru per jenjang' })
  async uploadBrochure(@Body() body: any) {
    return this.admissionsService.uploadBrochure(body);
  }

  @Get('brochure/track')
  @ApiOperation({ summary: 'Pelacakan jumlah download brosur PMB' })
  async trackBrochureDownload(@Query('jenjang') jenjang?: string) {
    return this.admissionsService.trackBrochureDownload(jenjang);
  }

  @Get('applicants')
  @ApiOperation({ summary: 'Mengambil daftar pendaftar dari database (Filter, Pencarian & Pagination)' })
  async getApplicants(@Query() query: QueryApplicantsDto) {
    return this.admissionsService.getApplicants(query);
  }

  @Get('applicants/:id')
  @ApiOperation({ summary: 'Mendapatkan data detail pendaftar PMB berdasarkan ID' })
  async getApplicantById(@Param('id') id: string) {
    return this.admissionsService.getApplicantById(id);
  }

  @Patch('applicants/:id/status')
  @ApiOperation({ summary: 'Update status seleksi calon mahasiswa (Verifikasi berkas, Kelulusan, Nilai CBT)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicantStatusDto,
  ) {
    return this.admissionsService.updateStatus(id, dto);
  }

  @Put('applicants/:id/form')
  @ApiOperation({ summary: 'Update formulir pendaftaran calon mahasiswa (Form Wizard)' })
  async updateApplicantForm(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.admissionsService.updateApplicantForm(id, body);
  }

  @Post('applicants')
  @ApiOperation({ summary: 'Tambah calon mahasiswa secara manual oleh Admin PMB' })
  async createApplicant(@Body() body: any) {
    return this.admissionsService.createApplicantByAdmin(body);
  }

  @Delete('applicants/:id')
  @ApiOperation({ summary: 'Hapus data pendaftar dari database' })
  async deleteApplicant(@Param('id') id: string) {
    return this.admissionsService.deleteApplicant(id);
  }

  @Post('applicants/:id/convert-to-student')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Konversi Calon Mahasiswa Lulus / Registrasi menjadi Mahasiswa Aktif SIAKAD' })
  async convertToStudent(@Param('id') id: string) {
    return this.admissionsService.convertToStudent(id);
  }

  @Get('status/:regNumber')
  @ApiOperation({ summary: 'Mengecek status seleksi & kelulusan calon mahasiswa' })
  async checkStatus(@Param('regNumber') regNumber: string) {
    return this.admissionsService.checkStatus(regNumber);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login calon mahasiswa baru / pelamar PMB' })
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  async login(@Body() body: { identifier: string; password?: string }) {
    return this.admissionsService.login(body.identifier, body.password);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Permintaan tautan reset kata sandi pendaftar PMB' })
  async forgotPassword(@Body() body: { identifier: string }, @Req() req: any) {
    const origin = req.headers['origin'] || req.headers['referer'];
    return this.admissionsService.forgotPassword(body.identifier, origin);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Eksekusi pengaturan ulang kata sandi pendaftar PMB' })
  async resetPassword(@Body() body: { token: string; email: string; newPassword: string }) {
    return this.admissionsService.resetPassword(body.token, body.email, body.newPassword);
  }
}
