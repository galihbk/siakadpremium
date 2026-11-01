import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class P2mService {
  constructor(private prisma: PrismaService) {}

  // ================= OVERVIEW =================
  async getOverview() {
    const [totalStandards, activeStandards, totalAudits, auditsByResult, openFollowUps, recentAudits] = await Promise.all([
      this.prisma.qualityStandard.count(),
      this.prisma.qualityStandard.count({ where: { status: 'Aktif' } }),
      this.prisma.qualityAudit.count(),
      this.prisma.qualityAudit.groupBy({ by: ['result'], _count: { _all: true } }),
      this.prisma.qualityAudit.count({ where: { followUpStatus: { not: 'Selesai' } } }),
      this.prisma.qualityAudit.findMany({ orderBy: { auditDate: 'desc' }, take: 5 }),
    ]);

    return {
      totalStandards,
      activeStandards,
      totalAudits,
      completedAudits: await this.prisma.qualityAudit.count({ where: { status: 'Selesai' } }),
      openFollowUps,
      auditsByResult: auditsByResult.map((g) => ({ result: g.result, count: g._count._all })),
      recentAudits,
    };
  }

  // ================= LANDING PAGE PUBLIK =================
  /**
   * Data untuk situs publik P2M (subdomain p2m.). Hanya memuat yang aman dipublikasikan:
   * standar mutu berstatus Aktif, dokumen berakses "Publik", jadwal & ringkasan hasil audit
   * secara agregat -- temuan per program studi sengaja TIDAK ditampilkan.
   */
  async getPublicLanding() {
    const [standards, documents, totalAudits, completedAudits, auditsByResult, followUpDone, upcoming, downloads] =
      await Promise.all([
        this.prisma.qualityStandard.findMany({
          where: { status: 'Aktif' },
          orderBy: [{ category: 'asc' }, { code: 'asc' }],
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            description: true,
            indicator: true,
            targetValue: true,
            academicYear: true,
          },
        }),
        this.prisma.qualityDocument.findMany({
          where: { accessLevel: 'Publik' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            code: true,
            title: true,
            category: true,
            fileType: true,
            fileSize: true,
            version: true,
            academicYear: true,
            description: true,
            fileUrl: true,
            downloadsCount: true,
            updatedAt: true,
          },
        }),
        this.prisma.qualityAudit.count(),
        this.prisma.qualityAudit.count({ where: { status: 'Selesai' } }),
        this.prisma.qualityAudit.groupBy({
          by: ['result'],
          where: { status: 'Selesai' },
          _count: { _all: true },
        }),
        this.prisma.qualityAudit.count({ where: { status: 'Selesai', followUpStatus: 'Selesai' } }),
        this.prisma.qualityAudit.findMany({
          where: { status: { in: ['Terjadwal', 'Berlangsung'] }, auditDate: { gte: new Date(Date.now() - 86400000) } },
          orderBy: { auditDate: 'asc' },
          take: 6,
          select: { id: true, studyProgram: true, faculty: true, auditDate: true, status: true },
        }),
        this.prisma.qualityDocument.aggregate({ where: { accessLevel: 'Publik' }, _sum: { downloadsCount: true } }),
      ]);

    const categories = Array.from(new Set(standards.map((s) => s.category)));
    return {
      stats: {
        activeStandards: standards.length,
        totalAudits,
        completedAudits,
        followUpDone,
        publicDocuments: documents.length,
        totalDownloads: downloads._sum.downloadsCount ?? 0,
      },
      categories,
      standards,
      documents,
      auditSummary: auditsByResult.map((g) => ({ result: g.result, count: g._count._all })),
      upcomingAudits: upcoming,
    };
  }

  // ================= STANDAR MUTU =================
  async getStandards(filters?: { category?: string; status?: string; search?: string }) {
    const where: any = {};
    if (filters?.category && filters.category !== 'Semua') where.category = filters.category;
    if (filters?.status && filters.status !== 'Semua') where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.qualityStandard.findMany({ where, orderBy: { code: 'asc' } });
  }

  async createStandard(data: any) {
    return this.prisma.qualityStandard.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        category: data.category || 'Akademik',
        description: data.description?.trim() || null,
        indicator: data.indicator?.trim() || null,
        targetValue: data.targetValue?.trim() || null,
        status: data.status || 'Aktif',
        academicYear: data.academicYear || '2026/2027',
      },
    });
  }

  async updateStandard(id: string, data: any) {
    const existing = await this.prisma.qualityStandard.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Standar mutu tidak ditemukan.');
    return this.prisma.qualityStandard.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim().toUpperCase() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        category: data.category !== undefined ? data.category : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        indicator: data.indicator !== undefined ? data.indicator.trim() : undefined,
        targetValue: data.targetValue !== undefined ? data.targetValue.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        academicYear: data.academicYear !== undefined ? data.academicYear : undefined,
      },
    });
  }

  async deleteStandard(id: string) {
    const existing = await this.prisma.qualityStandard.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Standar mutu tidak ditemukan.');
    await this.prisma.qualityStandard.delete({ where: { id } });
    return { success: true };
  }

  // ================= AUDIT MUTU INTERNAL (AMI) =================
  async getAudits(filters?: {
    studyProgram?: string;
    status?: string;
    result?: string;
    followUpStatus?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filters?.studyProgram && filters.studyProgram !== 'Semua') where.studyProgram = filters.studyProgram;
    if (filters?.status && filters.status !== 'Semua') where.status = filters.status;
    if (filters?.result && filters.result !== 'Semua') where.result = filters.result;
    if (filters?.followUpStatus && filters.followUpStatus !== 'Semua') where.followUpStatus = filters.followUpStatus;
    if (filters?.search) {
      where.OR = [
        { studyProgram: { contains: filters.search, mode: 'insensitive' } },
        { auditorName: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.qualityAudit.findMany({ where, orderBy: { auditDate: 'desc' } });
  }

  async createAudit(data: any) {
    return this.prisma.qualityAudit.create({
      data: {
        code: data.code?.trim() || null,
        studyProgram: data.studyProgram.trim(),
        faculty: data.faculty?.trim() || null,
        auditDate: new Date(data.auditDate),
        auditorName: data.auditorName.trim(),
        scope: data.scope?.trim() || null,
        findingsSummary: data.findingsSummary?.trim() || null,
        result: data.result || 'Sesuai',
        status: data.status || 'Terjadwal',
        followUpDeadline: data.followUpDeadline ? new Date(data.followUpDeadline) : null,
        followUpStatus: data.followUpStatus || 'Belum Ditindaklanjuti',
        notes: data.notes?.trim() || null,
      },
    });
  }

  async updateAudit(id: string, data: any) {
    const existing = await this.prisma.qualityAudit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Data audit mutu tidak ditemukan.');
    return this.prisma.qualityAudit.update({
      where: { id },
      data: {
        code: data.code !== undefined ? (data.code?.trim() || null) : undefined,
        studyProgram: data.studyProgram !== undefined ? data.studyProgram.trim() : undefined,
        faculty: data.faculty !== undefined ? data.faculty.trim() : undefined,
        auditDate: data.auditDate !== undefined ? new Date(data.auditDate) : undefined,
        auditorName: data.auditorName !== undefined ? data.auditorName.trim() : undefined,
        scope: data.scope !== undefined ? data.scope.trim() : undefined,
        findingsSummary: data.findingsSummary !== undefined ? data.findingsSummary.trim() : undefined,
        result: data.result !== undefined ? data.result : undefined,
        status: data.status !== undefined ? data.status : undefined,
        followUpDeadline:
          data.followUpDeadline !== undefined ? (data.followUpDeadline ? new Date(data.followUpDeadline) : null) : undefined,
        followUpStatus: data.followUpStatus !== undefined ? data.followUpStatus : undefined,
        notes: data.notes !== undefined ? data.notes.trim() : undefined,
      },
    });
  }

  async deleteAudit(id: string) {
    const existing = await this.prisma.qualityAudit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Data audit mutu tidak ditemukan.');
    await this.prisma.qualityAudit.delete({ where: { id } });
    return { success: true };
  }

  // ================= PEMANTAUAN PENGUMPULAN RPS =================
  // Hanya-baca: P2M melihat dosen/kelas mana yang sudah mengumpulkan RPS pada satu tahun akademik.
  // Pengesahan RPS dilakukan Program Studi, bukan P2M. Kelas tanpa dosen dan kelas berjadwal fleksibel
  // (skripsi, kegiatan lapangan, dst.) tidak diwajibkan punya RPS sehingga tidak dihitung.
  async getRpsSubmissions(filters?: { academicYearId?: string; status?: string; studyProgram?: string; search?: string }) {
    const years = await this.prisma.academicYear.findMany({
      orderBy: [{ startDate: 'desc' }],
      select: { id: true, name: true, isActive: true },
    });
    const year = filters?.academicYearId
      ? years.find((y) => y.id === filters.academicYearId)
      : years.find((y) => y.isActive) ?? years[0];
    if (!year) return { year: null, years, studyPrograms: [] as string[], summary: this.emptyRpsSummary(), items: [] as any[] };

    const classes = await this.prisma.courseClass.findMany({
      where: { academicYearId: year.id, lecturerId: { not: null }, isFlexibleSchedule: false },
      include: { course: true, lecturer: { include: { user: true } }, contract: true },
      orderBy: [{ course: { code: 'asc' } }, { className: 'asc' }],
    });

    const all = classes.map((c) => ({
      classId: c.id,
      courseCode: c.course.code,
      courseName: c.course.name,
      studyProgram: c.course.studyProgramName || 'Seluruh Program Studi',
      className: c.className,
      lecturerName: c.lecturer?.user?.fullName || '-',
      status: c.contract?.p2mStatus || 'BELUM_DIAJUKAN',
      submittedAt: c.contract && (c.contract.p2mStatus || 'BELUM_DIAJUKAN') !== 'BELUM_DIAJUKAN' ? c.contract.updatedAt : null,
      validatedBy: c.contract?.p2mValidatedBy ?? null,
    }));

    const summary = this.emptyRpsSummary();
    summary.total = all.length;
    for (const r of all) {
      if (r.status === 'BELUM_DIAJUKAN') summary.belum++;
      else {
        summary.sudah++;
        if (r.status === 'DIAJUKAN') summary.menunggu++;
        else if (r.status === 'DISAHKAN') summary.disahkan++;
        else if (r.status === 'PERLU_REVISI') summary.revisi++;
      }
    }
    const studyPrograms = Array.from(new Set(all.map((r) => r.studyProgram))).sort();

    const q = (filters?.search ?? '').trim().toLowerCase();
    const items = all.filter((r) => {
      if (filters?.studyProgram && filters.studyProgram !== 'Semua' && r.studyProgram !== filters.studyProgram) return false;
      const st = filters?.status;
      if (st === 'SUDAH' && r.status === 'BELUM_DIAJUKAN') return false;
      if (st && st !== 'Semua' && st !== 'SUDAH' && r.status !== st) return false;
      if (q && !(r.courseName.toLowerCase().includes(q) || r.courseCode.toLowerCase().includes(q) || r.lecturerName.toLowerCase().includes(q))) return false;
      return true;
    });
    return { year, years, studyPrograms, summary, items };
  }

  private emptyRpsSummary() {
    return { total: 0, sudah: 0, belum: 0, menunggu: 0, disahkan: 0, revisi: 0 };
  }

  // ================= DOKUMEN MUTU =================
  async getDocuments(query?: { category?: string; search?: string }) {
    const where: any = {};
    if (query?.category && query.category !== 'Semua') where.category = query.category;
    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.qualityDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createDocument(dto: any) {
    return this.prisma.qualityDocument.create({
      data: {
        code: dto.code?.trim() || `DOC-P2M-${Date.now().toString().slice(-4)}`,
        title: dto.title,
        category: dto.category || 'Panduan & Renstra',
        fileType: dto.fileType || 'PDF',
        fileSize: dto.fileSize || '1.0 MB',
        version: dto.version || 'v2026.1',
        academicYear: dto.academicYear || '2026/2027',
        accessLevel: dto.accessLevel || 'Publik',
        description: dto.description || null,
        author: dto.author || 'P2M',
        fileUrl: dto.fileUrl || null,
      },
    });
  }

  async incrementDocumentDownload(id: string) {
    const exists = await this.prisma.qualityDocument.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');
    const updated = await this.prisma.qualityDocument.update({
      where: { id: exists.id },
      data: { downloadsCount: { increment: 1 } },
    });
    return { success: true, downloadsCount: updated.downloadsCount };
  }

  async deleteDocument(id: string) {
    const exists = await this.prisma.qualityDocument.findFirst({ where: { OR: [{ id }, { code: id }] } });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');
    await this.prisma.qualityDocument.delete({ where: { id: exists.id } });
    return { success: true };
  }
}
