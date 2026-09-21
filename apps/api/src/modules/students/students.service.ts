import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { FeeRulesService } from '../finance/fee-rules.service';
import { StudentDashboardSummary, EnrollmentStatus } from '@siakad/types';

const MAX_SKS_PER_SEMESTER = 24;

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private feeRulesService: FeeRulesService,
  ) {}

  async getDashboardSummary(userId?: string): Promise<StudentDashboardSummary> {
    try {
      const student = await this.prisma.student.findFirst({
        where: userId
          ? {
              OR: [
                { userId },
                { id: userId },
                { nim: userId },
              ],
            }
          : undefined,
        include: {
          user: true,
          studyProgram: { include: { faculty: true } },
          advisorLecturer: { include: { user: true } },
          enrollments: {
            where: { status: { not: 'REJECTED' } },
            include: { course: true, academicYear: true },
          },
          admissionApplications: {
            include: { payments: true },
          },
        },
      });

      if (student) {
        const approvedEnrollments = student.enrollments.filter((e) => e.status === 'APPROVED');
        const draftEnrollments = student.enrollments.filter((e) => e.status === 'DRAFT');
        const submittedEnrollments = student.enrollments.filter((e) => e.status === 'SUBMITTED');
        const totalSks = approvedEnrollments.reduce((sum, e) => sum + (e.course?.sks || 3), 0);
        const gradesWithScore = approvedEnrollments.filter((e) => e.gradePoint !== null && e.gradePoint !== undefined);
        const ipk = gradesWithScore.length > 0
          ? Math.round((gradesWithScore.reduce((a, e) => a + (e.gradePoint || 0), 0) / gradesWithScore.length) * 100) / 100
          : 0;

        // Check payments
        let hasPaid = false;
        if (student.admissionApplications && Array.isArray(student.admissionApplications)) {
          for (const app of student.admissionApplications) {
            if (app.payments?.some((p) => p.status === 'PAID')) {
              hasPaid = true;
              break;
            }
          }
        }

        return {
          nim: student.nim,
          nama: student.user.fullName,
          programStudi: student.studyProgram?.name || '-',
          fakultas: student.studyProgram?.faculty?.name || '-',
          semesterAktif: student.currentSemester,
          ipk,
          ipsTerakhir: ipk,
          totalSksLulus: totalSks,
          dosenPembimbingAkademik: student.advisorLecturer?.user?.fullName || 'Belum Ditentukan',
          statusKrs:
            student.enrollments.length === 0
              ? (null as any)
              : approvedEnrollments.length === student.enrollments.length
              ? EnrollmentStatus.APPROVED
              : submittedEnrollments.length > 0
              ? EnrollmentStatus.SUBMITTED
              : draftEnrollments.length > 0
              ? EnrollmentStatus.DRAFT
              : EnrollmentStatus.APPROVED,
          tagihanSppStatus: hasPaid ? 'PAID' : 'UNPAID',
        };
      }
    } catch (e) {
      console.warn('getDashboardSummary error:', e);
    }

    return {
      nim: '2601001',
      nama: 'Mahasiswa',
      programStudi: 'Desain Komunikasi Visual',
      fakultas: 'Fakultas Desain Komunikasi Visual & Seni Digital',
      semesterAktif: 1,
      ipk: 0,
      ipsTerakhir: 0,
      totalSksLulus: 0,
      dosenPembimbingAkademik: 'Dr. Aris Sudrajat, S.Ds., M.Ds.',
      statusKrs: EnrollmentStatus.DRAFT as any,
      tagihanSppStatus: 'PAID',
    };
  }

  private async findStudentByUserId(userId?: string) {
    if (!userId) return null;
    return this.prisma.student.findFirst({
      where: {
        OR: [{ userId }, { id: userId }, { nim: userId }],
      },
    });
  }

  async getKrs(userId?: string, studyProgramId?: string) {
    try {
      const student = await this.findStudentByUserId(userId);
      const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
      if (!activeYear) return [];

      // Katalog kelas berdasarkan prodi mahasiswa (atau prodi yang diminta), tahun akademik aktif.
      // Sengaja tidak difilter per semester mahasiswa -- mahasiswa semester atas yang mau
      // mengulang matkul semester bawah tetap harus bisa menemukannya.
      const effectiveProdiId = studyProgramId || student?.studyProgramId;
      const classes = await this.prisma.courseClass.findMany({
        where: {
          academicYearId: activeYear.id,
          course: effectiveProdiId
            ? { OR: [{ studyProgramId: effectiveProdiId }, { studyProgramId: null }] }
            : undefined,
        },
        include: {
          course: true,
          lecturer: { include: { user: true } },
          _count: { select: { enrollments: { where: { status: { not: 'REJECTED' } } } } },
        },
        orderBy: [{ course: { semester: 'asc' } }, { course: { code: 'asc' } }, { className: 'asc' }],
        take: 60,
      });

      // Status KRS mahasiswa untuk tahun akademik aktif (kalau ada)
      let enrollmentByClassId = new Map<string, { id: string; status: string }>();
      if (student) {
        const enrollments = await this.prisma.courseEnrollment.findMany({
          where: { studentId: student.id, academicYearId: activeYear.id, courseClassId: { not: null } },
        });
        enrollmentByClassId = new Map(
          enrollments.map((e) => [e.courseClassId as string, { id: e.id, status: e.status }]),
        );
      }

      return classes.map((cc) => {
        const enrolled = enrollmentByClassId.get(cc.id);
        const enrolledCount = cc._count?.enrollments || 0;
        return {
          id: cc.id,
          classId: cc.id,
          courseId: cc.courseId,
          code: cc.course.code,
          name: cc.course.name,
          className: cc.className,
          sks: cc.course.sks || cc.course.totalSks || 3,
          dosen: cc.lecturer?.user?.fullName || cc.course.coordinator || 'Tim Dosen',
          hari: cc.day,
          jam: `${cc.startTime}-${cc.endTime}`,
          ruang: '-',
          quota: cc.quota,
          enrolledCount,
          isFull: enrolledCount >= cc.quota,
          status: enrolled?.status || null,
          enrollmentId: enrolled?.id || null,
          semester: cc.course.semester,
          type: cc.course.type,
        };
      });
    } catch (e) {
      console.warn('getKrs error:', e);
    }

    return [];
  }

  async submitKrs(userId: string | undefined, classIds: string[]) {
    const student = await this.findStudentByUserId(userId);
    if (!student) {
      throw new NotFoundException('Data mahasiswa tidak ditemukan');
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) {
      throw new NotFoundException('Tidak ada tahun akademik aktif saat ini');
    }
    if (!activeYear.isKrsOpen) {
      throw new BadRequestException('Periode pengisian KRS sedang ditutup oleh BAAK. Silakan hubungi BAAK jika Anda perlu melakukan perubahan.');
    }

    const classes = await this.prisma.courseClass.findMany({
      where: { id: { in: classIds } },
      include: { course: true, _count: { select: { enrollments: { where: { status: { not: 'REJECTED' } } } } } },
    });

    const totalSks = classes.reduce((sum, c) => sum + (c.course.sks || c.course.totalSks || 3), 0);
    if (totalSks > MAX_SKS_PER_SEMESTER) {
      throw new BadRequestException(
        `Total SKS (${totalSks}) melebihi batas maksimal ${MAX_SKS_PER_SEMESTER} SKS per semester`,
      );
    }

    // Cek kuota: kelas yang sudah penuh hanya boleh dipertahankan kalau mahasiswa ini
    // memang sudah terdaftar di kelas itu sebelumnya (bukan penambahan baru).
    const existingEnrollments = await this.prisma.courseEnrollment.findMany({
      where: { studentId: student.id, academicYearId: activeYear.id, courseClassId: { not: null } },
    });
    const alreadyEnrolledClassIds = new Set(existingEnrollments.map((e) => e.courseClassId));

    for (const cc of classes) {
      const alreadyIn = alreadyEnrolledClassIds.has(cc.id);
      const enrolledCount = cc._count?.enrollments || 0;
      if (!alreadyIn && enrolledCount >= cc.quota) {
        throw new BadRequestException(
          `Kelas ${cc.className} (${cc.course.code}) sudah penuh (${enrolledCount}/${cc.quota}). Pilih kelas lain.`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Hapus enrollment lama yang belum disetujui PA dan tidak lagi dipilih
      await tx.courseEnrollment.deleteMany({
        where: {
          studentId: student.id,
          academicYearId: activeYear.id,
          status: { not: 'APPROVED' },
          courseClassId: { notIn: classIds },
        },
      });

      for (const cc of classes) {
        const existing = await tx.courseEnrollment.findUnique({
          where: { studentId_courseClassId: { studentId: student.id, courseClassId: cc.id } },
        });
        if (existing?.status === 'APPROVED') continue;

        await tx.courseEnrollment.upsert({
          where: { studentId_courseClassId: { studentId: student.id, courseClassId: cc.id } },
          create: {
            studentId: student.id,
            courseId: cc.courseId,
            courseClassId: cc.id,
            academicYearId: activeYear.id,
            status: 'DRAFT',
          },
          update: { status: 'DRAFT' },
        });
      }
    });

    // Hitung/perbarui tagihan UKT (SPP + biaya per SKS) untuk pilihan KRS ini.
    // Mahasiswa baru resmi mengajukan KRS ke Dosen PA setelah tagihan ini LUNAS
    // (lihat FinanceService.promoteKrsAfterPayment).
    let invoice: any = null;
    if (classIds.length > 0) {
      try {
        const dueDate = activeYear.krsEndDate
          ? new Date(activeYear.krsEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : undefined;
        invoice = await this.feeRulesService.generateStudentSemesterInvoice({
          studentId: student.id,
          semester: student.currentSemester,
          academicYear: activeYear.name,
          dueDate,
          totalSks,
        });
      } catch (e) {
        console.warn('Gagal menerbitkan tagihan UKT otomatis saat KRS:', e);
      }
    }

    const courseList = await this.getKrs(userId);
    return {
      courses: courseList,
      invoice: invoice
        ? {
            id: invoice.id,
            invoiceNo: invoice.invoiceNo,
            amount: invoice.amount,
            status: invoice.status,
            dueDate: invoice.dueDate,
          }
        : null,
    };
  }

  async getStudentsList() {
    try {
      const students = await this.prisma.student.findMany({
        include: {
          user: true,
          studyProgram: { include: { faculty: true } },
          enrollments: { where: { totalScore: { not: null } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });

      return students.map((s) => {
        const grades = s.enrollments.filter((e) => e.gradePoint !== null);
        const ipk = grades.length > 0
          ? Math.round((grades.reduce((a, e) => a + (e.gradePoint || 0), 0) / grades.length) * 100) / 100
          : 0;
        return {
          id: s.id,
          nim: s.nim,
          name: s.user.fullName,
          email: s.user.email,
          studyProgram: s.studyProgram?.name || '-',
          faculty: s.studyProgram?.faculty?.name || '-',
          entryYear: s.entryYear,
          currentSemester: s.currentSemester,
          status: s.status,
          ipk,
          isActive: s.user.isActive,
        };
      });
    } catch (e) {
      console.warn('getStudentsList error:', e);
      return [];
    }
  }
}
