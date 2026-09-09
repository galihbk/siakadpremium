import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';

@ApiTags('Buildings & Rooms (Gedung & Fasilitas Ruangan Kampus)')
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  // ================= ROOMS ENDPOINTS =================
  @Get('rooms')
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar ruangan kampus dari basis data' })
  @ApiResponse({ status: 200, description: 'Daftar ruangan berhasil dimuat' })
  async findAllRooms(@Query('buildingCode') buildingCode?: string) {
    return this.buildingsService.findAllRooms(buildingCode);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Mendapatkan detail ruangan berdasarkan ID atau kode' })
  async findRoom(@Param('id') id: string) {
    return this.buildingsService.findRoom(id);
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Menambahkan ruangan kampus baru' })
  async createRoom(@Body() body: any) {
    return this.buildingsService.createRoom(body);
  }

  @Put('rooms/:id')
  @ApiOperation({ summary: 'Memperbarui data ruangan kampus' })
  async updateRoom(@Param('id') id: string, @Body() body: any) {
    return this.buildingsService.updateRoom(id, body);
  }

  @Delete('rooms/:id')
  @ApiOperation({ summary: 'Menghapus ruangan kampus' })
  async removeRoom(@Param('id') id: string) {
    return this.buildingsService.deleteRoom(id);
  }

  // ================= BUILDINGS ENDPOINTS =================
  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar gedung kampus dari basis data' })
  @ApiResponse({ status: 200, description: 'Daftar gedung berhasil dimuat' })
  async findAll() {
    return this.buildingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail gedung berdasarkan ID atau kode' })
  async findOne(@Param('id') id: string) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan data gedung kampus baru' })
  async create(@Body() body: any) {
    return this.buildingsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui informasi data gedung kampus' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.buildingsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus data gedung kampus' })
  async remove(@Param('id') id: string) {
    return this.buildingsService.remove(id);
  }
}
