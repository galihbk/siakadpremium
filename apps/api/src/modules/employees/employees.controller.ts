import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';

@ApiTags('Employees (Pegawai & SDM Kampus)')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar pegawai dan dosen dari database' })
  @ApiResponse({ status: 200, description: 'Daftar pegawai berhasil dimuat' })
  async findAll() {
    return this.employeesService.findAll();
  }

  @Get('directory')
  @ApiOperation({ summary: 'Direktori ringkas pegawai & dosen (nama, kontak, unit) untuk pilihan penanggung jawab' })
  async directory() {
    return this.employeesService.directory();
  }

  @Get('universities')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Cari perguruan tinggi (PDDikti) untuk isian riwayat pendidikan pegawai' })
  async universities(@Query('search') search?: string) {
    return this.employeesService.searchUniversities(search ?? '');
  }

  @Post('bulk-shift')
  @ApiOperation({ summary: 'Menetapkan shift untuk banyak pegawai/dosen sekaligus (shiftId kosong = ikut shift default)' })
  async bulkShift(@Body() body: { ids?: string[]; shiftId?: string | null }) {
    return this.employeesService.bulkSetShift(body?.ids ?? [], body?.shiftId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan satu data pegawai berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan pegawai baru ke dalam database' })
  async create(@Body() body: any) {
    return this.employeesService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui data pegawai di database' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.employeesService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data pegawai dari database' })
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
