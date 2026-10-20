import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface Page<T> {
  items: T[];
  meta: { page: number; per_page: number; total: number; last_page: number };
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

const SEMESTER_LABEL: Record<string, string> = { ODD: 'GANJIL', EVEN: 'GENAP', SHORT: 'PENDEK' };
const SEMESTER_NAME: Record<string, string> = { ODD: 'Ganjil', EVEN: 'Genap', SHORT: 'Pendek' };

/** Kode periode yang stabil dan terbaca, mis. "2026/2027-GANJIL". Dipakai OBE sebagai label periode. */
export const periodCode = (name: string, semesterType: string) => `${name}-${SEMESTER_LABEL[semesterType] ?? semesterType}`;

/**
 * Data akademik yang ditarik sistem OBE. Hanya MEMBACA: tidak ada endpoint tulis. Bentuk keluaran
 * dibuat sederhana dan stabil (snake_case) agar OBE tidak bergantung pada skema internal SIAKAD:
 * kolom boleh berubah di SIAKAD tanpa memengaruhi OBE selama pemetaan di sini dijaga.
 *
 * Yang dibagikan hanya yang dibutuhkan OBE: identitas akademik dan nilai. Tidak ada data pribadi
 * (NIK, alamat, orang tua, keuangan, dsb.).
 */
@Injectable()
export class ObeIntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  private async paged<T, R>(
    page: number,
    perPage: number,
    count: () => Promise<number>,
    find: (skip: number, take: number) => Promise<T[]>,
    map: (row: T) => R[],
  ): Promise<Page<R>> {
    const total = await count();
    const rows = await find((page - 1) * perPage, perPage);
    return {
      items: rows.flatMap(map),
      meta: { page, per_page: perPage, total, last_page: Math.max(1, Math.ceil(total / perPage)) },
    };
  }

  async institutions() {
    const setting = await this.prisma.landingPageSetting.findFirst({
      select: { id: true, campusName: true, campusShortName: true },
    });
    const items = setting
      ? [{ id: setting.id, code: setting.campusShortName, name: setting.campusName }]
      : [];
    return { items, meta: { page: 1, per_page: items.length || 1, total: items.length, last_page: 1 } };
  }

  faculties(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.faculty.count(),
      (skip, take) => this.prisma.faculty.findMany({ orderBy: { id: 'asc' }, skip, take, select: { id: true, code: true, name: true } }),
      (f) => [{ id: f.id, code: f.code, name: f.name }],
    );
  }

  studyPrograms(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.studyProgram.count(),
      (skip, take) =>
        this.prisma.studyProgram.findMany({
          orderBy: { id: 'asc' },
          skip,
          take,
          select: { id: true, facultyId: true, code: true, name: true, degreeLevel: true },
        }),
      (p) => [{ id: p.id, faculty_id: p.facultyId, code: p.code, name: p.name, degree: p.degreeLevel }],
    );
  }

  students(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.student.count(),
      (skip, take) =>
        this.prisma.student.findMany({
          orderBy: { id: 'asc' },
          skip,
          take,
          select: {
            id: true,
            nim: true,
            studyProgramId: true,
            status: true,
            entryYear: true,
            user: { select: { fullName: true, email: true } },
          },
        }),
      (s) => [
        {
          id: s.id,
          student_number: s.nim,
          full_name: s.user.fullName,
          email: s.user.email,
          study_program_id: s.studyProgramId,
          status: s.status,
          entry_year: s.entryYear,
        },
      ],
    );
  }

  lecturers(page: number, perPage: number) {
    // OBE mengenali dosen lewat satu kode; dosen tanpa NIDN/NUPTK/NIP belum dapat dipakai dan dilewati.
    const where = { OR: [{ nidn: { not: null } }, { nuptk: { not: null } }, { nip: { not: null } }] };
    return this.paged(
      page,
      perPage,
      () => this.prisma.lecturer.count({ where }),
      (skip, take) =>
        this.prisma.lecturer.findMany({
          where,
          orderBy: { id: 'asc' },
          skip,
          take,
          select: {
            id: true,
            nidn: true,
            nuptk: true,
            nip: true,
            studyProgramId: true,
            titlePrefix: true,
            titleSuffix: true,
            user: { select: { fullName: true, email: true } },
          },
        }),
      (l) => [
        {
          id: l.id,
          nidn: l.nidn ?? l.nuptk ?? l.nip,
          full_name: `${l.titlePrefix ? `${l.titlePrefix} ` : ''}${l.user.fullName}${l.titleSuffix ? `, ${l.titleSuffix}` : ''}`,
          email: l.user.email,
          study_program_id: l.studyProgramId,
        },
      ],
    );
  }

  courses(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.course.count(),
      (skip, take) =>
        this.prisma.course.findMany({ orderBy: { id: 'asc' }, skip, take, select: { id: true, code: true, name: true, sks: true, semester: true } }),
      (c) => [{ id: c.id, code: c.code, name: c.name, credits: c.sks, semester: c.semester }],
    );
  }

  /**
   * Mata kuliah di dalam kurikulum. Satu baris = satu mata kuliah pada satu kurikulum, dengan data
   * kurikulumnya ikut di baris yang sama (datar, supaya mudah diimpor juga lewat CSV). Program studi
   * kurikulum dicari lewat nama program studi di kurikulum, lalu program studi mata kuliahnya.
   * Kurikulum tanpa mata kuliah tidak ikut terkirim.
   */
  async curriculumCourses(page: number, perPage: number) {
    const where = { curriculumId: { not: null } };
    const programs = await this.prisma.studyProgram.findMany({ select: { id: true, name: true } });
    const programByName = new Map(programs.map((p) => [p.name.trim().toLowerCase(), p.id]));
    return this.paged(
      page,
      perPage,
      () => this.prisma.course.count({ where }),
      (skip, take) =>
        this.prisma.course.findMany({
          where,
          orderBy: { id: 'asc' },
          skip,
          take,
          select: {
            id: true,
            sks: true,
            semester: true,
            type: true,
            studyProgramId: true,
            curriculum: { select: { id: true, code: true, name: true, studyProgram: true, startYear: true, status: true } },
          },
        }),
      (c) => {
        const k = c.curriculum;
        const programId = k ? (programByName.get(k.studyProgram.trim().toLowerCase()) ?? c.studyProgramId) : null;
        if (!k || !programId) return [];
        return [
          {
            id: `${k.id}:${c.id}`,
            curriculum_id: k.id,
            curriculum_code: k.code,
            curriculum_name: k.name,
            curriculum_year: k.startYear,
            curriculum_active: k.status === 'Aktif',
            study_program_id: programId,
            course_id: c.id,
            semester: c.semester,
            credits: c.sks,
            course_type: /pilihan/i.test(c.type) ? 'ELECTIVE' : 'MANDATORY',
          },
        ];
      },
    );
  }

  academicPeriods(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.academicYear.count(),
      (skip, take) =>
        this.prisma.academicYear.findMany({
          orderBy: { id: 'asc' },
          skip,
          take,
          select: { id: true, name: true, semesterType: true, startDate: true, endDate: true, isActive: true },
        }),
      (y) => [
        {
          id: y.id,
          code: periodCode(y.name, y.semesterType),
          name: `${y.name} ${SEMESTER_NAME[y.semesterType] ?? y.semesterType}`,
          start_date: iso(y.startDate),
          end_date: iso(y.endDate),
          is_active: y.isActive,
        },
      ],
    );
  }

  courseOfferings(page: number, perPage: number) {
    return this.paged(
      page,
      perPage,
      () => this.prisma.courseClass.count(),
      (skip, take) =>
        this.prisma.courseClass.findMany({
          orderBy: { id: 'asc' },
          skip,
          take,
          select: { id: true, courseId: true, academicYearId: true, className: true, lecturerId: true },
        }),
      (c) => [{ id: c.id, course_id: c.courseId, period_id: c.academicYearId, class_code: c.className, lecturer_id: c.lecturerId }],
    );
  }

  /** KRS yang sudah disetujui dan terikat ke satu kelas. */
  enrollments(page: number, perPage: number) {
    const where = { status: 'APPROVED' as const, courseClassId: { not: null } };
    return this.paged(
      page,
      perPage,
      () => this.prisma.courseEnrollment.count({ where }),
      (skip, take) =>
        this.prisma.courseEnrollment.findMany({
          where,
          orderBy: { id: 'asc' },
          skip,
          take,
          select: { id: true, studentId: true, courseClassId: true },
        }),
      (e) => [{ id: e.id, student_id: e.studentId, class_id: e.courseClassId }],
    );
  }

  /**
   * Nilai yang sudah FINAL. Satu baris per komponen yang terisi (Tugas, UTS, UAS) ditambah nilai akhir
   * tanpa komponen (lihat skala di bawah). OBE mencocokkan nama komponen dengan nama/jenis assessment di RPS-nya; nilai akhir
   * hanya disimpan sebagai arsip. Halaman dihitung per KRS, jadi satu halaman dapat berisi sampai 4x
   * `per_page` baris.
   */
  grades(page: number, perPage: number) {
    const where = { status: 'APPROVED' as const, courseClassId: { not: null }, gradeStatus: 'FINAL' };
    return this.paged(
      page,
      perPage,
      () => this.prisma.courseEnrollment.count({ where }),
      (skip, take) =>
        this.prisma.courseEnrollment.findMany({
          where,
          orderBy: { id: 'asc' },
          skip,
          take,
          select: {
            id: true,
            studentId: true,
            courseClassId: true,
            assignmentScore: true,
            midtermScore: true,
            finalScore: true,
            totalScore: true,
            gradePoint: true,
            componentScores: { select: { score: true, component: { select: { code: true, name: true } } } },
          },
        }),
      (e) => {
        const base = { student_id: e.studentId, class_id: e.courseClassId, max_score: 100 };
        const rows: Record<string, unknown>[] = [];
        const add = (key: string, component: string | null, score: number | null) => {
          if (score !== null && score !== undefined) rows.push({ id: `${e.id}:${key}`, ...base, component, score });
        };
        if (e.componentScores.length > 0) {
          // Nilai memakai skema komponen kampus: satu baris per komponen (nama komponen apa adanya)
          for (const cs of e.componentScores) add(cs.component.code, cs.component.name, cs.score);
        } else {
          add('tugas', 'Tugas', e.assignmentScore);
          add('uts', 'UTS', e.midtermScore);
          add('uas', 'UAS', e.finalScore);
        }
        // `totalScore` tidak seragam di data SIAKAD: sebagian baris berisi nilai 0-100, sebagian (hasil impor
        // Feeder) berisi indeks 0-4 yang sama dengan `gradePoint`. Skalanya dikirim apa adanya lewat
        // `max_score` supaya OBE menormalkannya dengan benar; baris yang skalanya tidak dapat dipastikan
        // dilewati daripada dikirim sebagai angka yang menyesatkan.
        if (e.totalScore !== null && e.totalScore !== undefined) {
          if (e.totalScore > 4) {
            rows.push({ id: `${e.id}:akhir`, ...base, component: null, score: e.totalScore });
          } else if (e.gradePoint !== null && e.gradePoint !== undefined && Math.abs(e.totalScore - e.gradePoint) < 0.01) {
            rows.push({ id: `${e.id}:akhir`, ...base, component: null, score: e.gradePoint, max_score: 4 });
          }
        }
        return rows;
      },
    );
  }
}
