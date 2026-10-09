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

  // ================= VALIDASI RPS =================
  private mapRpsRow(c: any) {
    return {
      id: c.id,
      courseClassId: c.courseClassId,
      courseCode: c.courseClass.course.code,
      courseName: c.courseClass.course.name,
      studyProgram: c.courseClass.course.studyProgramName || 'Seluruh Program Studi',
      className: c.courseClass.className,
      lecturerName: c.courseClass.lecturer?.user?.fullName || '-',
      rpsCode: c.rpsCode,
      p2mStatus: c.p2mStatus || 'BELUM_DIAJUKAN',
      p2mNote: c.p2mNote,
      p2mValidatedAt: c.p2mValidatedAt,
      p2mValidatedBy: c.p2mValidatedBy,
      updatedAt: c.updatedAt,
    };
  }

  async getRpsForValidation(filters?: { status?: string; studyProgram?: string; search?: string }) {
    const where: any = {};
    if (filters?.status && filters.status !== 'Semua') {
      where.p2mStatus = filters.status;
    } else {
      // Default: hanya RPS yang pernah diajukan (bukan yang masih draf dosen belum pernah submit)
      where.p2mStatus = { not: 'BELUM_DIAJUKAN' };
    }
    if (filters?.studyProgram && filters.studyProgram !== 'Semua') {
      where.courseClass = { course: { studyProgramName: filters.studyProgram } };
    }
    if (filters?.search) {
      const q = filters.search;
      where.OR = [
        { courseClass: { course: { name: { contains: q, mode: 'insensitive' } } } },
        { courseClass: { course: { code: { contains: q, mode: 'insensitive' } } } },
        { courseClass: { lecturer: { user: { fullName: { contains: q, mode: 'insensitive' } } } } },
      ];
    }

    const list = await this.prisma.courseContract.findMany({
      where,
      include: {
        courseClass: { include: { course: true, lecturer: { include: { user: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return list.map((c) => this.mapRpsRow(c));
  }

  async getRpsDetail(contractId: string) {
    const contract = await this.prisma.courseContract.findUnique({
      where: { id: contractId },
      include: {
        weeks: { orderBy: { weekNumber: 'asc' } },
        courseClass: { include: { course: true, lecturer: { include: { user: true } } } },
      },
    });
    if (!contract) throw new NotFoundException('RPS tidak ditemukan.');
    return {
      ...this.mapRpsRow(contract),
      weeks: contract.weeks,
      description: contract.description,
      graduateLearningOutcomes: contract.graduateLearningOutcomes,
      learningOutcomes: contract.learningOutcomes,
      subCpmk: contract.subCpmk,
      studyMaterials: contract.studyMaterials,
      teachingMethods: contract.teachingMethods,
      studentExperience: contract.studentExperience,
      assessmentCriteria: contract.assessmentCriteria,
      references: contract.references,
      supportingReferences: contract.supportingReferences,
      learningMedia: contract.learningMedia,
      coordinatorName: contract.coordinatorName,
      headOfProdiName: contract.headOfProdiName,
      preparedDate: contract.preparedDate,
    };
  }

  async validateRps(
    contractId: string,
    data: { status: 'DISAHKAN' | 'PERLU_REVISI'; note?: string; validatorName: string },
  ): Promise<{ success: boolean; message: string; data: any }> {
    const existing = await this.prisma.courseContract.findUnique({ where: { id: contractId } });
    if (!existing) throw new NotFoundException('RPS tidak ditemukan.');
    if (existing.p2mStatus !== 'DIAJUKAN') {
      throw new BadRequestException('RPS ini belum diajukan dosen untuk divalidasi.');
    }

    const updated = await this.prisma.courseContract.update({
      where: { id: contractId },
      data: {
        p2mStatus: data.status,
        p2mNote: data.status === 'PERLU_REVISI' ? data.note?.trim() || null : null,
        p2mValidatedAt: new Date(),
        p2mValidatedBy: data.validatorName,
        // RPS yang diminta revisi otomatis ditarik dari publikasi ke mahasiswa sampai diajukan ulang.
        isPublished: data.status === 'DISAHKAN' ? existing.isPublished : false,
      },
    });

    return {
      success: true,
      message:
        data.status === 'DISAHKAN'
          ? 'RPS berhasil disahkan.'
          : 'RPS dikembalikan ke dosen untuk direvisi.',
      data: updated,
    };
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
