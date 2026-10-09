import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

const DEAN_INCLUDE = {
  deanLecturers: {
    include: { user: { select: { fullName: true } } },
  },
} as const;

function formatLecturerName(lecturer: { titlePrefix: string | null; titleSuffix: string | null; user: { fullName: string } }) {
  const prefix = lecturer.titlePrefix ? `${lecturer.titlePrefix} ` : '';
  const suffix = lecturer.titleSuffix ? `, ${lecturer.titleSuffix}` : '';
  return `${prefix}${lecturer.user.fullName}${suffix}`;
}

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  private attachDean<T extends { deanLecturers: Array<{ nip: string | null; titlePrefix: string | null; titleSuffix: string | null; user: { fullName: string } }> }>(
    faculty: T
  ) {
    const { deanLecturers, ...rest } = faculty;
    const dean = deanLecturers[0];
    return {
      ...rest,
      deanName: dean ? formatLecturerName(dean) : null,
      deanNip: dean?.nip ?? null,
    };
  }

  // CATATAN: dulu method ini punya fallback array hardcoded (fac-1/fac-2/fac-3) yang
  // dikembalikan setiap kali tabel Faculty kosong -- itu bikin UI menampilkan data
  // seolah-olah asli padahal tidak pernah ada di database, dan aksi seperti hapus
  // jadi selalu gagal karena ID-nya tidak pernah benar-benar ada. Sekarang method ini
  // selalu mengembalikan data asli dari database apa adanya, termasuk saat kosong.
  //
  // deanName/deanNip TIDAK disimpan sebagai teks manual -- diturunkan dari Lecturer
  // yang structuralPosition-nya DEKAN di fakultas ini. Ganti jabatan struktural dosen
  // di menu Data Dosen, bukan di sini.
  async findAll() {
    const list = await this.prisma.faculty.findMany({
      include: {
        studyPrograms: true,
        ...DEAN_INCLUDE,
      },
    });
    return list.map((f) => this.attachDean(f));
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { studyPrograms: true, ...DEAN_INCLUDE },
    });
    if (!faculty) {
      throw new NotFoundException('Fakultas tidak ditemukan.');
    }
    return this.attachDean(faculty);
  }

  // Hard delete -- hanya boleh kalau fakultas sudah tidak punya program studi
  // sama sekali. Kalau masih ada prodi, admin harus memindahkan/menghapus
  // prodinya dulu supaya tidak ada data prodi yang kehilangan induk fakultas.
  async remove(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { studyPrograms: true },
    });

    if (!faculty) {
      throw new NotFoundException('Fakultas tidak ditemukan.');
    }

    if (faculty.studyPrograms.length > 0) {
      throw new BadRequestException(
        `Fakultas "${faculty.name}" masih memiliki ${faculty.studyPrograms.length} program studi. Pindahkan atau hapus program studinya terlebih dahulu sebelum menghapus fakultas ini.`
      );
    }

    await this.prisma.faculty.delete({ where: { id } });
    return { success: true, message: `Fakultas "${faculty.name}" berhasil dihapus.` };
  }

  async create(dto: {
    code: string;
    name: string;
    description?: string;
    building?: string;
    establishedYear?: number;
    accreditation?: string;
    skAkreditasi?: string;
  }) {
    if (!dto.code?.trim() || !dto.name?.trim()) {
      throw new BadRequestException('Kode dan nama fakultas wajib diisi.');
    }

    const existing = await this.prisma.faculty.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
    if (existing) {
      throw new BadRequestException(`Kode fakultas "${dto.code.trim().toUpperCase()}" sudah dipakai.`);
    }

    const created = await this.prisma.faculty.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        building: dto.building?.trim() || null,
        establishedYear: dto.establishedYear || null,
        accreditation: dto.accreditation?.trim() || null,
        skAkreditasi: dto.skAkreditasi?.trim() || null,
      },
      include: { studyPrograms: true, ...DEAN_INCLUDE },
    });

    return this.attachDean(created);
  }

  async update(
    id: string,
    dto: {
      code?: string;
      name?: string;
      description?: string;
      building?: string;
      establishedYear?: number;
      accreditation?: string;
      skAkreditasi?: string;
    }
  ) {
    const existing = await this.prisma.faculty.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Fakultas tidak ditemukan.');
    }

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeTaken = await this.prisma.faculty.findUnique({ where: { code: dto.code.trim().toUpperCase() } });
      if (codeTaken) {
        throw new BadRequestException(`Kode fakultas "${dto.code.trim().toUpperCase()}" sudah dipakai.`);
      }
    }

    const updated = await this.prisma.faculty.update({
      where: { id },
      data: {
        code: dto.code !== undefined ? dto.code.trim().toUpperCase() : undefined,
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() || null : undefined,
        building: dto.building !== undefined ? dto.building.trim() || null : undefined,
        establishedYear: dto.establishedYear !== undefined ? dto.establishedYear : undefined,
        accreditation: dto.accreditation !== undefined ? dto.accreditation.trim() || null : undefined,
        skAkreditasi: dto.skAkreditasi !== undefined ? dto.skAkreditasi.trim() || null : undefined,
      },
      include: { studyPrograms: true, ...DEAN_INCLUDE },
    });

    return this.attachDean(updated);
  }
}
