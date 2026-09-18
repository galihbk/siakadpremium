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
  @ApiOperation({ summary: 'Verifikasi pembayaran manual mahasiswa menjadi Lunas' })
  async verifyTransaction(@Param('id') id: string) {
    return await this.financeService.verifyTransaction(id);
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

