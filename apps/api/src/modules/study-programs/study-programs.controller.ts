import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudyProgramsService } from './study-programs.service';

@ApiTags('Study Programs (Program Studi)')
@Controller('study-programs')
export class StudyProgramsController {
  constructor(private studyProgramsService: StudyProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar Program Studi' })
  @ApiResponse({ status: 200, description: 'Daftar program studi berhasil dimuat' })
  async findAll() {
    return this.studyProgramsService.findAll();
  }
}
