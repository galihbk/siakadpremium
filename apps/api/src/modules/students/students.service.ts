import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { FeeRulesService } from '../finance/fee-rules.service';
import { Role } from '@siakad/database';
import { StudentDashboardSummary, EnrollmentStatus } from '@siakad/types';
import { computeIsKrsOpen } from '../academic/academic.service';

const MAX_SKS_PER_SEMESTER = 24;

export interface CreateStudentDto {
  email?: string;
  password?: string;
  fullName: string;
  nim: string;
  studyProgramId: string;
  entryYear?: number;
  gender?: 'MALE' | 'FEMALE';
  phone?: string;
  advisorLecturerId?: string;
  isActive?: boolean;
}

export interface UpdateStudentDto {
  fullName?: string;
  email?: string;
  isActive?: boolean;
  gender?: 'MALE' | 'FEMALE';
  birthDate?: string | null;
  birthPlace?: string;
  phone?: string;
  nik?: string;
  nisn?: string;
  noKk?: string;
  religion?: string;
  address?: string;
  streetAddress?: string;
  rtRw?: string;
  dusun?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  studyProgramId?: string;
  advisorLecturerId?: string | null;
  entryYear?: number;
  currentSemester?: number;
  status?: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  schoolName?: string;
  npsn?: string;
  graduationYear?: string;
  major?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherJob?: string;
  fatherIncome?: string;
  motherName?: string;
  motherPhone?: string;
  motherJob?: string;
  motherIncome?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianJob?: string;
}

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
          studentId: student.id,
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
          room: true,
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
          isFlexibleSchedule: cc.isFlexibleSchedule,
          hari: cc.isFlexibleSchedule ? 'Fleksibel' : cc.day,
          jam: cc.isFlexibleSchedule ? 'Bimbingan Mandiri' : `${cc.startTime}-${cc.endTime}`,
          ruang: cc.isFlexibleSchedule ? '-' : cc.room?.name || '-',
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

  /** Jadwal kuliah mingguan mahasiswa: hanya kelas yang KRS-nya sudah APPROVED, dengan rekap kehadiran nyata. */
  async getSchedule(userId?: string) {
    const student = await this.findStudentByUserId(userId);
    if (!student) return [];

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return [];

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { studentId: student.id, academicYearId: activeYear.id, status: 'APPROVED' },
      include: {
        course: true,
        courseClass: {
          include: {
            room: true,
            lecturer: { include: { user: true } },
            attendanceSessions: { include: { records: { where: { studentId: student.id } } } },
          },
        },
      },
    });

    return enrollments
      .filter((e) => e.courseClass)
      .map((e) => {
        const cc = e.courseClass!;
        const sessions = cc.attendanceSessions;
        const totalSessions = sessions.length;
        const hadirCount = sessions.filter((s) => s.records[0]?.status === 'HADIR').length;
        const kehadiranPercent = totalSessions > 0 ? Math.round((hadirCount / totalSessions) * 100) : null;

        return {
          id: e.id,
          classId: cc.id,
          code: e.course.code,
          name: e.course.name,
          sks: e.course.sks || e.course.totalSks || 3,
          kelas: cc.className,
          isFlexibleSchedule: cc.isFlexibleSchedule,
          hari: cc.isFlexibleSchedule ? null : cc.day,
          jamMulai: cc.isFlexibleSchedule ? null : cc.startTime,
          jamSelesai: cc.isFlexibleSchedule ? null : cc.endTime,
          ruang: cc.room?.name || '-',
          gedung: cc.room?.buildingName || '-',
          dosen: cc.lecturer
            ? `${cc.lecturer.titlePrefix ? cc.lecturer.titlePrefix + ' ' : ''}${cc.lecturer.user.fullName}${cc.lecturer.titleSuffix ? ', ' + cc.lecturer.titleSuffix : ''}`
            : 'Belum ditentukan',
          dosenEmail: cc.lecturer?.user?.email || null,
          deskripsi: e.course.description || '',
          pertemuanTerlaksana: totalSessions,
          pertemuanHadir: hadirCount,
          kehadiranPercent,
        };
      });
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
    if (!computeIsKrsOpen(activeYear)) {
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

    // Cek bentrok jadwal antar kelas yang dipilih mahasiswa (hari & jam beririsan).
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const a = classes[i];
        const b = classes[j];
        // Kelas tanpa jadwal tetap (Skripsi/KKN/KP dst.) tidak punya jam nyata untuk dibandingkan.
        if (a.isFlexibleSchedule || b.isFlexibleSchedule) continue;
        if (a.day.toLowerCase() !== b.day.toLowerCase()) continue;
        const overlaps = toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
        if (overlaps) {
          throw new BadRequestException(
            `Jadwal bentrok: ${a.course.code} (Kelas ${a.className}, ${a.startTime}-${a.endTime}) bertabrakan dengan ${b.course.code} (Kelas ${b.className}, ${b.startTime}-${b.endTime}) pada hari ${a.day}.`,
          );
        }
      }
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

  async findOne(id: string) {
    const s = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
        advisorLecturer: { include: { user: true } },
        enrollments: { where: { status: 'APPROVED' }, include: { course: true } },
      },
    });
    if (!s) {
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }

    const grades = s.enrollments.filter((e) => e.gradePoint !== null);
    const ipk =
      grades.length > 0 ? Math.round((grades.reduce((a, e) => a + (e.gradePoint || 0), 0) / grades.length) * 100) / 100 : 0;
    const totalSks = s.enrollments.reduce((a, e) => a + (e.course?.sks || e.course?.totalSks || 0), 0);

    const dash = (v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '-' : v);

    return {
      id: s.id,
      userId: s.userId,
      nim: s.nim,
      fullName: s.user.fullName,
      email: s.user.email,
      isActive: s.user.isActive,
      gender: s.gender,
      birthDate: s.birthDate,
      birthPlace: dash(s.birthPlace),
      phone: dash(s.phone),
      nik: dash(s.nik),
      nisn: dash(s.nisn),
      noKk: dash(s.noKk),
      religion: dash(s.religion),
      address: dash(s.address),
      streetAddress: dash(s.streetAddress),
      rtRw: dash(s.rtRw),
      dusun: dash(s.dusun),
      kelurahan: dash(s.kelurahan),
      kecamatan: dash(s.kecamatan),
      city: dash(s.city),
      province: dash(s.province),
      postalCode: dash(s.postalCode),
      studyProgramId: s.studyProgramId,
      studyProgramName: s.studyProgram?.name || '-',
      facultyName: s.studyProgram?.faculty?.name || '-',
      entryYear: s.entryYear,
      currentSemester: s.currentSemester,
      status: s.status,
      ipk,
      totalSks,
      schoolName: dash(s.schoolName),
      npsn: dash(s.npsn),
      graduationYear: dash(s.graduationYear),
      major: dash(s.major),
      fatherName: dash(s.fatherName),
      fatherPhone: dash(s.fatherPhone),
      fatherJob: dash(s.fatherJob),
      fatherIncome: dash(s.fatherIncome),
      motherName: dash(s.motherName),
      motherPhone: dash(s.motherPhone),
      motherJob: dash(s.motherJob),
      motherIncome: dash(s.motherIncome),
      guardianName: dash(s.guardianName),
      guardianPhone: dash(s.guardianPhone),
      guardianJob: dash(s.guardianJob),
      advisorLecturerId: s.advisorLecturerId,
      advisorLecturerName: s.advisorLecturer?.user?.fullName || null,
      createdAt: s.createdAt,
    };
  }

  /** Membuat mahasiswa baru manual lewat form admin -- bukan dari Pull/Sync Feeder. */
  async create(dto: CreateStudentDto) {
    const nim = dto.nim?.trim();
    if (!nim) {
      throw new BadRequestException('NIM wajib diisi.');
    }
    if (!dto.fullName?.trim()) {
      throw new BadRequestException('Nama lengkap wajib diisi.');
    }
    if (!dto.studyProgramId) {
      throw new BadRequestException('Program studi wajib dipilih.');
    }

    const existingNim = await this.prisma.student.findUnique({ where: { nim } });
    if (existingNim) {
      throw new BadRequestException(`NIM "${nim}" sudah terdaftar.`);
    }

    const studyProgram = await this.prisma.studyProgram.findUnique({ where: { id: dto.studyProgramId } });
    if (!studyProgram) {
      throw new BadRequestException('Program studi tidak ditemukan.');
    }

    const email = dto.email?.trim() || `${nim}@mahasiswa.itn.ac.id`;
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException(`Email "${email}" sudah terdaftar dalam sistem.`);
    }

    const password = dto.password || nim;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        role: Role.STUDENT,
        passwordHash,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    const student = await this.prisma.student.create({
      data: {
        userId: user.id,
        studyProgramId: dto.studyProgramId,
        nim,
        gender: dto.gender || 'MALE',
        entryYear: dto.entryYear || new Date().getFullYear(),
        currentSemester: 1,
        phone: dto.phone?.trim() || null,
        advisorLecturerId: dto.advisorLecturerId || null,
      },
    });

    return this.findOne(student.id);
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID "${id}" tidak ditemukan.`);
    }

    const userUpdateData: any = {};
    if (dto.fullName) userUpdateData.fullName = dto.fullName;
    if (dto.email && dto.email !== student.user.email) userUpdateData.email = dto.email;
    if (dto.isActive !== undefined) userUpdateData.isActive = dto.isActive;
    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({ where: { id: student.userId }, data: userUpdateData });
    }

    const studentUpdateData: any = {};
    if (dto.gender !== undefined) studentUpdateData.gender = dto.gender;
    if (dto.birthDate !== undefined) studentUpdateData.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.birthPlace !== undefined) studentUpdateData.birthPlace = dto.birthPlace;
    if (dto.phone !== undefined) studentUpdateData.phone = dto.phone;
    if (dto.nik !== undefined) studentUpdateData.nik = dto.nik;
    if (dto.nisn !== undefined) studentUpdateData.nisn = dto.nisn;
    if (dto.noKk !== undefined) studentUpdateData.noKk = dto.noKk;
    if (dto.religion !== undefined) studentUpdateData.religion = dto.religion;
    if (dto.address !== undefined) studentUpdateData.address = dto.address;
    if (dto.streetAddress !== undefined) studentUpdateData.streetAddress = dto.streetAddress;
    if (dto.rtRw !== undefined) studentUpdateData.rtRw = dto.rtRw;
    if (dto.dusun !== undefined) studentUpdateData.dusun = dto.dusun;
    if (dto.kelurahan !== undefined) studentUpdateData.kelurahan = dto.kelurahan;
    if (dto.kecamatan !== undefined) studentUpdateData.kecamatan = dto.kecamatan;
    if (dto.city !== undefined) studentUpdateData.city = dto.city;
    if (dto.province !== undefined) studentUpdateData.province = dto.province;
    if (dto.postalCode !== undefined) studentUpdateData.postalCode = dto.postalCode;
    if (dto.studyProgramId) studentUpdateData.studyProgramId = dto.studyProgramId;
    if (dto.advisorLecturerId !== undefined) studentUpdateData.advisorLecturerId = dto.advisorLecturerId || null;
    if (dto.entryYear !== undefined) studentUpdateData.entryYear = dto.entryYear;
    if (dto.currentSemester !== undefined) studentUpdateData.currentSemester = dto.currentSemester;
    if (dto.status !== undefined) studentUpdateData.status = dto.status;
    if (dto.schoolName !== undefined) studentUpdateData.schoolName = dto.schoolName;
    if (dto.npsn !== undefined) studentUpdateData.npsn = dto.npsn;
    if (dto.graduationYear !== undefined) studentUpdateData.graduationYear = dto.graduationYear;
    if (dto.major !== undefined) studentUpdateData.major = dto.major;
    if (dto.fatherName !== undefined) studentUpdateData.fatherName = dto.fatherName;
    if (dto.fatherPhone !== undefined) studentUpdateData.fatherPhone = dto.fatherPhone;
    if (dto.fatherJob !== undefined) studentUpdateData.fatherJob = dto.fatherJob;
    if (dto.fatherIncome !== undefined) studentUpdateData.fatherIncome = dto.fatherIncome;
    if (dto.motherName !== undefined) studentUpdateData.motherName = dto.motherName;
    if (dto.motherPhone !== undefined) studentUpdateData.motherPhone = dto.motherPhone;
    if (dto.motherJob !== undefined) studentUpdateData.motherJob = dto.motherJob;
    if (dto.motherIncome !== undefined) studentUpdateData.motherIncome = dto.motherIncome;
    if (dto.guardianName !== undefined) studentUpdateData.guardianName = dto.guardianName;
    if (dto.guardianPhone !== undefined) studentUpdateData.guardianPhone = dto.guardianPhone;
    if (dto.guardianJob !== undefined) studentUpdateData.guardianJob = dto.guardianJob;

    if (Object.keys(studentUpdateData).length > 0) {
      await this.prisma.student.update({ where: { id }, data: studentUpdateData });
    }

    return this.findOne(id);
  }

  /** Jumlah mahasiswa bimbingan AKTIF per dosen PA -- mahasiswa cuti/lulus/DO/pindah tidak dihitung. */
  async getActiveAdvisorCounts(): Promise<Record<string, number>> {
    const rows = await this.prisma.student.groupBy({
      by: ['advisorLecturerId'],
      where: { status: 'ACTIVE', advisorLecturerId: { not: null } },
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (r.advisorLecturerId) counts[r.advisorLecturerId] = r._count._all;
    }
    return counts;
  }

  async getStudentsList() {
    try {
      const students = await this.prisma.student.findMany({
        include: {
          user: true,
          studyProgram: { include: { faculty: true } },
          advisorLecturer: { include: { user: true } },
          enrollments: { where: { status: 'APPROVED' }, include: { course: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return students.map((s) => {
        const grades = s.enrollments.filter((e) => e.gradePoint !== null);
        const ipk = grades.length > 0
          ? Math.round((grades.reduce((a, e) => a + (e.gradePoint || 0), 0) / grades.length) * 100) / 100
          : 0;
        const totalSks = s.enrollments.reduce((a, e) => a + (e.course?.sks || e.course?.totalSks || 0), 0);
        return {
          id: s.id,
          nim: s.nim,
          name: s.user.fullName,
          email: s.user.email,
          phone: s.phone || null,
          address: s.address || null,
          gender: s.gender,
          studyProgram: s.studyProgram?.name || '-',
          faculty: s.studyProgram?.faculty?.name || '-',
          entryYear: s.entryYear,
          currentSemester: s.currentSemester,
          status: s.status,
          ipk,
          totalSks,
          dosenPA: s.advisorLecturer?.user?.fullName || null,
          isActive: s.user.isActive,
          // Biodata lengkap -- field-field ini sudah ikut terambil dari query `findMany` di
          // atas (bukan query tambahan per mahasiswa), cuma belum pernah diikutsertakan di
          // response-nya. Dipakai untuk ekspor data lengkap, bukan ditampilkan di tabel.
          nik: s.nik || null,
          nisn: s.nisn || null,
          noKk: s.noKk || null,
          birthPlace: s.birthPlace || null,
          birthDate: s.birthDate ? s.birthDate.toISOString().slice(0, 10) : null,
          religion: s.religion || null,
          streetAddress: s.streetAddress || null,
          rtRw: s.rtRw || null,
          dusun: s.dusun || null,
          kelurahan: s.kelurahan || null,
          kecamatan: s.kecamatan || null,
          city: s.city || null,
          province: s.province || null,
          postalCode: s.postalCode || null,
          schoolName: s.schoolName || null,
          npsn: s.npsn || null,
          graduationYear: s.graduationYear || null,
          major: s.major || null,
          fatherName: s.fatherName || null,
          fatherPhone: s.fatherPhone || null,
          fatherJob: s.fatherJob || null,
          fatherIncome: s.fatherIncome || null,
          motherName: s.motherName || null,
          motherPhone: s.motherPhone || null,
          motherJob: s.motherJob || null,
          motherIncome: s.motherIncome || null,
          guardianName: s.guardianName || null,
          guardianPhone: s.guardianPhone || null,
          guardianJob: s.guardianJob || null,
        };
      });
    } catch (e) {
      console.warn('getStudentsList error:', e);
      return [];
    }
  }
}
