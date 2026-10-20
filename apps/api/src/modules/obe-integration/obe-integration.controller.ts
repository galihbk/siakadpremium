import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ObeApiKeyGuard } from './obe-api-key.guard';
import { ObeIntegrationService } from './obe-integration.service';

const MAX_PER_PAGE = 500;

function paging(page?: string, perPage?: string) {
  const p = Math.max(1, Math.floor(Number(page)) || 1);
  const n = Math.min(MAX_PER_PAGE, Math.max(1, Math.floor(Number(perPage)) || 200));
  return { page: p, perPage: n };
}

/**
 * Endpoint baca-saja untuk sistem OBE (Outcome-Based Education), diakses server-ke-server dengan
 * API key (`Authorization: Bearer <OBE_API_KEY>`), bukan token pengguna. Alamat dasar yang diisi di
 * OBE: `{API_URL}/api/v1/integrations/obe`.
 *
 * Semua daftar mendukung `page` dan `per_page` (maks. 500) dan mengembalikan `data` (daftar) serta
 * `meta.last_page`, sehingga OBE membaca halaman demi halaman sampai habis.
 */
@ApiTags('Integrasi OBE')
@ApiBearerAuth()
@UseGuards(ObeApiKeyGuard)
// Sinkronisasi membaca banyak halaman berurutan; batas laju umum (120/menit) terlalu sempit untuk itu.
// Akses tetap dibatasi API key.
@SkipThrottle()
@Controller('integrations/obe')
export class ObeIntegrationController {
  constructor(private readonly service: ObeIntegrationService) {}

  @Get('institutions')
  @ApiOperation({ summary: 'Institusi (nama dan singkatan kampus)' })
  institutions() {
    return this.service.institutions();
  }

  @Get('faculties')
  @ApiOperation({ summary: 'Fakultas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  faculties(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.faculties(q.page, q.perPage);
  }

  @Get('study-programs')
  @ApiOperation({ summary: 'Program studi' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  studyPrograms(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.studyPrograms(q.page, q.perPage);
  }

  @Get('students')
  @ApiOperation({ summary: 'Mahasiswa (NIM, nama, email, program studi)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  students(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.students(q.page, q.perPage);
  }

  @Get('lecturers')
  @ApiOperation({ summary: 'Dosen yang memiliki NIDN/NUPTK/NIP' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  lecturers(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.lecturers(q.page, q.perPage);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Mata kuliah (kode, nama, SKS)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  courses(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.courses(q.page, q.perPage);
  }

  @Get('curriculum-courses')
  @ApiOperation({ summary: 'Mata kuliah di dalam kurikulum (data kurikulum ikut di tiap baris)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  curriculumCourses(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.curriculumCourses(q.page, q.perPage);
  }

  @Get('academic-periods')
  @ApiOperation({ summary: 'Periode akademik (tahun akademik + semester), mis. 2026/2027-GANJIL' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  academicPeriods(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.academicPeriods(q.page, q.perPage);
  }

  @Get('course-offerings')
  @ApiOperation({ summary: 'Kelas (mata kuliah pada satu periode, kode kelas, dosen pengampu)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  courseOfferings(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.courseOfferings(q.page, q.perPage);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'KRS yang sudah disetujui dan terikat ke kelas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  enrollments(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.enrollments(q.page, q.perPage);
  }

  @Get('grades')
  @ApiOperation({ summary: 'Nilai FINAL per komponen (Tugas, UTS, UAS) dan nilai akhir' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  grades(@Query('page') page?: string, @Query('per_page') perPage?: string) {
    const q = paging(page, perPage);
    return this.service.grades(q.page, q.perPage);
  }
}
