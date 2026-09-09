import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudyProgramsService } from './study-programs.service';

@ApiTags('Study Programs (Program Studi)')
@Controller('study-programs')
export class StudyProgramsController {
  constructor(private studyProgramsService: StudyProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar Program Studi dari basis data' })
  @ApiResponse({ status: 200, description: 'Daftar program studi berhasil dimuat' })
  async findAll() {
    return this.studyProgramsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan detail program studi' })
  async findOne(@Param('id') id: string) {
    return this.studyProgramsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan program studi baru' })
  async create(@Body() body: any) {
    return this.studyProgramsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui data program studi' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.studyProgramsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus program studi' })
  async remove(@Param('id') id: string) {
    return this.studyProgramsService.remove(id);
  }
}
