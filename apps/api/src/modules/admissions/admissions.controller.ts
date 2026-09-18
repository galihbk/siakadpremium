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
import { PmbService } from './pmb.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { QueryApplicantsDto, UpdateApplicantStatusDto } from './dto/admin-applicant.dto';
import {
  RegisterPmbAccountDto,
  LoginPmbAccountDto,
  SaveApplicationDraftDto,
  UploadPaymentProofDto,
  VerifyDocumentDto,
  VerifyPaymentDto,
  SelectionDecisionDto,
  CreateWaveDto,
  UpdatePmbFeeConfigDto,
  CreateRegistrationTypeDto,
  CreateTrackDto,
  CreateClassDto,
} from './dto/pmb.dto';

@ApiTags('Admissions (Penerimaan Mahasiswa Baru / PMB)')
@Controller('admissions')
export class AdmissionsController {
  constructor(
    private admissionsService: AdmissionsService,
    private pmbService: PmbService,
  ) {}

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
    return this.pmbService.getDashboardStats();
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

  // ===========================================================================
  // MODUL PMB BARU (CLEAN, REAL DATABASE, DRAFT & SUBMIT, 2 BIAYA)
  // ===========================================================================

  @Post('pmb/register')
  @ApiOperation({ summary: 'Daftar Akun PMB (Nama, Email, WhatsApp, Password)' })
  async pmbRegister(@Body() dto: RegisterPmbAccountDto) {
    return this.pmbService.registerAccount(dto);
  }

  @Post('pmb/login')
  @ApiOperation({ summary: 'Login Akun PMB Calon Mahasiswa' })
  async pmbLogin(@Body() dto: LoginPmbAccountDto) {
    return this.pmbService.loginAccount(dto);
  }

  @Get('pmb/me')
  @ApiOperation({ summary: 'Profil dan Data Pendaftaran Calon Mahasiswa Login' })
  async pmbProfile(@Query('accountId') accountId: string, @Query('email') email?: string) {
    return this.pmbService.getMyProfile(accountId || email || '');
  }

  @Get('pmb/options')
  @ApiOperation({ summary: 'Opsi Master PMB (Gelombang, Jalur, Kelas, Program Studi Akademik)' })
  async pmbOptions() {
    return this.pmbService.getFormOptions();
  }

  @Get('pmb/schools')
  @ApiOperation({ summary: 'Pencarian Database Sekolah Indonesia (NPSN & Nama Sekolah Kemendikbud)' })
  async pmbSearchSchools(@Query('search') search: string) {
    return this.pmbService.searchSchools(search);
  }

  @Put('pmb/draft')
  @ApiOperation({ summary: 'Simpan Draf Formulir PMB' })
  async pmbSaveDraft(@Query('accountId') accountIdQuery: string, @Body() dto: SaveApplicationDraftDto) {
    const accountId = accountIdQuery || dto.accountId || dto.email || '';
    return this.pmbService.saveDraft(accountId, dto);
  }

  @Post('pmb/submit')
  @ApiOperation({ summary: 'Submit Formulir PMB (Generate Nomor Pendaftaran & Buat Tagihan Registrasi)' })
  async pmbSubmit(@Query('accountId') accountIdQuery: string, @Body() dto: SaveApplicationDraftDto) {
    const accountId = accountIdQuery || dto.accountId || dto.email || '';
    return this.pmbService.submitApplication(accountId, dto);
  }

  @Post('pmb/payments/:id/pay')
  @ApiOperation({ summary: 'Upload Bukti Pembayaran (Registrasi / Daftar Ulang)' })
  async pmbUploadPayment(@Param('id') paymentId: string, @Body() dto: UploadPaymentProofDto) {
    return this.pmbService.uploadPaymentProof(paymentId, dto);
  }

  // Admin PMB Endpoints
  @Get('admin/pmb/stats')
  @ApiOperation({ summary: 'Statistik Riil Dashboard Admin PMB dari PostgreSQL' })
  async adminPmbStats() {
    return this.pmbService.getDashboardStats();
  }

  @Get('admin/pmb/applications')
  @ApiOperation({ summary: 'Daftar Seluruh Pendaftar PMB untuk Admin' })
  async adminPmbApplications(@Query() query: any) {
    return this.pmbService.getAdminApplications(query);
  }

  @Get('admin/pmb/applications/:id')
  @ApiOperation({ summary: 'Detail Lengkap Pendaftar PMB untuk Admin' })
  async adminPmbApplicationDetail(@Param('id') id: string) {
    return this.pmbService.getAdminApplicationById(id);
  }

  @Patch('admin/pmb/applications/:id/verify-doc')
  @ApiOperation({ summary: 'Verifikasi Berkas Dokumen Pendaftar (Terverifikasi / Ditolak)' })
  async adminPmbVerifyDoc(@Param('id') id: string, @Body() dto: VerifyDocumentDto) {
    return this.pmbService.verifyDocument(id, dto);
  }

  @Get('admin/pmb/payments')
  @ApiOperation({ summary: 'Daftar Tagihan & Pembayaran Calon Mahasiswa (Registrasi & Daftar Ulang)' })
  async adminPmbPayments(@Query() query: any) {
    return this.pmbService.getAdminPayments(query);
  }

  @Patch('admin/pmb/payments/:id/verify')
  @ApiOperation({ summary: 'Verifikasi Pembayaran (Ubah Menjadi Lunas)' })
  async adminPmbVerifyPayment(@Param('id') paymentId: string, @Body() dto: VerifyPaymentDto) {
    return this.pmbService.verifyPayment(paymentId, dto);
  }

  @Patch('admin/pmb/applications/:id/selection')
  @ApiOperation({ summary: 'Keputusan Seleksi (Lulus, Tidak Lulus, Cadangan - Otomatis Buat Tagihan Daftar Ulang jika Lulus)' })
  async adminPmbSelection(@Param('id') id: string, @Body() dto: SelectionDecisionDto) {
    return this.pmbService.setSelectionDecision(id, dto);
  }

  @Post('admin/pmb/applications/:id/convert-student')
  @ApiOperation({ summary: 'Konversi Menjadi Mahasiswa Resmi (NIM & Akun Portal Mahasiswa Terbit Otomatis)' })
  async adminPmbConvertStudent(@Param('id') id: string) {
    return this.pmbService.convertToStudent(id);
  }

  // CRUD Gelombang
  @Get('admin/pmb/waves')
  async adminGetWaves() {
    return this.pmbService.getWaves();
  }

  @Post('admin/pmb/waves')
  async adminCreateWave(@Body() dto: CreateWaveDto) {
    return this.pmbService.createWave(dto);
  }

  @Patch('admin/pmb/waves/:id')
  async adminUpdateWave(@Param('id') id: string, @Body() dto: Partial<CreateWaveDto>) {
    return this.pmbService.updateWave(id, dto);
  }

  @Delete('admin/pmb/waves/:id')
  async adminDeleteWave(@Param('id') id: string) {
    return this.pmbService.deleteWave(id);
  }

  // CRUD Jenis Pendaftaran
  @Get('admin/pmb/registration-types')
  async adminGetRegistrationTypes() {
    return this.pmbService.getRegistrationTypes();
  }

  @Post('admin/pmb/registration-types')
  async adminCreateRegistrationType(@Body() dto: CreateRegistrationTypeDto) {
    return this.pmbService.createRegistrationType(dto);
  }

  @Patch('admin/pmb/registration-types/:id')
  async adminUpdateRegistrationType(@Param('id') id: string, @Body() dto: Partial<CreateRegistrationTypeDto>) {
    return this.pmbService.updateRegistrationType(id, dto);
  }

  @Delete('admin/pmb/registration-types/:id')
  async adminDeleteRegistrationType(@Param('id') id: string) {
    return this.pmbService.deleteRegistrationType(id);
  }

  // CRUD Jalur / Jenis Mahasiswa
  @Get('admin/pmb/tracks')
  async adminGetTracks() {
    return this.pmbService.getTracks();
  }

  @Post('admin/pmb/tracks')
  async adminCreateTrack(@Body() dto: CreateTrackDto) {
    return this.pmbService.createTrack(dto);
  }

  @Patch('admin/pmb/tracks/:id')
  async adminUpdateTrack(@Param('id') id: string, @Body() dto: Partial<CreateTrackDto>) {
    return this.pmbService.updateTrack(id, dto);
  }

  @Delete('admin/pmb/tracks/:id')
  async adminDeleteTrack(@Param('id') id: string) {
    return this.pmbService.deleteTrack(id);
  }

  // CRUD Kelas
  @Get('admin/pmb/classes')
  async adminGetClasses() {
    return this.pmbService.getClasses();
  }

  @Post('admin/pmb/classes')
  async adminCreateClass(@Body() dto: CreateClassDto) {
    return this.pmbService.createClass(dto);
  }

  @Patch('admin/pmb/classes/:id')
  async adminUpdateClass(@Param('id') id: string, @Body() dto: Partial<CreateClassDto>) {
    return this.pmbService.updateClass(id, dto);
  }

  @Delete('admin/pmb/classes/:id')
  async adminDeleteClass(@Param('id') id: string) {
    return this.pmbService.deleteClass(id);
  }

  // ===========================================================================
  // KONFIGURASI BIAYA PMB (BIAYA REGISTRASI & BIAYA DAFTAR ULANG)
  // ===========================================================================

  @Get('pmb/fee-config')
  @ApiOperation({ summary: 'Ambil konfigurasi nominal Biaya Registrasi & Biaya Daftar Ulang' })
  async getPmbFeeConfig(@Query('jenjang') jenjang?: string) {
    return this.pmbService.getFeeConfig(jenjang);
  }

  @Put('pmb/fee-config')
  @ApiOperation({ summary: 'Perbarui konfigurasi nominal Biaya Registrasi & Biaya Daftar Ulang' })
  async updatePmbFeeConfig(@Body() dto: UpdatePmbFeeConfigDto) {
    return this.pmbService.updateFeeConfig(dto);
  }
}
