import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

// Penelitian & Pengabdian di LP3M adalah LAPORAN kegiatan yang sudah selesai (bukan proposal/usulan).
// Status hanya menyatakan hasil verifikasi kelengkapan laporan oleh LP3M.
export const REPORT_STATUSES = ['Menunggu Verifikasi', 'Terverifikasi', 'Perlu Perbaikan'] as const;
type ReportStatus = (typeof REPORT_STATUSES)[number];

@Injectable()
export class Lp3mService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.normalizeLegacyResearchStatuses();
  }

  // Status lama dari alur proposal dipetakan ke status laporan (idempotent).
  private async normalizeLegacyResearchStatuses() {
    try {
      const map: [string[], ReportStatus][] = [
        [['Selesai'], 'Terverifikasi'],
        [['Sedang Berjalan', 'Disetujui'], 'Menunggu Verifikasi'],
        [['Perlu Revisi', 'Revisi Usulan', 'Ditolak'], 'Perlu Perbaikan'],
      ];
      for (const [legacy, next] of map) {
        await this.prisma.lp3mResearch.updateMany({ where: { status: { in: legacy } }, data: { status: next } });
      }
    } catch (err) {
      console.warn('Gagal menormalkan status laporan LP3M:', (err as Error).message);
    }
  }

  private assertReportStatus(status: unknown): ReportStatus {
    if (!REPORT_STATUSES.includes(status as ReportStatus)) {
      throw new BadRequestException(`Status laporan harus salah satu dari: ${REPORT_STATUSES.join(', ')}.`);
    }
    return status as ReportStatus;
  }

  // ================= 1. OVERVIEW & STATS =================
  async getOverview() {
    const totalPenelitian = await this.prisma.lp3mResearch.count({
      where: { type: 'Penelitian' },
    });

    const penelitianTerverifikasi = await this.prisma.lp3mResearch.count({
      where: { type: 'Penelitian', status: 'Terverifikasi' },
    });

    const totalPengabdian = await this.prisma.lp3mResearch.count({
      where: { type: 'Pengabdian' },
    });

    const pengabdianTerverifikasi = await this.prisma.lp3mResearch.count({
      where: { type: 'Pengabdian', status: 'Terverifikasi' },
    });

    const totalHaki = await this.prisma.lp3mIntellectualProperty.count();
    const hakiCertified = await this.prisma.lp3mIntellectualProperty.count({
      where: { status: 'Tersertifikasi' },
    });

    const totalDocuments = await this.prisma.lp3mDocument.count();
    const pendingReviewCount = await this.prisma.lp3mResearch.count({
      where: { status: 'Menunggu Verifikasi' },
    });

    // Calculate aggregated funding
    const litItems = await this.prisma.lp3mResearch.findMany({
      where: { type: 'Penelitian' },
      select: { fundingAmount: true },
    });
    const totalDanaPenelitian = litItems.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    const pkmItems = await this.prisma.lp3mResearch.findMany({
      where: { type: 'Pengabdian' },
      select: { fundingAmount: true },
    });
    const totalDanaPengabdian = pkmItems.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    return {
      success: true,
      data: {
        totalPenelitian,
        penelitianTerverifikasi,
        totalPengabdian,
        pengabdianTerverifikasi,
        totalHaki,
        hakiCertified,
        totalDocuments,
        pendingReviewCount,
        totalDanaPenelitian,
        totalDanaPengabdian,
        totalDanaKeseluruhan: totalDanaPenelitian + totalDanaPengabdian,
      },
    };
  }

  // ================= 2. RESEARCH & PKM CRUD =================
  async getResearches(query?: {
    type?: string;
    year?: string;
    status?: string;
    search?: string;
    faculty?: string;
  }) {
    const where: any = {};

    if (query?.type && query.type !== 'Semua') {
      where.type = query.type;
    }

    if (query?.year && query.year !== 'Semua') {
      where.year = parseInt(query.year, 10) || 2026;
    }

    if (query?.status && query.status !== 'Semua') {
      where.status = query.status;
    }

    if (query?.faculty && query.faculty !== 'Semua') {
      where.faculty = query.faculty;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { leader: { contains: q, mode: 'insensitive' } },
        { scheme: { contains: q, mode: 'insensitive' } },
        { focusArea: { contains: q, mode: 'insensitive' } },
        { faculty: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mResearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: items.length,
      data: items,
    };
  }

  async getResearchById(id: string) {
    const item = await this.prisma.lp3mResearch.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!item) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    return { success: true, data: item };
  }

  async createResearch(dto: any) {
    const type = dto.type === 'Pengabdian' ? 'Pengabdian' : 'Penelitian';
    const title = String(dto.title ?? '').trim();
    const leader = String(dto.leader ?? '').trim();
    if (!title) throw new BadRequestException('Judul kegiatan wajib diisi.');
    if (!leader) throw new BadRequestException('Nama ketua pelaksana wajib diisi.');

    const year = Number(dto.year) || new Date().getFullYear();
    const typePrefix = type === 'Pengabdian' ? 'PKM' : 'LIT';
    const count = await this.prisma.lp3mResearch.count({ where: { type, year } });
    const code = dto.code || `P3M-${typePrefix}-${year}-${String(count + 1).padStart(3, '0')}`;

    const item = await this.prisma.lp3mResearch.create({
      data: {
        code,
        type,
        title,
        scheme: String(dto.scheme ?? '').trim(),
        focusArea: String(dto.focusArea ?? '').trim(),
        leader,
        nidn: dto.nidn || null,
        faculty: String(dto.faculty ?? '').trim(),
        studyProgram: dto.studyProgram || null,
        membersCount: Number(dto.membersCount) || 1,
        year,
        fundingAmount: Number(dto.fundingAmount) || 0,
        fundingSource: String(dto.fundingSource ?? '').trim() || 'Mandiri',
        status: dto.status ? this.assertReportStatus(dto.status) : 'Menunggu Verifikasi',
        targetOutput: dto.targetOutput || null,
        mitraSasaran: dto.mitraSasaran || null,
        reviewerNote: dto.reviewerNote || null,
        documentUrl: dto.documentUrl || null,
        submittedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      },
    });

    return {
      success: true,
      message: `Laporan ${item.type.toLowerCase()} "${item.title}" berhasil dicatat di basis data LP3M.`,
      data: item,
    };
  }

  async updateResearch(id: string, dto: any) {
    const exists = await this.prisma.lp3mResearch.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    const updated = await this.prisma.lp3mResearch.update({
      where: { id: exists.id },
      data: {
        title: dto.title !== undefined ? dto.title : exists.title,
        scheme: dto.scheme !== undefined ? dto.scheme : exists.scheme,
        focusArea: dto.focusArea !== undefined ? dto.focusArea : exists.focusArea,
        leader: dto.leader !== undefined ? dto.leader : exists.leader,
        nidn: dto.nidn !== undefined ? dto.nidn : exists.nidn,
        faculty: dto.faculty !== undefined ? dto.faculty : exists.faculty,
        studyProgram: dto.studyProgram !== undefined ? dto.studyProgram : exists.studyProgram,
        fundingAmount: dto.fundingAmount !== undefined ? Number(dto.fundingAmount) : exists.fundingAmount,
        fundingSource: dto.fundingSource !== undefined ? dto.fundingSource : exists.fundingSource,
        status: dto.status !== undefined ? this.assertReportStatus(dto.status) : exists.status,
        reviewerNote: dto.reviewerNote !== undefined ? dto.reviewerNote : exists.reviewerNote,
        targetOutput: dto.targetOutput !== undefined ? dto.targetOutput : exists.targetOutput,
        mitraSasaran: dto.mitraSasaran !== undefined ? dto.mitraSasaran : exists.mitraSasaran,
        documentUrl: dto.documentUrl !== undefined ? dto.documentUrl : exists.documentUrl,
        year: dto.year !== undefined ? Number(dto.year) : exists.year,
        membersCount: dto.membersCount !== undefined ? Number(dto.membersCount) : exists.membersCount,
      },
    });

    return {
      success: true,
      message: `Data kegiatan LP3M "${updated.title}" berhasil diperbarui.`,
      data: updated,
    };
  }

  async deleteResearch(id: string) {
    const exists = await this.prisma.lp3mResearch.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    await this.prisma.lp3mResearch.delete({ where: { id: exists.id } });

    return {
      success: true,
      message: `Laporan "${exists.title}" berhasil dihapus dari basis data LP3M.`,
    };
  }

  // ================= 3. SENTRA HAKI CRUD =================
  async getHakiList(query?: { status?: string; search?: string }) {
    const where: any = {};

    if (query?.status && query.status !== 'Semua') {
      where.status = query.status;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { inventor: { contains: q, mode: 'insensitive' } },
        { regNumber: { contains: q, mode: 'insensitive' } },
        { faculty: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mIntellectualProperty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, total: items.length, data: items };
  }

  async createHaki(dto: any) {
    const item = await this.prisma.lp3mIntellectualProperty.create({
      data: {
        regNumber: dto.regNumber || `EC002026${Date.now().toString().slice(-5)}`,
        title: dto.title,
        type: dto.type || 'Hak Cipta',
        inventor: dto.inventor || 'Dosen ITN',
        nidn: dto.nidn || null,
        faculty: dto.faculty || 'Fakultas Ilmu Komputer',
        status: dto.status || 'Menunggu Verifikasi',
        grantYear: Number(dto.grantYear) || 2026,
        applicationDate: dto.applicationDate || 'Hari ini',
        description: dto.description || null,
        certificateUrl: dto.certificateUrl || null,
      },
    });

    return {
      success: true,
      message: `Permohonan HAKI "${item.title}" berhasil didaftarkan ke basis data LP3M.`,
      data: item,
    };
  }

  async deleteHaki(id: string) {
    const exists = await this.prisma.lp3mIntellectualProperty.findFirst({
      where: { OR: [{ id }, { regNumber: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Data HAKI dengan ID "${id}" tidak ditemukan.`);
    }

    await this.prisma.lp3mIntellectualProperty.delete({ where: { id: exists.id } });
    return { success: true, message: `Arsip HAKI "${exists.title}" berhasil dihapus.` };
  }

  // ================= 4. BANK DOKUMEN CRUD =================
  async getDocuments(query?: { category?: string; search?: string }) {
    const where: any = {};

    if (query?.category && query.category !== 'Semua') {
      where.category = query.category;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, total: items.length, data: items };
  }

  async createDocument(dto: any) {
    const item = await this.prisma.lp3mDocument.create({
      data: {
        code: dto.code || `DOC-LP3M-${Date.now().toString().slice(-4)}`,
        title: dto.title,
        category: dto.category || 'Panduan & Renstra',
        fileType: dto.fileType || 'PDF',
        fileSize: dto.fileSize || '2.5 MB',
        version: dto.version || 'v2026.1',
        academicYear: dto.academicYear || '2026/2027',
        accessLevel: dto.accessLevel || 'Publik',
        description: dto.description || null,
        author: dto.author || 'Sekretariat LP3M',
        fileUrl: dto.fileUrl || null,
        downloadsCount: 0,
      },
    });

    return {
      success: true,
      message: `Dokumen "${item.title}" berhasil ditambahkan ke Bank Dokumen LP3M.`,
      data: item,
    };
  }

  async incrementDocumentDownload(id: string) {
    const exists = await this.prisma.lp3mDocument.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');

    const updated = await this.prisma.lp3mDocument.update({
      where: { id: exists.id },
      data: { downloadsCount: { increment: 1 } },
    });

    return { success: true, downloadsCount: updated.downloadsCount };
  }

  async deleteDocument(id: string) {
    const exists = await this.prisma.lp3mDocument.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');

    await this.prisma.lp3mDocument.delete({ where: { id: exists.id } });
    return { success: true, message: `Dokumen "${exists.title}" berhasil dihapus.` };
  }

  // ================= 5. REKAP BORANG AKREDITASI =================
  // Kategorisasi tingkatan sumber dana riset (Lokal/Nasional/Internasional) dari nama sumber dana bebas-teks
  private classifyFundingScope(fundingSource: string): 'lokal' | 'nasional' | 'internasional' {
    const s = (fundingSource || '').toLowerCase();
    if (s.includes('internasional') || s.includes('luar negeri') || s.includes('foreign')) return 'internasional';
    if (s.includes('dipa') || s.includes('mandiri') || s.includes('internal')) return 'lokal';
    return 'nasional';
  }

  async getBorangRecords(query?: { faculty?: string; search?: string }) {
    const studyPrograms = await this.prisma.studyProgram.findMany({
      include: { faculty: true, _count: { select: { lecturers: true } } },
      orderBy: { code: 'asc' },
    });

    const researches = await this.prisma.lp3mResearch.findMany({ where: { status: 'Terverifikasi' } });
    const totalHakiReal = await this.prisma.lp3mIntellectualProperty.count();

    let rows = studyPrograms.map((sp) => {
      const spResearches = researches.filter((r) => r.studyProgram === sp.name);
      const lit = spResearches.filter((r) => r.type === 'Penelitian');
      const pkm = spResearches.filter((r) => r.type === 'Pengabdian');

      const countByScope = (list: typeof lit, scope: 'lokal' | 'nasional' | 'internasional') =>
        list.filter((r) => this.classifyFundingScope(r.fundingSource) === scope).length;

      return {
        prodiCode: sp.code,
        prodiName: sp.name,
        faculty: sp.faculty.name,
        academicYear: '2026',
        dtpsCount: sp._count.lecturers,
        penelitianLokal: countByScope(lit, 'lokal'),
        penelitianNasional: countByScope(lit, 'nasional'),
        penelitianInternasional: countByScope(lit, 'internasional'),
        danaPenelitianTotal: lit.reduce((acc, r) => acc + r.fundingAmount, 0),
        pkmLokal: countByScope(pkm, 'lokal'),
        pkmNasional: countByScope(pkm, 'nasional'),
        pkmInternasional: countByScope(pkm, 'internasional'),
        danaPkmTotal: pkm.reduce((acc, r) => acc + r.fundingAmount, 0),
        // Belum ada model pelacakan publikasi Scopus/SINTA maupun tautan HAKI per program studi,
        // jadi jujur ditampilkan 0 di tingkat prodi (bukan angka rekaan).
        scopusCount: 0,
        sintaCount: 0,
        hakiCount: 0,
        bukuCount: 0,
        scorePenelitian: 0,
        scorePkm: 0,
      };
    });

    if (query?.faculty && query.faculty !== 'Semua') {
      rows = rows.filter((r) => r.faculty === query.faculty);
    }
    if (query?.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.prodiName.toLowerCase().includes(q) ||
          r.prodiCode.toLowerCase().includes(q) ||
          r.faculty.toLowerCase().includes(q),
      );
    }

    // Summary calculations
    const totalDTPS = rows.reduce((acc, curr) => acc + curr.dtpsCount, 0);
    const totalJudulLit = rows.reduce(
      (acc, curr) => acc + curr.penelitianLokal + curr.penelitianNasional + curr.penelitianInternasional,
      0
    );
    const totalJudulPkm = rows.reduce(
      (acc, curr) => acc + curr.pkmLokal + curr.pkmNasional + curr.pkmInternasional,
      0
    );
    const totalDanaLit = rows.reduce((acc, curr) => acc + curr.danaPenelitianTotal, 0);
    const totalDanaPkm = rows.reduce((acc, curr) => acc + curr.danaPkmTotal, 0);

    const rasioLitPerDosen = totalDTPS > 0 ? (totalJudulLit / totalDTPS).toFixed(2) : '0';
    const rasioPkmPerDosen = totalDTPS > 0 ? (totalJudulPkm / totalDTPS).toFixed(2) : '0';

    return {
      success: true,
      summary: {
        totalDTPS,
        totalJudulLit,
        totalJudulPkm,
        totalDanaLit,
        totalDanaPkm,
        totalDanaGabungan: totalDanaLit + totalDanaPkm,
        totalScopus: 0,
        totalSinta: 0,
        totalHaki: totalHakiReal,
        rasioLitPerDosen,
        rasioPkmPerDosen,
      },
      data: rows,
    };
  }
}
