import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProdiService } from './prodi.service';

/**
 * Data program studi untuk Admin Prodi. Program studi SELALU ditentukan dari akun yang login
 * (bukan dari parameter), sehingga admin satu prodi tidak bisa membaca data prodi lain.
 */
@ApiTags('Prodi (Admin Program Studi)')
@Controller('prodi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN_PRODI)
export class ProdiController {
  constructor(private readonly prodiService: ProdiService) {}

  @Get('students')
  @ApiOperation({ summary: 'Mahasiswa program studi (server-side: cari, filter angkatan/status, urut)' })
  async students(
    @Req() req: any,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('status') status?: string,
    @Query('entryYear') entryYear?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDir') sortDir?: string
  ) {
    const prodiId = await this.prodiService.resolveProdiId(req.user, studyProgramId);
    return this.prodiService.listStudents(prodiId, { status, entryYear, search, page, pageSize, sortKey, sortDir });
  }

  @Get('lecturers')
  @ApiOperation({ summary: 'Dosen homebase program studi beserta beban mengajar semester aktif' })
  async lecturers(
    @Req() req: any,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDir') sortDir?: string
  ) {
    const prodiId = await this.prodiService.resolveProdiId(req.user, studyProgramId);
    return this.prodiService.listLecturers(prodiId, { search, page, pageSize, sortKey, sortDir });
  }

  @Get('classes')
  @ApiOperation({ summary: 'Kelas perkuliahan program studi per semester' })
  async classes(
    @Req() req: any,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortKey') sortKey?: string,
    @Query('sortDir') sortDir?: string
  ) {
    const prodiId = await this.prodiService.resolveProdiId(req.user, studyProgramId);
    return this.prodiService.listClasses(prodiId, { academicYearId, search, page, pageSize, sortKey, sortDir });
  }

  @Get('thesis')
  @ApiOperation({ summary: 'Pemantauan tugas akhir/skripsi mahasiswa program studi' })
  async thesis(
    @Req() req: any,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('stage') stage?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const prodiId = await this.prodiService.resolveProdiId(req.user, studyProgramId);
    return this.prodiService.listThesis(prodiId, { stage, search, page, pageSize });
  }

  @Get('graduation')
  @ApiOperation({ summary: 'Pemantauan pendaftaran yudisium mahasiswa program studi' })
  async graduation(
    @Req() req: any,
    @Query('studyProgramId') studyProgramId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const prodiId = await this.prodiService.resolveProdiId(req.user, studyProgramId);
    return this.prodiService.listGraduation(prodiId, { status, search, page, pageSize });
  }
}
