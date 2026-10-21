import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ObeApiKeyGuard } from './obe-api-key.guard';
import { ObeGradeFilter, ObeIntegrationService } from './obe-integration.service';

const MAX_PER_PAGE = 500;

/** `period_id`, `class_id`, dan `updated_since` (tanggal/waktu ISO); nilai yang tidak valid diabaikan. */
function gradeFilter(periodId?: string, classId?: string, updatedSince?: string): ObeGradeFilter {
  const since = updatedSince ? new Date(updatedSince) : undefined;
  return {
    periodId: periodId || undefined,
    classId: classId || undefined,
    updatedSince: since && !Number.isNaN(since.getTime()) ? since : undefined,
  };
}

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
  @ApiQuery({ name: 'period_id', required: false, description: 'Hanya KRS pada periode akademik ini' })
  @ApiQuery({ name: 'class_id', required: false, description: 'Hanya KRS pada kelas ini' })
  @ApiQuery({ name: 'updated_since', required: false, description: 'Hanya yang berubah sejak waktu ini (ISO 8601)' })
  enrollments(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
    @Query('period_id') periodId?: string,
    @Query('class_id') classId?: string,
    @Query('updated_since') updatedSince?: string,
  ) {
    const q = paging(page, perPage);
    return this.service.enrollments(q.page, q.perPage, gradeFilter(periodId, classId, updatedSince));
  }

  @Get('grades')
  @ApiOperation({
    summary: 'Nilai FINAL per komponen (nama, kode, bobot kelas) dan nilai akhir',
    description:
      'Satu baris per komponen yang terisi, ditambah satu baris nilai akhir (component = null). Bobot komponen berasal dari Kontrak Kuliah kelas dan null bila belum ditetapkan.',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'per_page', required: false })
  @ApiQuery({ name: 'period_id', required: false, description: 'Hanya nilai pada periode akademik ini' })
  @ApiQuery({ name: 'class_id', required: false, description: 'Hanya nilai pada kelas ini' })
  @ApiQuery({ name: 'updated_since', required: false, description: 'Hanya yang berubah sejak waktu ini (ISO 8601), untuk sinkronisasi bertahap' })
  grades(
    @Query('page') page?: string,
    @Query('per_page') perPage?: string,
    @Query('period_id') periodId?: string,
    @Query('class_id') classId?: string,
    @Query('updated_since') updatedSince?: string,
  ) {
    const q = paging(page, perPage);
    return this.service.grades(q.page, q.perPage, gradeFilter(periodId, classId, updatedSince));
  }
}
