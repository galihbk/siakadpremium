import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@siakad/database';
import { PrismaService } from '../../shared/prisma/prisma.service';

interface TableQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  sortKey?: string;
  sortDir?: string;
}

const STUDENT_STATUSES = ['ACTIVE', 'LEAVE', 'GRADUATED', 'DROPOUT', 'TRANSFERRED'];

@Injectable()
export class ProdiService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------- util
  /**
   * Program studi yang boleh diakses: ADMIN_PRODI HANYA prodi yang tertaut ke akunnya di
   * database (parameter dari klien diabaikan). SUPER_ADMIN wajib menyebut prodi lewat query.
   */
  async resolveProdiId(user: { sub: string; role: string }, requested?: string): Promise<string> {
    if (user.role === 'ADMIN_PRODI') {
      const row = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { studyProgramId: true } });
      if (!row?.studyProgramId) {
        throw new ForbiddenException('Akun ini belum ditautkan ke program studi manapun.');
      }
      return row.studyProgramId;
    }
    if (!requested) throw new BadRequestException('Parameter studyProgramId wajib untuk peran ini.');
    return requested;
  }

  private tq(q: TableQuery) {
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(String(q.pageSize ?? '25'), 10) || 25));
    const search = (q.search ?? '').trim();
    const dir: 'asc' | 'desc' = q.sortDir === 'desc' ? 'desc' : 'asc';
    return { page, pageSize, skip: (page - 1) * pageSize, search, dir };
  }

  private lecturerName(l?: { titlePrefix?: string | null; titleSuffix?: string | null; user?: { fullName: string } | null } | null) {
    if (!l) return null;
    return [l.titlePrefix, l.user?.fullName, l.titleSuffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  // ---------------------------------------------------------------- mahasiswa
  async listStudents(prodiId: string, q: TableQuery & { status?: string; entryYear?: string }) {
    const { page, pageSize, skip, search, dir } = this.tq(q);
    const where: Prisma.StudentWhereInput = { studyProgramId: prodiId };
    if (q.status && STUDENT_STATUSES.includes(q.status)) where.status = q.status as any;
    const entryYear = parseInt(String(q.entryYear ?? ''), 10);
    if (!Number.isNaN(entryYear)) where.entryYear = entryYear;
    if (search) {
      where.OR = [
        { nim: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const orderByMap: Record<string, Prisma.StudentOrderByWithRelationInput> = {
      nim: { nim: dir },
      name: { user: { fullName: dir } },
      entryYear: { entryYear: dir },
      semester: { currentSemester: dir },
      status: { status: dir },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.nim, { nim: 'asc' as const }];

    const [total, rows, byStatus, byYear] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          nim: true,
          entryYear: true,
          currentSemester: true,
          status: true,
          phone: true,
          user: { select: { fullName: true, email: true } },
          advisorLecturer: { select: { titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
        },
      }),
      this.prisma.student.groupBy({ by: ['status'], where: { studyProgramId: prodiId }, _count: { _all: true } }),
      this.prisma.student.groupBy({ by: ['entryYear'], where: { studyProgramId: prodiId }, _count: { _all: true }, orderBy: { entryYear: 'desc' } }),
    ]);

    // IPK & SKS lulus untuk baris di halaman ini saja (satu query, nilai terbaik per mata kuliah).
    const ids = rows.map((r) => r.id);
    const acad = ids.length
      ? await this.prisma.$queryRaw<{ studentId: string; sks_lulus: number; ipk: Prisma.Decimal | null }[]>`
          WITH best AS (
            SELECT DISTINCT ON (e."studentId", e."courseId") e."studentId", e."courseId", c.sks, e."gradePoint"
            FROM course_enrollments e
            JOIN courses c ON c.id = e."courseId"
            WHERE e."studentId" = ANY(${ids}::text[]) AND e.status = 'APPROVED' AND e."gradePoint" IS NOT NULL
            ORDER BY e."studentId", e."courseId", e."gradePoint" DESC
          )
          SELECT "studentId",
                 COALESCE(SUM(sks) FILTER (WHERE "gradePoint" > 0), 0)::int AS sks_lulus,
                 ROUND((SUM(sks * "gradePoint") / NULLIF(SUM(sks), 0))::numeric, 2) AS ipk
          FROM best GROUP BY "studentId"
        `
      : [];
    const acadMap = new Map(acad.map((a) => [a.studentId, a]));

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((b) => (statusCounts[b.status] = b._count._all));

    return {
      total,
      page,
      pageSize,
      statusCounts,
      entryYears: byYear.map((y) => ({ year: y.entryYear, count: y._count._all })),
      items: rows.map((r) => {
        const a = acadMap.get(r.id);
        return {
          id: r.id,
          nim: r.nim,
          name: r.user.fullName,
          email: r.user.email,
          phone: r.phone,
          entryYear: r.entryYear,
          semester: r.currentSemester,
          status: r.status,
          advisor: this.lecturerName(r.advisorLecturer),
          sksLulus: a?.sks_lulus ?? 0,
          ipk: a?.ipk !== null && a?.ipk !== undefined ? Number(a.ipk) : null,
        };
      }),
    };
  }

  // ---------------------------------------------------------------- dosen
  async listLecturers(prodiId: string, q: TableQuery) {
    const { page, pageSize, skip, search, dir } = this.tq(q);
    const where: Prisma.LecturerWhereInput = { studyProgramId: prodiId };
    if (search) {
      where.OR = [
        { nidn: { contains: search, mode: 'insensitive' } },
        { nuptk: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const orderByMap: Record<string, Prisma.LecturerOrderByWithRelationInput> = {
      name: { user: { fullName: dir } },
      nidn: { nidn: dir },
      position: { functionalPosition: dir },
      status: { employmentStatus: dir },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.name, { id: 'asc' as const }];

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { id: true, name: true } });

    const [total, rows] = await Promise.all([
      this.prisma.lecturer.count({ where }),
      this.prisma.lecturer.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          nidn: true,
          nuptk: true,
          titlePrefix: true,
          titleSuffix: true,
          functionalPosition: true,
          employmentStatus: true,
          lastEducation: true,
          expertise: true,
          isAcademicAdvisor: true,
          phone: true,
          user: { select: { fullName: true, email: true, isActive: true } },
          _count: { select: { advisedStudents: true } },
        },
      }),
    ]);

    // Beban mengajar semester aktif (jumlah kelas & total SKS) untuk dosen di halaman ini.
    const ids = rows.map((r) => r.id);
    const load = activeYear && ids.length
      ? await this.prisma.courseClass.findMany({
          where: { academicYearId: activeYear.id, lecturerId: { in: ids } },
          select: { lecturerId: true, course: { select: { sks: true } } },
        })
      : [];
    const loadMap = new Map<string, { classes: number; sks: number }>();
    load.forEach((c) => {
      const cur = loadMap.get(c.lecturerId as string) || { classes: 0, sks: 0 };
      cur.classes += 1;
      cur.sks += c.course?.sks ?? 0;
      loadMap.set(c.lecturerId as string, cur);
    });

    return {
      total,
      page,
      pageSize,
      activeYear: activeYear?.name ?? null,
      items: rows.map((r) => ({
        id: r.id,
        name: this.lecturerName(r),
        nidn: r.nidn || r.nuptk || null,
        position: r.functionalPosition,
        employmentStatus: r.employmentStatus,
        lastEducation: r.lastEducation,
        expertise: r.expertise,
        email: r.user.email,
        phone: r.phone,
        isActive: r.user.isActive,
        isAdvisor: r.isAcademicAdvisor,
        adviseeCount: r._count.advisedStudents,
        classes: loadMap.get(r.id)?.classes ?? 0,
        sks: loadMap.get(r.id)?.sks ?? 0,
      })),
    };
  }

  // ---------------------------------------------------------------- kelas
  async listClasses(prodiId: string, q: TableQuery & { academicYearId?: string }) {
    const { page, pageSize, skip, search, dir } = this.tq(q);
    const year = q.academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: q.academicYearId }, select: { id: true, name: true } })
      : await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { id: true, name: true } });
    if (!year) return { total: 0, page, pageSize, year: null, items: [] as any[] };

    const where: Prisma.CourseClassWhereInput = { academicYearId: year.id, course: { studyProgramId: prodiId } };
    if (search) {
      where.OR = [
        { className: { contains: search, mode: 'insensitive' } },
        { course: { code: { contains: search, mode: 'insensitive' } } },
        { course: { name: { contains: search, mode: 'insensitive' } } },
        { lecturer: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const orderByMap: Record<string, Prisma.CourseClassOrderByWithRelationInput> = {
      course: { course: { code: dir } },
      className: { className: dir },
      lecturer: { lecturer: { user: { fullName: dir } } },
      day: { day: dir },
    };
    const orderBy = [orderByMap[q.sortKey || ''] || orderByMap.course, { className: 'asc' as const }];

    const [total, rows] = await Promise.all([
      this.prisma.courseClass.count({ where }),
      this.prisma.courseClass.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          className: true,
          day: true,
          startTime: true,
          endTime: true,
          practiceDay: true,
          practiceStartTime: true,
          practiceEndTime: true,
          isFlexibleSchedule: true,
          quota: true,
          course: { select: { code: true, name: true, sks: true, semester: true } },
          lecturer: { select: { titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
          room: { select: { name: true } },
          _count: { select: { enrollments: { where: { status: 'APPROVED' } } } },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      year,
      items: rows.map((c) => ({
        id: c.id,
        courseCode: c.course?.code ?? '',
        courseName: c.course?.name ?? '',
        sks: c.course?.sks ?? 0,
        semester: c.course?.semester ?? null,
        className: c.className,
        lecturer: this.lecturerName(c.lecturer),
        schedule: c.isFlexibleSchedule
          ? 'Tanpa jadwal tetap'
          : `${c.day}, ${c.startTime}-${c.endTime}${c.practiceDay && c.practiceStartTime ? ` + Praktikum ${c.practiceDay}, ${c.practiceStartTime}-${c.practiceEndTime}` : ''}`,
        room: c.room?.name ?? null,
        quota: c.quota,
        enrolled: c._count.enrollments,
      })),
    };
  }

  // ---------------------------------------------------------------- tugas akhir
  async listThesis(prodiId: string, q: TableQuery & { stage?: string }) {
    const { page, pageSize, skip, search } = this.tq(q);
    const where: Prisma.ThesisProjectWhereInput = { student: { studyProgramId: prodiId } };
    const baseWhere = { ...where };
    if (q.stage) where.stage = q.stage as any;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { nim: { contains: search, mode: 'insensitive' } } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [total, rows, byStage] = await Promise.all([
      this.prisma.thesisProject.count({ where }),
      this.prisma.thesisProject.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          title: true,
          stage: true,
          finalScore: true,
          finalGrade: true,
          submittedAt: true,
          student: { select: { nim: true, user: { select: { fullName: true } } } },
          supervisor1: { select: { titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
          supervisor2: { select: { titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
        },
      }),
      this.prisma.thesisProject.groupBy({ by: ['stage'], where: baseWhere, _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {};
    byStage.forEach((b) => (counts[b.stage] = b._count._all));
    return {
      total,
      page,
      pageSize,
      counts,
      items: rows.map((r) => ({
        id: r.id,
        nim: r.student.nim,
        name: r.student.user.fullName,
        title: r.title,
        stage: r.stage,
        supervisor1: this.lecturerName(r.supervisor1),
        supervisor2: this.lecturerName(r.supervisor2),
        finalScore: r.finalScore,
        finalGrade: r.finalGrade,
        submittedAt: r.submittedAt,
      })),
    };
  }

  // ---------------------------------------------------------------- yudisium
  async listGraduation(prodiId: string, q: TableQuery & { status?: string }) {
    const { page, pageSize, skip, search } = this.tq(q);
    const base: Prisma.GraduationApplicationWhereInput = { student: { studyProgramId: prodiId } };
    const where: Prisma.GraduationApplicationWhereInput = { ...base };
    if (q.status && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(q.status)) where.status = q.status as any;
    if (search) {
      where.OR = [
        { student: { nim: { contains: search, mode: 'insensitive' } } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [total, rows, byStatus] = await Promise.all([
      this.prisma.graduationApplication.count({ where }),
      this.prisma.graduationApplication.findMany({
        where,
        orderBy: [{ status: 'asc' }, { appliedAt: 'desc' }],
        skip,
        take: pageSize,
        include: { student: { select: { nim: true, entryYear: true, user: { select: { fullName: true } } } } },
      }),
      this.prisma.graduationApplication.groupBy({ by: ['status'], where: base, _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {};
    byStatus.forEach((b) => (counts[b.status] = b._count._all));
    return {
      total,
      page,
      pageSize,
      counts,
      items: rows.map((a) => ({
        id: a.id,
        nim: a.student.nim,
        name: a.student.user.fullName,
        entryYear: a.student.entryYear,
        status: a.status,
        sksLulus: a.sksLulus,
        sksRequired: a.sksRequired,
        ipk: a.ipk,
        predicate: a.predicate,
        graduationDate: a.graduationDate,
        skNumber: a.skNumber,
        appliedAt: a.appliedAt,
      })),
    };
  }
}
