import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

const DEFAULTS = [
  { name: 'Skripsi/TA', kind: 'TUGAS_AKHIR', isSystem: true, needsSupervision: true, description: 'Skripsi / Tugas Akhir (alur Tugas Akhir: pengajuan, bimbingan, sidang).' },
  { name: 'Seminar Proposal', kind: 'TUGAS_AKHIR', isSystem: true, needsSupervision: false, description: 'Penanda nilai seminar proposal. Tidak tanpa jadwal dan tidak masuk daftar bimbingan.' },
  { name: 'KKN', kind: 'LAPANGAN', isGroup: true, minMembers: 5, maxMembers: 10 },
  { name: 'PLP', kind: 'LAPANGAN', isGroup: true, minMembers: 3, maxMembers: 6, description: 'Pengenalan Lapangan Persekolahan.' },
  { name: 'Kerja Praktik', kind: 'LAPANGAN' },
  { name: 'Magang', kind: 'LAPANGAN' },
];

export interface CategoryInput {
  name?: string;
  kind?: string;
  needsSupervision?: boolean;
  requiresRegistration?: boolean;
  hasPartners?: boolean;
  allowOwnPartner?: boolean;
  feeComponentId?: string | null;
  isGroup?: boolean;
  minMembers?: number;
  maxMembers?: number;
  minLogbook?: number;
  sortOrder?: number;
  isActive?: boolean;
  description?: string | null;
}

/** Master jenis tugas akhir & kegiatan lapangan. Mata kuliah merujuk lewat nama jenis (Course.finalProjectLabel). */
@Injectable()
export class CourseCategoriesService {
  constructor(private prisma: PrismaService) {}

  /** Isi bawaan sekali: jenis standar + label yang sudah terlanjur dipakai mata kuliah (data lama). */
  private async ensureSeeded() {
    // Terisi bila belum ada satu pun jenis bawaan (jenis sistem tidak bisa dihapus, jadi tidak terulang)
    const present = await this.prisma.courseCategory.count({ where: { name: { in: DEFAULTS.map((d) => d.name) } } });
    if (present > 0) return;
    const used = await this.prisma.course.findMany({ where: { finalProjectLabel: { not: null } }, distinct: ['finalProjectLabel'], select: { finalProjectLabel: true } });
    const known = new Set(DEFAULTS.map((d) => d.name));
    const extra = used.map((u) => (u.finalProjectLabel || '').trim()).filter((n) => n && !known.has(n)).map((name) => ({ name, kind: 'LAPANGAN' }));
    await this.prisma.courseCategory.createMany({
      data: [...DEFAULTS, ...extra].map((d: any, i) => ({ ...d, sortOrder: i })),
      skipDuplicates: true,
    });
  }

  async list(includeInactive = true) {
    await this.ensureSeeded();
    const rows = await this.prisma.courseCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const counts = await this.prisma.course.groupBy({ by: ['finalProjectLabel'], where: { finalProjectLabel: { not: null } }, _count: { _all: true } });
    const byName = new Map(counts.map((c) => [c.finalProjectLabel as string, c._count._all]));
    return rows.map((r) => ({ ...r, courseCount: byName.get(r.name) ?? 0 }));
  }

  /** Aturan jenis untuk nama tertentu (null bila bukan jenis terdaftar). */
  async findByName(name: string | null | undefined) {
    const n = (name || '').trim();
    if (!n) return null;
    await this.ensureSeeded();
    return this.prisma.courseCategory.findUnique({ where: { name: n } });
  }

  private normalize(dto: CategoryInput, base?: { isGroup: boolean }) {
    const isGroup = dto.isGroup !== undefined ? Boolean(dto.isGroup) : base?.isGroup ?? false;
    let minMembers = Math.max(1, Math.floor(Number(dto.minMembers ?? 1)) || 1);
    let maxMembers = Math.max(1, Math.floor(Number(dto.maxMembers ?? 1)) || 1);
    if (!isGroup) {
      minMembers = 1;
      maxMembers = 1;
    } else {
      if (maxMembers < 2) throw new BadRequestException('Jenis berkelompok: anggota maksimal minimal 2 orang.');
      if (minMembers > maxMembers) throw new BadRequestException('Anggota minimal tidak boleh lebih besar dari anggota maksimal.');
    }
    return { isGroup, minMembers, maxMembers };
  }

  /**
   * Biaya khusus kegiatan = komponen biaya dari master Keuangan. Nominal dan nama disalin ke jenis agar pembatasan
   * (harus lunas dulu) tetap cepat dibaca; salinan diperbarui otomatis saat Keuangan mengubah komponennya.
   */
  private async feeRules(dto: CategoryInput, currentComponentId?: string | null) {
    if (dto.feeComponentId === undefined) return {};
    if (!dto.feeComponentId) return { feeComponentId: null, feeAmount: 0, feeLabel: null };
    const comp = await this.prisma.feeComponent.findUnique({ where: { id: dto.feeComponentId } });
    if (!comp) throw new BadRequestException('Komponen biaya tidak ditemukan.');
    if (!comp.isActive && comp.id !== currentComponentId) throw new BadRequestException(`Komponen biaya "${comp.name}" sudah nonaktif.`);
    if (!(comp.defaultAmount > 0)) throw new BadRequestException(`Tarif komponen "${comp.name}" belum diisi di Keuangan.`);
    return { feeComponentId: comp.id, feeAmount: comp.defaultAmount, feeLabel: comp.name };
  }

  /** Komponen biaya sekali bayar yang aktif (pilihan di Pengaturan jenis). */
  async listFeeComponents() {
    return this.prisma.feeComponent.findMany({
      where: { isActive: true, category: 'SEKALI_BAYAR' },
      select: { id: true, code: true, name: true, defaultAmount: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Mitra hanya bermakna bila jenis wajib mendaftar (isian tempat ada di formulir pendaftaran). */
  private partnerRules(dto: CategoryInput, requiresRegistration: boolean, base?: { hasPartners: boolean; allowOwnPartner: boolean }) {
    const has = dto.hasPartners !== undefined ? Boolean(dto.hasPartners) : base?.hasPartners ?? false;
    return {
      hasPartners: requiresRegistration && has,
      allowOwnPartner: dto.allowOwnPartner !== undefined ? Boolean(dto.allowOwnPartner) : base?.allowOwnPartner ?? true,
    };
  }

  async create(dto: CategoryInput) {
    await this.ensureSeeded();
    const name = String(dto.name ?? '').trim();
    if (name.length < 2) throw new BadRequestException('Nama jenis wajib diisi.');
    if (await this.prisma.courseCategory.findUnique({ where: { name } })) throw new BadRequestException(`Jenis "${name}" sudah ada.`);
    const g = this.normalize(dto);
    const fee = await this.feeRules(dto);
    const max = await this.prisma.courseCategory.aggregate({ _max: { sortOrder: true } });
    const data = await this.prisma.courseCategory.create({
      data: {
        name,
        kind: dto.kind === 'TUGAS_AKHIR' ? 'TUGAS_AKHIR' : 'LAPANGAN',
        needsSupervision: dto.needsSupervision ?? true,
        requiresRegistration: Boolean(dto.requiresRegistration),
        ...this.partnerRules(dto, Boolean(dto.requiresRegistration)),
        ...fee,
        ...g,
        minLogbook: Math.max(0, Math.floor(Number(dto.minLogbook ?? 0)) || 0),
        sortOrder: (max._max.sortOrder ?? 0) + 1,
        isActive: dto.isActive ?? true,
        description: dto.description?.toString().trim() || null,
      },
    });
    return { success: true, message: `Jenis "${name}" berhasil ditambahkan.`, data };
  }

  async update(id: string, dto: CategoryInput) {
    const cur = await this.prisma.courseCategory.findUnique({ where: { id } });
    if (!cur) throw new NotFoundException('Jenis tidak ditemukan.');
    const name = dto.name !== undefined ? String(dto.name).trim() : cur.name;
    if (name.length < 2) throw new BadRequestException('Nama jenis wajib diisi.');
    if (name !== cur.name) {
      if (cur.isSystem) throw new BadRequestException(`Nama jenis "${cur.name}" dipakai sistem Tugas Akhir dan tidak dapat diubah.`);
      if (await this.prisma.courseCategory.findUnique({ where: { name } })) throw new BadRequestException(`Jenis "${name}" sudah ada.`);
    }
    if (cur.isSystem && dto.isActive === false) throw new BadRequestException(`Jenis "${cur.name}" dipakai sistem Tugas Akhir dan tidak dapat dinonaktifkan.`);
    const g = this.normalize({ ...cur, ...dto } as CategoryInput, cur);
    const fee = await this.feeRules(dto, cur.feeComponentId);
    const needsSupervision = cur.isSystem ? cur.needsSupervision : dto.needsSupervision ?? cur.needsSupervision;
    const data = await this.prisma.$transaction(async (tx) => {
      const row = await tx.courseCategory.update({
        where: { id },
        data: {
          name,
          kind: cur.isSystem ? cur.kind : dto.kind !== undefined ? (dto.kind === 'TUGAS_AKHIR' ? 'TUGAS_AKHIR' : 'LAPANGAN') : undefined,
          needsSupervision,
          requiresRegistration: dto.requiresRegistration !== undefined ? Boolean(dto.requiresRegistration) : undefined,
          ...this.partnerRules(dto, dto.requiresRegistration !== undefined ? Boolean(dto.requiresRegistration) : cur.requiresRegistration, cur),
          ...fee,
          ...g,
          minLogbook: dto.minLogbook !== undefined ? Math.max(0, Math.floor(Number(dto.minLogbook)) || 0) : undefined,
          sortOrder: dto.sortOrder !== undefined ? Number(dto.sortOrder) || 0 : undefined,
          isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : undefined,
          description: dto.description !== undefined ? dto.description?.toString().trim() || null : undefined,
        },
      });
      // Mata kuliah merujuk lewat nama: ikut nama baru, dan penanda bimbingannya mengikuti aturan jenis
      await tx.course.updateMany({ where: { finalProjectLabel: cur.name }, data: { finalProjectLabel: name, requiresThesisSupervision: needsSupervision } });
      return row;
    });
    return { success: true, message: `Jenis "${name}" berhasil diperbarui.`, data };
  }

  async remove(id: string) {
    const cur = await this.prisma.courseCategory.findUnique({ where: { id } });
    if (!cur) throw new NotFoundException('Jenis tidak ditemukan.');
    if (cur.isSystem) throw new BadRequestException(`Jenis "${cur.name}" dipakai sistem Tugas Akhir dan tidak dapat dihapus.`);
    const used = await this.prisma.course.count({ where: { finalProjectLabel: cur.name } });
    if (used > 0) throw new BadRequestException(`Jenis "${cur.name}" masih dipakai ${used} mata kuliah. Nonaktifkan saja, atau ubah kategori mata kuliahnya dulu.`);
    await this.prisma.courseCategory.delete({ where: { id } });
    return { success: true, message: `Jenis "${cur.name}" berhasil dihapus.` };
  }
}
