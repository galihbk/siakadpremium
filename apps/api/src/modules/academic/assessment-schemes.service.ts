import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface ComponentInput {
  name: string;
  source?: 'MANUAL' | 'ATTENDANCE';
}

export interface SchemeInput {
  name: string;
  effectiveFromYearId: string;
  notes?: string | null;
  components: ComponentInput[];
}

const MAX_COMPONENTS = 12;

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'komponen'
  );
}

/**
 * Skema komponen penilaian kampus yang diatur Akademik. Satu skema berlaku mulai tahun akademik + semester
 * tertentu dan terus dipakai sampai ada skema yang lebih baru; semua dosen memakai skema yang sama.
 */
@Injectable()
export class AssessmentSchemesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Skema yang berlaku untuk sebuah tahun akademik+semester: yang mulai berlaku paling akhir tapi tidak setelah tahun itu. */
  async resolveForYear(academicYearId: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { startDate: true } });
    if (!year) return null;
    return this.prisma.assessmentScheme.findFirst({
      where: { effectiveFrom: { startDate: { lte: year.startDate } } },
      orderBy: { effectiveFrom: { startDate: 'desc' } },
      include: { components: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  private async isLocked(schemeId: string): Promise<boolean> {
    const n = await this.prisma.enrollmentComponentScore.count({ where: { component: { schemeId } } });
    return n > 0;
  }

  async list() {
    const [schemes, activeYear] = await Promise.all([
      this.prisma.assessmentScheme.findMany({
        include: { effectiveFrom: true, components: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { effectiveFrom: { startDate: 'asc' } },
      }),
      this.prisma.academicYear.findFirst({ where: { isActive: true } }),
    ]);

    const activeStart = activeYear?.startDate ?? null;
    const result = [];
    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const next = schemes[i + 1];
      const locked = await this.isLocked(s.id);
      let status: 'BERLAKU' | 'AKAN_DATANG' | 'DIGANTIKAN' = 'AKAN_DATANG';
      if (activeStart) {
        const started = s.effectiveFrom.startDate <= activeStart;
        const replaced = next ? next.effectiveFrom.startDate <= activeStart : false;
        status = !started ? 'AKAN_DATANG' : replaced ? 'DIGANTIKAN' : 'BERLAKU';
      }
      result.push({
        id: s.id,
        name: s.name,
        notes: s.notes,
        effectiveFromYearId: s.effectiveFromYearId,
        effectiveFromLabel: `${s.effectiveFrom.name} ${s.effectiveFrom.semesterType === 'ODD' ? 'Ganjil' : s.effectiveFrom.semesterType === 'EVEN' ? 'Genap' : 'Pendek'}`,
        // sampai sebelum skema berikutnya mulai berlaku
        replacedByLabel: next
          ? `${next.effectiveFrom.name} ${next.effectiveFrom.semesterType === 'ODD' ? 'Ganjil' : next.effectiveFrom.semesterType === 'EVEN' ? 'Genap' : 'Pendek'}`
          : null,
        isLocked: locked,
        status,
        components: s.components.map((c) => ({ id: c.id, code: c.code, name: c.name, source: c.source })),
      });
    }
    // terbaru di atas
    return result.reverse();
  }

  /** Aturan umum: nama unik, bobot positif dan total 100%, maksimal satu komponen otomatis dari kehadiran. */
  private validate(input: SchemeInput) {
    if (!input.name?.trim()) throw new BadRequestException('Nama skema wajib diisi.');
    if (!input.effectiveFromYearId) throw new BadRequestException('Pilih tahun akademik dan semester mulai berlaku.');
    const comps = input.components ?? [];
    if (comps.length === 0) throw new BadRequestException('Tambahkan minimal satu komponen penilaian.');
    if (comps.length > MAX_COMPONENTS) throw new BadRequestException(`Maksimal ${MAX_COMPONENTS} komponen per skema.`);

    // Skema hanya menentukan DAFTAR komponen; bobotnya diisi dosen per kelas di Kontrak Kuliah.
    const seen = new Set<string>();
    let attendance = 0;
    for (const c of comps) {
      const name = String(c.name ?? '').trim();
      if (!name) throw new BadRequestException('Setiap komponen harus punya nama.');
      const key = name.toLowerCase();
      if (seen.has(key)) throw new BadRequestException(`Nama komponen "${name}" dobel.`);
      seen.add(key);
      if (c.source === 'ATTENDANCE') attendance += 1;
    }
    if (attendance > 1) throw new BadRequestException('Hanya satu komponen yang boleh diambil otomatis dari kehadiran.');
  }

  /** Tidak boleh mengubah cara menghitung nilai yang sudah terlanjur diinput untuk semester yang sudah/sedang berjalan. */
  private async assertNotRetroactive(effectiveFromYearId: string) {
    const year = await this.prisma.academicYear.findUnique({ where: { id: effectiveFromYearId } });
    if (!year) throw new BadRequestException('Tahun akademik mulai berlaku tidak ditemukan.');
    const graded = await this.prisma.courseEnrollment.count({
      where: { totalScore: { not: null }, academicYear: { startDate: { gte: year.startDate } } },
    });
    if (graded > 0) {
      throw new BadRequestException(
        'Sudah ada nilai yang diinput pada semester tersebut atau sesudahnya, sehingga skema tidak bisa berlaku mulai semester itu. Pilih semester berikutnya yang belum ada nilainya.',
      );
    }
    return year;
  }

  private toRows(components: ComponentInput[]) {
    const used = new Set<string>();
    return components.map((c, i) => {
      let code = slug(c.name);
      let n = 2;
      while (used.has(code)) code = `${slug(c.name)}-${n++}`;
      used.add(code);
      return { code, name: c.name.trim(), weight: 0, source: c.source === 'ATTENDANCE' ? 'ATTENDANCE' : 'MANUAL', sortOrder: i };
    });
  }

  async create(input: SchemeInput) {
    this.validate(input);
    await this.assertNotRetroactive(input.effectiveFromYearId);
    const existing = await this.prisma.assessmentScheme.findUnique({ where: { effectiveFromYearId: input.effectiveFromYearId } });
    if (existing) throw new BadRequestException('Sudah ada skema yang berlaku mulai semester itu. Ubah skema tersebut atau pilih semester lain.');

    return this.prisma.assessmentScheme.create({
      data: {
        name: input.name.trim(),
        effectiveFromYearId: input.effectiveFromYearId,
        notes: input.notes?.trim() || null,
        components: { create: this.toRows(input.components) },
      },
      include: { components: true },
    });
  }

  async update(id: string, input: SchemeInput) {
    const scheme = await this.prisma.assessmentScheme.findUnique({ where: { id } });
    if (!scheme) throw new NotFoundException('Skema penilaian tidak ditemukan.');
    if (await this.isLocked(id)) {
      throw new BadRequestException('Skema ini sudah dipakai untuk menginput nilai sehingga tidak bisa diubah. Buat skema baru yang berlaku mulai semester berikutnya.');
    }
    this.validate(input);
    await this.assertNotRetroactive(input.effectiveFromYearId);
    if (input.effectiveFromYearId !== scheme.effectiveFromYearId) {
      const clash = await this.prisma.assessmentScheme.findUnique({ where: { effectiveFromYearId: input.effectiveFromYearId } });
      if (clash) throw new BadRequestException('Sudah ada skema yang berlaku mulai semester itu.');
    }

    await this.prisma.$transaction([
      this.prisma.assessmentComponent.deleteMany({ where: { schemeId: id } }),
      this.prisma.assessmentScheme.update({
        where: { id },
        data: {
          name: input.name.trim(),
          effectiveFromYearId: input.effectiveFromYearId,
          notes: input.notes?.trim() || null,
          components: { create: this.toRows(input.components) },
        },
      }),
    ]);
    return this.prisma.assessmentScheme.findUnique({ where: { id }, include: { components: { orderBy: { sortOrder: 'asc' } } } });
  }

  async remove(id: string) {
    const scheme = await this.prisma.assessmentScheme.findUnique({ where: { id } });
    if (!scheme) throw new NotFoundException('Skema penilaian tidak ditemukan.');
    if (await this.isLocked(id)) {
      throw new BadRequestException('Skema ini sudah dipakai untuk menginput nilai sehingga tidak bisa dihapus.');
    }
    await this.prisma.assessmentScheme.delete({ where: { id } });
    return { success: true };
  }
}
