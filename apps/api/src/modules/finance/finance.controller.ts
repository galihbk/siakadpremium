import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';

@ApiTags('Finance (Biro Keuangan)')
@Controller('finance')
export class FinanceController {
  constructor(private financeService: FinanceService) {}

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
}
