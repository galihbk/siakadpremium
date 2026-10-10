import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';

@ApiTags('Shifts (Jam Kerja Pegawai)')
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar template shift jam kerja' })
  async getAll() {
    return await this.shiftsService.getAll();
  }

  @Post()
  @ApiOperation({ summary: 'Tambah template shift baru' })
  async create(@Body() body: any) {
    return await this.shiftsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Ubah template shift' })
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.shiftsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus template shift' })
  async remove(@Param('id') id: string) {
    return await this.shiftsService.remove(id);
  }
}
