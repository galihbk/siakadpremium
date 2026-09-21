import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '@siakad/database';
import { LecturerDashboardSummary } from '@siakad/types';

export interface CreateLecturerDto {
  email: string;
  password?: string;
  fullName: string;
  nidn: string;
  nip?: string;
  titlePrefix?: string;
  titleSuffix?: string;
  studyProgramId?: string;
  phone?: string;
  isAcademicAdvisor?: boolean;
  isActive?: boolean;
}

export interface UpdateLecturerDto {
  email?: string;
  password?: string;
  fullName?: string;
  nidn?: string;
  nip?: string;
  titlePrefix?: string;
  titleSuffix?: string;
  studyProgramId?: string;
  phone?: string;
  isAcademicAdvisor?: boolean;
  isActive?: boolean;
}

@Injectable()
export class LecturersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const lecturers = await this.prisma.lecturer.findMany({
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return lecturers.map((lec) => ({
      id: lec.id,
      userId: lec.userId,
      nidn: lec.nidn,
      nip: lec.nip || '-',
      fullName: lec.user.fullName,
      titlePrefix: lec.titlePrefix || '',
      titleSuffix: lec.titleSuffix || '',
      email: lec.user.email,
      phone: lec.phone || '',
      studyProgramId: lec.studyProgramId,
      studyProgramName: lec.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lec.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lec.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lec.isAcademicAdvisor,
      isActive: lec.user.isActive,
      role: lec.user.role,
      createdAt: lec.createdAt,
    }));
  }

  async findOne(id: string) {
    const lec = await this.prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!lec) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    return {
      id: lec.id,
      userId: lec.userId,
      nidn: lec.nidn,
      nip: lec.nip || '-',
      fullName: lec.user.fullName,
      titlePrefix: lec.titlePrefix || '',
      titleSuffix: lec.titleSuffix || '',
      email: lec.user.email,
      phone: lec.phone || '',
      studyProgramId: lec.studyProgramId,
      studyProgramName: lec.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lec.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lec.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lec.isAcademicAdvisor,
      isActive: lec.user.isActive,
      role: lec.user.role,
      createdAt: lec.createdAt,
    };
  }

  async create(dto: CreateLecturerDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException(`Email "${dto.email}" sudah terdaftar dalam sistem.`);
    }

    // Check if NIDN already exists
    if (dto.nidn) {
      const existingNidn = await this.prisma.lecturer.findUnique({ where: { nidn: dto.nidn } });
      if (existingNidn) {
        throw new BadRequestException(`NIDN "${dto.nidn}" sudah terdaftar.`);
      }
    }

    const password = dto.password || 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve studyProgramId
    let studyProgramId = dto.studyProgramId;
    if (!studyProgramId) {
      const firstProdi = await this.prisma.studyProgram.findFirst();
      studyProgramId = firstProdi ? firstProdi.id : 'default-prodi';
    }

    // Create User with role LECTURER
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: Role.LECTURER,
        passwordHash,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Create Lecturer Profile
    const lecturer = await this.prisma.lecturer.create({
      data: {
        userId: user.id,
        studyProgramId,
        nidn: dto.nidn || `04${Date.now().toString().slice(-8)}`,
        nip: dto.nip || null,
        titlePrefix: dto.titlePrefix || null,
        titleSuffix: dto.titleSuffix || null,
        phone: dto.phone || null,
        isAcademicAdvisor: dto.isAcademicAdvisor !== undefined ? dto.isAcademicAdvisor : true,
      },
      include: {
        user: true,
        studyProgram: {
          include: { faculty: true },
        },
      },
    });

    return {
      id: lecturer.id,
      userId: user.id,
      nidn: lecturer.nidn,
      nip: lecturer.nip || '-',
      fullName: user.fullName,
      titlePrefix: lecturer.titlePrefix || '',
      titleSuffix: lecturer.titleSuffix || '',
      email: user.email,
      phone: lecturer.phone || '',
      studyProgramId: lecturer.studyProgramId,
      studyProgramName: lecturer.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lecturer.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lecturer.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lecturer.isAcademicAdvisor,
      isActive: user.isActive,
      role: user.role,
      createdAt: lecturer.createdAt,
    };
  }

  async update(id: string, dto: UpdateLecturerDto) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    // Update User details
    const userUpdateData: any = {};
    if (dto.fullName) userUpdateData.fullName = dto.fullName;
    if (dto.email && dto.email !== lecturer.user.email) userUpdateData.email = dto.email;
    if (dto.isActive !== undefined) userUpdateData.isActive = dto.isActive;
    if (dto.password) {
      userUpdateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: lecturer.userId },
        data: userUpdateData,
      });
    }

    // Update Lecturer profile
    const lecturerUpdateData: any = {};
    if (dto.nidn) lecturerUpdateData.nidn = dto.nidn;
    if (dto.nip !== undefined) lecturerUpdateData.nip = dto.nip;
    if (dto.titlePrefix !== undefined) lecturerUpdateData.titlePrefix = dto.titlePrefix;
    if (dto.titleSuffix !== undefined) lecturerUpdateData.titleSuffix = dto.titleSuffix;
    if (dto.phone !== undefined) lecturerUpdateData.phone = dto.phone;
    if (dto.studyProgramId) lecturerUpdateData.studyProgramId = dto.studyProgramId;
    if (dto.isAcademicAdvisor !== undefined) lecturerUpdateData.isAcademicAdvisor = dto.isAcademicAdvisor;

    const updated = await this.prisma.lecturer.update({
      where: { id },
      data: lecturerUpdateData,
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      nidn: updated.nidn,
      nip: updated.nip || '-',
      fullName: updated.user.fullName,
      titlePrefix: updated.titlePrefix || '',
      titleSuffix: updated.titleSuffix || '',
      email: updated.user.email,
      phone: updated.phone || '',
      studyProgramId: updated.studyProgramId,
      studyProgramName: updated.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: updated.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: updated.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: updated.isAcademicAdvisor,
      isActive: updated.user.isActive,
      role: updated.user.role,
      createdAt: updated.createdAt,
    };
  }

  async remove(id: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    // Deleting the user will cascade delete the lecturer profile
    await this.prisma.user.delete({ where: { id: lecturer.userId } });
    return { success: true, message: 'Akun dosen berhasil dihapus dari sistem.' };
  }

  async resetPassword(id: string, newPassword?: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    const password = newPassword || 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: lecturer.userId },
      data: { passwordHash },
    });

    return { success: true, message: `Password berhasil direset menjadi "${password}".` };
  }

  async getDashboardSummary(): Promise<LecturerDashboardSummary> {
    return {
      nidn: '0412088501',
      nama: 'Dr. Bayu Wicaksono, M.Kom.',
      jabatanFungsional: 'Lektor Kepala / Dosen Pembimbing Akademik',
      fakultas: 'Fakultas Ilmu Komputer',
      totalKelasMengajar: 4,
      totalMahasiswaBimbingan: 28,
      statusInputNilai: 'PROSES',
    };
  }

  async getTeachingSchedule(lecturerId: string | undefined) {
    if (!lecturerId) return [];

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    const classes = await this.prisma.courseClass.findMany({
      where: {
        lecturerId,
        ...(activeYear ? { academicYearId: activeYear.id } : {}),
      },
      include: {
        course: { include: { studyProgram: true } },
        room: { include: { building: true } },
        lecturer: { include: { user: true } },
        academicYear: true,
        _count: { select: { enrollments: { where: { status: { not: 'REJECTED' } } } } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return classes.map((cc) => ({
      id: cc.id,
      courseCode: cc.course.code,
      courseName: cc.course.name,
      className: cc.className,
      sks: cc.course.sks || cc.course.totalSks || 3,
      studyProgramName: cc.course.studyProgram?.name || cc.course.studyProgramName || '-',
      semester: cc.course.semester,
      academicYear: cc.academicYear?.name || '-',
      day: cc.day,
      timeSlot: `${cc.startTime} - ${cc.endTime} WIB`,
      roomName: cc.room?.name || '-',
      buildingName: cc.room?.building?.name || '',
      lecturerName: cc.lecturer?.user?.fullName || '-',
      lecturerNidn: cc.lecturer?.nidn || '-',
      enrolledCount: cc._count?.enrollments || 0,
      quota: cc.quota,
    }));
  }

  private async assertClassOwnedByLecturer(classId: string, lecturerId: string | undefined) {
    if (!lecturerId) {
      throw new BadRequestException('Dosen tidak teridentifikasi. Silakan login ulang.');
    }
    const cc = await this.prisma.courseClass.findUnique({ where: { id: classId }, include: { course: true } });
    if (!cc) {
      throw new NotFoundException(`Kelas dengan ID "${classId}" tidak ditemukan.`);
    }
    if (cc.lecturerId !== lecturerId) {
      throw new BadRequestException('Kelas ini bukan kelas yang Anda ajar.');
    }
    return cc;
  }

  // ================= ABSENSI PERKULIAHAN =================
  async getAttendance(lecturerId: string | undefined, classId: string, meetingNumber: number) {
    const cc = await this.assertClassOwnedByLecturer(classId, lecturerId);

    const roster = await this.prisma.courseEnrollment.findMany({
      where: { courseClassId: classId, status: { in: ['SUBMITTED', 'APPROVED'] } },
      include: { student: { include: { user: true } } },
      orderBy: { student: { nim: 'asc' } },
    });

    const session = await this.prisma.attendanceSession.findUnique({
      where: { courseClassId_meetingNumber: { courseClassId: classId, meetingNumber } },
      include: { records: true },
    });
    const recordByStudent = new Map((session?.records || []).map((r) => [r.studentId, r]));

    return {
      classId,
      courseCode: cc.course.code,
      courseName: cc.course.name,
      className: cc.className,
      meetingNumber,
      date: session?.date || null,
      topic: session?.topic || '',
      students: roster.map((e) => ({
        studentId: e.studentId,
        nim: e.student.nim,
        fullName: e.student.user.fullName,
        status: recordByStudent.get(e.studentId)?.status || 'ALFA',
        notes: recordByStudent.get(e.studentId)?.notes || '',
      })),
    };
  }

  async saveAttendance(
    lecturerId: string | undefined,
    classId: string,
    payload: { meetingNumber: number; date?: string; topic?: string; records: Array<{ studentId: string; status: string; notes?: string }> },
  ) {
    await this.assertClassOwnedByLecturer(classId, lecturerId);

    const session = await this.prisma.attendanceSession.upsert({
      where: { courseClassId_meetingNumber: { courseClassId: classId, meetingNumber: Number(payload.meetingNumber) } },
      create: {
        courseClassId: classId,
        meetingNumber: Number(payload.meetingNumber),
        date: payload.date ? new Date(payload.date) : new Date(),
        topic: payload.topic || null,
      },
      update: {
        date: payload.date ? new Date(payload.date) : undefined,
        topic: payload.topic !== undefined ? payload.topic : undefined,
      },
    });

    for (const r of payload.records || []) {
      await this.prisma.attendanceRecord.upsert({
        where: { attendanceSessionId_studentId: { attendanceSessionId: session.id, studentId: r.studentId } },
        create: { attendanceSessionId: session.id, studentId: r.studentId, status: r.status as any, notes: r.notes || null },
        update: { status: r.status as any, notes: r.notes || null },
      });
    }

    return { success: true, message: `Absensi pertemuan ke-${payload.meetingNumber} berhasil disimpan.` };
  }

  async getAttendanceRecap(lecturerId: string | undefined, classId: string) {
    const cc = await this.assertClassOwnedByLecturer(classId, lecturerId);

    const roster = await this.prisma.courseEnrollment.findMany({
      where: { courseClassId: classId, status: { in: ['SUBMITTED', 'APPROVED'] } },
      include: { student: { include: { user: true } } },
      orderBy: { student: { nim: 'asc' } },
    });

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { courseClassId: classId },
      include: { records: true },
      orderBy: { meetingNumber: 'asc' },
    });
    const totalMeetings = sessions.length;

    const students = roster.map((e) => {
      const counts: Record<string, number> = { HADIR: 0, IZIN: 0, SAKIT: 0, ALFA: 0 };
      for (const s of sessions) {
        const rec = s.records.find((r) => r.studentId === e.studentId);
        const status = rec?.status || 'ALFA';
        counts[status] = (counts[status] || 0) + 1;
      }
      const percentage = totalMeetings > 0 ? Math.round((counts.HADIR / totalMeetings) * 100) : 0;
      return {
        studentId: e.studentId,
        nim: e.student.nim,
        fullName: e.student.user.fullName,
        ...counts,
        percentage,
      };
    });

    return { classId, courseName: cc.course.name, className: cc.className, totalMeetings, students };
  }

  // ================= KONTRAK KULIAH (RPS) =================
  async getCourseContract(lecturerId: string | undefined, classId: string): Promise<any> {
    const cc = await this.assertClassOwnedByLecturer(classId, lecturerId);
    const contract = await this.prisma.courseContract.findUnique({
      where: { courseClassId: classId },
      include: { weeks: { orderBy: { weekNumber: 'asc' } } },
    });
    return {
      classId,
      courseCode: cc.course.code,
      courseName: cc.course.name,
      className: cc.className,
      contract: contract || null,
    };
  }

  async saveCourseContract(lecturerId: string | undefined, classId: string, payload: any) {
    await this.assertClassOwnedByLecturer(classId, lecturerId);

    const contract = await this.prisma.courseContract.upsert({
      where: { courseClassId: classId },
      create: {
        courseClassId: classId,
        description: payload.description || null,
        learningOutcomes: payload.learningOutcomes || null,
        references: payload.references || null,
        assessmentWeights: payload.assessmentWeights || undefined,
        isPublished: Boolean(payload.isPublished),
      },
      update: {
        description: payload.description || null,
        learningOutcomes: payload.learningOutcomes || null,
        references: payload.references || null,
        assessmentWeights: payload.assessmentWeights || undefined,
        isPublished: Boolean(payload.isPublished),
      },
    });

    await this.prisma.courseContractWeek.deleteMany({ where: { contractId: contract.id } });
    const weeks = Array.isArray(payload.weeks) ? payload.weeks : [];
    for (const w of weeks) {
      if (!w.topic) continue;
      await this.prisma.courseContractWeek.create({
        data: {
          contractId: contract.id,
          weekNumber: Number(w.weekNumber),
          topic: w.topic,
          method: w.method || null,
          indicator: w.indicator || null,
        },
      });
    }

    return { success: true, message: 'Kontrak kuliah berhasil disimpan.' };
  }

  // ================= UPLOAD RPS (BERKAS) =================
  async getRps(lecturerId: string | undefined, classId: string): Promise<any> {
    const cc = await this.assertClassOwnedByLecturer(classId, lecturerId);
    const contract = await this.prisma.courseContract.findUnique({
      where: { courseClassId: classId },
      select: { rpsFileUrl: true, rpsFileName: true, rpsUploadedAt: true },
    });
    return {
      classId,
      courseCode: cc.course.code,
      courseName: cc.course.name,
      className: cc.className,
      rpsFileUrl: contract?.rpsFileUrl || null,
      rpsFileName: contract?.rpsFileName || null,
      rpsUploadedAt: contract?.rpsUploadedAt || null,
    };
  }

  async saveRps(lecturerId: string | undefined, classId: string, payload: { fileUrl: string; fileName: string }) {
    await this.assertClassOwnedByLecturer(classId, lecturerId);
    if (!payload.fileUrl) {
      throw new BadRequestException('Berkas RPS wajib diunggah.');
    }

    await this.prisma.courseContract.upsert({
      where: { courseClassId: classId },
      create: {
        courseClassId: classId,
        rpsFileUrl: payload.fileUrl,
        rpsFileName: payload.fileName || null,
        rpsUploadedAt: new Date(),
      },
      update: {
        rpsFileUrl: payload.fileUrl,
        rpsFileName: payload.fileName || null,
        rpsUploadedAt: new Date(),
      },
    });

    return { success: true, message: 'Berkas RPS berhasil diunggah.' };
  }

  // ================= MAHASISWA BIMBINGAN (ADVISEES) =================
  private async mapAdviseeStudent(s: any) {
    const enrollments = s.enrollments || [];
    const hasSubmitted = enrollments.some((e: any) => e.status === 'SUBMITTED');
    const hasApproved = enrollments.some((e: any) => e.status === 'APPROVED');
    const allApproved = enrollments.length > 0 && enrollments.every((e: any) => e.status === 'APPROVED');
    const krsStatus: 'Menunggu Persetujuan' | 'Disetujui' | 'Draft' | 'Belum Mengisi' = hasSubmitted
      ? 'Menunggu Persetujuan'
      : allApproved
      ? 'Disetujui'
      : hasApproved
      ? 'Disetujui'
      : enrollments.length > 0
      ? 'Draft'
      : 'Belum Mengisi';

    const graded = enrollments.filter((e: any) => e.gradePoint !== null && e.gradePoint !== undefined);
    const ipk = graded.length > 0
      ? Math.round((graded.reduce((a: number, e: any) => a + (e.gradePoint || 0), 0) / graded.length) * 100) / 100
      : 0;
    const totalSksLulus = graded
      .filter((e: any) => (e.gradePoint || 0) >= 2.0)
      .reduce((sum: number, e: any) => sum + (e.course?.sks || 3), 0);
    const sksSemesterIni = enrollments.reduce((sum: number, e: any) => sum + (e.course?.sks || 3), 0);

    return {
      id: s.id,
      nim: s.nim,
      fullName: s.user.fullName,
      gender: s.gender === 'FEMALE' ? 'Perempuan' : 'Laki-laki',
      angkatan: s.entryYear,
      currentSemester: s.currentSemester,
      studyProgramName: s.studyProgram?.name || '-',
      facultyName: s.studyProgram?.faculty?.name || '-',
      ipk,
      totalSksLulus,
      sksSemesterIni,
      krsStatus,
      phone: s.phone || '-',
      email: s.user.email,
      statusBimbingan: 'KRS' as const,
      skripsiTitle: null,
      skripsiProgress: null,
      courses: enrollments.map((e: any) => ({
        code: e.course?.code || '-',
        name: e.course?.name || '-',
        sks: e.course?.sks || 3,
        class: e.courseClass?.className || '-',
        schedule: e.courseClass ? `${e.courseClass.day}, ${e.courseClass.startTime} - ${e.courseClass.endTime}` : '-',
        status: e.status,
      })),
      consultations: [] as any[],
    };
  }

  /**
   * Detail lengkap satu mahasiswa bimbingan: biodata diri, alamat, data sekolah asal,
   * data orang tua/wali, jalur masuk PMB, dan riwayat KRS di semua tahun akademik.
   */
  async getAdviseeDetail(lecturerId: string | undefined, studentId: string) {
    if (!lecturerId) {
      throw new BadRequestException('Dosen tidak teridentifikasi. Silakan login ulang.');
    }

    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { nim: studentId }] },
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
        advisorLecturer: { include: { user: true } },
        registrationType: true,
        track: true,
        admissionClass: true,
        enrollments: {
          include: { course: true, courseClass: true, academicYear: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID atau NIM "${studentId}" tidak ditemukan.`);
    }
    if (student.advisorLecturerId !== lecturerId) {
      throw new BadRequestException('Mahasiswa ini bukan mahasiswa bimbingan Anda.');
    }

    const graded = student.enrollments.filter((e) => e.gradePoint !== null && e.gradePoint !== undefined);
    const ipk = graded.length > 0
      ? Math.round((graded.reduce((a, e) => a + (e.gradePoint || 0), 0) / graded.length) * 100) / 100
      : 0;
    const totalSksLulus = graded
      .filter((e) => (e.gradePoint || 0) >= 2.0)
      .reduce((sum, e) => sum + (e.course?.sks || 3), 0);

    // Kelompokkan riwayat KRS per tahun akademik
    const historyMap = new Map<string, { academicYear: string; courses: any[] }>();
    for (const e of student.enrollments) {
      const key = e.academicYearId;
      const entry = historyMap.get(key) || { academicYear: e.academicYear?.name || '-', courses: [] };
      entry.courses.push({
        code: e.course?.code || '-',
        name: e.course?.name || '-',
        sks: e.course?.sks || 3,
        class: e.courseClass?.className || '-',
        status: e.status,
        gradeLetter: e.gradeLetter,
        gradePoint: e.gradePoint,
      });
      historyMap.set(key, entry);
    }

    const fullAddress = [
      student.streetAddress,
      student.rtRw ? `RT/RW ${student.rtRw}` : null,
      student.dusun,
      student.kelurahan ? `Kel. ${student.kelurahan}` : null,
      student.kecamatan ? `Kec. ${student.kecamatan}` : null,
      student.city,
      student.province,
      student.postalCode,
    ].filter(Boolean).join(', ') || student.address || '-';

    return {
      id: student.id,
      nim: student.nim,
      fullName: student.user.fullName,
      email: student.user.email,
      gender: student.gender === 'FEMALE' ? 'Perempuan' : 'Laki-laki',
      birthPlace: student.birthPlace || '-',
      birthDate: student.birthDate,
      phone: student.phone || '-',
      nik: student.nik || '-',
      nisn: student.nisn || '-',
      religion: student.religion || '-',
      address: fullAddress,

      studyProgramName: student.studyProgram?.name || '-',
      facultyName: student.studyProgram?.faculty?.name || '-',
      degreeLevel: student.studyProgram?.degreeLevel || '-',
      entryYear: student.entryYear,
      currentSemester: student.currentSemester,
      status: student.status,
      advisorLecturerName: student.advisorLecturer?.user?.fullName || 'Belum Ditentukan',

      registrationType: student.registrationType?.name || '-',
      track: student.track?.name || '-',
      admissionClass: student.admissionClass?.name || '-',

      schoolName: student.schoolName || '-',
      npsn: student.npsn || '-',
      graduationYear: student.graduationYear || '-',
      major: student.major || '-',

      fatherName: student.fatherName || '-',
      fatherPhone: student.fatherPhone || '-',
      fatherJob: student.fatherJob || '-',
      motherName: student.motherName || '-',
      motherPhone: student.motherPhone || '-',
      motherJob: student.motherJob || '-',
      guardianName: student.guardianName || null,
      guardianPhone: student.guardianPhone || null,
      guardianJob: student.guardianJob || null,

      ipk,
      totalSksLulus,
      academicHistory: Array.from(historyMap.values()),
    };
  }

  async getAdvisees(lecturerId: string | undefined, query?: { angkatan?: number; status?: string; search?: string }) {
    if (!lecturerId) {
      return { summary: { totalStudents: 0, pendingKrs: 0, approvedKrs: 0, thesisStudents: 0 }, students: [] };
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });

    const where: any = { advisorLecturerId: lecturerId };
    if (query?.angkatan) where.entryYear = query.angkatan;
    if (query?.search) {
      where.OR = [
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
        { nim: { contains: query.search } },
      ];
    }

    const allAdvisees = await this.prisma.student.findMany({
      where: { advisorLecturerId: lecturerId },
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
        enrollments: activeYear
          ? { where: { academicYearId: activeYear.id }, include: { course: true, courseClass: true } }
          : false,
      },
    });
    const allMapped = await Promise.all(allAdvisees.map((s) => this.mapAdviseeStudent(s)));

    const totalStudents = allMapped.length;
    const pendingKrs = allMapped.filter((m) => m.krsStatus === 'Menunggu Persetujuan').length;
    const approvedKrs = allMapped.filter((m) => m.krsStatus === 'Disetujui').length;
    // Bimbingan skripsi belum ada modelnya di database -- semua mahasiswa masih tercatat status 'KRS'
    const thesisStudents = 0;

    let list = allMapped;
    if (query?.angkatan && Number(query.angkatan) > 0) {
      list = list.filter((m) => m.angkatan === Number(query.angkatan));
    }
    if (query?.status && query.status !== 'Semua') {
      if (query.status === 'KRS Menunggu') list = list.filter((m) => m.krsStatus === 'Menunggu Persetujuan');
      else if (query.status === 'KRS Disetujui') list = list.filter((m) => m.krsStatus === 'Disetujui');
      else if (query.status === 'Bimbingan Skripsi') list = [];
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter((m) => m.fullName.toLowerCase().includes(q) || m.nim.includes(q));
    }

    return {
      summary: { totalStudents, pendingKrs, approvedKrs, thesisStudents },
      students: list,
    };
  }

  async approveStudentKrs(lecturerId: string | undefined, studentId: string, note?: string) {
    if (!lecturerId) {
      throw new BadRequestException('Dosen tidak teridentifikasi. Silakan login ulang.');
    }
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { nim: studentId }] },
      include: { user: true },
    });
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID atau NIM "${studentId}" tidak ditemukan.`);
    }
    if (student.advisorLecturerId !== lecturerId) {
      throw new BadRequestException('Mahasiswa ini bukan mahasiswa bimbingan Anda.');
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) {
      throw new NotFoundException('Tidak ada tahun akademik aktif saat ini.');
    }

    await this.prisma.courseEnrollment.updateMany({
      where: { studentId: student.id, academicYearId: activeYear.id, status: 'SUBMITTED' },
      data: { status: 'APPROVED' },
    });

    if (note) {
      await this.prisma.systemAuditLog
        .create({ data: { action: 'PA_APPROVE_KRS', detail: `${note} (KRS ${student.nim} disetujui Dosen PA)`, userEmail: student.user.email } })
        .catch(() => null);
    }

    const refreshed = await this.prisma.student.findUnique({
      where: { id: student.id },
      include: {
        user: true,
        studyProgram: { include: { faculty: true } },
        enrollments: { where: { academicYearId: activeYear.id }, include: { course: true, courseClass: true } },
      },
    });

    return {
      success: true,
      message: `KRS mahasiswa ${student.user.fullName} (${student.nim}) berhasil disetujui resmi oleh Dosen PA.`,
      data: await this.mapAdviseeStudent(refreshed),
    };
  }

  async addAdviseeConsultation(lecturerId: string | undefined, studentId: string, payload: { topic: string; note: string }) {
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { nim: studentId }] },
      include: { user: true },
    });
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID atau NIM "${studentId}" tidak ditemukan.`);
    }

    const newConsultation = {
      id: `cs-${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      topic: payload.topic || 'Bimbingan Konsultasi Akademik',
      note: payload.note,
    };

    await this.prisma.systemAuditLog
      .create({ data: { action: 'PA_CONSULTATION', detail: `${newConsultation.topic}: ${newConsultation.note} (mahasiswa ${student.nim})`, userEmail: student.user.email } })
      .catch(() => null);

    return {
      success: true,
      message: 'Catatan konsultasi bimbingan akademik berhasil ditambahkan.',
      data: newConsultation,
    };
  }

  // ================= P3M (PENELITIAN & PENGABDIAN KEPADA MASYARAKAT) =================
  private static p3mStore: any[] = [
    {
      id: 'p3m-1',
      type: 'Penelitian',
      title: 'Rancang Bangun Framework Microservices Berbasis Event-Driven untuk Skalabilitas Sistem Informasi Pendidikan Tinggi',
      scheme: 'Penelitian Terapan Kemendikbudristek (BIMA)',
      focusArea: 'Rekayasa Perangkat Lunak Terdistribusi',
      year: 2025,
      status: 'Selesai',
      fundingAmount: 45000000,
      fundingSource: 'Kemendikbudristek / BIMA',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Ir. Rahmat Hidayat, M.T.', 'Muhammad Rizky Pratama (Mhs - 2311501001)'],
      targetOutput: 'Jurnal Terakreditasi SINTA 2 & Prototipe Sistem Teruji',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-akhir-p3m-1.pdf',
      submittedAt: '15 Maret 2025',
      verifiedAt: '20 April 2025',
      reviewerNote: 'Laporan akhir dan luaran publikasi SINTA 2 telah lengkap diverifikasi LP3M.',
    },
    {
      id: 'p3m-2',
      type: 'Penelitian',
      title: 'Implementasi Algoritma Deep Learning Transformer untuk Deteksi Dini Kerentanan Keamanan Kode Sumber Aplikasi Web',
      scheme: 'Penelitian Fundamental Internal ITN',
      focusArea: 'Kecerdasan Buatan & Keamanan Siber',
      year: 2026,
      status: 'Sedang Berjalan',
      fundingAmount: 20000000,
      fundingSource: 'DIPA Internal ITN',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Nadia Salsabila Putri (Mhs - 2311501045)'],
      targetOutput: 'Prosiding Internasional Terindeks Scopus & Hak Cipta Perangkat Lunak',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-kemajuan-p3m-2.pdf',
      submittedAt: '10 Februari 2026',
      verifiedAt: '05 Maret 2026',
      reviewerNote: 'Laporan kemajuan 70% disetujui. Siap publikasi prosiding konferensi internasional.',
    },
    {
      id: 'p3m-3',
      type: 'Pengabdian',
      title: 'Digitalisasi Tata Kelola Administrasi dan Promosi Produk UMKM Berbasis Web di Desa Wisata Sumbersekar',
      scheme: 'Pengabdian Kemitraan Wilayah Berkelanjutan',
      focusArea: 'Pemberdayaan Ekonomi Digital Desa',
      year: 2025,
      status: 'Selesai',
      fundingAmount: 18000000,
      fundingSource: 'DIPA Internal ITN & CSR Mitra',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Siti Aminah, S.Kom., M.Cs.', 'Dimas Aditya Saputra (Mhs - 2411501008)'],
      targetOutput: 'Publikasi Jurnal Pengabdian SINTA 4, Video Dokumenter & Website Desa',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-akhir-pkm-3.pdf',
      submittedAt: '01 Juni 2025',
      verifiedAt: '15 Agustus 2025',
      reviewerNote: 'Pengabdian selesai dengan hasil kepuasan mitra desa 94%. Luaran video dan web tuntas.',
    },
    {
      id: 'p3m-4',
      type: 'Pengabdian',
      title: 'Pelatihan Literasi Keamanan Siber dan Perlindungan Data Pribadi bagi Siswa dan Guru SMK Informatika Nusantara',
      scheme: 'Penerapan Iptek bagi Masyarakat (PIM)',
      focusArea: 'Literasi Digital & Cyber Hygiene',
      year: 2026,
      status: 'Laporan Akhir',
      fundingAmount: 15000000,
      fundingSource: 'DIPA Internal ITN',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Fajar Nugroho Wicaksono (Mhs - 2211501012)'],
      targetOutput: 'Modul Pelatihan Ber-ISBN, Sertifikat Hak Cipta & Publikasi Media',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/draft-laporan-pkm-4.pdf',
      submittedAt: '20 Januari 2026',
      verifiedAt: '28 Februari 2026',
      reviewerNote: 'Draft laporan akhir sedang dalam proses telaah reviewer akhir P3M.',
    },
    {
      id: 'p3m-5',
      type: 'Penelitian',
      title: 'Optimasi Resource Allocation pada Arsitektur Serverless Multi-Cloud Berbantuan Artificial Intelligence',
      scheme: 'Penelitian Terapan Kerjasama Industri',
      focusArea: 'Cloud Computing & Distributed Systems',
      year: 2026,
      status: 'Laporan Masuk',
      fundingAmount: 35000000,
      fundingSource: 'Hibah Kolaborasi Riset Industri',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Ir. Bambang Tri, M.T.', 'Aulia Rahmadani (Mhs - 2211501024)'],
      targetOutput: 'Jurnal Internasional Terindeks Scopus Q2 & Paten Sederhana',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-riset-p3m-5.pdf',
      submittedAt: '12 Agustus 2026',
      verifiedAt: '25 Agustus 2026',
      reviewerNote: 'Laporan kegiatan riset telah diverifikasi dan tercatat dalam arsip akreditasi kampus.',
    },
  ];

  async getP3mReports(query?: { type?: string; year?: number; status?: string; search?: string }) {
    let list = [...LecturersService.p3mStore];

    if (query?.type && query.type !== 'Semua') {
      list = list.filter((item) => item.type.toLowerCase() === query.type.toLowerCase());
    }

    if (query?.year && Number(query.year) > 0) {
      list = list.filter((item) => item.year === Number(query.year));
    }

    if (query?.status && query.status !== 'Semua') {
      list = list.filter((item) => item.status.toLowerCase() === query.status.toLowerCase());
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.scheme.toLowerCase().includes(q) ||
          item.focusArea.toLowerCase().includes(q) ||
          item.leader.toLowerCase().includes(q)
      );
    }

    const totalPenelitian = LecturersService.p3mStore.filter((i) => i.type === 'Penelitian').length;
    const totalPengabdian = LecturersService.p3mStore.filter((i) => i.type === 'Pengabdian').length;
    const totalDana = LecturersService.p3mStore.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);
    const aktifBerjalan = LecturersService.p3mStore.filter((i) => i.status === 'Sedang Berjalan' || i.status === 'Laporan Akhir').length;

    return {
      summary: {
        totalKegiatan: LecturersService.p3mStore.length,
        totalPenelitian,
        totalPengabdian,
        totalDana,
        aktifBerjalan,
      },
      reports: list,
    };
  }

  async createP3mReport(dto: any) {
    const newReport = {
      id: `p3m-${Date.now()}`,
      type: dto.type || 'Penelitian',
      title: dto.title,
      scheme: dto.scheme || 'Penelitian Fundamental Internal ITN',
      focusArea: dto.focusArea || 'Teknologi Informasi & Sains Terapan',
      year: dto.year ? Number(dto.year) : new Date().getFullYear(),
      status: dto.status || 'Laporan Masuk',
      fundingAmount: dto.fundingAmount ? Number(dto.fundingAmount) : 15000000,
      fundingSource: dto.fundingSource || 'DIPA Internal ITN',
      leader: dto.leader || 'Dr. Bayu Wicaksono, M.Kom.',
      members: Array.isArray(dto.members) ? dto.members : (dto.members ? dto.members.split(',').map((s: string) => s.trim()) : []),
      targetOutput: dto.targetOutput || 'Publikasi Jurnal Terakreditasi Nasional & Laporan Akhir',
      documentUrl: dto.documentUrl || 'https://siakad.itn.ac.id/dokumen/p3m/berkas-laporan.pdf',
      submittedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      verifiedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      reviewerNote: 'Laporan kegiatan telah dicatat dan terverifikasi dalam arsip akreditasi Tri Dharma P3M.',
    };

    LecturersService.p3mStore.unshift(newReport);
    return {
      success: true,
      message: `Laporan ${newReport.type} "${newReport.title}" berhasil disimpan ke arsip P3M.`,
      data: newReport,
    };
  }

  async updateP3mReport(id: string, dto: any) {
    const index = LecturersService.p3mStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Laporan P3M dengan ID "${id}" tidak ditemukan.`);
    }

    const current = LecturersService.p3mStore[index];
    const updated = {
      ...current,
      ...dto,
      year: dto.year ? Number(dto.year) : current.year,
      fundingAmount: dto.fundingAmount !== undefined ? Number(dto.fundingAmount) : current.fundingAmount,
      members: Array.isArray(dto.members) ? dto.members : (dto.members ? dto.members.split(',').map((s: string) => s.trim()) : current.members),
    };

    LecturersService.p3mStore[index] = updated;
    return {
      success: true,
      message: `Laporan P3M "${updated.title}" berhasil diperbarui.`,
      data: updated,
    };
  }

  async deleteP3mReport(id: string) {
    const index = LecturersService.p3mStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Laporan P3M dengan ID "${id}" tidak ditemukan.`);
    }

    const deleted = LecturersService.p3mStore.splice(index, 1)[0];
    return {
      success: true,
      message: `Laporan P3M "${deleted.title}" berhasil dihapus.`,
      data: deleted,
    };
  }
}

