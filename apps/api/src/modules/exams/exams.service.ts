import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@siakad/database';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface UpsertExamDto {
  courseClassId?: string;
  type?: string;
  examDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  roomId?: string | null;
  location?: string | null;
  proctor1Id?: string | null;
  proctor2Id?: string | null;
  notes?: string;
}

type ExamTypeValue = 'UTS' | 'UAS';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const lecturerSelect = { id: true, titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } as const;

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------- util
  private lecturerName(l?: { titlePrefix?: string | null; titleSuffix?: string | null; user?: { fullName: string } | null } | null) {
    if (!l) return null;
    return [l.titlePrefix, l.user?.fullName, l.titleSuffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  private normType(type?: string): ExamTypeValue {
    const t = (type ?? '').toUpperCase();
    if (t !== 'UTS' && t !== 'UAS') throw new BadRequestException('Jenis ujian harus UTS atau UAS.');
    return t;
  }

  private toMinutes(time: string) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    return this.toMinutes(aStart) < this.toMinutes(bEnd) && this.toMinutes(bStart) < this.toMinutes(aEnd);
  }

  private dateOnly(value?: string) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('Tanggal ujian tidak valid (format YYYY-MM-DD).');
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Tanggal ujian tidak valid.');
    return d;
  }

  private async resolveYear(academicYearId?: string) {
    if (academicYearId) {
      const y = await this.prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { id: true, code: true, name: true } });
      if (!y) throw new NotFoundException('Tahun akademik tidak ditemukan.');
      return y;
    }
    const active = await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { id: true, code: true, name: true } });
    if (!active) throw new NotFoundException('Belum ada tahun akademik aktif.');
    return active;
  }

  private shape(e: any) {
    return {
      id: e.id,
      type: e.type as ExamTypeValue,
      examDate: e.examDate,
      startTime: e.startTime,
      endTime: e.endTime,
      roomId: e.roomId,
      location: e.location,
      roomName: e.room ? `${e.room.name} (${e.room.buildingName})` : e.location || null,
      roomCapacity: e.room?.capacity ?? null,
      seatCount: e._count?.seats ?? 0,
      proctor1: e.proctor1 ? { id: e.proctor1.id, name: this.lecturerName(e.proctor1) } : null,
      proctor2: e.proctor2 ? { id: e.proctor2.id, name: this.lecturerName(e.proctor2) } : null,
      notes: e.notes,
    };
  }

  private readonly scheduleInclude = {
    room: { select: { id: true, name: true, buildingName: true, capacity: true } },
    proctor1: { select: lecturerSelect },
    proctor2: { select: lecturerSelect },
    _count: { select: { seats: true } },
  } satisfies Prisma.ExamScheduleInclude;

  // ---------------------------------------------------------------- admin
  async getOptions() {
    const [years, rooms] = await Promise.all([
      this.prisma.academicYear.findMany({
        select: { id: true, code: true, name: true, semesterType: true, isActive: true },
        orderBy: { code: 'desc' },
      }),
      this.prisma.room.findMany({
        select: { id: true, code: true, name: true, buildingName: true, capacity: true },
        orderBy: [{ buildingName: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return { years, rooms };
  }

  async listAdmin(q: {
    academicYearId?: string;
    type?: string;
    status?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const year = await this.resolveYear(q.academicYearId);
    const type = this.normType(q.type || 'UTS');
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(String(q.pageSize ?? '25'), 10) || 25));
    const search = (q.search ?? '').trim();

    const where: Prisma.CourseClassWhereInput = { academicYearId: year.id };
    if (search) {
      where.OR = [
        { className: { contains: search, mode: 'insensitive' } },
        { course: { code: { contains: search, mode: 'insensitive' } } },
        { course: { name: { contains: search, mode: 'insensitive' } } },
        { lecturer: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (q.status === 'scheduled') where.examSchedules = { some: { type } };
    if (q.status === 'unscheduled') where.examSchedules = { none: { type } };

    const [total, totalClasses, scheduledCount, rows] = await Promise.all([
      this.prisma.courseClass.count({ where }),
      this.prisma.courseClass.count({ where: { academicYearId: year.id } }),
      this.prisma.courseClass.count({ where: { academicYearId: year.id, examSchedules: { some: { type } } } }),
      this.prisma.courseClass.findMany({
        where,
        orderBy: [{ course: { code: 'asc' } }, { className: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          className: true,
          course: { select: { code: true, name: true } },
          lecturer: { select: lecturerSelect },
          _count: { select: { enrollments: { where: { status: 'APPROVED' } } } },
          examSchedules: { where: { type }, include: this.scheduleInclude },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      year,
      type,
      summary: { totalClasses, scheduledCount, unscheduledCount: totalClasses - scheduledCount },
      items: rows.map((c) => ({
        courseClassId: c.id,
        className: c.className,
        courseCode: c.course?.code ?? '',
        courseName: c.course?.name ?? '',
        lecturerName: this.lecturerName(c.lecturer),
        studentCount: c._count.enrollments,
        schedule: c.examSchedules[0] ? this.shape(c.examSchedules[0]) : null,
      })),
    };
  }

  /** Cek bentrok ruang & pengawas (blok) dan mahasiswa dengan dua ujian bersamaan (peringatan). */
  private async checkConflicts(args: {
    academicYearId: string;
    examDate: Date;
    startTime: string;
    endTime: string;
    roomId: string | null;
    location: string | null;
    proctorIds: string[];
    courseClassId: string;
    type: ExamTypeValue;
  }) {
    const sameDay = await this.prisma.examSchedule.findMany({
      where: {
        academicYearId: args.academicYearId,
        examDate: args.examDate,
        NOT: { courseClassId: args.courseClassId, type: args.type },
      },
      include: {
        courseClass: { select: { id: true, className: true, course: { select: { code: true, name: true } } } },
        room: { select: { name: true } },
      },
    });
    const clashing = sameDay.filter((e) => this.overlap(args.startTime, args.endTime, e.startTime, e.endTime));

    const label = (e: (typeof sameDay)[number]) =>
      `${e.courseClass.course?.code ?? ''} ${e.courseClass.course?.name ?? ''} (${e.courseClass.className}, ${e.startTime}-${e.endTime})`;

    for (const e of clashing) {
      const sameRoom = args.roomId && e.roomId === args.roomId;
      const sameLocation =
        args.location && e.location && args.location.trim().toLowerCase() === e.location.trim().toLowerCase();
      if (sameRoom || sameLocation) {
        throw new BadRequestException(`Ruang/lokasi sudah dipakai ujian ${label(e)} pada jam yang sama.`);
      }
      const ids = [e.proctor1Id, e.proctor2Id].filter(Boolean) as string[];
      const dup = args.proctorIds.find((p) => ids.includes(p));
      if (dup) {
        throw new BadRequestException(`Pengawas sudah bertugas pada ujian ${label(e)} di jam yang sama.`);
      }
    }

    // Mahasiswa yang mengikuti dua kelas dengan ujian bersamaan.
    const warnings: string[] = [];
    if (clashing.length > 0) {
      const otherClassIds = Array.from(new Set(clashing.map((c) => c.courseClassId)));
      const shared = await this.prisma.courseEnrollment.groupBy({
        by: ['courseClassId'],
        where: {
          status: 'APPROVED',
          courseClassId: { in: otherClassIds },
          studentId: {
            in: (
              await this.prisma.courseEnrollment.findMany({
                where: { status: 'APPROVED', courseClassId: args.courseClassId },
                select: { studentId: true },
              })
            ).map((r) => r.studentId),
          },
        },
        _count: { _all: true },
      });
      for (const s of shared) {
        const other = clashing.find((c) => c.courseClassId === s.courseClassId);
        if (other) warnings.push(`${s._count._all} mahasiswa juga mengikuti ujian ${label(other)} pada jam yang bersamaan.`);
      }
    }
    return warnings;
  }

  async upsertSchedule(dto: UpsertExamDto) {
    if (!dto.courseClassId) throw new BadRequestException('Kelas wajib dipilih.');
    const type = this.normType(dto.type);
    const examDate = this.dateOnly(dto.examDate);
    const startTime = (dto.startTime ?? '').trim();
    const endTime = (dto.endTime ?? '').trim();
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) throw new BadRequestException('Jam ujian tidak valid (format HH:MM).');
    if (this.toMinutes(startTime) >= this.toMinutes(endTime)) throw new BadRequestException('Jam selesai harus setelah jam mulai.');

    const courseClass = await this.prisma.courseClass.findUnique({
      where: { id: dto.courseClassId },
      select: { id: true, academicYearId: true },
    });
    if (!courseClass) throw new NotFoundException('Kelas tidak ditemukan.');

    // Lokasi ujian = ruang dari master ruang (gedung & lantai sudah tercatat di sana); tidak ada lokasi bebas.
    const roomId = dto.roomId || null;
    if (!roomId) throw new BadRequestException('Ruang ujian wajib dipilih dari master ruang.');
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, select: { id: true, name: true, capacity: true } });
    if (!room) throw new BadRequestException('Ruang tidak ditemukan.');
    const participants = await this.prisma.courseEnrollment.count({ where: { courseClassId: courseClass.id, status: 'APPROVED' } });
    if (participants > room.capacity) {
      throw new BadRequestException(
        `Ruang ${room.name} hanya berkapasitas ${room.capacity} kursi, sedangkan kelas ini punya ${participants} peserta. Pilih ruang yang lebih besar.`,
      );
    }
    const location: string | null = null;
    const proctor1Id = dto.proctor1Id || null;
    const proctor2Id = dto.proctor2Id || null;
    if (proctor1Id && proctor1Id === proctor2Id) throw new BadRequestException('Pengawas 1 dan 2 tidak boleh orang yang sama.');
    const proctorIds = [proctor1Id, proctor2Id].filter(Boolean) as string[];
    if (proctorIds.length) {
      const found = await this.prisma.lecturer.count({ where: { id: { in: proctorIds } } });
      if (found !== proctorIds.length) throw new BadRequestException('Pengawas tidak ditemukan.');
    }

    const warnings = await this.checkConflicts({
      academicYearId: courseClass.academicYearId,
      examDate,
      startTime,
      endTime,
      roomId,
      location,
      proctorIds,
      courseClassId: courseClass.id,
      type,
    });

    const previous = await this.prisma.examSchedule.findUnique({
      where: { courseClassId_type: { courseClassId: courseClass.id, type } },
      select: { id: true, roomId: true },
    });

    const data = {
      academicYearId: courseClass.academicYearId,
      examDate,
      startTime,
      endTime,
      roomId,
      location: null,
      proctor1Id,
      proctor2Id,
      notes: (dto.notes ?? '').trim() || null,
    };
    const saved = await this.prisma.examSchedule.upsert({
      where: { courseClassId_type: { courseClassId: courseClass.id, type } },
      create: { courseClassId: courseClass.id, type, ...data },
      update: data,
      include: this.scheduleInclude,
    });
    // Ganti ruang: nomor kursi lama tidak berlaku lagi (kapasitas/tata letak berbeda)
    if (previous && previous.roomId !== roomId) {
      const removed = await this.prisma.examSeat.deleteMany({ where: { examScheduleId: previous.id } });
      if (removed.count > 0) warnings.push('Ruang diganti, nomor kursi sebelumnya dihapus. Generate ulang nomor kursi.');
      return { success: true, schedule: this.shape({ ...saved, _count: { seats: 0 } }), warnings };
    }
    return { success: true, schedule: this.shape(saved), warnings };
  }

  // ---------------------------------------------------------------- ketersediaan & nomor kursi
  /** Ruang dan pengawas yang sudah terpakai pada tanggal & jam tertentu (untuk menonaktifkan pilihan di form). */
  async getAvailability(q: { academicYearId?: string; date?: string; startTime?: string; endTime?: string; courseClassId?: string; type?: string }) {
    const examDate = this.dateOnly(q.date);
    const startTime = (q.startTime ?? '').trim();
    const endTime = (q.endTime ?? '').trim();
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || this.toMinutes(startTime) >= this.toMinutes(endTime)) {
      return { busyRooms: {}, busyProctors: {} };
    }
    const year = await this.resolveYear(q.academicYearId);
    const type = q.type ? this.normType(q.type) : null;
    const rows = await this.prisma.examSchedule.findMany({
      where: {
        academicYearId: year.id,
        examDate,
        ...(q.courseClassId && type ? { NOT: { courseClassId: q.courseClassId, type } } : {}),
      },
      include: { courseClass: { select: { className: true, course: { select: { code: true, name: true } } } } },
    });
    const busyRooms: Record<string, string> = {};
    const busyProctors: Record<string, string> = {};
    for (const e of rows) {
      if (!this.overlap(startTime, endTime, e.startTime, e.endTime)) continue;
      const label = `${e.courseClass.course?.code ?? ''} ${e.courseClass.className}, ${e.startTime}-${e.endTime}`;
      if (e.roomId) busyRooms[e.roomId] = label;
      for (const p of [e.proctor1Id, e.proctor2Id]) if (p) busyProctors[p] = label;
    }
    return { busyRooms, busyProctors };
  }

  private shuffle<T>(arr: T[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private async generateSeatsFor(scheduleId: string, mode: 'nim' | 'random') {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: { room: { select: { name: true, capacity: true } }, courseClass: { select: { className: true, course: { select: { code: true } } } } },
    });
    if (!schedule) throw new NotFoundException('Jadwal ujian tidak ditemukan.');
    if (!schedule.room) throw new BadRequestException('Jadwal belum punya ruang; pilih ruang ujian dulu.');

    const enrolled = await this.prisma.courseEnrollment.findMany({
      where: { courseClassId: schedule.courseClassId, status: 'APPROVED' },
      select: { student: { select: { id: true, nim: true } } },
    });
    const students = Array.from(new Map(enrolled.map((e) => [e.student.id, e.student])).values());
    if (students.length > schedule.room.capacity) {
      throw new BadRequestException(
        `${schedule.courseClass.course?.code ?? ''} ${schedule.courseClass.className}: ${students.length} peserta melebihi kapasitas ${schedule.room.name} (${schedule.room.capacity} kursi).`,
      );
    }
    const ordered = mode === 'random' ? this.shuffle(students) : [...students].sort((a, b) => a.nim.localeCompare(b.nim));
    await this.prisma.$transaction([
      this.prisma.examSeat.deleteMany({ where: { examScheduleId: scheduleId } }),
      this.prisma.examSeat.createMany({ data: ordered.map((st, i) => ({ examScheduleId: scheduleId, studentId: st.id, seatNo: i + 1 })) }),
    ]);
    return ordered.length;
  }

  /** Generate nomor kursi satu jadwal (id jadwal) atau semua jadwal pada tahun akademik + jenis ujian. */
  async generateSeats(dto: { scheduleId?: string; academicYearId?: string; type?: string; mode?: string }) {
    const mode: 'nim' | 'random' = dto.mode === 'random' ? 'random' : 'nim';
    if (dto.scheduleId) {
      const count = await this.generateSeatsFor(dto.scheduleId, mode);
      return { success: true, generated: 1, seats: count, failed: [] as string[] };
    }
    const year = await this.resolveYear(dto.academicYearId);
    const type = this.normType(dto.type);
    const schedules = await this.prisma.examSchedule.findMany({ where: { academicYearId: year.id, type }, select: { id: true } });
    let generated = 0;
    let seats = 0;
    const failed: string[] = [];
    for (const sc of schedules) {
      try {
        seats += await this.generateSeatsFor(sc.id, mode);
        generated++;
      } catch (err: any) {
        failed.push(err?.message || 'Gagal membuat nomor kursi.');
      }
    }
    return { success: true, generated, seats, failed };
  }

  /** Daftar peserta + nomor kursi sebuah jadwal (untuk cetak daftar hadir). */
  async getSeats(scheduleId: string) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        ...this.scheduleInclude,
        courseClass: { select: { className: true, course: { select: { code: true, name: true } } } },
        seats: { select: { seatNo: true, studentId: true } },
      },
    });
    if (!schedule) throw new NotFoundException('Jadwal ujian tidak ditemukan.');
    // Peserta = mahasiswa kelas dengan KRS disetujui; nomor kursi terisi bila sudah digenerate
    const enrolled = await this.prisma.courseEnrollment.findMany({
      where: { courseClassId: schedule.courseClassId, status: 'APPROVED' },
      select: { student: { select: { id: true, nim: true, user: { select: { fullName: true } } } } },
    });
    const seatOf = new Map(schedule.seats.map((x) => [x.studentId, x.seatNo]));
    const participants = Array.from(new Map(enrolled.map((e) => [e.student.id, e.student])).values())
      .map((st) => ({ seatNo: seatOf.get(st.id) ?? null, nim: st.nim, name: st.user.fullName }))
      .sort((a, b) => (a.seatNo ?? 1e9) - (b.seatNo ?? 1e9) || a.nim.localeCompare(b.nim));
    return {
      schedule: {
        ...this.shape(schedule),
        courseCode: schedule.courseClass.course?.code ?? '',
        courseName: schedule.courseClass.course?.name ?? '',
        className: schedule.courseClass.className,
      },
      seats: participants,
    };
  }

  /** Bahan cetak Daftar Hadir & Berita Acara: satu jadwal, atau semua jadwal pada tahun akademik + jenis ujian. */
  async getPrintBundle(q: { scheduleId?: string; academicYearId?: string; type?: string }) {
    let ids: string[];
    let year: { id: string; code: string; name: string };
    if (q.scheduleId) {
      const one = await this.prisma.examSchedule.findUnique({ where: { id: q.scheduleId }, select: { id: true, academicYearId: true } });
      if (!one) throw new NotFoundException('Jadwal ujian tidak ditemukan.');
      ids = [one.id];
      year = await this.resolveYear(one.academicYearId);
    } else {
      year = await this.resolveYear(q.academicYearId);
      const type = this.normType(q.type);
      const rows = await this.prisma.examSchedule.findMany({
        where: { academicYearId: year.id, type },
        orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }, { room: { name: 'asc' } }],
        select: { id: true },
      });
      ids = rows.map((r) => r.id);
    }
    const items = [];
    for (const id of ids) items.push(await this.getSeats(id));
    return { year, items };
  }

  /** Rekap tugas mengawas per dosen (pengawas 1 & 2) untuk tahun akademik dan jenis ujian (kosong = UTS & UAS). */
  async getProctorRecap(q: { academicYearId?: string; type?: string }) {
    const year = await this.resolveYear(q.academicYearId);
    const type = q.type ? this.normType(q.type) : null;
    const rows = await this.prisma.examSchedule.findMany({
      where: { academicYearId: year.id, ...(type ? { type } : {}), OR: [{ proctor1Id: { not: null } }, { proctor2Id: { not: null } }] },
      include: {
        ...this.scheduleInclude,
        courseClass: { select: { className: true, course: { select: { code: true, name: true } } } },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });
    const byLecturer = new Map<string, { id: string; name: string; duties: any[] }>();
    for (const r of rows) {
      for (const [role, l] of [['Pengawas 1', r.proctor1], ['Pengawas 2', r.proctor2]] as const) {
        if (!l) continue;
        const entry = byLecturer.get(l.id) ?? { id: l.id, name: this.lecturerName(l) || '-', duties: [] };
        entry.duties.push({
          scheduleId: r.id,
          type: r.type,
          role,
          examDate: r.examDate,
          startTime: r.startTime,
          endTime: r.endTime,
          room: r.room ? `${r.room.name} (${r.room.buildingName})` : '-',
          courseCode: r.courseClass.course?.code ?? '',
          courseName: r.courseClass.course?.name ?? '',
          className: r.courseClass.className,
        });
        byLecturer.set(l.id, entry);
      }
    }
    const items = Array.from(byLecturer.values())
      .map((e) => ({ ...e, total: e.duties.length }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    return { year, type, totalSchedules: rows.length, items };
  }

  async removeSchedule(id: string) {
    const existing = await this.prisma.examSchedule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Jadwal ujian tidak ditemukan.');
    await this.prisma.examSchedule.delete({ where: { id } });
    return { success: true };
  }

  // ---------------------------------------------------------------- mahasiswa
  async getMine(userId: string, academicYearId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true, nim: true, user: { select: { fullName: true } }, studyProgram: { select: { name: true } } },
    });
    if (!student) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    const year = await this.resolveYear(academicYearId);

    const unpaid = await this.prisma.paymentInvoice.count({ where: { nim: student.nim, status: { not: 'LUNAS' } } });

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { studentId: student.id, academicYearId: year.id, status: 'APPROVED', courseClassId: { not: null } },
      select: {
        course: { select: { code: true, name: true, sks: true } },
        courseClass: {
          select: {
            className: true,
            examSchedules: { include: { ...this.scheduleInclude, seats: { where: { studentId: student.id }, select: { seatNo: true } } } },
          },
        },
      },
    });

    const items = enrollments
      .flatMap((e) =>
        (e.courseClass?.examSchedules ?? []).map((s) => ({
          ...this.shape(s),
          seatNo: (s as any).seats?.[0]?.seatNo ?? null,
          courseCode: e.course?.code ?? '',
          courseName: e.course?.name ?? '',
          sks: e.course?.sks ?? 0,
          className: e.courseClass?.className ?? '',
        }))
      )
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime() || a.startTime.localeCompare(b.startTime));

    const unscheduled = enrollments
      .filter((e) => !(e.courseClass?.examSchedules ?? []).length)
      .map((e) => ({ courseCode: e.course?.code ?? '', courseName: e.course?.name ?? '', className: e.courseClass?.className ?? '' }));

    return {
      year,
      student: {
        nim: student.nim,
        name: student.user.fullName,
        studyProgram: student.studyProgram?.name ?? '-',
      },
      hasUnpaidInvoice: unpaid > 0,
      unpaidCount: unpaid,
      items,
      unscheduled,
    };
  }

  // ---------------------------------------------------------------- dosen
  async getForLecturer(userId: string, academicYearId?: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { userId }, select: { id: true } });
    if (!lecturer) throw new ForbiddenException('Akun ini bukan akun dosen.');
    const year = await this.resolveYear(academicYearId);

    const rows = await this.prisma.examSchedule.findMany({
      where: {
        academicYearId: year.id,
        OR: [{ courseClass: { lecturerId: lecturer.id } }, { proctor1Id: lecturer.id }, { proctor2Id: lecturer.id }],
      },
      include: {
        ...this.scheduleInclude,
        courseClass: {
          select: {
            className: true,
            lecturerId: true,
            course: { select: { code: true, name: true } },
            _count: { select: { enrollments: { where: { status: 'APPROVED' } } } },
          },
        },
      },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });

    return {
      year,
      items: rows.map((r) => ({
        ...this.shape(r),
        courseCode: r.courseClass.course?.code ?? '',
        courseName: r.courseClass.course?.name ?? '',
        className: r.courseClass.className,
        studentCount: r.courseClass._count.enrollments,
        roles: [
          ...(r.courseClass.lecturerId === lecturer.id ? ['PENGAMPU'] : []),
          ...(r.proctor1Id === lecturer.id || r.proctor2Id === lecturer.id ? ['PENGAWAS'] : []),
        ],
      })),
    };
  }
}
