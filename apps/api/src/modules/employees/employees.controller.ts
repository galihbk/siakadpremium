import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
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
