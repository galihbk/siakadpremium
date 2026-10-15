import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@siakad/database';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface ApproveGraduationDto {
  graduationDate?: string;
  skNumber?: string;
  predicate?: string;
  note?: string;
}

export interface GraduationRequirement {
  key: 'status' | 'sks' | 'ipk' | 'thesis' | 'invoice';
  label: string;
  ok: boolean;
  detail: string;
}

const MIN_IPK = 2.0;
const DEFAULT_TOTAL_SKS = 144;

/** Predikat kelulusan berdasarkan IPK (skala 4,00). */
export function graduationPredicate(ipk: number | null | undefined): string {
  if (ipk === null || ipk === undefined) return '-';
  if (ipk >= 3.51) return 'Dengan Pujian (Cum Laude)';
  if (ipk >= 3.01) return 'Sangat Memuaskan';
  if (ipk >= 2.76) return 'Memuaskan';
  return 'Cukup';
}

@Injectable()
export class GraduationService {
  constructor(private prisma: PrismaService) {}

  private async studentByUser(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, nim: true, status: true, studyProgram: { select: { id: true, name: true, code: true } } },
    });
    if (!student) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    return student;
  }

  /**
   * SKS lulus & IPK dihitung dari nilai TERBAIK tiap mata kuliah (mengulang tidak
   * menggandakan SKS), hanya KRS yang disetujui dan sudah bernilai.
   */
  private async academicSummary(studentId: string) {
    const rows = await this.prisma.$queryRaw<{ sks_lulus: number; sks_graded: number; ipk: Prisma.Decimal | null }[]>`
      WITH best AS (
        SELECT DISTINCT ON (e."courseId") e."courseId", c.sks, e."gradePoint"
        FROM course_enrollments e
        JOIN courses c ON c.id = e."courseId"
        WHERE e."studentId" = ${studentId} AND e.status = 'APPROVED' AND e."gradePoint" IS NOT NULL
        ORDER BY e."courseId", e."gradePoint" DESC
      )
      SELECT COALESCE(SUM(sks) FILTER (WHERE "gradePoint" > 0), 0)::int AS sks_lulus,
             COALESCE(SUM(sks), 0)::int AS sks_graded,
             ROUND((SUM(sks * "gradePoint") / NULLIF(SUM(sks), 0))::numeric, 2) AS ipk
      FROM best
    `;
    const r = rows[0];
    return { sksLulus: Number(r?.sks_lulus ?? 0), ipk: r?.ipk !== null && r?.ipk !== undefined ? Number(r.ipk) : null };
  }

  /** Total SKS kelulusan dari kurikulum aktif prodi mahasiswa (fallback 144). */
  private async requiredSks(studyProgram: { name: string; code: string } | null) {
    if (studyProgram) {
      const cur = await this.prisma.curriculum.findFirst({
        where: {
          status: 'Aktif',
          OR: [
            { studyProgram: { equals: studyProgram.name, mode: 'insensitive' } },
            { studyProgram: { equals: studyProgram.code, mode: 'insensitive' } },
          ],
        },
        orderBy: { startYear: 'desc' },
        select: { totalSks: true },
      });
      if (cur?.totalSks) return cur.totalSks;
    }
    return DEFAULT_TOTAL_SKS;
  }

  private async evaluate(student: Awaited<ReturnType<GraduationService['studentByUser']>>) {
    const [summary, required, thesis, unpaid] = await Promise.all([
      this.academicSummary(student.id),
      this.requiredSks(student.studyProgram),
      this.prisma.thesisProject.findUnique({
        where: { studentId: student.id },
        select: { stage: true, finalGrade: true, finalScore: true },
      }),
      this.prisma.paymentInvoice.count({ where: { nim: student.nim, status: { not: 'LUNAS' } } }),
    ]);

    const requirements: GraduationRequirement[] = [
      {
        key: 'status',
        label: 'Berstatus mahasiswa aktif',
        ok: student.status === 'ACTIVE',
        detail: student.status === 'ACTIVE' ? 'Aktif' : `Status saat ini: ${student.status}`,
      },
      {
        key: 'sks',
        label: `SKS lulus minimal ${required} SKS`,
        ok: summary.sksLulus >= required,
        detail: `${summary.sksLulus} dari ${required} SKS`,
      },
      {
        key: 'ipk',
        label: `IPK minimal ${MIN_IPK.toFixed(2)}`,
        ok: summary.ipk !== null && summary.ipk >= MIN_IPK,
        detail: summary.ipk !== null ? `IPK ${summary.ipk.toFixed(2)}` : 'Belum ada nilai',
      },
      {
        key: 'thesis',
        label: 'Tugas akhir / skripsi selesai',
        ok: thesis?.stage === 'COMPLETED',
        detail: thesis ? (thesis.stage === 'COMPLETED' ? `Nilai ${thesis.finalGrade ?? '-'}` : 'Tugas akhir belum selesai') : 'Belum mengajukan tugas akhir',
      },
      {
        key: 'invoice',
        label: 'Tidak ada tagihan yang belum lunas',
        ok: unpaid === 0,
        detail: unpaid === 0 ? 'Semua tagihan lunas' : `${unpaid} tagihan belum lunas`,
      },
    ];

    return {
      requirements,
      eligible: requirements.every((r) => r.ok),
      summary: {
        sksLulus: summary.sksLulus,
        sksRequired: required,
        ipk: summary.ipk,
        thesisGrade: thesis?.finalGrade ?? null,
        predicate: graduationPredicate(summary.ipk),
      },
    };
  }

  // ---------------------------------------------------------------- mahasiswa
  async getMine(userId: string) {
    const student = await this.studentByUser(userId);
    const [evaluation, application] = await Promise.all([
      this.evaluate(student),
      this.prisma.graduationApplication.findUnique({ where: { studentId: student.id } }),
    ]);
    return { ...evaluation, application };
  }

  async apply(userId: string) {
    const student = await this.studentByUser(userId);
    const existing = await this.prisma.graduationApplication.findUnique({ where: { studentId: student.id } });
    if (existing && existing.status !== 'REJECTED') {
      throw new BadRequestException('Pendaftaran yudisium sudah ada dan sedang diproses atau telah disetujui.');
    }
    const evaluation = await this.evaluate(student);
    if (!evaluation.eligible) {
      const failed = evaluation.requirements.filter((r) => !r.ok).map((r) => r.label);
      throw new BadRequestException(`Syarat yudisium belum terpenuhi: ${failed.join('; ')}.`);
    }
    const data = {
      status: 'SUBMITTED' as const,
      sksLulus: evaluation.summary.sksLulus,
      sksRequired: evaluation.summary.sksRequired,
      ipk: evaluation.summary.ipk,
      thesisGrade: evaluation.summary.thesisGrade,
      adminNote: null,
      appliedAt: new Date(),
    };
    const application = existing
      ? await this.prisma.graduationApplication.update({ where: { id: existing.id }, data })
      : await this.prisma.graduationApplication.create({ data: { studentId: student.id, ...data } });
    return application;
  }

  // ---------------------------------------------------------------- admin (BAAK)
  async listAdmin(q: { status?: string; search?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(String(q.pageSize ?? '25'), 10) || 25));
    const search = (q.search ?? '').trim();
    const where: Prisma.GraduationApplicationWhereInput = {};
    if (q.status && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(q.status)) {
      where.status = q.status as 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    }
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
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          student: {
            select: {
              nim: true,
              entryYear: true,
              status: true,
              user: { select: { fullName: true } },
              studyProgram: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.graduationApplication.groupBy({ by: ['status'], _count: { _all: true } }),
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
        status: a.status,
        nim: a.student.nim,
        name: a.student.user.fullName,
        studyProgram: a.student.studyProgram?.name ?? '-',
        entryYear: a.student.entryYear,
        studentStatus: a.student.status,
        sksLulus: a.sksLulus,
        sksRequired: a.sksRequired,
        ipk: a.ipk,
        thesisGrade: a.thesisGrade,
        suggestedPredicate: graduationPredicate(a.ipk),
        predicate: a.predicate,
        graduationDate: a.graduationDate,
        skNumber: a.skNumber,
        adminNote: a.adminNote,
        appliedAt: a.appliedAt,
        decidedAt: a.decidedAt,
      })),
    };
  }

  async approve(id: string, dto: ApproveGraduationDto) {
    const app = await this.prisma.graduationApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pendaftaran yudisium tidak ditemukan.');
    if (app.status !== 'SUBMITTED') throw new BadRequestException('Hanya pendaftaran berstatus menunggu yang dapat disetujui.');

    if (!dto.graduationDate) throw new BadRequestException('Tanggal kelulusan wajib diisi.');
    const graduationDate = new Date(dto.graduationDate);
    if (Number.isNaN(graduationDate.getTime())) throw new BadRequestException('Tanggal kelulusan tidak valid.');
    const skNumber = (dto.skNumber ?? '').trim();
    if (!skNumber) throw new BadRequestException('Nomor SK yudisium wajib diisi.');
    const predicate = (dto.predicate ?? '').trim() || graduationPredicate(app.ipk);

    await this.prisma.$transaction([
      this.prisma.graduationApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          predicate,
          graduationDate,
          skNumber,
          adminNote: (dto.note ?? '').trim() || null,
          decidedAt: new Date(),
        },
      }),
      this.prisma.student.update({ where: { id: app.studentId }, data: { status: 'GRADUATED' } }),
    ]);
    return { success: true };
  }

  async reject(id: string, note?: string) {
    const app = await this.prisma.graduationApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pendaftaran yudisium tidak ditemukan.');
    if (app.status !== 'SUBMITTED') throw new BadRequestException('Hanya pendaftaran berstatus menunggu yang dapat ditolak.');
    const text = (note ?? '').trim();
    if (text.length < 3) throw new BadRequestException('Alasan penolakan wajib diisi.');
    await this.prisma.graduationApplication.update({
      where: { id },
      data: { status: 'REJECTED', adminNote: text, decidedAt: new Date() },
    });
    return { success: true };
  }
}
