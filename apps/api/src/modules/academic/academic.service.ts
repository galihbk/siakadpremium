import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AdminDashboardSummary } from '@siakad/types';

function semesterTypeLabel(type: string): string {
  return type === 'ODD' ? 'Gasal' : type === 'EVEN' ? 'Genap' : 'Pendek';
}

function semesterTypeFromLabel(label: string): 'ODD' | 'EVEN' | 'SHORT' {
  return label === 'Genap' ? 'EVEN' : label === 'Pendek' ? 'SHORT' : 'ODD';
}

/**
 * Status buka/tutup KRS: tahun akademik yang BUKAN aktif SELALU tertutup, berapapun
 * jendela tanggalnya -- KRS semester lama tidak boleh diajukan/diubah lagi lewat jalur
 * normal. Untuk tahun aktif, dihitung dari jendela tanggal (`krsStartDate`/`krsEndDate`);
 * kalau salah satu/keduanya belum diisi, dianggap selalu terbuka (fitur ini opt-in,
 * sama seperti jendela tanggal input nilai).
 */
export function computeIsKrsOpen(year: { isActive: boolean; krsStartDate: Date | null; krsEndDate: Date | null }): boolean {
  if (!year.isActive) return false;
  if (!year.krsStartDate || !year.krsEndDate) return true;
  const now = new Date();
  return now >= year.krsStartDate && now <= year.krsEndDate;
}

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    const [
      totalProdi,
      totalDosenDb,
      totalMhsDb,
      faculties,
      activeYear,
      mahasiswaBaruTerdaftar,
      studentsByProdiRaw,
      statusGroups,
      genderGroups,
      entryYearGroups,
    ] = await Promise.all([
      this.prisma.studyProgram.count(),
      this.prisma.lecturer.count(),
      this.prisma.student.count(),
      this.prisma.faculty.findMany({
        include: {
          studyPrograms: {
            include: { _count: { select: { students: true, lecturers: true } } },
          },
        },
        orderBy: { code: 'asc' },
      }),
      this.prisma.academicYear.findFirst({ where: { isActive: true } }),
      this.prisma.admissionApplication.count({ where: { formStatus: 'SUBMITTED' } }),
      this.prisma.studyProgram.findMany({
        select: { name: true, _count: { select: { students: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.student.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.student.groupBy({ by: ['gender'], _count: { _all: true } }),
      this.prisma.student.groupBy({ by: ['entryYear'], _count: { _all: true }, orderBy: { entryYear: 'desc' }, take: 6 }),
    ]);

    let persentaseRegistrasiKRS = 0;
    if (activeYear) {
      const [activeStudents, krsSubmitted] = await Promise.all([
        this.prisma.student.count({ where: { status: 'ACTIVE' } }),
        this.prisma.courseEnrollment.groupBy({
          by: ['studentId'],
          where: { academicYearId: activeYear.id, status: { in: ['SUBMITTED', 'APPROVED'] } },
        }),
      ]);
      persentaseRegistrasiKRS = activeStudents > 0 ? Number(((krsSubmitted.length / activeStudents) * 100).toFixed(1)) : 0;
    }

    const facultyList = faculties.map((f) => {
      const studyProgramsCount = f.studyPrograms.length;
      const studentsCount = f.studyPrograms.reduce((acc, p) => acc + p._count.students, 0);
      const lecturersCount = f.studyPrograms.reduce((acc, p) => acc + p._count.lecturers, 0);
      const isUnggul = f.studyPrograms.some((p) => p.accreditation?.toLowerCase().includes('unggul'));
      return {
        id: f.id,
        name: f.name,
        code: f.code,
        studyProgramsCount,
        studentsCount,
        lecturersCount,
        accreditation: isUnggul ? 'Unggul' : 'Baik Sekali',
      };
    });

    const statusLabels: Record<string, string> = {
      ACTIVE: 'Aktif',
      LEAVE: 'Cuti',
      GRADUATED: 'Lulus',
      DROPOUT: 'DO',
      TRANSFERRED: 'Pindah',
    };
    const genderLabels: Record<string, string> = { MALE: 'Laki-laki', FEMALE: 'Perempuan' };

    return {
      totalMahasiswaAktif: totalMhsDb,
      totalDosen: totalDosenDb,
      totalProgramStudi: totalProdi,
      totalFakultas: faculties.length,
      persentaseRegistrasiKRS,
      mahasiswaBaruTerdaftar,
      facultyList,
      studentsByProdi: studentsByProdiRaw
        .map((p) => ({ name: p.name, count: p._count.students }))
        .filter((p) => p.count > 0)
        .sort((a, b) => b.count - a.count),
      studentStatusBreakdown: statusGroups
        .map((g) => ({ status: statusLabels[g.status] || g.status, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      studentGenderBreakdown: genderGroups.map((g) => ({ label: genderLabels[g.gender] || g.gender, count: g._count._all })),
      studentsByEntryYear: entryYearGroups
        .map((g) => ({ year: g.entryYear, count: g._count._all }))
        .sort((a, b) => a.year - b.year),
    };
  }

  async getSuperAdminDashboardData() {
    // 1. Real database ping latency
    const startPing = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startPing;

    // 2. Real counts from DB models
    const [
      totalFakultasCount,
      totalProdiCount,
      totalMhsDb,
      totalDosenDb,
      totalPegawaiDb,
      activeSem,
      facultiesWithProdi,
      auditLogs,
      enrollmentsCount,
    ] = await Promise.all([
      this.prisma.faculty.count(),
      this.prisma.studyProgram.count(),
      this.prisma.student.count(),
      this.prisma.lecturer.count(),
      this.prisma.user.count({
        where: { role: { in: ['STAFF', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'SUPER_ADMIN'] } },
      }),
      this.prisma.academicYear.findFirst({ where: { isActive: true } }),
      this.prisma.faculty.findMany({
        include: {
          studyPrograms: true,
          deanLecturers: { include: { user: { select: { fullName: true } } } },
        },
        orderBy: { code: 'asc' },
      }),
      this.prisma.systemAuditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.courseEnrollment.count(),
    ]);

    // Jumlah mahasiswa/dosen per prodi dihitung LANGSUNG dari tabel Student/Lecturer
    // (bukan dari kolom cache StudyProgram.studentsCount/lecturersCount yang berisi
    // angka seed lama dan tidak otomatis mengikuti data sungguhan).
    const [studentGroups, lecturerGroups] = await Promise.all([
      this.prisma.student.groupBy({ by: ['studyProgramId'], _count: { _all: true } }),
      this.prisma.lecturer.groupBy({ by: ['studyProgramId'], _count: { _all: true } }),
    ]);
    const studentCountByProdi = new Map(studentGroups.map((g) => [g.studyProgramId, g._count._all]));
    const lecturerCountByProdi = new Map(lecturerGroups.map((g) => [g.studyProgramId, g._count._all]));

    const totalMahasiswa = totalMhsDb;
    const totalDosen = totalDosenDb;
    const totalPegawai = totalPegawaiDb;

    const semesterName = activeSem ? `${activeSem.name} ${semesterTypeLabel(activeSem.semesterType)}` : '2026/2027 Gasal';

    // Filter active faculties that have programs or are primary entries
    const cleanFaculties = facultiesWithProdi.filter(
      (f) => f.studyPrograms.length > 0 || !['fac-1', 'fac-2', 'fac-3'].includes(f.id)
    );
    const totalFakultasClean = cleanFaculties.length || totalFakultasCount;

    // Summary cards format
    const summaryCards = [
      {
        title: 'Total Fakultas',
        value: String(totalFakultasClean),
        subtitle: `${totalFakultasClean} Fakultas Pendidikan Terpadu`,
        rawCount: totalFakultasClean,
      },
      {
        title: 'Total Program Studi',
        value: String(totalProdiCount || 12),
        subtitle: `${totalProdiCount || 12} Program Studi S1, D4 & D3`,
        rawCount: totalProdiCount,
      },
      {
        title: 'Total Mahasiswa Aktif',
        value: new Intl.NumberFormat('id-ID').format(totalMahasiswa),
        subtitle: 'Terdaftar Semester Ini',
        rawCount: totalMahasiswa,
      },
      {
        title: 'Total Dosen Aktif',
        value: String(totalDosen),
        subtitle: 'Dosen Tetap & Luar Biasa',
        rawCount: totalDosen,
      },
      {
        title: 'Total Pegawai',
        value: String(totalPegawai),
        subtitle: 'Staf & Tenaga Kependidikan',
        rawCount: totalPegawai,
      },
      {
        title: 'Semester Aktif',
        value: semesterName,
        subtitle: 'Minggu Perkuliahan ke-4',
        isBadge: true,
        badgeText: 'Aktif',
      },
    ];

    // Real faculties list from database
    const facultyList = cleanFaculties.map((f) => {
      const prodisCount = f.studyPrograms.length;
      const studentsSum = f.studyPrograms.reduce((acc, p) => acc + (studentCountByProdi.get(p.id) || 0), 0);
      const lecturersSum = f.studyPrograms.reduce((acc, p) => acc + (lecturerCountByProdi.get(p.id) || 0), 0);
      const isUnggul = f.studyPrograms.some((p) => p.accreditation?.toLowerCase().includes('unggul'));
      const dean = f.deanLecturers[0];
      const deanName = dean
        ? `${dean.titlePrefix ? dean.titlePrefix + ' ' : ''}${dean.user.fullName}${dean.titleSuffix ? ', ' + dean.titleSuffix : ''}`
        : null;

      return {
        id: f.id,
        name: f.name,
        code: f.code,
        dean: deanName || 'Belum ada Dekan',
        studyProgramsCount: prodisCount,
        studentsCount: studentsSum,
        lecturersCount: lecturersSum,
        accreditation: isUnggul ? 'Unggul' : 'Baik Sekali',
      };
    });

    // Count real course enrollments and active courses from DB
    const [
      totalEnrollments,
      approvedEnrollments,
      submittedEnrollments,
      activeCoursesCount,
      totalRoomsCount,
    ] = await Promise.all([
      this.prisma.courseEnrollment.count(),
      this.prisma.courseEnrollment.count({ where: { status: 'APPROVED' } }),
      this.prisma.courseEnrollment.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.course.count({ where: { status: 'Aktif' } }),
      this.prisma.room.count(),
    ]);

    // Real system services health: cek konfigurasi Feeder PDDIKTI di database (fallback ke env var lama)
    const pddiktiSetting = await this.prisma.pddiktiSetting.findUnique({ where: { id: 'default-pddikti-setting' } }).catch(() => null);
    const isFeederConnected = Boolean(
      pddiktiSetting?.isActive && pddiktiSetting?.baseUrl && pddiktiSetting?.username && pddiktiSetting?.password,
    ) || Boolean(process.env.FEEDER_PDDIKTI_URL && process.env.FEEDER_PDDIKTI_TOKEN);

    const servicesMonitoring = [
      {
        name: 'Feeder PDDIKTI',
        desc: 'Web Service Neo Feeder Kemdikbud',
        status: isFeederConnected ? 'Terhubung' : 'Belum Terhubung',
        statusType: isFeederConnected ? 'healthy' : 'disconnected',
        responseTime: isFeederConnected ? '18ms' : '--',
        isOnline: isFeederConnected,
        badgeClass: isFeederConnected
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-rose-100 text-rose-800 border border-rose-200',
        dotClass: isFeederConnected ? 'bg-emerald-500' : 'bg-rose-500',
        actionUrl: '/admin/superadmin/pengaturan-dikti',
        actionLabel: 'Konfigurasi Token WS',
      },
      {
        name: 'Database SIAKAD',
        desc: 'Master PostgreSQL Server :5434',
        status: 'Healthy',
        statusType: 'healthy',
        responseTime: `${dbLatencyMs}ms`,
        isOnline: true,
        badgeClass: 'bg-emerald-100 text-emerald-800',
        dotClass: 'bg-emerald-500',
      },
      {
        name: 'Cache & Sesi',
        desc: 'In-Memory State & Session Store',
        status: 'Lokal Standalone',
        statusType: 'info',
        responseTime: '1ms',
        isOnline: true,
        badgeClass: 'bg-blue-100 text-blue-800',
        dotClass: 'bg-blue-500',
      },
      {
        name: 'E-Katalog & Berkas',
        desc: 'Penyimpanan Berkas Digital',
        status: 'Siap (Lokal)',
        statusType: 'healthy',
        responseTime: '18ms',
        isOnline: true,
        badgeClass: 'bg-emerald-100 text-emerald-800',
        dotClass: 'bg-emerald-500',
      },
      {
        name: 'Antrian Worker',
        desc: 'Background Job & Sync Processor',
        status: 'Siap (Lokal)',
        statusType: 'healthy',
        responseTime: '<1ms',
        isOnline: true,
        badgeClass: 'bg-emerald-100 text-emerald-800',
        dotClass: 'bg-emerald-500',
      },
      {
        name: 'Presensi & Jadwal Engine',
        desc: 'Validasi Ruang & Jadwal Kuliah',
        status: 'Aktif (Database)',
        statusType: 'healthy',
        responseTime: `${dbLatencyMs}ms`,
        isOnline: true,
        badgeClass: 'bg-emerald-100 text-emerald-800',
        dotClass: 'bg-emerald-500',
      },
    ];

    // Overall status badge (accurately reflects if feeder is not connected)
    const overallSystemStatus = {
      isAllNormal: isFeederConnected,
      badgeText: isFeederConnected
        ? 'Seluruh Layanan Kampus Normal'
        : '1 Layanan Memerlukan Integrasi (Feeder PDDIKTI Belum Terhubung)',
      badgeClass: isFeederConnected
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-amber-50 border-amber-300 text-amber-800',
      dotClass: isFeederConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse',
    };

    // Real recent activities directly from database audit logs
    const recentActivities = auditLogs.length > 0
      ? auditLogs.map((log) => ({
          title: log.action.replace(/_/g, ' '),
          detail: log.detail,
          time: new Date(log.createdAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
          badge: log.userEmail ? log.userEmail.split('@')[0] : 'Sistem',
          color: log.action.includes('DB')
            ? 'bg-[#1E3A8A]'
            : log.action.includes('CMS')
              ? 'bg-purple-600'
              : 'bg-emerald-600',
        }))
      : [
          {
            title: 'Koneksi Basis Data PostgreSQL',
            detail: 'Koneksi master database PostgreSQL siakad_premium aktif dan terhubung pada port 5434.',
            time: 'Baru saja',
            badge: 'Database',
            color: 'bg-[#1E3A8A]',
          },
          {
            title: 'Web Service Neo Feeder PDDIKTI',
            detail: 'Koneksi ke Neo Feeder Kemdikbudristek belum dikonfigurasi. Memerlukan URL dan token institusi.',
            time: 'Baru saja',
            badge: 'PDDIKTI',
            color: 'bg-amber-600',
          },
        ];

    // Real KRS statistics from database
    const validationPercentage = totalEnrollments > 0
      ? Number(((approvedEnrollments / totalEnrollments) * 100).toFixed(1))
      : 0;
    const pendingValidation = submittedEnrollments;
    const notFilledCount = Math.max(0, totalMahasiswa - totalEnrollments);
    const notFilledPercentage = totalMahasiswa > 0
      ? Number(((notFilledCount / totalMahasiswa) * 100).toFixed(1))
      : 100;

    // Rata-rata IPK kampus dihitung nyata dari nilai (gradePoint) yang sudah diinput, bukan angka tetap.
    const gradedEnrollments = await this.prisma.courseEnrollment.findMany({
      where: { gradePoint: { not: null } },
      select: { gradePoint: true },
    });
    const avgGpa = gradedEnrollments.length > 0
      ? Number((gradedEnrollments.reduce((acc, e) => acc + (e.gradePoint || 0), 0) / gradedEnrollments.length).toFixed(2))
      : 0;

    return {
      summaryCards,
      faculties: facultyList,
      servicesMonitoring,
      overallSystemStatus,
      recentActivities,
      krsStats: {
        enrolledCount: totalEnrollments,
        approvedCount: approvedEnrollments,
        validationPercentage,
        pendingValidation,
        notFilled: notFilledCount,
        notFilledPercentage,
        activeCourses: activeCoursesCount,
        activeRooms: totalRoomsCount,
        avgGpa,
      },
    };
  }

  async getActiveAcademicYear() {
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { isActive: true },
    });
    if (activeYear) {
      return {
        code: activeYear.code,
        name: `Tahun Akademik ${activeYear.name}`,
        semester: `${semesterTypeLabel(activeYear.semesterType)} (Aktif)`,
        krsPeriod: `${activeYear.krsStartDate?.toISOString().slice(0, 10) || '-'} - ${activeYear.krsEndDate?.toISOString().slice(0, 10) || '-'}`,
        status: 'Sedang Berlangsung',
        currentWeek: 4,
      };
    }

    return {
      code: '20261',
      name: 'Tahun Akademik 2026/2027',
      semester: 'Gasal (Ganjil)',
      krsPeriod: '15 Agustus 2026 - 31 Agustus 2026',
      status: 'Sedang Berlangsung',
      currentWeek: 4,
    };
  }

  // ================= COURSES (MATA KULIAH) =================
  async getCourses(filters?: { semester?: number; type?: string; studyProgramId?: string }) {
    const where: any = {};
    if (filters?.semester) {
      where.semester = Number(filters.semester);
    }
    if (filters?.type && filters.type !== 'Semua') {
      where.type = filters.type;
    }
    if (filters?.studyProgramId) {
      where.studyProgramId = filters.studyProgramId;
    }

    const list = await this.prisma.course.findMany({
      where,
      include: { curriculum: true },
      orderBy: { code: 'asc' },
    });

    return list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgramName || 'Seluruh Program Studi',
      studyProgramId: c.studyProgramId,
      facultyCode: c.facultyCode || 'UNIVERSITAS',
      sksTeori: c.sksTeori,
      sksPraktik: c.sksPraktik,
      totalSks: c.totalSks,
      sks: c.sks,
      semester: c.semester,
      type: c.type as any,
      requiresThesisSupervision: c.requiresThesisSupervision,
      finalProjectLabel: c.finalProjectLabel || '',
      coordinator: c.coordinator || '',
      status: (c.status as any) || 'Aktif',
      description: c.description || '',
      curriculumId: c.curriculumId,
      curriculumName: c.curriculum?.name || null,
      curriculumCode: c.curriculum?.code || null,
    }));
  }

  async getCourse(id: string) {
    const c = await this.prisma.course.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!c) throw new NotFoundException('Mata kuliah tidak ditemukan');
    return c;
  }

  async createCourse(data: any) {
    const sksTeori = Number(data.sksTeori) || 0;
    const sksPraktik = Number(data.sksPraktik) || 0;
    const totalSks = Number(data.totalSks) || sksTeori + sksPraktik || 2;
    const finalProjectLabel = data.finalProjectLabel?.trim() || null;

    return this.prisma.course.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        studyProgramName: data.studyProgram?.trim() || null,
        studyProgramId: data.studyProgramId || null,
        facultyCode: data.facultyCode?.trim() || 'UNIVERSITAS',
        curriculumId: data.curriculumId || null,
        sksTeori,
        sksPraktik,
        totalSks,
        sks: totalSks,
        semester: Number(data.semester) || 1,
        type: data.type || 'Wajib Prodi',
        // Label kategori (Skripsi/TA, KKN, dst.) adalah sumber kebenaran -- kalau diisi,
        // mata kuliahnya otomatis masuk kategori tugas akhir/lapangan.
        requiresThesisSupervision: finalProjectLabel ? true : Boolean(data.requiresThesisSupervision),
        finalProjectLabel,
        coordinator: data.coordinator?.trim() || null,
        status: data.status || 'Aktif',
        description: data.description?.trim() || null,
      },
    });
  }

  async updateCourse(id: string, data: any) {
    const sksTeori = data.sksTeori !== undefined ? Number(data.sksTeori) : undefined;
    const sksPraktik = data.sksPraktik !== undefined ? Number(data.sksPraktik) : undefined;
    const totalSks = data.totalSks !== undefined ? Number(data.totalSks) : undefined;
    const finalProjectLabel = data.finalProjectLabel !== undefined ? (data.finalProjectLabel?.trim() || null) : undefined;

    return this.prisma.course.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim().toUpperCase() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        studyProgramName: data.studyProgram !== undefined ? data.studyProgram.trim() : undefined,
        studyProgramId: data.studyProgramId !== undefined ? (data.studyProgramId || null) : undefined,
        facultyCode: data.facultyCode !== undefined ? data.facultyCode.trim() : undefined,
        curriculumId: data.curriculumId !== undefined ? (data.curriculumId || null) : undefined,
        sksTeori,
        sksPraktik,
        totalSks,
        sks: totalSks,
        semester: data.semester !== undefined ? Number(data.semester) : undefined,
        type: data.type !== undefined ? data.type : undefined,
        requiresThesisSupervision:
          finalProjectLabel !== undefined
            ? Boolean(finalProjectLabel)
            : data.requiresThesisSupervision !== undefined
              ? Boolean(data.requiresThesisSupervision)
              : undefined,
        finalProjectLabel,
        coordinator: data.coordinator !== undefined ? data.coordinator.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
      },
    });
  }

  async deleteCourse(id: string) {
    try {
      await this.prisma.course.delete({ where: { id } });
    } catch (err: any) {
      if (err?.code === 'P2003' || err?.code === 'P2014') {
        throw new BadRequestException(
          'Mata kuliah ini tidak dapat dihapus karena masih memiliki data KRS mahasiswa yang terkait. Hapus/pindahkan data terkait terlebih dahulu, atau ubah statusnya menjadi Nonaktif.',
        );
      }
      throw err;
    }
    return { success: true, message: 'Mata kuliah berhasil dihapus' };
  }

  // ================= CURRICULUMS (KURIKULUM) =================
  async getCurriculums() {
    const list = await this.prisma.curriculum.findMany({
      orderBy: { code: 'asc' },
    });
    return list.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      studyProgram: c.studyProgram,
      degreeLevel: c.degreeLevel,
      facultyCode: c.facultyCode,
      startYear: c.startYear,
      sksWajib: c.sksWajib,
      sksPilihan: c.sksPilihan,
      totalSks: c.totalSks,
      curriculumType: c.curriculumType,
      skRektor: c.skRektor || '',
      status: c.status,
      description: c.description || '',
    }));
  }

  async getCurriculum(id: string) {
    const c = await this.prisma.curriculum.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!c) throw new NotFoundException('Kurikulum tidak ditemukan');
    return c;
  }

  async createCurriculum(data: any) {
    const sksWajib = Number(data.sksWajib) || 120;
    const sksPilihan = Number(data.sksPilihan) || 24;
    const totalSks = Number(data.totalSks) || sksWajib + sksPilihan;

    return this.prisma.curriculum.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        studyProgram: data.studyProgram?.trim() || 'S1 Teknik Informatika',
        degreeLevel: data.degreeLevel || 'S1',
        facultyCode: data.facultyCode || 'FASILKOM',
        startYear: Number(data.startYear) || 2024,
        sksWajib,
        sksPilihan,
        totalSks,
        curriculumType: data.curriculumType || 'Kurikulum OBE',
        skRektor: data.skRektor?.trim() || null,
        status: data.status || 'Aktif',
        description: data.description?.trim() || null,
      },
    });
  }

  async updateCurriculum(id: string, data: any) {
    return this.prisma.curriculum.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim().toUpperCase() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        studyProgram: data.studyProgram !== undefined ? data.studyProgram.trim() : undefined,
        degreeLevel: data.degreeLevel !== undefined ? data.degreeLevel : undefined,
        facultyCode: data.facultyCode !== undefined ? data.facultyCode : undefined,
        startYear: data.startYear !== undefined ? Number(data.startYear) : undefined,
        sksWajib: data.sksWajib !== undefined ? Number(data.sksWajib) : undefined,
        sksPilihan: data.sksPilihan !== undefined ? Number(data.sksPilihan) : undefined,
        totalSks: data.totalSks !== undefined ? Number(data.totalSks) : undefined,
        curriculumType: data.curriculumType !== undefined ? data.curriculumType : undefined,
        skRektor: data.skRektor !== undefined ? data.skRektor.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
      },
    });
  }

  async deleteCurriculum(id: string) {
    await this.prisma.curriculum.delete({ where: { id } });
    return { success: true, message: 'Kurikulum berhasil dihapus' };
  }

  // ================= ACADEMIC YEARS / SEMESTERS (TAHUN AKADEMIK) =================
  private async mapAcademicYear(y: any) {
    const [classes, studentsEnrolled] = await Promise.all([
      this.prisma.courseClass.findMany({
        where: { academicYearId: y.id },
        include: { course: true },
      }),
      this.prisma.courseEnrollment.groupBy({
        by: ['studentId'],
        where: { academicYearId: y.id, status: { in: ['SUBMITTED', 'APPROVED'] } },
      }),
    ]);
    const totalCoursesOffered = new Set(classes.map((c) => c.courseId)).size;
    const totalCreditsOffered = classes.reduce((sum, c) => sum + (c.course.sks || c.course.totalSks || 3), 0);

    return {
      id: y.id,
      code: y.code,
      name: y.name,
      semesterType: y.semesterType,
      semesterLabel: semesterTypeLabel(y.semesterType),
      startDate: y.startDate,
      endDate: y.endDate,
      krsStartDate: y.krsStartDate,
      krsEndDate: y.krsEndDate,
      isKrsOpen: computeIsKrsOpen(y),
      pmbStartDate: y.pmbStartDate,
      pmbEndDate: y.pmbEndDate,
      skRektor: y.skRektor || '',
      gradeDeadline: y.gradeDeadline || '',
      gradeInputStartDate: y.gradeInputStartDate,
      gradeInputEndDate: y.gradeInputEndDate,
      isGradeLocked: this.computeIsGradeLocked(y),
      totalCoursesOffered,
      totalCreditsOffered,
      studentsCount: studentsEnrolled.length,
      isActive: y.isActive,
      status: y.status,
      notes: y.notes || '',
    };
  }

  async getAcademicYears() {
    const list = await this.prisma.academicYear.findMany({
      orderBy: { code: 'desc' },
    });
    return Promise.all(list.map((y) => this.mapAcademicYear(y)));
  }

  async getAcademicYear(id: string) {
    const y = await this.prisma.academicYear.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!y) throw new NotFoundException('Tahun akademik tidak ditemukan');
    return this.mapAcademicYear(y);
  }

  async createAcademicYear(data: any) {
    if (data.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicYear.create({
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        semesterType: data.semesterType ? semesterTypeFromLabel(data.semesterType) : 'ODD',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        krsStartDate: data.krsStartDate ? new Date(data.krsStartDate) : null,
        krsEndDate: data.krsEndDate ? new Date(data.krsEndDate) : null,
        isKrsOpen: data.isKrsOpen !== undefined ? Boolean(data.isKrsOpen) : true,
        pmbStartDate: data.pmbStartDate ? new Date(data.pmbStartDate) : null,
        pmbEndDate: data.pmbEndDate ? new Date(data.pmbEndDate) : null,
        skRektor: data.skRektor?.trim() || null,
        gradeDeadline: data.gradeDeadline?.trim() || null,
        gradeInputStartDate: data.gradeInputStartDate ? new Date(data.gradeInputStartDate) : null,
        gradeInputEndDate: data.gradeInputEndDate ? new Date(data.gradeInputEndDate) : null,
        isGradeLocked: data.isGradeLocked !== undefined ? Boolean(data.isGradeLocked) : true,
        isActive: Boolean(data.isActive),
        status: data.status || 'Aktif',
        notes: data.notes?.trim() || null,
      },
    });
  }

  async updateAcademicYear(id: string, data: any) {
    if (data.isActive) {
      await this.prisma.academicYear.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicYear.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        code: data.code !== undefined ? data.code.trim() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        semesterType: data.semesterType !== undefined ? semesterTypeFromLabel(data.semesterType) : undefined,
        startDate: data.startDate !== undefined ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined ? new Date(data.endDate) : undefined,
        krsStartDate: data.krsStartDate !== undefined ? (data.krsStartDate ? new Date(data.krsStartDate) : null) : undefined,
        krsEndDate: data.krsEndDate !== undefined ? (data.krsEndDate ? new Date(data.krsEndDate) : null) : undefined,
        isKrsOpen: data.isKrsOpen !== undefined ? Boolean(data.isKrsOpen) : undefined,
        pmbStartDate: data.pmbStartDate !== undefined ? (data.pmbStartDate ? new Date(data.pmbStartDate) : null) : undefined,
        pmbEndDate: data.pmbEndDate !== undefined ? (data.pmbEndDate ? new Date(data.pmbEndDate) : null) : undefined,
        skRektor: data.skRektor !== undefined ? data.skRektor.trim() : undefined,
        gradeDeadline: data.gradeDeadline !== undefined ? data.gradeDeadline.trim() : undefined,
        gradeInputStartDate:
          data.gradeInputStartDate !== undefined ? (data.gradeInputStartDate ? new Date(data.gradeInputStartDate) : null) : undefined,
        gradeInputEndDate:
          data.gradeInputEndDate !== undefined ? (data.gradeInputEndDate ? new Date(data.gradeInputEndDate) : null) : undefined,
        isGradeLocked: data.isGradeLocked !== undefined ? Boolean(data.isGradeLocked) : undefined,
        status: data.status !== undefined ? data.status : undefined,
        notes: data.notes !== undefined ? data.notes.trim() : undefined,
      },
    });
  }

  async deleteAcademicYear(id: string) {
    await this.prisma.academicYear.delete({ where: { id } });
    return { success: true, message: 'Tahun akademik berhasil dihapus' };
  }

  // ================= CALENDAR EVENTS =================
  async getCalendarEvents(semester?: string, academicYear?: string) {
    const where: any = {};
    if (semester && semester !== 'Semua') {
      where.semester = semester;
    }
    if (academicYear && academicYear !== 'Semua') {
      where.academicYear = academicYear;
    }

    const list = await this.prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return list.map((ev) => ({
      id: ev.id,
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate,
      academicYear: ev.academicYear,
      semester: ev.semester,
      target: ev.target,
      status: ev.status,
      notes: ev.notes || '',
    }));
  }

  async getCalendarEvent(id: string) {
    return this.prisma.calendarEvent.findUnique({
      where: { id },
    });
  }

  async createCalendarEvent(data: any) {
    return this.prisma.calendarEvent.create({
      data: {
        title: data.title.trim(),
        category: data.category,
        startDate: data.startDate,
        endDate: data.endDate,
        academicYear: data.academicYear || '2026/2027',
        semester: data.semester || 'Gasal',
        target: data.target?.trim() || 'Seluruh Sivitas Akademika',
        status: data.status || 'Akan Datang',
        notes: data.notes?.trim() || null,
      },
    });
  }

  async updateCalendarEvent(id: string, data: any) {
    return this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        category: data.category !== undefined ? data.category : undefined,
        startDate: data.startDate !== undefined ? data.startDate : undefined,
        endDate: data.endDate !== undefined ? data.endDate : undefined,
        academicYear: data.academicYear !== undefined ? data.academicYear : undefined,
        semester: data.semester !== undefined ? data.semester : undefined,
        target: data.target !== undefined ? data.target.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        notes: data.notes !== undefined ? data.notes.trim() : undefined,
      },
    });
  }

  async deleteCalendarEvent(id: string) {
    await this.prisma.calendarEvent.delete({
      where: { id },
    });
    return { success: true, message: 'Agenda kalender akademik berhasil dihapus' };
  }

  // ================= JADWAL PERKULIAHAN (COURSE CLASSES, PERSISTED) =================
  private static readonly courseClassInclude = {
    course: true,
    room: { include: { building: true } },
    lecturer: { include: { user: true } },
    academicYear: true,
    _count: { select: { enrollments: true } },
  } as const;

  private mapCourseClass(cc: any) {
    return {
      id: cc.id,
      courseCode: cc.course?.code || '',
      courseName: cc.course?.name || '',
      sks: cc.course?.sks || cc.course?.totalSks || 3,
      className: cc.className,
      isFlexibleSchedule: cc.isFlexibleSchedule,
      day: cc.isFlexibleSchedule ? null : cc.day,
      startTime: cc.isFlexibleSchedule ? null : cc.startTime,
      endTime: cc.isFlexibleSchedule ? null : cc.endTime,
      timeSlot: cc.isFlexibleSchedule ? 'Tanpa Jadwal Tetap (Bimbingan Mandiri)' : `${cc.startTime} - ${cc.endTime} WIB`,
      roomId: cc.roomId,
      roomCode: cc.room?.code || '-',
      roomName: cc.room?.name || '-',
      buildingName: cc.room?.building?.name || cc.room?.buildingName || '-',
      lecturerId: cc.lecturerId,
      lecturerNidn: cc.lecturer?.nidn || '-',
      lecturerName: cc.lecturer?.user?.fullName || '-',
      studyProgramId: cc.course?.studyProgramId || null,
      studyProgramName: cc.course?.studyProgramName || null,
      facultyCode: cc.course?.facultyCode || 'UNIVERSITAS',
      semester: cc.course?.semester || 1,
      academicYearId: cc.academicYearId || null,
      academicYear: cc.academicYear?.name || '',
      quota: cc.quota,
      enrolledCount: cc._count?.enrollments || 0,
      status: cc.status,
    };
  }

  async getSchedules(query?: { prodiId?: string; day?: string; lecturerId?: string; semester?: number; academicYearId?: string }) {
    const where: any = {};
    if (query?.day && query.day !== 'Semua') {
      where.day = { equals: query.day, mode: 'insensitive' };
    }
    if (query?.lecturerId && query.lecturerId !== 'Semua') {
      where.OR = [{ lecturerId: query.lecturerId }, { lecturer: { nidn: query.lecturerId } }];
    }
    if (query?.prodiId && query.prodiId !== 'Semua') {
      where.course = { OR: [{ studyProgramId: query.prodiId }, { studyProgramName: query.prodiId }] };
    }
    if (query?.semester) {
      where.course = { ...(where.course || {}), semester: Number(query.semester) };
    }
    if (query?.academicYearId && query.academicYearId !== 'Semua') {
      where.academicYearId = query.academicYearId;
    }

    const rows = await this.prisma.courseClass.findMany({
      where,
      include: AcademicService.courseClassInclude,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapCourseClass(r));
  }

  private async resolveCourseByCodeOrId(courseIdOrCode: string) {
    const course = await this.prisma.course.findFirst({
      where: { OR: [{ id: courseIdOrCode }, { code: courseIdOrCode }] },
    });
    if (!course) throw new NotFoundException(`Mata kuliah "${courseIdOrCode}" tidak ditemukan.`);
    return course;
  }

  // Neo Feeder hanya menerima nama kelas kuliah maksimal 5 karakter.
  private static readonly CLASS_NAME_MAX_LENGTH = 5;

  private normalizeClassName(raw: unknown): string {
    const name = String(raw ?? '').trim();
    if (!name) throw new BadRequestException('Nama kelas wajib diisi.');
    if (name.length > AcademicService.CLASS_NAME_MAX_LENGTH) {
      throw new BadRequestException(
        `Nama kelas maksimal ${AcademicService.CLASS_NAME_MAX_LENGTH} karakter (batas Neo Feeder). Contoh: "A", "5A", "REG-A".`,
      );
    }
    return name;
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /** Cek jadwal kelas bentrok ruang atau dosen pada hari & jam yang beririsan. */
  private async assertNoScheduleConflict(params: {
    academicYearId: string;
    day: string;
    startTime: string;
    endTime: string;
    roomId?: string | null;
    lecturerId?: string | null;
    excludeClassId?: string;
  }) {
    const { academicYearId, day, startTime, endTime, roomId, lecturerId, excludeClassId } = params;
    const newStart = this.toMinutes(startTime);
    const newEnd = this.toMinutes(endTime);
    if (newEnd <= newStart) {
      throw new BadRequestException('Jam selesai harus setelah jam mulai.');
    }

    const orFilters: any[] = [];
    if (roomId) orFilters.push({ roomId });
    if (lecturerId) orFilters.push({ lecturerId });
    if (orFilters.length === 0) return;

    const candidates = await this.prisma.courseClass.findMany({
      where: {
        academicYearId,
        day: { equals: day, mode: 'insensitive' },
        id: excludeClassId ? { not: excludeClassId } : undefined,
        OR: orFilters,
      },
      include: { course: true, lecturer: { include: { user: true } } },
    });

    for (const c of candidates) {
      const overlaps = this.toMinutes(c.startTime) < newEnd && newStart < this.toMinutes(c.endTime);
      if (!overlaps) continue;

      if (roomId && c.roomId === roomId) {
        throw new BadRequestException(
          `Ruang bentrok: sudah dipakai kelas ${c.className} (${c.course.code}) pada ${c.day} ${c.startTime}-${c.endTime}.`,
        );
      }
      if (lecturerId && c.lecturerId === lecturerId) {
        throw new BadRequestException(
          `Dosen bentrok: ${c.lecturer?.user?.fullName || 'dosen ini'} sudah mengajar kelas ${c.className} (${c.course.code}) pada ${c.day} ${c.startTime}-${c.endTime}.`,
        );
      }
    }
  }

  async createSchedule(data: any) {
    const course = await this.resolveCourseByCodeOrId(data.courseCode || data.courseId);
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) throw new NotFoundException('Tidak ada tahun akademik aktif saat ini.');

    // Mata kuliah tanpa jadwal & ruang tetap (Skripsi/TA, KKN, Kerja Praktik, dst.):
    // tidak ada hari/jam/ruang yang bisa bentrok, jadi dilewati dari validasi jadwal.
    // Kalau mata kuliahnya sudah ditandai "requiresThesisSupervision" di Master Mata Kuliah,
    // kelasnya otomatis fleksibel — BAAK tidak perlu mencentang manual tiap kali.
    const isFlexibleSchedule = Boolean(data.isFlexibleSchedule) || course.requiresThesisSupervision;
    const day = isFlexibleSchedule ? 'Fleksibel' : data.day || 'Senin';
    const startTime = isFlexibleSchedule ? '-' : data.startTime || '08:00';
    const endTime = isFlexibleSchedule ? '-' : data.endTime || '10:30';
    const roomId = isFlexibleSchedule ? null : data.roomId || null;
    const lecturerId = data.lecturerId || null;

    if (!isFlexibleSchedule) {
      await this.assertNoScheduleConflict({ academicYearId: activeYear.id, day, startTime, endTime, roomId, lecturerId });
    }

    const created = await this.prisma.courseClass.create({
      data: {
        courseId: course.id,
        academicYearId: activeYear.id,
        className: this.normalizeClassName(data.className || 'A'),
        isFlexibleSchedule,
        day,
        startTime,
        endTime,
        roomId,
        lecturerId,
        quota: Number(data.quota) || 40,
        status: 'Berjalan',
      },
      include: AcademicService.courseClassInclude,
    });

    return this.mapCourseClass(created);
  }

  async updateSchedule(id: string, data: any) {
    const existing = await this.prisma.courseClass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Jadwal kuliah dengan ID "${id}" tidak ditemukan.`);

    let courseId: string | undefined;
    let course = await this.prisma.course.findUnique({ where: { id: existing.courseId } });
    if (data.courseCode || data.courseId) {
      course = await this.resolveCourseByCodeOrId(data.courseCode || data.courseId);
      courseId = course.id;
    }

    const isFlexibleSchedule =
      (data.isFlexibleSchedule !== undefined ? Boolean(data.isFlexibleSchedule) : existing.isFlexibleSchedule) ||
      Boolean(course?.requiresThesisSupervision);
    const day = isFlexibleSchedule ? 'Fleksibel' : data.day !== undefined ? data.day : existing.day;
    const startTime = isFlexibleSchedule ? '-' : data.startTime !== undefined ? data.startTime : existing.startTime;
    const endTime = isFlexibleSchedule ? '-' : data.endTime !== undefined ? data.endTime : existing.endTime;
    const roomId = isFlexibleSchedule ? null : data.roomId !== undefined ? data.roomId || null : existing.roomId;
    const lecturerId = data.lecturerId !== undefined ? data.lecturerId || null : existing.lecturerId;

    if (!isFlexibleSchedule) {
      await this.assertNoScheduleConflict({
        academicYearId: existing.academicYearId,
        day,
        startTime,
        endTime,
        roomId,
        lecturerId,
        excludeClassId: id,
      });
    }

    const updated = await this.prisma.courseClass.update({
      where: { id },
      data: {
        courseId,
        className: data.className !== undefined ? this.normalizeClassName(data.className) : undefined,
        isFlexibleSchedule,
        day,
        startTime,
        endTime,
        roomId,
        lecturerId,
        quota: data.quota !== undefined ? Number(data.quota) : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
      include: AcademicService.courseClassInclude,
    });

    return this.mapCourseClass(updated);
  }

  async deleteSchedule(id: string) {
    const existing = await this.prisma.courseClass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Jadwal kuliah dengan ID "${id}" tidak ditemukan.`);

    await this.prisma.courseClass.delete({ where: { id } });
    return { success: true, message: 'Jadwal perkuliahan berhasil dihapus.' };
  }

  // ================= INPUT & PENGELOLAAN NILAI (GRADES) =================
  private static readonly DEFAULT_GRADE_WEIGHTS = { tugas: 20, uts: 30, uas: 40, kehadiran: 10 };

  private async getAssessmentWeights(courseClassId: string) {
    const contract = await this.prisma.courseContract.findUnique({ where: { courseClassId } });
    const w = (contract?.assessmentWeights as any) || {};
    return {
      tugas: w.tugas ?? AcademicService.DEFAULT_GRADE_WEIGHTS.tugas,
      uts: w.uts ?? AcademicService.DEFAULT_GRADE_WEIGHTS.uts,
      uas: w.uas ?? AcademicService.DEFAULT_GRADE_WEIGHTS.uas,
      kehadiran: w.kehadiran ?? AcademicService.DEFAULT_GRADE_WEIGHTS.kehadiran,
    };
  }

  private async computeAttendancePercentages(courseClassId: string, studentIds: string[]) {
    const sessions = await this.prisma.attendanceSession.findMany({
      where: { courseClassId },
      include: { records: true },
    });
    const total = sessions.length;
    const map = new Map<string, number>();
    for (const sid of studentIds) {
      if (total === 0) {
        map.set(sid, 0);
        continue;
      }
      const hadir = sessions.filter((s) => (s.records.find((r) => r.studentId === sid)?.status || 'ALFA') === 'HADIR').length;
      map.set(sid, Math.round((hadir / total) * 100));
    }
    return map;
  }

  // ================= SKALA NILAI (GRADE SCALE) =================
  private static readonly FALLBACK_GRADE_SCALE = [
    { letter: 'A', minScore: 85, maxScore: 100, gradePoint: 4.0 },
    { letter: 'A-', minScore: 80, maxScore: 84.99, gradePoint: 3.7 },
    { letter: 'B+', minScore: 75, maxScore: 79.99, gradePoint: 3.3 },
    { letter: 'B', minScore: 70, maxScore: 74.99, gradePoint: 3.0 },
    { letter: 'B-', minScore: 65, maxScore: 69.99, gradePoint: 2.7 },
    { letter: 'C+', minScore: 60, maxScore: 64.99, gradePoint: 2.3 },
    { letter: 'C', minScore: 55, maxScore: 59.99, gradePoint: 2.0 },
    { letter: 'D', minScore: 40, maxScore: 54.99, gradePoint: 1.0 },
    { letter: 'E', minScore: 0, maxScore: 39.99, gradePoint: 0.0 },
  ];

  // Skala nilai dikelompokkan per grup (GradeScaleVersion), masing-masing grup terhubung
  // ke satu Tahun Akademik/semester (kapan skala itu dibuat & berlaku). Grup yang dipakai
  // untuk menghitung nilai adalah grup yang terhubung ke tahun akademik yang sedang AKTIF.
  // Edit/tambah/hapus baris di dalam satu grup mengubah baris itu langsung (tidak membuat
  // grup baru) -- grup baru hanya dibuat secara eksplisit lewat createGradeScaleGroup, biasanya
  // saat BAAK menyiapkan skala untuk tahun akademik berikutnya. Nilai mahasiswa yang sudah
  // dihitung & disimpan sebelumnya tidak berubah karena gradeLetter/gradePoint disimpan permanen
  // di CourseEnrollment saat itu, bukan dihitung ulang secara live dari skala saat ini.
  private async getActiveGradeScaleGroup() {
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return null;

    // SENGAJA tidak jatuh ke "grup manapun yang paling baru dibuat" kalau tidak ada yang
    // terhubung ke tahun aktif -- grup yang tidak terhubung ke tahun akademik manapun
    // (mis. tersisa dari percobaan/import) bisa diam-diam jadi dipakai menghitung nilai
    // padahal tidak pernah diaktifkan lewat UI. Kalau memang belum ada grup untuk tahun
    // aktif, `getGradeScales` yang memanggil fungsi ini akan seed grup baru dari
    // `FALLBACK_GRADE_SCALE` -- bukan menebak pakai grup lama yang tidak terhubung.
    return this.prisma.gradeScaleVersion.findFirst({
      where: { academicYearId: activeYear.id },
      orderBy: { createdAt: 'desc' },
      include: { scales: { orderBy: { minScore: 'desc' } } },
    });
  }

  // Grup dianggap "sudah dipakai" kalau ada mata kuliah/mahasiswa yang nilainya sudah dihitung
  // untuk tahun akademik yang terhubung ke grup itu -- begitu terpakai, grup dikunci (tidak
  // bisa diedit/dihapus) supaya riwayat nilai yang sudah dihitung dengan skala itu tetap valid.
  private async isGradeScaleGroupUsed(academicYearId: string | null): Promise<boolean> {
    if (!academicYearId) return false;
    const count = await this.prisma.courseEnrollment.count({
      where: { academicYearId, totalScore: { not: null } },
    });
    return count > 0;
  }

  private async assertGroupEditable(academicYearId: string | null) {
    if (await this.isGradeScaleGroupUsed(academicYearId)) {
      throw new BadRequestException(
        'Grup skala nilai ini sudah dipakai untuk menghitung nilai mata kuliah dan tidak bisa diedit atau dihapus lagi.',
      );
    }
  }

  async getGradeScaleGroups() {
    const groups = await this.prisma.gradeScaleVersion.findMany({
      orderBy: { createdAt: 'desc' },
      include: { scales: { orderBy: { minScore: 'desc' } }, academicYear: true },
    });
    return Promise.all(
      groups.map(async (g) => ({
        ...g,
        isUsed: await this.isGradeScaleGroupUsed(g.academicYearId),
      })),
    );
  }

  async createGradeScaleGroup(data: { academicYearId?: string; label?: string; cloneFromVersionId?: string }) {
    let sourceScales: { letter: string; minScore: number; maxScore: number; gradePoint: number; isActive: boolean }[] = [];

    if (data.cloneFromVersionId) {
      const source = await this.prisma.gradeScaleVersion.findUnique({ where: { id: data.cloneFromVersionId }, include: { scales: true } });
      if (!source) throw new NotFoundException('Grup sumber untuk disalin tidak ditemukan.');
      sourceScales = source.scales.map((s) => ({ letter: s.letter, minScore: s.minScore, maxScore: s.maxScore, gradePoint: s.gradePoint, isActive: s.isActive }));
    } else {
      const active = await this.getActiveGradeScaleGroup();
      sourceScales = active
        ? active.scales.map((s) => ({ letter: s.letter, minScore: s.minScore, maxScore: s.maxScore, gradePoint: s.gradePoint, isActive: s.isActive }))
        : AcademicService.FALLBACK_GRADE_SCALE.map((s) => ({ ...s, isActive: true }));
    }

    let label = data.label?.trim() || null;
    if (!label && data.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
      if (year) label = `${year.name} ${semesterTypeLabel(year.semesterType)}`;
    }

    return this.prisma.gradeScaleVersion.create({
      data: {
        academicYearId: data.academicYearId || null,
        label,
        scales: { create: sourceScales },
      },
      include: { scales: { orderBy: { minScore: 'desc' } }, academicYear: true },
    });
  }

  async deleteGradeScaleGroup(id: string) {
    const group = await this.prisma.gradeScaleVersion.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Grup skala nilai tidak ditemukan.');
    if (group.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({ where: { id: group.academicYearId } });
      if (year?.isActive) {
        throw new BadRequestException('Tidak dapat menghapus grup skala nilai yang terhubung ke tahun akademik aktif.');
      }
    }
    await this.assertGroupEditable(group.academicYearId);
    await this.prisma.gradeScaleVersion.delete({ where: { id } });
    return { success: true, message: 'Grup skala nilai berhasil dihapus.' };
  }

  async getGradeScales(versionId?: string) {
    if (versionId) {
      const group = await this.prisma.gradeScaleVersion.findUnique({
        where: { id: versionId },
        include: { scales: { orderBy: { minScore: 'desc' } } },
      });
      if (!group) throw new NotFoundException('Grup skala nilai tidak ditemukan.');
      return group.scales;
    }

    const active = await this.getActiveGradeScaleGroup();
    if (!active || active.scales.length === 0) {
      // Belum ada grup yang terhubung ke tahun akademik aktif -- seed grup baru dari default
      // bawaan sistem, LANGSUNG dihubungkan ke tahun aktif (kalau ada) supaya tidak jadi
      // grup orphan lagi yang tidak terhubung ke tahun akademik manapun.
      const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
      const seeded = await this.createGradeScaleGroup({ academicYearId: activeYear?.id });
      return seeded.scales;
    }
    return active.scales;
  }

  async createGradeScale(data: any) {
    const letter = String(data.letter || '').trim().toUpperCase();
    if (!letter) throw new BadRequestException('Huruf mutu wajib diisi.');
    if (!data.versionId) throw new BadRequestException('Grup skala nilai wajib dipilih.');

    const group = await this.prisma.gradeScaleVersion.findUnique({ where: { id: data.versionId }, include: { scales: true } });
    if (!group) throw new NotFoundException('Grup skala nilai tidak ditemukan.');
    await this.assertGroupEditable(group.academicYearId);
    if (group.scales.some((s) => s.letter === letter)) {
      throw new BadRequestException(`Skala nilai dengan huruf "${letter}" sudah ada di grup ini.`);
    }

    return this.prisma.gradeScale.create({
      data: {
        versionId: data.versionId,
        letter,
        minScore: Number(data.minScore) || 0,
        maxScore: Number(data.maxScore) || 0,
        gradePoint: Number(data.gradePoint) || 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateGradeScale(id: string, data: any) {
    const existing = await this.prisma.gradeScale.findUnique({ where: { id }, include: { version: true } });
    if (!existing) throw new NotFoundException('Skala nilai tidak ditemukan.');
    await this.assertGroupEditable(existing.version.academicYearId);

    const newLetter = data.letter !== undefined ? String(data.letter).trim().toUpperCase() : existing.letter;
    if (newLetter !== existing.letter) {
      const clash = await this.prisma.gradeScale.findFirst({ where: { versionId: existing.versionId, letter: newLetter, id: { not: id } } });
      if (clash) throw new BadRequestException(`Skala nilai dengan huruf "${newLetter}" sudah ada di grup ini.`);
    }

    return this.prisma.gradeScale.update({
      where: { id },
      data: {
        letter: newLetter,
        minScore: data.minScore !== undefined ? Number(data.minScore) : undefined,
        maxScore: data.maxScore !== undefined ? Number(data.maxScore) : undefined,
        gradePoint: data.gradePoint !== undefined ? Number(data.gradePoint) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
    });
  }

  async deleteGradeScale(id: string) {
    const existing = await this.prisma.gradeScale.findUnique({ where: { id }, include: { version: true } });
    if (!existing) throw new NotFoundException('Skala nilai tidak ditemukan.');
    await this.assertGroupEditable(existing.version.academicYearId);
    await this.prisma.gradeScale.delete({ where: { id } });
    return { success: true, message: `Skala nilai "${existing.letter}" berhasil dihapus.` };
  }

  // Skala yang dipakai untuk menghitung nilai adalah skala yang sedang AKTIF pada saat dosen
  // menekan simpan -- bukan skala yang terhubung ke tahun akademik kelas tersebut. Ini disengaja:
  // begitu totalScore/gradeLetter/gradePoint tersimpan di CourseEnrollment, nilai itu permanen
  // (snapshot), tidak pernah dihitung ulang secara live. Jadi kalau 3 semester lagi BAAK bikin
  // skala nilai baru, nilai yang sudah tersimpan sekarang tidak ikut berubah sama sekali --
  // hanya nilai yang BELUM dihitung/disimpan yang akan memakai skala terbaru saat itu.
  private async calculateGrade(
    attendance: number,
    assignment: number,
    midterm: number,
    finalExam: number,
    weights: { tugas: number; uts: number; uas: number; kehadiran: number },
  ) {
    const totalScore = Number(
      (
        attendance * (weights.kehadiran / 100) +
        assignment * (weights.tugas / 100) +
        midterm * (weights.uts / 100) +
        finalExam * (weights.uas / 100)
      ).toFixed(1),
    );

    const scale = await this.getGradeScales();
    const activeScale = scale.filter((s: any) => s.isActive !== false).sort((a: any, b: any) => b.minScore - a.minScore);
    const matched = activeScale.find((s: any) => totalScore >= s.minScore) || activeScale[activeScale.length - 1];

    return {
      totalScore,
      gradeLetter: matched?.letter || 'E',
      gradePoint: matched?.gradePoint ?? 0,
    };
  }

  /**
   * Akses pengisian nilai: semester yang BUKAN tahun akademik aktif SELALU terkunci,
   * berapapun jendela tanggalnya -- nilai semester lama tidak boleh diubah lagi lewat
   * jalur normal ini (histori harus tetap final). Untuk semester aktif, dihitung dari
   * jendela tanggal (`gradeInputStartDate`/`gradeInputEndDate`) -- di luar rentang itu
   * berarti terkunci. Kalau salah satu/keduanya belum diisi, dianggap TIDAK terkunci --
   * fitur jendela tanggal ini opt-in: BAAK yang mau membatasi waktu baru mengisi
   * tanggalnya, bukan terkunci diam-diam begitu saja tanpa ada cara membukanya dari UI.
   */
  private computeIsGradeLocked(year: { isActive: boolean; gradeInputStartDate: Date | null; gradeInputEndDate: Date | null }): boolean {
    if (!year.isActive) return true;
    if (!year.gradeInputStartDate || !year.gradeInputEndDate) return false;
    const now = new Date();
    return now < year.gradeInputStartDate || now > year.gradeInputEndDate;
  }

  async getGradeClasses(lecturerId?: string, academicYearId?: string) {
    const selectedYear = academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    const activeYear = selectedYear;
    const isLocked = activeYear ? this.computeIsGradeLocked(activeYear) : false;

    const classes = await this.prisma.courseClass.findMany({
      where: {
        ...(lecturerId && lecturerId !== 'all' ? { lecturerId } : {}),
        ...(activeYear ? { academicYearId: activeYear.id } : {}),
      },
      include: {
        course: true,
        room: true,
        lecturer: { include: { user: true } },
        enrollments: { where: { status: { in: ['SUBMITTED', 'APPROVED'] } } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return classes.map((cc) => {
      const totalStudents = cc.enrollments.length;
      const gradedCount = cc.enrollments.filter((e) => e.totalScore !== null && e.totalScore !== undefined).length;
      const finalCount = cc.enrollments.filter((e) => e.gradeStatus === 'FINAL').length;

      let gradeStatus = 'Belum Diisi';
      if (finalCount === totalStudents && totalStudents > 0) {
        gradeStatus = 'Selesai & Terbit';
      } else if (gradedCount > 0) {
        gradeStatus = 'Draf Proses';
      }

      return {
        id: cc.id,
        courseCode: cc.course.code,
        courseName: cc.course.name,
        className: cc.className,
        sks: cc.course.sks || cc.course.totalSks || 3,
        studyProgramName: cc.course.studyProgramName || '-',
        semester: cc.course.semester,
        academicYear: activeYear?.name || '-',
        day: cc.day,
        timeSlot: `${cc.startTime} - ${cc.endTime} WIB`,
        roomName: cc.room?.name || '-',
        lecturerName: cc.lecturer?.user?.fullName || '-',
        lecturerNidn: cc.lecturer?.nidn || '-',
        totalStudents,
        gradedCount,
        gradeStatus,
        isLocked,
        gradeDeadline: activeYear?.gradeInputEndDate
          ? activeYear.gradeInputEndDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
          : activeYear?.gradeDeadline || '-',
      };
    });
  }

  async getClassEnrollments(classId: string) {
    const cc = await this.prisma.courseClass.findUnique({
      where: { id: classId },
      include: { course: true, room: true, lecturer: { include: { user: true } }, academicYear: true },
    });
    if (!cc) {
      throw new NotFoundException(`Kelas dengan ID "${classId}" tidak ditemukan.`);
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { courseClassId: classId, status: { in: ['SUBMITTED', 'APPROVED'] } },
      include: { student: { include: { user: true } } },
      orderBy: { student: { nim: 'asc' } },
    });

    const weights = await this.getAssessmentWeights(classId);
    const attendanceMap = await this.computeAttendancePercentages(classId, enrollments.map((e) => e.studentId));

    const students = enrollments.map((e) => ({
      id: e.id,
      nim: e.student.nim,
      studentName: e.student.user.fullName,
      attendance: attendanceMap.get(e.studentId) ?? 0,
      assignment: e.assignmentScore ?? 0,
      midterm: e.midtermScore ?? 0,
      finalExam: e.finalScore ?? 0,
      totalScore: e.totalScore ?? 0,
      gradeLetter: e.gradeLetter || '-',
      gradePoint: e.gradePoint ?? 0,
      status: e.gradeStatus === 'FINAL' ? 'Final' : 'Draf',
    }));

    return {
      classInfo: {
        id: cc.id,
        courseCode: cc.course.code,
        courseName: cc.course.name,
        className: cc.className,
        sks: cc.course.sks || cc.course.totalSks || 3,
        studyProgramName: cc.course.studyProgramName || '-',
        semester: cc.course.semester,
        academicYear: cc.academicYear?.name || '-',
        day: cc.day,
        timeSlot: `${cc.startTime} - ${cc.endTime} WIB`,
        roomName: cc.room?.name || '-',
        lecturerName: cc.lecturer?.user?.fullName || '-',
        lecturerNidn: cc.lecturer?.nidn || '-',
        isLocked: cc.academicYear ? this.computeIsGradeLocked(cc.academicYear) : false,
        gradeInputStartDate: cc.academicYear?.gradeInputStartDate || null,
        gradeInputEndDate: cc.academicYear?.gradeInputEndDate || null,
        weights,
      },
      students,
    };
  }

  async saveBatchGrades(classId: string, payload: { grades: any[]; isFinalSubmit?: boolean }) {
    const cc = await this.prisma.courseClass.findUnique({ where: { id: classId }, include: { academicYear: true } });
    if (!cc) {
      throw new NotFoundException(`Kelas dengan ID "${classId}" tidak ditemukan.`);
    }

    if (cc.academicYear && this.computeIsGradeLocked(cc.academicYear)) {
      throw new BadRequestException('Pengisian nilai semester ini sedang di luar jendela waktu yang diizinkan BAAK (lihat tanggal mulai/akhir input nilai di Tahun Akademik).');
    }

    const weights = await this.getAssessmentWeights(classId);
    const enrollmentIds = payload.grades.map((g) => g.id).filter(Boolean);
    const enrollments = await this.prisma.courseEnrollment.findMany({ where: { id: { in: enrollmentIds } } });
    const enrollmentById = new Map(enrollments.map((e) => [e.id, e]));
    const attendanceMap = await this.computeAttendancePercentages(classId, enrollments.map((e) => e.studentId));

    const updated: any[] = [];
    for (const item of payload.grades) {
      const enrollment = enrollmentById.get(item.id);
      if (!enrollment) continue;

      const attendance = attendanceMap.get(enrollment.studentId) ?? 0;
      const assignment = Math.min(100, Math.max(0, Number(item.assignment) || 0));
      const midterm = Math.min(100, Math.max(0, Number(item.midterm) || 0));
      const finalExam = Math.min(100, Math.max(0, Number(item.finalExam) || 0));

      const { totalScore, gradeLetter, gradePoint } = await this.calculateGrade(
        attendance,
        assignment,
        midterm,
        finalExam,
        weights,
      );

      const saved = await this.prisma.courseEnrollment.update({
        where: { id: item.id },
        data: {
          assignmentScore: assignment,
          midtermScore: midterm,
          finalScore: finalExam,
          totalScore,
          gradeLetter,
          gradePoint,
          gradeStatus: payload.isFinalSubmit ? 'FINAL' : 'DRAFT',
        },
        include: { student: { include: { user: true } } },
      });

      updated.push({
        id: saved.id,
        nim: saved.student.nim,
        studentName: saved.student.user.fullName,
        attendance,
        assignment,
        midterm,
        finalExam,
        totalScore,
        gradeLetter,
        gradePoint,
        status: saved.gradeStatus === 'FINAL' ? 'Final' : 'Draf',
      });
    }

    return {
      success: true,
      message: payload.isFinalSubmit
        ? 'Seluruh nilai mahasiswa berhasil disahkan dan diterbitkan secara resmi.'
        : 'Draf nilai mahasiswa berhasil disimpan.',
      data: updated,
    };
  }

  async toggleGradeLock(academicYearId?: string) {
    let year;
    if (academicYearId) {
      year = await this.prisma.academicYear.findUnique({ where: { id: academicYearId } });
    } else {
      year = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    }

    if (!year) {
      throw new NotFoundException('Semester aktif tidak ditemukan.');
    }

    const newLockState = !year.isGradeLocked;
    const updated = await this.prisma.academicYear.update({
      where: { id: year.id },
      data: { isGradeLocked: newLockState },
    });

    return {
      success: true,
      isGradeLocked: updated.isGradeLocked,
      message: updated.isGradeLocked
        ? `Pengisian nilai semester ${updated.name} telah dikunci resmi.`
        : `Akses pengisian nilai semester ${updated.name} dibuka kembali bagi dosen.`,
    };
  }

  // ================= STATUS PERIODE KRS (berdasarkan jendela tanggal) =================
  async getKrsStatus() {
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) {
      throw new NotFoundException('Tidak ada tahun akademik aktif saat ini');
    }
    return {
      academicYearId: activeYear.id,
      academicYearName: activeYear.name,
      isKrsOpen: computeIsKrsOpen(activeYear),
      krsStartDate: activeYear.krsStartDate,
      krsEndDate: activeYear.krsEndDate,
    };
  }

  // ================= MONITORING KRS LINTAS PRODI (BAAK) =================
  async getKrsOverview(query?: { academicYearId?: string; studyProgramId?: string; status?: string; search?: string }) {
    const activeYear = query?.academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: query.academicYearId } })
      : await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return { academicYearId: null, academicYearName: null, items: [] };

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        academicYearId: activeYear.id,
        student: query?.studyProgramId ? { studyProgramId: query.studyProgramId } : undefined,
      },
      include: {
        student: { include: { user: true, studyProgram: true, advisorLecturer: { include: { user: true } } } },
        course: true,
        courseClass: { include: { room: true, lecturer: { include: { user: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byStudent = new Map<string, any>();
    for (const e of enrollments) {
      if (!e.student) continue;
      let row = byStudent.get(e.studentId);
      if (!row) {
        row = {
          id: e.studentId,
          nim: e.student.nim,
          studentName: e.student.user.fullName,
          studyProgram: e.student.studyProgram?.name || '-',
          // `Student.currentSemester` TIDAK dipakai di sini -- field itu status standing
          // mahasiswa SAAT INI (dan belum dihitung ulang sama sekali dari Feeder, masih
          // nilai default skema untuk semua mahasiswa), jadi salah kalau dipakai untuk
          // KRS periode manapun, apalagi periode historis. Semester KRS ini diturunkan dari
          // Course.semester mata kuliah yang diambil di baris ini (modus/paling sering
          // muncul), yang memang sudah benar per-matkul.
          semesterCounts: new Map<number, number>(),
          academicYear: activeYear.name,
          dosenPA: e.student.advisorLecturer?.user?.fullName || 'Belum ditentukan',
          submittedAt: e.createdAt,
          courses: [] as any[],
          statuses: new Set<string>(),
        };
        byStudent.set(e.studentId, row);
      }
      row.courses.push({
        code: e.course.code,
        name: e.course.name,
        sks: e.course.sks || e.course.totalSks || 3,
        classRoom: e.courseClass?.room?.name || '-',
        schedule: e.courseClass ? `${e.courseClass.day}, ${e.courseClass.startTime} - ${e.courseClass.endTime}` : '-',
        lecturer: e.courseClass?.lecturer?.user?.fullName || '-',
      });
      if (e.course.semester) {
        row.semesterCounts.set(e.course.semester, (row.semesterCounts.get(e.course.semester) || 0) + 1);
      }
      row.statuses.add(e.status);
      if (e.createdAt < row.submittedAt) row.submittedAt = e.createdAt;
    }

    let items = [...byStudent.values()].map((row) => {
      const statuses: Set<string> = row.statuses;
      const status = statuses.size === 1 && statuses.has('APPROVED')
        ? 'APPROVED'
        : statuses.has('REJECTED')
          ? 'REJECTED'
          : statuses.has('SUBMITTED')
            ? 'SUBMITTED'
            : 'DRAFT';
      const totalSks = row.courses.reduce((a: number, c: any) => a + c.sks, 0);
      const semesterCounts: Map<number, number> = row.semesterCounts;
      let semester = 0;
      let maxCount = 0;
      for (const [sem, count] of semesterCounts) {
        if (count > maxCount) {
          semester = sem;
          maxCount = count;
        }
      }
      return {
        id: row.id,
        nim: row.nim,
        studentName: row.studentName,
        studyProgram: row.studyProgram,
        semester,
        academicYear: row.academicYear,
        dosenPA: row.dosenPA,
        submittedAt: row.submittedAt,
        totalSks,
        status,
        courses: row.courses,
      };
    });

    if (query?.status && query.status !== 'ALL') {
      items = items.filter((i) => i.status === query.status);
    }
    if (query?.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.nim.includes(q) ||
          i.dosenPA.toLowerCase().includes(q),
      );
    }

    return { academicYearId: activeYear.id, academicYearName: activeYear.name, items };
  }

  /** Override BAAK: menyetujui/menolak seluruh KRS seorang mahasiswa untuk tahun akademik aktif. */
  async baakSetKrsStatus(studentId: string, status: 'APPROVED' | 'REJECTED') {
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) throw new NotFoundException('Tidak ada tahun akademik aktif saat ini.');

    const student = await this.prisma.student.findFirst({ where: { OR: [{ id: studentId }, { nim: studentId }] } });
    if (!student) throw new NotFoundException(`Mahasiswa dengan ID/NIM "${studentId}" tidak ditemukan.`);

    const result = await this.prisma.courseEnrollment.updateMany({
      where: { studentId: student.id, academicYearId: activeYear.id },
      data: { status },
    });
    if (result.count === 0) {
      throw new NotFoundException('Mahasiswa ini belum memiliki pengajuan KRS pada tahun akademik aktif.');
    }

    return {
      success: true,
      message:
        status === 'APPROVED'
          ? `KRS ${student.nim} berhasil disetujui oleh BAAK.`
          : `KRS ${student.nim} ditolak dan perlu direvisi mahasiswa.`,
    };
  }

  // ================= BIMBINGAN SKRIPSI/TA, KKN, KERJA PRAKTIK (BAAK) =================
  // Mahasiswa yang KRS-nya berisi kelas "tanpa jadwal tetap" (Skripsi/TA, KKN, KP, dst.)
  // perlu ditetapkan pembimbingnya satu per satu oleh Admin Akademik — berbeda dari Dosen
  // Pengampu di CourseClass (satu dosen untuk satu kelas) dan Dosen PA (pembimbing umum).
  async getThesisSupervisionCandidates(query?: { academicYearId?: string; courseId?: string; search?: string }) {
    const activeYear = query?.academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: query.academicYearId } })
      : await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return { academicYearId: null, academicYearName: null, courses: [], items: [] };

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        academicYearId: activeYear.id,
        status: { not: 'REJECTED' },
        courseId: query?.courseId || undefined,
        OR: [{ courseClass: { isFlexibleSchedule: true } }, { course: { requiresThesisSupervision: true } }],
      },
      include: {
        student: { include: { user: true, studyProgram: true } },
        course: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const studentCourseIds = enrollments.map((e) => ({ studentId: e.studentId, courseId: e.courseId }));
    const supervisions = studentCourseIds.length
      ? await this.prisma.thesisSupervision.findMany({
          where: {
            academicYearId: activeYear.id,
            OR: studentCourseIds.map((s) => ({ studentId: s.studentId, courseId: s.courseId })),
          },
          include: { supervisor1: { include: { user: true } }, supervisor2: { include: { user: true } } },
        })
      : [];
    const supervisionMap = new Map(supervisions.map((s) => [`${s.studentId}:${s.courseId}`, s]));

    let items = enrollments.map((e) => {
      const sup = supervisionMap.get(`${e.studentId}:${e.courseId}`);
      return {
        studentId: e.studentId,
        nim: e.student.nim,
        studentName: e.student.user.fullName,
        studyProgram: e.student.studyProgram?.name || '-',
        courseId: e.courseId,
        courseCode: e.course.code,
        courseName: e.course.name,
        title: sup?.title || null,
        supervisor1Id: sup?.supervisor1Id || null,
        supervisor1Name: sup?.supervisor1?.user?.fullName || null,
        supervisor2Id: sup?.supervisor2Id || null,
        supervisor2Name: sup?.supervisor2?.user?.fullName || null,
        notes: sup?.notes || null,
        assignedAt: sup?.assignedAt || null,
      };
    });

    if (query?.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      items = items.filter((i) => i.studentName.toLowerCase().includes(q) || i.nim.includes(q));
    }

    const courses = [...new Map(enrollments.map((e) => [e.course.id, { id: e.course.id, code: e.course.code, name: e.course.name }])).values()];

    return { academicYearId: activeYear.id, academicYearName: activeYear.name, courses, items };
  }

  async assignThesisSupervision(dto: {
    studentId: string;
    courseId: string;
    academicYearId?: string;
    title?: string;
    supervisor1Id?: string | null;
    supervisor2Id?: string | null;
    notes?: string;
  }) {
    const academicYearId = dto.academicYearId
      ? dto.academicYearId
      : (await this.prisma.academicYear.findFirst({ where: { isActive: true } }))?.id;
    if (!academicYearId) throw new NotFoundException('Tidak ada tahun akademik aktif saat ini.');

    const student = await this.prisma.student.findFirst({ where: { OR: [{ id: dto.studentId }, { nim: dto.studentId }] } });
    if (!student) throw new NotFoundException(`Mahasiswa dengan ID/NIM "${dto.studentId}" tidak ditemukan.`);

    const enrolled = await this.prisma.courseEnrollment.findFirst({
      where: { studentId: student.id, courseId: dto.courseId, academicYearId, status: { not: 'REJECTED' } },
    });
    if (!enrolled) {
      throw new BadRequestException('Mahasiswa ini belum mengambil mata kuliah tersebut pada tahun akademik ini.');
    }

    const data = {
      title: dto.title?.trim() || null,
      supervisor1Id: dto.supervisor1Id || null,
      supervisor2Id: dto.supervisor2Id || null,
      notes: dto.notes?.trim() || null,
      assignedAt: new Date(),
    };

    const saved = await this.prisma.thesisSupervision.upsert({
      where: { studentId_courseId_academicYearId: { studentId: student.id, courseId: dto.courseId, academicYearId } },
      create: { studentId: student.id, courseId: dto.courseId, academicYearId, ...data },
      update: data,
      include: { supervisor1: { include: { user: true } }, supervisor2: { include: { user: true } } },
    });

    return {
      success: true,
      message: `Pembimbing untuk ${student.nim} berhasil ditetapkan.`,
      data: saved,
    };
  }

  // ================= JUMLAH ENTITAS PELAPORAN PDDIKTI (DATA NYATA) =================
  // Sekadar hitungan baris lokal per entitas Feeder Dikti — BUKAN status pengiriman/sinkronisasi,
  // karena sistem ini belum punya integrasi push/pull sungguhan ke Web Service Neo Feeder.
  async getFeederEntityCounts() {
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });

    const [totalMahasiswaAktif, totalMataKuliah, totalKelasKuliah, totalKrs, totalNilai, totalAktivitasKuliah, totalLulusan] =
      await Promise.all([
        this.prisma.student.count({ where: { status: 'ACTIVE' } }),
        this.prisma.course.count(),
        activeYear ? this.prisma.courseClass.count({ where: { academicYearId: activeYear.id } }) : Promise.resolve(0),
        activeYear
          ? this.prisma.courseEnrollment.count({ where: { academicYearId: activeYear.id, status: { in: ['SUBMITTED', 'APPROVED'] } } })
          : Promise.resolve(0),
        this.prisma.courseEnrollment.count({ where: { gradePoint: { not: null } } }),
        activeYear ? this.prisma.courseEnrollment.count({ where: { academicYearId: activeYear.id, status: 'APPROVED' } }) : Promise.resolve(0),
        this.prisma.student.count({ where: { status: 'GRADUATED' } }),
      ]);

    return {
      mahasiswa_pt: totalMahasiswaAktif,
      mata_kuliah: totalMataKuliah,
      kelas_kuliah: totalKelasKuliah,
      krs_mahasiswa: totalKrs,
      nilai_perkuliahan: totalNilai,
      perkuliahan_mahasiswa: totalAktivitasKuliah,
      lulusan: totalLulusan,
    };
  }

  async getGradesSummary() {
    const classes = await this.getGradeClasses('all');
    const totalClasses = classes.length;
    const finishedClasses = classes.filter((c) => c.gradeStatus === 'Selesai & Terbit').length;
    const inProgressClasses = classes.filter((c) => c.gradeStatus === 'Draf Proses').length;
    const untouchedClasses = totalClasses - finishedClasses - inProgressClasses;

    const totalStudents = classes.reduce((sum, c) => sum + c.totalStudents, 0);
    const gradedStudents = classes.reduce((sum, c) => sum + c.gradedCount, 0);

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });

    return {
      totalClasses,
      finishedClasses,
      inProgressClasses,
      untouchedClasses,
      percentage: totalClasses ? Math.round((finishedClasses / totalClasses) * 100) : 0,
      totalStudents,
      gradedStudents,
      isGradeLocked: activeYear ? this.computeIsGradeLocked(activeYear) : false,
      activeSemesterName: activeYear ? `${activeYear.name} ${semesterTypeLabel(activeYear.semesterType)}` : 'Semester Gasal 2026/2027',
      gradeInputStartDate: activeYear?.gradeInputStartDate || null,
      gradeInputEndDate: activeYear?.gradeInputEndDate || null,
    };
  }

  // ================= PRESENSI & KEHADIRAN (ADMIN OVERVIEW) =================
  private static readonly TOTAL_MEETINGS = 16;

  async getAttendanceOverview(filters?: { academicYearId?: string; studyProgramId?: string }) {
    const where: any = {};
    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    const classes = await this.prisma.courseClass.findMany({
      where,
      include: {
        course: true,
        room: true,
        lecturer: { include: { user: true } },
        academicYear: true,
        enrollments: { where: { status: { in: ['SUBMITTED', 'APPROVED'] } } },
        attendanceSessions: { include: { records: true }, orderBy: { meetingNumber: 'desc' } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });

    return classes
      .filter((cc) => !filters?.studyProgramId || cc.course.studyProgramId === filters.studyProgramId)
      .map((cc) => {
        const totalEnrolled = cc.enrollments.length;
        const sessions = cc.attendanceSessions;
        const latestSession = sessions[0] || null;

        let presentSlots = 0;
        let totalSlots = 0;
        for (const s of sessions) {
          for (const r of s.records) {
            totalSlots += 1;
            if (r.status === 'HADIR') presentSlots += 1;
          }
        }
        const attendanceRate = totalSlots > 0 ? Number(((presentSlots / totalSlots) * 100).toFixed(1)) : 0;
        const absentCount = totalSlots - presentSlots;

        let status: 'BERJALAN' | 'SELESAI' | 'TERJADWAL' = 'TERJADWAL';
        if (sessions.length > 0) {
          status = sessions.length >= AcademicService.TOTAL_MEETINGS ? 'SELESAI' : 'BERJALAN';
        }

        return {
          id: cc.id,
          courseCode: cc.course.code,
          courseName: cc.course.name,
          studyProgram: cc.course.studyProgramName || '-',
          classRoom: cc.room?.name || '-',
          lecturerName: cc.lecturer?.user?.fullName || '-',
          meetingNumber: latestSession?.meetingNumber || 0,
          totalMeetings: AcademicService.TOTAL_MEETINGS,
          totalEnrolled,
          presentCount: presentSlots,
          absentCount,
          attendanceRate,
          date: latestSession ? latestSession.date.toISOString().slice(0, 10) : '-',
          time: `${cc.startTime} - ${cc.endTime} WIB`,
          day: cc.day,
          academicYearId: cc.academicYearId,
          academicYearName: cc.academicYear?.name || '-',
          semesterLabel: cc.academicYear ? semesterTypeLabel(cc.academicYear.semesterType) : '-',
          status,
        };
      });
  }
}

