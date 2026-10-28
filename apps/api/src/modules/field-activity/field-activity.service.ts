import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CourseCategoriesService } from '../academic/course-categories.service';
import { FinanceService } from '../finance/finance.service';

export interface PartnerDto {
  categoryId?: string;
  name?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  isActive?: boolean;
}

export interface RegistrationDto {
  courseId?: string;
  partnerId?: string | null;
  placeName?: string;
  placeAddress?: string;
  fieldSupervisorName?: string;
  plan?: string;
}

export interface ReviewDto {
  status?: string;
  adminNote?: string;
  supervisor1Id?: string | null;
  supervisor2Id?: string | null;
}

export interface PeriodDto {
  categoryId?: string;
  academicYearId?: string;
  openAt?: string;
  closeAt?: string;
  notes?: string;
}

export interface GroupDto {
  categoryId?: string;
  academicYearId?: string;
  name?: string;
  memberIds?: string[];
  supervisorId?: string | null;
  notes?: string;
}

export interface ChargeDto {
  categoryId?: string;
  academicYearId?: string;
}

type PeriodState = 'NOT_SET' | 'UPCOMING' | 'OPEN' | 'CLOSED';

/**
 * Kegiatan Lapangan (PLP, KKN, Kerja Praktik, Magang). Aturan tiap jenis dibaca dari master CourseCategory:
 *  - wajib mendaftar: mahasiswa mendaftar perorangan pada periode yang dibuka BAAK, lalu disetujui/ditolak
 *  - berkelompok: kelompok dibentuk akademik (BAAK), satu pembimbing per kelompok; bila jenisnya juga wajib
 *    mendaftar, anggota hanya boleh dipilih dari pendaftar yang sudah disetujui
 *  - perorangan tanpa pendaftaran: BAAK langsung memplot pembimbing
 * Pembimbing tetap disimpan di ThesisSupervision agar satu sumber dengan Bimbingan Tugas Akhir.
 */
@Injectable()
export class FieldActivityService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private categories: CourseCategoriesService,
    private finance: FinanceService,
  ) {}

  private readonly BAAK_ROLES = ['ADMIN_BAAK', 'STAFF'];

  // ---------------------------------------------------------------- util
  private async studentByUser(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true, nim: true, user: { select: { fullName: true } } } });
    if (!student) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    return student;
  }

  private async resolveYear(academicYearId?: string) {
    const year = academicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: academicYearId } })
      : await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!year) throw new NotFoundException('Tahun akademik tidak ditemukan atau belum ada yang aktif.');
    return year;
  }

  private async lapanganCategory(categoryId?: string) {
    const cat = categoryId ? await this.prisma.courseCategory.findUnique({ where: { id: categoryId } }) : null;
    if (!cat || cat.kind !== 'LAPANGAN') throw new NotFoundException('Jenis kegiatan lapangan tidak ditemukan.');
    return cat;
  }

  private periodState(p: { openAt: Date; closeAt: Date } | null, now = new Date()): PeriodState {
    if (!p) return 'NOT_SET';
    if (now < p.openAt) return 'UPCOMING';
    if (now > p.closeAt) return 'CLOSED';
    return 'OPEN';
  }

  /** Tanggal polos (YYYY-MM-DD) dibaca sebagai hari kalender WIB: buka 00:00, tutup 23:59:59. */
  private parseDate(value: string | undefined, endOfDay: boolean) {
    const v = (value ?? '').trim();
    if (!v) throw new BadRequestException('Tanggal buka dan tutup pendaftaran wajib diisi.');
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T${endOfDay ? '23:59:59.999' : '00:00:00'}+07:00`) : new Date(v);
    if (Number.isNaN(d.getTime())) throw new BadRequestException('Format tanggal tidak valid.');
    return d;
  }

  /** Mata kuliah yang diambil mahasiswa (tidak ditolak) pada tahun akademik dan berkategori `categoryName`. */
  private enrolledCourses(studentId: string, academicYearId: string, categoryName: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { studentId, academicYearId, status: { not: 'REJECTED' }, course: { finalProjectLabel: categoryName } },
      select: { courseId: true, course: { select: { id: true, code: true, name: true } } },
    });
  }

  /** Catat satu kejadian pada riwayat mahasiswa (satu baris per mata kuliah jenis ini bila `courseId` tidak diberikan). */
  private async logEvent(studentId: string, cat: { id: string; name: string }, academicYearId: string, type: string, title: string, detail?: string | null, courseId?: string) {
    try {
      const courseIds = courseId ? [courseId] : (await this.enrolledCourses(studentId, academicYearId, cat.name)).map((c) => c.courseId);
      if (!courseIds.length) return;
      await this.prisma.fieldEvent.createMany({
        data: courseIds.map((cid) => ({ studentId, courseId: cid, academicYearId, categoryId: cat.id, type, title, detail: detail ?? null })),
      });
    } catch {
      // riwayat tidak boleh menggagalkan tindakan utama
    }
  }

  private async lecturerNames(ids: Array<string | null | undefined>) {
    const clean = ids.filter((x): x is string => Boolean(x));
    if (!clean.length) return '';
    const rows = await this.prisma.lecturer.findMany({ where: { id: { in: clean } }, select: { id: true, user: { select: { fullName: true } } } });
    const byId = new Map(rows.map((r) => [r.id, r.user.fullName]));
    return clean.map((id) => byId.get(id)).filter(Boolean).join(' & ');
  }

  private feeLabelOf(cat: { name: string; feeLabel?: string | null }) {
    return cat.feeLabel?.trim() || `Biaya ${cat.name}`;
  }

  private rupiah(n: number) {
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  }

  /** Id mahasiswa yang biayanya sudah lunas pada jenis ini. */
  private async paidStudentIds(categoryId: string, academicYearId: string) {
    const rows = await this.prisma.fieldCharge.findMany({ where: { categoryId, academicYearId, invoice: { status: 'LUNAS' } }, select: { studentId: true } });
    return [...new Set(rows.map((r) => r.studentId))];
  }

  /**
   * Mahasiswa yang boleh diplot/dikelompokkan: pendaftarannya disetujui (bila wajib mendaftar) dan biayanya lunas
   * (bila ada biaya khusus). null = tanpa batasan tambahan.
   */
  private async eligibleStudentIds(cat: { id: string; requiresRegistration: boolean; feeAmount: number }, academicYearId: string) {
    let pool: string[] | null = cat.requiresRegistration ? await this.approvedStudentIds(cat.id, academicYearId) : null;
    if (cat.feeAmount > 0) {
      const paid = await this.paidStudentIds(cat.id, academicYearId);
      pool = pool ? pool.filter((id) => paid.includes(id)) : paid;
    }
    return pool;
  }

  /** Terbitkan tagihan biaya lewat modul Keuangan (PaymentInvoice) dan kaitkan dengan mahasiswa & mata kuliah. Null bila sudah pernah. */
  private async issueCharge(studentId: string, courseId: string, cat: { id: string; name: string; feeAmount: number; feeLabel: string | null; feeComponentId?: string | null }, year: { id: string; name: string }) {
    const existing = await this.prisma.fieldCharge.findUnique({ where: { studentId_courseId_academicYearId: { studentId, courseId, academicYearId: year.id } } });
    if (existing) return null;
    const [student, course] = await Promise.all([
      this.prisma.student.findUnique({ where: { id: studentId }, include: { user: true, studyProgram: true } }),
      this.prisma.course.findUnique({ where: { id: courseId }, select: { code: true, name: true } }),
    ]);
    if (!student || !course) return null;
    const label = this.feeLabelOf(cat);
    const inv = await this.finance.createInvoice({
      nim: student.nim,
      studentName: student.user.fullName,
      studyProgram: student.studyProgram?.name,
      paymentType: label,
      amount: cat.feeAmount,
      academicYear: year.name,
      notes: `${label} - ${course.code} ${course.name}`,
    });
    // Rincian tagihan per komponen agar laporan Keuangan per komponen biaya ikut rapi
    await this.prisma.paymentInvoiceItem
      .create({ data: { invoiceId: inv.data.id, feeComponentId: cat.feeComponentId ?? null, componentName: label, baseAmount: cat.feeAmount, finalAmount: cat.feeAmount } })
      .catch(() => undefined);
    const charge = await this.prisma.fieldCharge.create({
      data: { studentId, courseId, categoryId: cat.id, academicYearId: year.id, invoiceId: inv.data.id, label, amount: cat.feeAmount },
    });
    await this.logEvent(studentId, cat, year.id, 'CHARGE_ISSUED', 'Tagihan biaya diterbitkan', `${label}: ${this.rupiah(cat.feeAmount)} (${inv.data.invoiceNo})`, courseId);
    await this.notifications.notifyStudent(studentId, {
      type: 'FIELD',
      title: `Tagihan ${label}`,
      body: `${this.rupiah(cat.feeAmount)}. Selesaikan pembayaran di Tagihan & Pembayaran agar dapat diproses ke tahap berikutnya.`,
      link: '/student/keuangan',
    });
    return charge;
  }

  /** Id mahasiswa yang pendaftarannya disetujui untuk jenis ini (dipakai jenis berkelompok yang wajib mendaftar). */
  private async approvedStudentIds(categoryId: string, academicYearId: string) {
    const rows = await this.prisma.fieldRegistration.findMany({ where: { categoryId, academicYearId, status: 'APPROVED' }, select: { studentId: true } });
    return [...new Set(rows.map((r) => r.studentId))];
  }

  private async upsertSupervision(studentId: string, courseId: string, academicYearId: string, sup: { supervisor1Id: string | null; supervisor2Id: string | null }) {
    const data = { supervisor1Id: sup.supervisor1Id, supervisor2Id: sup.supervisor2Id, assignedAt: sup.supervisor1Id ? new Date() : null };
    await this.prisma.thesisSupervision.upsert({
      where: { studentId_courseId_academicYearId: { studentId, courseId, academicYearId } },
      create: { studentId, courseId, academicYearId, ...data },
      update: data,
    });
  }

  // ================================================================ MAHASISWA
  async getMine(userId: string) {
    const student = await this.studentByUser(userId);
    const year = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!year) return { academicYearName: null, items: [] };

    const cats = await this.prisma.courseCategory.findMany({
      where: { kind: 'LAPANGAN', isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const items: any[] = [];
    for (const cat of cats) {
      const courses = await this.enrolledCourses(student.id, year.id, cat.name);
      if (courses.length === 0) continue;
      const courseIds = courses.map((c) => c.courseId);
      const [period, registrations, membership, supervisions, events, charges] = await Promise.all([
        this.prisma.fieldPeriod.findUnique({ where: { categoryId_academicYearId: { categoryId: cat.id, academicYearId: year.id } } }),
        this.prisma.fieldRegistration.findMany({ where: { studentId: student.id, academicYearId: year.id, courseId: { in: courseIds } } }),
        this.prisma.fieldGroupMember.findUnique({
          where: { studentId_categoryId_academicYearId: { studentId: student.id, categoryId: cat.id, academicYearId: year.id } },
          include: {
            group: {
              include: {
                supervisor: { include: { user: { select: { fullName: true } } } },
                members: { include: { student: { select: { nim: true, user: { select: { fullName: true } } } } } },
              },
            },
          },
        }),
        this.prisma.thesisSupervision.findMany({
          where: { studentId: student.id, academicYearId: year.id, courseId: { in: courseIds } },
          include: { supervisor1: { include: { user: { select: { fullName: true } } } }, supervisor2: { include: { user: { select: { fullName: true } } } } },
        }),
        this.prisma.fieldEvent.findMany({
          where: { studentId: student.id, academicYearId: year.id, categoryId: cat.id, courseId: { in: courseIds } },
          include: { course: { select: { code: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.fieldCharge.findMany({
          where: { studentId: student.id, academicYearId: year.id, courseId: { in: courseIds } },
          include: { invoice: { select: { invoiceNo: true, status: true } } },
        }),
      ]);
      const mode = cat.isGroup ? 'GROUP' : cat.requiresRegistration ? 'REGISTRATION' : 'DIRECT';
      items.push({
        category: {
          id: cat.id,
          name: cat.name,
          isGroup: cat.isGroup,
          minMembers: cat.minMembers,
          maxMembers: cat.maxMembers,
          minLogbook: cat.minLogbook,
          requiresRegistration: cat.requiresRegistration,
          hasPartners: cat.hasPartners,
          allowOwnPartner: cat.allowOwnPartner,
          feeAmount: cat.feeAmount,
          feeLabel: cat.feeAmount > 0 ? this.feeLabelOf(cat) : null,
          description: cat.description,
        },
        partners: cat.hasPartners
          ? (await this.prisma.fieldPartner.findMany({ where: { categoryId: cat.id, isActive: true }, orderBy: { name: 'asc' } })).map((p) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              contactName: p.contactName,
              contactPhone: p.contactPhone,
            }))
          : [],
        mode,
        courses: courses.map((c) => c.course),
        period: cat.requiresRegistration ? { state: this.periodState(period), openAt: period?.openAt ?? null, closeAt: period?.closeAt ?? null, notes: period?.notes ?? null } : null,
        registrations: registrations.map((r) => ({
          id: r.id,
          courseId: r.courseId,
          status: r.status,
          partnerId: r.partnerId,
          placeName: r.placeName,
          placeAddress: r.placeAddress,
          fieldSupervisorName: r.fieldSupervisorName,
          plan: r.plan,
          adminNote: r.adminNote,
          submittedAt: r.submittedAt,
        })),
        group: membership
          ? {
              id: membership.group.id,
              name: membership.group.name,
              supervisorName: membership.group.supervisor?.user?.fullName ?? null,
              members: membership.group.members.map((m) => ({ nim: m.student.nim, name: m.student.user.fullName })),
            }
          : null,
        charges: charges.map((c) => ({
          courseId: c.courseId,
          label: c.label,
          amount: c.amount,
          invoiceNo: c.invoice.invoiceNo,
          status: c.invoice.status === 'LUNAS' ? 'PAID' : c.invoice.status === 'MENUNGGU_VERIFIKASI' ? 'VERIFYING' : 'UNPAID',
        })),
        history: events.map((e) => ({ id: e.id, type: e.type, title: e.title, detail: e.detail, courseCode: e.course.code, createdAt: e.createdAt })),
        supervisions: supervisions.map((s) => ({
          courseId: s.courseId,
          supervisor1Name: s.supervisor1?.user?.fullName ?? null,
          supervisor2Name: s.supervisor2?.user?.fullName ?? null,
        })),
      });
    }
    return { academicYearName: year.name, items };
  }

  async submitRegistration(userId: string, dto: RegistrationDto) {
    const student = await this.studentByUser(userId);
    const year = await this.resolveYear();
    if (!dto.courseId) throw new BadRequestException('Mata kuliah wajib dipilih.');

    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId }, select: { id: true, finalProjectLabel: true } });
    const cat = await this.categories.findByName(course?.finalProjectLabel);
    if (!course || !cat || cat.kind !== 'LAPANGAN' || !cat.isActive) throw new BadRequestException('Mata kuliah ini bukan kegiatan lapangan.');
    if (!cat.requiresRegistration) throw new BadRequestException('Jenis kegiatan ini tidak memerlukan pendaftaran.');

    // Tempat kegiatan: dipilih dari daftar mitra kampus, atau diisi sendiri (jenis tanpa mitra / yang membolehkan mitra lain)
    let placeName = (dto.placeName ?? '').trim();
    let placeAddress = (dto.placeAddress ?? '').trim() || null;
    let partnerId: string | null = null;
    if (cat.hasPartners && dto.partnerId) {
      const partner = await this.prisma.fieldPartner.findUnique({ where: { id: dto.partnerId } });
      if (!partner || partner.categoryId !== cat.id || !partner.isActive) throw new BadRequestException('Mitra yang dipilih tidak tersedia untuk jenis kegiatan ini.');
      partnerId = partner.id;
      placeName = partner.name;
      placeAddress = partner.address;
    } else if (cat.hasPartners && !cat.allowOwnPartner) {
      throw new BadRequestException(`Untuk ${cat.name}, pilih salah satu mitra dari daftar yang disediakan akademik.`);
    } else if (placeName.length < 3) {
      throw new BadRequestException('Nama tempat kegiatan wajib diisi (minimal 3 karakter).');
    }

    const enrolled = await this.prisma.courseEnrollment.findFirst({
      where: { studentId: student.id, courseId: course.id, academicYearId: year.id, status: { not: 'REJECTED' } },
    });
    if (!enrolled) throw new BadRequestException('Anda harus mengambil mata kuliah ini di KRS tahun akademik aktif sebelum mendaftar.');

    const period = await this.prisma.fieldPeriod.findUnique({ where: { categoryId_academicYearId: { categoryId: cat.id, academicYearId: year.id } } });
    const state = this.periodState(period);
    if (state === 'NOT_SET') throw new BadRequestException(`Periode pendaftaran ${cat.name} belum dibuka oleh akademik.`);
    if (state === 'UPCOMING') throw new BadRequestException(`Pendaftaran ${cat.name} belum dibuka.`);
    if (state === 'CLOSED') throw new BadRequestException(`Pendaftaran ${cat.name} sudah ditutup.`);

    const existing = await this.prisma.fieldRegistration.findUnique({
      where: { studentId_courseId_academicYearId: { studentId: student.id, courseId: course.id, academicYearId: year.id } },
    });
    if (existing?.status === 'APPROVED') throw new BadRequestException('Pendaftaran Anda sudah disetujui dan tidak dapat diubah.');
    // Selama menunggu, data dikunci agar yang ditinjau akademik sama dengan yang diajukan; baru bisa diajukan ulang bila ditolak.
    if (existing?.status === 'PENDING') throw new BadRequestException('Pendaftaran Anda sedang diproses akademik dan tidak dapat diubah. Anda dapat mengajukan ulang bila ditolak.');

    const data = {
      partnerId,
      placeName,
      placeAddress,
      fieldSupervisorName: (dto.fieldSupervisorName ?? '').trim() || null,
      plan: (dto.plan ?? '').trim() || null,
      status: 'PENDING',
      adminNote: null,
      reviewedAt: null,
      submittedAt: new Date(),
    };
    const saved = await this.prisma.fieldRegistration.upsert({
      where: { studentId_courseId_academicYearId: { studentId: student.id, courseId: course.id, academicYearId: year.id } },
      create: { studentId: student.id, courseId: course.id, categoryId: cat.id, academicYearId: year.id, ...data },
      update: data,
    });
    await this.logEvent(
      student.id,
      cat,
      year.id,
      existing ? 'REGISTRATION_RESUBMITTED' : 'REGISTRATION_SUBMITTED',
      existing ? 'Mengajukan ulang pendaftaran' : 'Mendaftar',
      `Tempat kegiatan: ${placeName}`,
      course.id,
    );
    void this.notifications.notifyRoles(this.BAAK_ROLES, {
      type: 'FIELD',
      title: `Pendaftaran ${cat.name} baru`,
      body: `${student.user.fullName} (${student.nim}) mendaftar ${cat.name} di ${placeName}.`,
      link: `/admin/kegiatan-lapangan?jenis=${encodeURIComponent(cat.name)}`,
    });
    return { success: true, message: 'Pendaftaran terkirim dan menunggu persetujuan akademik.', data: saved };
  }

  /**
   * Pekerjaan BAAK yang belum diproses per jenis pada tahun akademik aktif (lencana sidebar & tab):
   *  - registrations: pendaftaran mahasiswa yang menunggu persetujuan
   *  - placement: mahasiswa/kelompok yang belum dibentuk kelompoknya atau belum punya pembimbing
   */
  async pendingSummary() {
    const year = await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { id: true } });
    if (!year) return { pending: 0, items: [] };
    const cats = await this.prisma.courseCategory.findMany({
      where: { kind: 'LAPANGAN', isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const items: { categoryId: string; name: string; registrations: number; placement: number; total: number }[] = [];
    for (const cat of cats) {
      const enrolled = await this.prisma.courseEnrollment.findMany({
        where: { academicYearId: year.id, status: { not: 'REJECTED' }, course: { finalProjectLabel: cat.name } },
        select: { studentId: true, courseId: true },
      });
      const registrations = cat.requiresRegistration
        ? await this.prisma.fieldRegistration.count({ where: { categoryId: cat.id, academicYearId: year.id, status: 'PENDING' } })
        : 0;
      const withSupervisor = async (pairs: { studentId: string; courseId: string }[]) => {
        if (!pairs.length) return 0;
        const sup = await this.prisma.thesisSupervision.findMany({
          where: { academicYearId: year.id, supervisor1Id: { not: null }, OR: pairs.map((p) => ({ studentId: p.studentId, courseId: p.courseId })) },
          select: { studentId: true, courseId: true },
        });
        return sup.length;
      };

      // Dengan biaya khusus, hanya yang sudah lunas yang siap ditindaklanjuti BAAK
      const paidPairs = cat.feeAmount > 0
        ? new Set((await this.prisma.fieldCharge.findMany({ where: { categoryId: cat.id, academicYearId: year.id, invoice: { status: 'LUNAS' } }, select: { studentId: true, courseId: true } })).map((c) => `${c.studentId}:${c.courseId}`))
        : null;
      const onlyPaid = <T extends { studentId: string; courseId: string }>(list: T[]) => (paidPairs ? list.filter((p) => paidPairs.has(`${p.studentId}:${p.courseId}`)) : list);

      let placement = 0;
      if (cat.isGroup) {
        const [groups, members, approved] = await Promise.all([
          this.prisma.fieldGroup.findMany({ where: { categoryId: cat.id, academicYearId: year.id }, select: { supervisorId: true } }),
          this.prisma.fieldGroupMember.findMany({ where: { categoryId: cat.id, academicYearId: year.id }, select: { studentId: true } }),
          this.eligibleStudentIds(cat, year.id),
        ]);
        const inGroup = new Set(members.map((m) => m.studentId));
        const candidates = new Set(enrolled.map((e) => e.studentId));
        const pool = approved ? [...candidates].filter((id) => approved.includes(id)) : [...candidates];
        placement = pool.filter((id) => !inGroup.has(id)).length + groups.filter((g) => !g.supervisorId).length;
      } else if (cat.requiresRegistration) {
        const approved = onlyPaid(
          await this.prisma.fieldRegistration.findMany({
            where: { categoryId: cat.id, academicYearId: year.id, status: 'APPROVED' },
            select: { studentId: true, courseId: true },
          }),
        );
        placement = approved.length - (await withSupervisor(approved));
      } else {
        const ready = onlyPaid(enrolled);
        placement = ready.length - (await withSupervisor(ready));
      }
      items.push({ categoryId: cat.id, name: cat.name, registrations, placement, total: registrations + placement });
    }
    return { pending: items.reduce((n, i) => n + i.total, 0), items };
  }

  /** Riwayat satu mahasiswa pada satu mata kuliah (terbaru di atas), untuk detail pendaftaran BAAK. */
  async history(q: { studentId?: string; courseId?: string; academicYearId?: string }) {
    if (!q.studentId || !q.courseId) throw new BadRequestException('studentId dan courseId wajib diisi.');
    const year = await this.resolveYear(q.academicYearId);
    const rows = await this.prisma.fieldEvent.findMany({
      where: { studentId: q.studentId, courseId: q.courseId, academicYearId: year.id },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((e) => ({ id: e.id, type: e.type, title: e.title, detail: e.detail, createdAt: e.createdAt })) };
  }

  // ================================================================ BAAK: BIAYA KHUSUS
  /** Mahasiswa yang wajib ditagih biaya jenis ini: semua yang mengambil mata kuliahnya (KRS), terlepas dari ada/tidaknya pendaftaran. */
  private async chargeTargets(cat: { id: string; name: string }, academicYearId: string) {
    const rows = await this.prisma.courseEnrollment.findMany({
      where: { academicYearId, status: { not: 'REJECTED' }, course: { finalProjectLabel: cat.name } },
      select: { studentId: true, courseId: true },
    });
    return rows;
  }

  async chargeSummary(categoryId?: string, academicYearId?: string) {
    const cat = await this.lapanganCategory(categoryId);
    const year = await this.resolveYear(academicYearId);
    const base = { feeAmount: cat.feeAmount, feeLabel: this.feeLabelOf(cat), academicYearName: year.name };
    if (cat.feeAmount <= 0) return { ...base, notBilled: 0, unpaid: 0, verifying: 0, paid: 0 };
    const [targets, charges] = await Promise.all([
      this.chargeTargets(cat, year.id),
      this.prisma.fieldCharge.findMany({ where: { categoryId: cat.id, academicYearId: year.id }, include: { invoice: { select: { status: true } } } }),
    ]);
    const billed = new Set(charges.map((c) => `${c.studentId}:${c.courseId}`));
    return {
      ...base,
      notBilled: targets.filter((t) => !billed.has(`${t.studentId}:${t.courseId}`)).length,
      unpaid: charges.filter((c) => c.invoice.status === 'TERTUNDA').length,
      verifying: charges.filter((c) => c.invoice.status === 'MENUNGGU_VERIFIKASI').length,
      paid: charges.filter((c) => c.invoice.status === 'LUNAS').length,
    };
  }

  /**
   * Samakan tagihan biaya khusus dengan KRS mahasiswa (dipanggil tiap KRS disimpan): terbitkan untuk mata kuliah berbiaya yang
   * masuk KRS, dan batalkan tagihan yang belum dibayar bila mata kuliahnya dikeluarkan. Tagihan yang sudah dibayar/diverifikasi dibiarkan.
   */
  async syncKrsCharges(studentId: string, academicYearId: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { id: true, name: true } });
    if (!year) return;
    const [enrollments, cats] = await Promise.all([
      this.prisma.courseEnrollment.findMany({
        where: { studentId, academicYearId, status: { not: 'REJECTED' }, course: { finalProjectLabel: { not: null } } },
        select: { courseId: true, course: { select: { finalProjectLabel: true } } },
      }),
      this.prisma.courseCategory.findMany({ where: { kind: 'LAPANGAN', isActive: true, feeAmount: { gt: 0 } } }),
    ]);
    const byName = new Map(cats.map((c) => [c.name, c]));
    const keep = new Set<string>();
    for (const e of enrollments) {
      const cat = byName.get(e.course.finalProjectLabel ?? '');
      if (!cat) continue;
      keep.add(e.courseId);
      await this.issueCharge(studentId, e.courseId, cat, year);
    }
    const charges = await this.prisma.fieldCharge.findMany({
      where: { studentId, academicYearId },
      include: { invoice: { select: { status: true } }, category: true },
    });
    for (const c of charges) {
      if (keep.has(c.courseId) || c.invoice.status !== 'TERTUNDA') continue;
      await this.prisma.paymentInvoice.delete({ where: { id: c.invoiceId } }); // FieldCharge ikut terhapus
      await this.logEvent(studentId, c.category, academicYearId, 'CHARGE_CANCELLED', 'Tagihan biaya dibatalkan', `${c.label}: mata kuliah dikeluarkan dari KRS`, c.courseId);
    }
  }

  /** Terbitkan tagihan untuk semua mahasiswa yang berhak ditagih tetapi belum punya tagihan. */
  async issueCharges(dto: ChargeDto) {
    const cat = await this.lapanganCategory(dto.categoryId);
    if (cat.feeAmount <= 0) throw new BadRequestException(`${cat.name} belum memiliki biaya khusus (lihat Pengaturan).`);
    const year = await this.resolveYear(dto.academicYearId);
    const targets = await this.chargeTargets(cat, year.id);
    let issued = 0;
    for (const t of targets) {
      if (await this.issueCharge(t.studentId, t.courseId, cat, year)) issued++;
    }
    return { success: true, message: issued ? `${issued} tagihan ${this.feeLabelOf(cat)} diterbitkan.` : 'Semua mahasiswa sudah memiliki tagihan.', data: { issued } };
  }

  // ================================================================ BAAK: MITRA
  async listPartners(categoryId?: string) {
    const cat = await this.lapanganCategory(categoryId);
    const rows = await this.prisma.fieldPartner.findMany({
      where: { categoryId: cat.id },
      include: { _count: { select: { registrations: true } } },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return { items: rows.map(({ _count, ...p }) => ({ ...p, registrationCount: _count.registrations })) };
  }

  private async partnerData(dto: PartnerDto, categoryId: string, partnerId?: string) {
    const name = (dto.name ?? '').trim();
    if (name.length < 3) throw new BadRequestException('Nama mitra wajib diisi (minimal 3 karakter).');
    const dup = await this.prisma.fieldPartner.findFirst({
      where: { categoryId, name: { equals: name, mode: 'insensitive' }, ...(partnerId ? { id: { not: partnerId } } : {}) },
    });
    if (dup) throw new BadRequestException(`Mitra "${name}" sudah ada pada jenis ini.`);
    return {
      name,
      address: (dto.address ?? '').trim() || null,
      contactName: (dto.contactName ?? '').trim() || null,
      contactPhone: (dto.contactPhone ?? '').trim() || null,
      notes: (dto.notes ?? '').trim() || null,
      ...(dto.isActive !== undefined ? { isActive: Boolean(dto.isActive) } : {}),
    };
  }

  async createPartner(dto: PartnerDto) {
    const cat = await this.lapanganCategory(dto.categoryId);
    if (!cat.hasPartners) throw new BadRequestException(`${cat.name} belum diatur memiliki mitra (lihat Pengaturan).`);
    const data = await this.partnerData(dto, cat.id);
    const saved = await this.prisma.fieldPartner.create({ data: { categoryId: cat.id, ...data } });
    return { success: true, message: `Mitra ${saved.name} ditambahkan.`, data: saved };
  }

  async updatePartner(id: string, dto: PartnerDto) {
    const cur = await this.prisma.fieldPartner.findUnique({ where: { id } });
    if (!cur) throw new NotFoundException('Mitra tidak ditemukan.');
    const data = await this.partnerData(dto, cur.categoryId, id);
    const saved = await this.prisma.$transaction(async (tx) => {
      const row = await tx.fieldPartner.update({ where: { id }, data });
      // pendaftaran yang memilih mitra ini ikut nama & alamat terbaru
      await tx.fieldRegistration.updateMany({ where: { partnerId: id }, data: { placeName: row.name, placeAddress: row.address } });
      return row;
    });
    return { success: true, message: `Mitra ${saved.name} diperbarui.`, data: saved };
  }

  async deletePartner(id: string) {
    const cur = await this.prisma.fieldPartner.findUnique({ where: { id }, include: { _count: { select: { registrations: true } } } });
    if (!cur) throw new NotFoundException('Mitra tidak ditemukan.');
    if (cur._count.registrations > 0) {
      throw new BadRequestException(`Mitra "${cur.name}" sudah dipilih ${cur._count.registrations} pendaftaran. Nonaktifkan saja agar tidak muncul lagi untuk mahasiswa.`);
    }
    await this.prisma.fieldPartner.delete({ where: { id } });
    return { success: true, message: `Mitra ${cur.name} dihapus.` };
  }

  // ================================================================ BAAK: PERIODE
  async listPeriods(academicYearId?: string) {
    const year = await this.resolveYear(academicYearId);
    const cats = await this.prisma.courseCategory.findMany({
      where: { kind: 'LAPANGAN', isActive: true, requiresRegistration: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const periods = await this.prisma.fieldPeriod.findMany({ where: { academicYearId: year.id } });
    const byCat = new Map(periods.map((p) => [p.categoryId, p]));
    return {
      academicYearId: year.id,
      academicYearName: year.name,
      items: cats.map((c) => {
        const p = byCat.get(c.id) ?? null;
        return { categoryId: c.id, categoryName: c.name, period: p ? { ...p, state: this.periodState(p) } : null };
      }),
    };
  }

  async savePeriod(dto: PeriodDto) {
    const cat = await this.lapanganCategory(dto.categoryId);
    if (!cat.requiresRegistration) throw new BadRequestException(`${cat.name} tidak memakai periode pendaftaran.`);
    const year = await this.resolveYear(dto.academicYearId);
    const openAt = this.parseDate(dto.openAt, false);
    const closeAt = this.parseDate(dto.closeAt, true);
    if (closeAt <= openAt) throw new BadRequestException('Tanggal tutup harus setelah tanggal buka.');
    const data = { openAt, closeAt, notes: (dto.notes ?? '').trim() || null };
    const saved = await this.prisma.fieldPeriod.upsert({
      where: { categoryId_academicYearId: { categoryId: cat.id, academicYearId: year.id } },
      create: { categoryId: cat.id, academicYearId: year.id, ...data },
      update: data,
    });
    return { success: true, message: `Periode pendaftaran ${cat.name} tersimpan.`, data: saved };
  }

  async deletePeriod(id: string) {
    const p = await this.prisma.fieldPeriod.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Periode tidak ditemukan.');
    await this.prisma.fieldPeriod.delete({ where: { id } });
    return { success: true, message: 'Periode pendaftaran dihapus.' };
  }

  // ================================================================ BAAK: PENDAFTARAN
  /**
   * Daftar mahasiswa satu jenis: semua yang mengambil mata kuliahnya pada tahun akademik, lengkap dengan status
   * mendaftar (NONE = belum mendaftar, PENDING, APPROVED, REJECTED). Pendaftaran tanpa KRS (MK dilepas) tetap tampil.
   */
  async listRegistrations(q: { categoryId?: string; academicYearId?: string; status?: string; search?: string }) {
    const year = await this.resolveYear(q.academicYearId);
    const cat = q.categoryId ? await this.prisma.courseCategory.findUnique({ where: { id: q.categoryId } }) : null;
    const studentInclude = { include: { user: true, studyProgram: true } };
    const [regs, enrollments] = await Promise.all([
      this.prisma.fieldRegistration.findMany({
        where: { academicYearId: year.id, categoryId: q.categoryId || undefined },
        include: { student: studentInclude, course: true },
        orderBy: { submittedAt: 'desc' },
      }),
      cat
        ? this.prisma.courseEnrollment.findMany({
            where: { academicYearId: year.id, status: { not: 'REJECTED' }, course: { finalProjectLabel: cat.name } },
            include: { student: studentInclude, course: true },
            orderBy: { createdAt: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    const regKeys = new Set(regs.map((r) => `${r.studentId}:${r.courseId}`));
    const rows = [
      ...regs.map((r) => ({ id: r.id as string | null, status: r.status as string, student: r.student, course: r.course, reg: r })),
      ...enrollments
        .filter((e) => !regKeys.has(`${e.studentId}:${e.courseId}`))
        .map((e) => ({ id: null as string | null, status: 'NONE', student: e.student, course: e.course, reg: null as (typeof regs)[number] | null })),
    ];

    const counts = { NONE: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;

    const supervisions = rows.length
      ? await this.prisma.thesisSupervision.findMany({
          where: { academicYearId: year.id, OR: rows.map((r) => ({ studentId: r.student.id, courseId: r.course.id })) },
          include: { supervisor1: { include: { user: true } }, supervisor2: { include: { user: true } } },
        })
      : [];
    const supMap = new Map(supervisions.map((s) => [`${s.studentId}:${s.courseId}`, s]));

    const chargeRows = cat && cat.feeAmount > 0
      ? await this.prisma.fieldCharge.findMany({ where: { categoryId: cat.id, academicYearId: year.id }, include: { invoice: { select: { status: true } } } })
      : [];
    const chargeMap = new Map(chargeRows.map((c) => [`${c.studentId}:${c.courseId}`, c.invoice.status === 'LUNAS' ? 'PAID' : c.invoice.status === 'MENUNGGU_VERIFIKASI' ? 'VERIFYING' : 'UNPAID']));

    const needle = q.search?.trim().toLowerCase();
    const items = rows
      .filter((r) => !q.status || r.status === q.status)
      .filter((r) => !needle || r.student.user.fullName.toLowerCase().includes(needle) || r.student.nim.includes(needle) || (r.reg?.placeName ?? '').toLowerCase().includes(needle))
      .map((r) => {
        const sup = supMap.get(`${r.student.id}:${r.course.id}`);
        return {
          id: r.id,
          status: r.status,
          studentId: r.student.id,
          courseId: r.course.id,
          academicYearId: year.id,
          nim: r.student.nim,
          studentName: r.student.user.fullName,
          studyProgram: r.student.studyProgram?.name || '-',
          courseCode: r.course.code,
          courseName: r.course.name,
          chargeStatus: chargeMap.get(`${r.student.id}:${r.course.id}`) ?? 'NONE',
          partnerId: r.reg?.partnerId ?? null,
          placeName: r.reg?.placeName ?? null,
          placeAddress: r.reg?.placeAddress ?? null,
          fieldSupervisorName: r.reg?.fieldSupervisorName ?? null,
          plan: r.reg?.plan ?? null,
          adminNote: r.reg?.adminNote ?? null,
          submittedAt: r.reg?.submittedAt ?? null,
          supervisor1Id: sup?.supervisor1Id ?? null,
          supervisor1Name: sup?.supervisor1?.user?.fullName ?? null,
          supervisor2Id: sup?.supervisor2Id ?? null,
          supervisor2Name: sup?.supervisor2?.user?.fullName ?? null,
        };
      })
      .sort((x, y) => x.nim.localeCompare(y.nim));
    return { academicYearId: year.id, academicYearName: year.name, counts, items };
  }

  async reviewRegistration(id: string, dto: ReviewDto) {
    const reg = await this.prisma.fieldRegistration.findUnique({ where: { id }, include: { category: true } });
    if (!reg) throw new NotFoundException('Pendaftaran tidak ditemukan.');
    const status = dto.status;
    if (status !== 'APPROVED' && status !== 'REJECTED') throw new BadRequestException('Status harus APPROVED atau REJECTED.');
    const note = (dto.adminNote ?? '').trim();
    if (status === 'REJECTED' && note.length < 3) throw new BadRequestException('Alasan penolakan wajib diisi.');

    await this.prisma.fieldRegistration.update({ where: { id }, data: { status, adminNote: note || null, reviewedAt: new Date() } });

    let supervisorIds: string[] = [];
    let feeSettled = true; // true bila tanpa biaya atau biaya sudah lunas
    await this.logEvent(
      reg.studentId,
      reg.category,
      reg.academicYearId,
      status === 'APPROVED' ? 'REGISTRATION_APPROVED' : 'REGISTRATION_REJECTED',
      status === 'APPROVED' ? 'Pendaftaran disetujui' : 'Pendaftaran ditolak',
      note ? (status === 'APPROVED' ? note : `Alasan: ${note}`) : null,
      reg.courseId,
    );
    if (status === 'APPROVED') {
      if (reg.category.feeAmount > 0) {
        // Tagihan biasanya sudah terbit saat KRS; di sini hanya memastikan (mis. KRS dibuat sebelum biaya dipasang)
        const year = await this.prisma.academicYear.findUniqueOrThrow({ where: { id: reg.academicYearId }, select: { id: true, name: true } });
        await this.issueCharge(reg.studentId, reg.courseId, reg.category, year);
        feeSettled = Boolean(
          await this.prisma.fieldCharge.findFirst({
            where: { studentId: reg.studentId, courseId: reg.courseId, academicYearId: reg.academicYearId, invoice: { status: 'LUNAS' } },
          }),
        );
      }
      if (feeSettled && dto.supervisor1Id && !reg.category.isGroup) {
        const s1 = dto.supervisor1Id;
        const s2 = dto.supervisor2Id && dto.supervisor2Id !== s1 ? dto.supervisor2Id : null;
        await this.upsertSupervision(reg.studentId, reg.courseId, reg.academicYearId, { supervisor1Id: s1, supervisor2Id: s2 });
        supervisorIds = [s1, ...(s2 ? [s2] : [])];
        await this.logEvent(reg.studentId, reg.category, reg.academicYearId, 'SUPERVISOR_ASSIGNED', 'Dosen pembimbing ditetapkan', await this.lecturerNames(supervisorIds), reg.courseId);
      }
    } else {
      // pendaftaran ditolak: pembimbing yang sempat ditetapkan dilepas
      const had = await this.prisma.thesisSupervision.findFirst({
        where: { studentId: reg.studentId, courseId: reg.courseId, academicYearId: reg.academicYearId, supervisor1Id: { not: null } },
      });
      if (had) await this.logEvent(reg.studentId, reg.category, reg.academicYearId, 'SUPERVISOR_RELEASED', 'Dosen pembimbing dilepas', 'Pendaftaran ditolak', reg.courseId);
      await this.prisma.thesisSupervision.updateMany({
        where: { studentId: reg.studentId, courseId: reg.courseId, academicYearId: reg.academicYearId },
        data: { supervisor1Id: null, supervisor2Id: null, assignedAt: null },
      });
    }

    await this.notifications.notifyStudent(reg.studentId, {
      type: 'FIELD',
      title: status === 'APPROVED' ? `Pendaftaran ${reg.category.name} disetujui` : `Pendaftaran ${reg.category.name} ditolak`,
      body:
        status === 'APPROVED'
          ? `${note || 'Pendaftaran Anda disetujui akademik.'}${!feeSettled ? ` Selesaikan pembayaran ${this.feeLabelOf(reg.category)} (${this.rupiah(reg.category.feeAmount)}) untuk lanjut ke tahap berikutnya.` : ''}`
          : `Alasan: ${note}`,
      link: '/student/kegiatan-lapangan',
    });
    if (supervisorIds.length) {
      void this.notifications.notifyLecturers(supervisorIds, {
        type: 'FIELD',
        title: `Bimbingan ${reg.category.name} baru`,
        body: `Anda ditetapkan sebagai pembimbing ${reg.category.name}.`,
        link: '/lecturer',
      });
    }
    return {
      success: true,
      message:
        status === 'APPROVED'
          ? !feeSettled
            ? 'Pendaftaran disetujui. Pembimbing dapat ditetapkan setelah mahasiswa melunasi biaya kegiatan.'
            : 'Pendaftaran disetujui.'
          : 'Pendaftaran ditolak.',
    };
  }

  // ================================================================ BAAK: KELOMPOK
  async listGroups(q: { categoryId?: string; academicYearId?: string }) {
    const cat = await this.lapanganCategory(q.categoryId);
    const year = await this.resolveYear(q.academicYearId);
    const groups = await this.prisma.fieldGroup.findMany({
      where: { categoryId: cat.id, academicYearId: year.id },
      include: {
        supervisor: { include: { user: true } },
        members: { include: { student: { include: { user: true, studyProgram: true } } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    const courses = await this.prisma.courseEnrollment.findMany({
      where: { academicYearId: year.id, status: { not: 'REJECTED' }, course: { finalProjectLabel: cat.name } },
      select: { studentId: true },
    });
    const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)));
    let enrolledIds = new Set(courses.map((c) => c.studentId));
    const eligible = await this.eligibleStudentIds(cat, year.id);
    if (eligible) {
      const ok = new Set(eligible);
      enrolledIds = new Set([...enrolledIds].filter((id) => ok.has(id)));
    }
    return {
      academicYearId: year.id,
      academicYearName: year.name,
      category: { id: cat.id, name: cat.name, minMembers: cat.minMembers, maxMembers: cat.maxMembers },
      totalStudents: enrolledIds.size,
      ungrouped: [...enrolledIds].filter((id) => !grouped.has(id)).length,
      items: groups.map((g) => ({
        id: g.id,
        name: g.name,
        notes: g.notes,
        supervisorId: g.supervisorId,
        supervisorName: g.supervisor?.user?.fullName ?? null,
        members: g.members.map((m) => ({ studentId: m.studentId, nim: m.student.nim, name: m.student.user.fullName, studyProgram: m.student.studyProgram?.name || '-' })),
      })),
    };
  }

  /** Mahasiswa yang mengambil mata kuliah jenis ini dan belum masuk kelompok mana pun (plus anggota kelompok `groupId`). */
  async availableStudents(q: { categoryId?: string; academicYearId?: string; groupId?: string; search?: string; studyProgramId?: string }) {
    const cat = await this.lapanganCategory(q.categoryId);
    const year = await this.resolveYear(q.academicYearId);
    const taken = await this.prisma.fieldGroupMember.findMany({
      where: { categoryId: cat.id, academicYearId: year.id, ...(q.groupId ? { groupId: { not: q.groupId } } : {}) },
      select: { studentId: true },
    });
    const approvedOnly = await this.eligibleStudentIds(cat, year.id);
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        academicYearId: year.id,
        status: { not: 'REJECTED' },
        course: { finalProjectLabel: cat.name },
        studentId: { notIn: taken.map((t) => t.studentId), ...(approvedOnly ? { in: approvedOnly } : {}) },
        student: q.studyProgramId ? { studyProgramId: q.studyProgramId } : undefined,
      },
      include: { student: { include: { user: true, studyProgram: true } } },
    });
    const needle = q.search?.trim().toLowerCase();
    const seen = new Set<string>();
    const items = enrollments
      .filter((e) => (seen.has(e.studentId) ? false : (seen.add(e.studentId), true)))
      .filter((e) => !needle || e.student.user.fullName.toLowerCase().includes(needle) || e.student.nim.includes(needle))
      .map((e) => ({ studentId: e.studentId, nim: e.student.nim, name: e.student.user.fullName, studyProgram: e.student.studyProgram?.name || '-', entryYear: e.student.entryYear }))
      .sort((a, b) => a.nim.localeCompare(b.nim));
    return { items };
  }

  private async validateGroup(dto: GroupDto, groupId?: string) {
    const cat = await this.lapanganCategory(dto.categoryId);
    if (!cat.isGroup) throw new BadRequestException(`${cat.name} bukan kegiatan berkelompok.`);
    const year = await this.resolveYear(dto.academicYearId);
    const name = (dto.name ?? '').trim();
    if (!name) throw new BadRequestException('Nama kelompok wajib diisi.');
    const memberIds = [...new Set(dto.memberIds ?? [])];
    if (memberIds.length < cat.minMembers || memberIds.length > cat.maxMembers) {
      throw new BadRequestException(`Jumlah anggota ${cat.name} harus ${cat.minMembers}-${cat.maxMembers} orang (sekarang ${memberIds.length}).`);
    }
    const dup = await this.prisma.fieldGroup.findFirst({
      where: { categoryId: cat.id, academicYearId: year.id, name: { equals: name, mode: 'insensitive' }, ...(groupId ? { id: { not: groupId } } : {}) },
    });
    if (dup) throw new BadRequestException(`Nama kelompok "${name}" sudah dipakai.`);

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { academicYearId: year.id, status: { not: 'REJECTED' }, course: { finalProjectLabel: cat.name }, studentId: { in: memberIds } },
      select: { studentId: true },
    });
    const ok = new Set(enrollments.map((e) => e.studentId));
    const missing = memberIds.filter((id) => !ok.has(id));
    if (cat.requiresRegistration) {
      const approved = new Set(await this.approvedStudentIds(cat.id, year.id));
      const notApproved = memberIds.filter((id) => ok.has(id) && !approved.has(id));
      if (notApproved.length) {
        const names = await this.prisma.student.findMany({ where: { id: { in: notApproved } }, select: { nim: true } });
        throw new BadRequestException(`${cat.name} wajib mendaftar; pendaftaran belum disetujui untuk: ${names.map((n) => n.nim).join(', ')}.`);
      }
    }
    if (cat.feeAmount > 0) {
      const paid = new Set(await this.paidStudentIds(cat.id, year.id));
      const notPaid = memberIds.filter((id) => ok.has(id) && !paid.has(id));
      if (notPaid.length) {
        const names = await this.prisma.student.findMany({ where: { id: { in: notPaid } }, select: { nim: true } });
        throw new BadRequestException(`${this.feeLabelOf(cat)} belum lunas untuk: ${names.map((n) => n.nim).join(', ')}.`);
      }
    }
    if (missing.length) {
      const names = await this.prisma.student.findMany({ where: { id: { in: missing } }, select: { nim: true } });
      throw new BadRequestException(`Belum mengambil mata kuliah ${cat.name} pada tahun akademik ini: ${names.map((n) => n.nim).join(', ')}.`);
    }
    const taken = await this.prisma.fieldGroupMember.findMany({
      where: { categoryId: cat.id, academicYearId: year.id, studentId: { in: memberIds }, ...(groupId ? { groupId: { not: groupId } } : {}) },
      include: { student: { select: { nim: true } }, group: { select: { name: true } } },
    });
    if (taken.length) {
      throw new BadRequestException(`Sudah tergabung di kelompok lain: ${taken.map((t) => `${t.student.nim} (${t.group.name})`).join(', ')}.`);
    }
    return { cat, year, name, memberIds, supervisorId: dto.supervisorId || null, notes: (dto.notes ?? '').trim() || null };
  }

  /** Samakan ThesisSupervision anggota dengan pembimbing kelompok (satu pembimbing per kelompok). */
  private async syncGroupSupervision(categoryName: string, academicYearId: string, studentIds: string[], supervisorId: string | null) {
    for (const studentId of studentIds) {
      const courses = await this.enrolledCourses(studentId, academicYearId, categoryName);
      for (const c of courses) {
        await this.upsertSupervision(studentId, c.courseId, academicYearId, { supervisor1Id: supervisorId, supervisor2Id: null });
      }
    }
  }

  async createGroup(dto: GroupDto) {
    const v = await this.validateGroup(dto);
    const group = await this.prisma.fieldGroup.create({
      data: {
        categoryId: v.cat.id,
        academicYearId: v.year.id,
        name: v.name,
        supervisorId: v.supervisorId,
        notes: v.notes,
        members: { create: v.memberIds.map((studentId) => ({ studentId, categoryId: v.cat.id, academicYearId: v.year.id })) },
      },
    });
    await this.syncGroupSupervision(v.cat.name, v.year.id, v.memberIds, v.supervisorId);
    const supName = await this.lecturerNames([v.supervisorId]);
    for (const sid of v.memberIds) {
      await this.logEvent(sid, v.cat, v.year.id, 'GROUP_JOINED', `Masuk ${v.name}`, `Anggota: ${v.memberIds.length} orang`);
      if (supName) await this.logEvent(sid, v.cat, v.year.id, 'SUPERVISOR_ASSIGNED', 'Dosen pembimbing kelompok ditetapkan', supName);
    }
    await this.notifyGroup(group.id, v.cat.name, v.name, v.memberIds, v.supervisorId, true);
    return { success: true, message: `Kelompok ${v.name} dibuat.`, data: { id: group.id } };
  }

  async updateGroup(id: string, dto: GroupDto) {
    const existing = await this.prisma.fieldGroup.findUnique({ where: { id }, include: { members: true } });
    if (!existing) throw new NotFoundException('Kelompok tidak ditemukan.');
    const v = await this.validateGroup({ ...dto, categoryId: existing.categoryId, academicYearId: existing.academicYearId }, id);
    const before = existing.members.map((m) => m.studentId);
    const removed = before.filter((sid) => !v.memberIds.includes(sid));
    const added = v.memberIds.filter((sid) => !before.includes(sid));

    await this.prisma.$transaction([
      this.prisma.fieldGroupMember.deleteMany({ where: { groupId: id, studentId: { in: removed } } }),
      this.prisma.fieldGroup.update({ where: { id }, data: { name: v.name, supervisorId: v.supervisorId, notes: v.notes } }),
      this.prisma.fieldGroupMember.createMany({ data: added.map((studentId) => ({ groupId: id, studentId, categoryId: v.cat.id, academicYearId: v.year.id })) }),
    ]);
    // anggota yang keluar kehilangan pembimbing kelompok; anggota lain mengikuti pembimbing terbaru
    await this.syncGroupSupervision(v.cat.name, v.year.id, removed, null);
    await this.syncGroupSupervision(v.cat.name, v.year.id, v.memberIds, v.supervisorId);
    const supervisorChanged = existing.supervisorId !== v.supervisorId;
    const supName = await this.lecturerNames([v.supervisorId]);
    for (const sid of removed) await this.logEvent(sid, v.cat, v.year.id, 'GROUP_LEFT', `Keluar dari ${v.name}`);
    for (const sid of added) await this.logEvent(sid, v.cat, v.year.id, 'GROUP_JOINED', `Masuk ${v.name}`);
    if (supervisorChanged) {
      for (const sid of v.memberIds) {
        await this.logEvent(
          sid,
          v.cat,
          v.year.id,
          supName ? 'SUPERVISOR_ASSIGNED' : 'SUPERVISOR_RELEASED',
          supName ? 'Dosen pembimbing kelompok diganti' : 'Dosen pembimbing kelompok dilepas',
          supName || null,
        );
      }
    } else if (supName) {
      for (const sid of added) await this.logEvent(sid, v.cat, v.year.id, 'SUPERVISOR_ASSIGNED', 'Dosen pembimbing kelompok ditetapkan', supName);
    }
    await this.notifyGroup(id, v.cat.name, v.name, added, supervisorChanged ? v.supervisorId : null, false);
    return { success: true, message: `Kelompok ${v.name} diperbarui.` };
  }

  async deleteGroup(id: string) {
    const g = await this.prisma.fieldGroup.findUnique({ where: { id }, include: { members: true, category: true } });
    if (!g) throw new NotFoundException('Kelompok tidak ditemukan.');
    const ids = g.members.map((m) => m.studentId);
    await this.prisma.fieldGroup.delete({ where: { id } });
    await this.syncGroupSupervision(g.category.name, g.academicYearId, ids, null);
    for (const sid of ids) await this.logEvent(sid, g.category, g.academicYearId, 'GROUP_LEFT', `Kelompok ${g.name} dihapus`, g.supervisorId ? 'Dosen pembimbing kelompok dilepas' : null);
    return { success: true, message: `Kelompok ${g.name} dihapus.` };
  }

  private async notifyGroup(groupId: string, categoryName: string, groupName: string, newStudentIds: string[], supervisorId: string | null, created: boolean) {
    for (const sid of newStudentIds) {
      void this.notifications.notifyStudent(sid, {
        type: 'FIELD',
        title: `Anda masuk kelompok ${categoryName}`,
        body: `Anda ditempatkan di kelompok "${groupName}"${created ? '' : ' (diperbarui)'}.`,
        link: '/student/kegiatan-lapangan',
      });
    }
    if (supervisorId) {
      void this.notifications.notifyLecturers([supervisorId], {
        type: 'FIELD',
        title: `Kelompok ${categoryName} baru`,
        body: `Anda ditetapkan sebagai pembimbing kelompok "${groupName}".`,
        link: '/lecturer',
      });
    }
  }
}
