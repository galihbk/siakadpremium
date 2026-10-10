import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { FeeRulesService } from './fee-rules.service';

@ApiTags('Finance (Biro Keuangan)')
@Controller('finance')
export class FinanceController {
  constructor(
    private financeService: FinanceService,
    private feeRulesService: FeeRulesService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Mendapatkan ringkasan dashboard keuangan, rekening kas bank, dan alokasi anggaran' })
  async getDashboard() {
    return await this.financeService.getSummary();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Mendapatkan riwayat transaksi dan tagihan pembayaran mahasiswa' })
  async getTransactions(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return await this.financeService.getTransactions({ status, type, search });
  }

  @Post('transactions/:id/verify')
  @ApiOperation({ summary: 'Verifikasi pembayaran manual mahasiswa menjadi Lunas (aksi Biro Keuangan)' })
  async verifyTransaction(@Param('id') id: string) {
    return await this.financeService.verifyTransaction(id);
  }

  @Post('transactions/:id/submit-payment')
  @ApiOperation({ summary: 'Mahasiswa mengirim pembayaran (kanal otomatis) atau mengunggah bukti transfer manual' })
  async submitStudentPayment(@Param('id') id: string, @Body() body: { channel: string; proofUrl?: string }) {
    return await this.financeService.submitStudentPayment(id, body);
  }

  @Post('invoices')
  @ApiOperation({ summary: 'Menerbitkan tagihan baru untuk mahasiswa' })
  async createInvoice(@Body() body: any) {
    return await this.financeService.createInvoice(body);
  }

  @Get('invoices/student/:nim')
  @ApiOperation({ summary: 'Mendapatkan semua tagihan mahasiswa berdasarkan NIM' })
  async getInvoicesByStudent(@Param('nim') nim: string) {
    return await this.financeService.getInvoicesByStudent(nim);
  }

  @Get('teaching-recap')
  @ApiOperation({ summary: 'Rekapitulasi mengajar dosen per semester (kelas, SKS, pertemuan)' })
  async getTeachingRecap(@Query('academicYearId') academicYearId?: string) {
    return await this.financeService.getTeachingRecap(academicYearId);
  }

  @Get('transport-rate')
  @ApiOperation({ summary: 'Tarif uang transport pagi & sore yang berlaku untuk semua dosen/karyawan' })
  async getTransportRate() {
    return await this.financeService.getTransportRate();
  }

  @Put('transport-rate')
  @ApiOperation({ summary: 'Ubah tarif uang transport pagi & sore' })
  async updateTransportRate(@Body() body: { ratePagi?: number; rateSore?: number; updatedBy?: string }) {
    return await this.financeService.updateTransportRate(body);
  }

  @Get('honor-rate-jenjang')
  @ApiOperation({ summary: 'Tarif honor per SKS untuk tiap jenjang prodi (D3/D4/S1/S2/S3/Profesi)' })
  async getHonorRateJenjang() {
    return await this.financeService.getHonorRateJenjang();
  }

  @Put('honor-rate-jenjang/:degreeLevel')
  @ApiOperation({ summary: 'Ubah tarif honor per SKS untuk satu jenjang' })
  async updateHonorRateJenjang(@Param('degreeLevel') degreeLevel: string, @Body() body: { ratePerSks: number }) {
    return await this.financeService.upsertHonorRateJenjang(degreeLevel, body.ratePerSks);
  }

  @Get('honor-recap')
  @ApiOperation({ summary: 'Rekap honor dosen & karyawan per semester (gaji pokok, honor mengajar, tunjangan)' })
  async getHonorRecap(
    @Query('academicYearId') academicYearId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return await this.financeService.getHonorRecap(
      academicYearId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  @Post('honor-recap/:userId/mark-paid')
  @ApiOperation({ summary: 'Tandai honor seorang pegawai sudah dibayarkan untuk satu periode bulan (snapshot beku)' })
  async markHonorPaid(
    @Param('userId') userId: string,
    @Body() body: { academicYearId?: string; month: number; year: number; paidBy?: string; notes?: string },
  ) {
    return await this.financeService.markHonorPaid(userId, body);
  }

  @Delete('honor-recap/:userId/mark-paid')
  @ApiOperation({ summary: 'Batalkan status sudah dibayar honor seorang pegawai untuk satu periode bulan' })
  async unmarkHonorPaid(
    @Param('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return await this.financeService.unmarkHonorPaid(userId, Number(month), Number(year));
  }

  @Get('payroll')
  @ApiOperation({ summary: 'Daftar pengaturan gaji & honor dosen dan karyawan' })
  async getPayrollSettings(@Query('search') search?: string) {
    return await this.financeService.getPayrollSettings(search);
  }

  @Put('payroll/:userId')
  @ApiOperation({ summary: 'Simpan gaji pokok, honor per SKS, rincian tunjangan, dan potongan untuk seorang dosen/karyawan' })
  async upsertPayrollSetting(
    @Param('userId') userId: string,
    @Body()
    body: {
      baseSalary?: number;
      notes?: string;
      updatedBy?: string;
      tunjangan?: { name: string; amount: number }[];
      potongan?: { name: string; amount: number }[];
    },
  ) {
    return await this.financeService.upsertPayrollSetting(userId, body);
  }

  @Get('bank-accounts')
  async getBankAccounts() {
    return await this.financeService.getBankAccounts();
  }

  @Post('bank-accounts')
  async createBankAccount(@Body() body: any) {
    return await this.financeService.createBankAccount(body);
  }

  @Put('bank-accounts/:id')
  async updateBankAccount(@Param('id') id: string, @Body() body: any) {
    return await this.financeService.updateBankAccount(id, body);
  }

  @Delete('bank-accounts/:id')
  async deleteBankAccount(@Param('id') id: string) {
    return await this.financeService.deleteBankAccount(id);
  }

  @Get('budget-items')
  async getBudgetItems() {
    return await this.financeService.getBudgetItems();
  }

  @Post('budget-items')
  async createBudgetItem(@Body() body: any) {
    return await this.financeService.createBudgetItem(body);
  }

  @Put('budget-items/:id')
  async updateBudgetItem(@Param('id') id: string, @Body() body: any) {
    return await this.financeService.updateBudgetItem(id, body);
  }

  @Delete('budget-items/:id')
  async deleteBudgetItem(@Param('id') id: string) {
    return await this.financeService.deleteBudgetItem(id);
  }

  // ===========================================================================
  // MASTER KOMPONEN BIAYA ENDPOINTS
  // ===========================================================================

  @Get('fee-rules/components')
  @ApiOperation({ summary: 'Daftar semua komponen biaya (SPP, SKS, Praktikum, dll.)' })
  async getFeeComponents() {
    return await this.feeRulesService.getComponents();
  }

  @Post('fee-rules/components')
  @ApiOperation({ summary: 'Tambah komponen biaya baru' })
  async createFeeComponent(@Body() body: any) {
    return await this.feeRulesService.createComponent(body);
  }

  @Put('fee-rules/components/:id')
  @ApiOperation({ summary: 'Edit komponen biaya' })
  async updateFeeComponent(@Param('id') id: string, @Body() body: any) {
    return await this.feeRulesService.updateComponent(id, body);
  }

  @Delete('fee-rules/components/:id')
  @ApiOperation({ summary: 'Hapus komponen biaya' })
  async deleteFeeComponent(@Param('id') id: string) {
    return await this.feeRulesService.deleteComponent(id);
  }

  // ===========================================================================
  // ATURAN PEMBIAYAAN (FEE RULES) ENDPOINTS
  // ===========================================================================

  @Get('fee-rules/rules')
  @ApiOperation({ summary: 'Daftar semua aturan pembiayaan' })
  async getFeeRules() {
    return await this.feeRulesService.getRules();
  }

  @Get('fee-rules/rules/:id')
  @ApiOperation({ summary: 'Detail aturan pembiayaan berdasarkan ID' })
  async getFeeRuleById(@Param('id') id: string) {
    return await this.feeRulesService.getRuleById(id);
  }

  @Post('fee-rules/rules')
  @ApiOperation({ summary: 'Tambah aturan pembiayaan baru' })
  async createFeeRule(@Body() body: any) {
    return await this.feeRulesService.createRule(body);
  }

  @Put('fee-rules/rules/:id')
  @ApiOperation({ summary: 'Update aturan pembiayaan' })
  async updateFeeRule(@Param('id') id: string, @Body() body: any) {
    return await this.feeRulesService.updateRule(id, body);
  }

  @Delete('fee-rules/rules/:id')
  @ApiOperation({ summary: 'Hapus / Nonaktifkan aturan pembiayaan' })
  async deleteFeeRule(@Param('id') id: string) {
    return await this.feeRulesService.deleteRule(id);
  }

  // ===========================================================================
  // SIMULATOR, PENETAPAN & GENERATE INVOICE ENDPOINTS
  // ===========================================================================

  @Post('fee-rules/simulate')
  @ApiOperation({ summary: 'Simulasi aturan pembiayaan berdasarkan profil mahasiswa' })
  async simulateFeeRules(@Body() body: any) {
    return await this.feeRulesService.simulateCalculation(body);
  }

  @Get('fee-rules/assignments')
  @ApiOperation({ summary: 'Daftar penetapan pembiayaan mahasiswa' })
  async getStudentAssignments(
    @Query('search') search?: string,
    @Query('academicYear') academicYear?: string,
  ): Promise<any> {
    return await this.feeRulesService.getStudentAssignments({ search, academicYear });
  }

  @Post('fee-rules/assign')
  @ApiOperation({ summary: 'Tetapkan kebijakan pembiayaan untuk mahasiswa' })
  async assignStudentFee(
    @Body() body: { studentId: string; academicYear: string; customRuleId?: string; notes?: string },
  ): Promise<any> {
    return await this.feeRulesService.assignStudentFeePolicy(body);
  }

  @Post('fee-rules/generate-invoice')
  @ApiOperation({ summary: 'Generate tagihan semester mahasiswa berbasis aturan pembiayaan' })
  async generateSemesterInvoice(
    @Body() body: { studentId: string; semester: number; academicYear?: string; dueDate?: string },
  ): Promise<any> {
    return await this.feeRulesService.generateStudentSemesterInvoice(body);
  }
}

