import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class StudyProgramsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.studyProgram.findMany({
      include: { faculty: true },
      orderBy: { code: 'asc' },
    });

    return list.map((p) => ({
      id: p.id,
      code: p.code,
      diktiCode: p.diktiCode || '55201',
      name: p.name,
      degreeLevel: p.degreeLevel,
      degreeTitle: p.degreeTitle || (p.degreeLevel === 'S1' ? 'S.Kom.' : 'S.Tr.Kom.'),
      facultyCode: p.faculty?.code || 'FASILKOM',
      facultyName: p.faculty?.name || 'Fakultas Terdaftar',
      headOfProgram: p.headOfProgram || 'Dr. Bambang Sutrisno, M.Kom.',
      headNip: p.headNip || '19790112 200501 1 002',
      studentsCount: p.studentsCount || 500,
      lecturersCount: p.lecturersCount || 20,
      accreditation: p.accreditation,
      accreditationAgency: p.accreditationAgency || 'LAM-INFOKOM',
      skAkreditasi: p.skAkreditasi || 'No. SK Resmi Akreditasi',
      status: p.status || 'Aktif',
    }));
  }

  async findOne(id: string) {
    const p = await this.prisma.studyProgram.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { faculty: true },
    });
    if (!p) throw new NotFoundException('Program studi tidak ditemukan');
    return {
      id: p.id,
      code: p.code,
      diktiCode: p.diktiCode,
      name: p.name,
      degreeLevel: p.degreeLevel,
      degreeTitle: p.degreeTitle,
      facultyCode: p.faculty?.code,
      facultyName: p.faculty?.name,
      headOfProgram: p.headOfProgram,
      headNip: p.headNip,
      studentsCount: p.studentsCount,
      lecturersCount: p.lecturersCount,
      accreditation: p.accreditation,
      accreditationAgency: p.accreditationAgency,
      skAkreditasi: p.skAkreditasi,
      status: p.status,
    };
  }

  async create(data: any) {
    let faculty = await this.prisma.faculty.findFirst({
      where: { code: data.facultyCode },
    });
    if (!faculty) {
      faculty = await this.prisma.faculty.findFirst();
    }

    const created = await this.prisma.studyProgram.create({
      data: {
        facultyId: faculty?.id || 'fac-2',
        code: data.code.trim(),
        diktiCode: data.diktiCode?.trim() || null,
        name: data.name.trim(),
        degreeLevel: data.degreeLevel || 'S1',
        degreeTitle: data.degreeTitle?.trim() || null,
        accreditation: data.accreditation || 'Unggul',
        accreditationAgency: data.accreditationAgency?.trim() || null,
        skAkreditasi: data.skAkreditasi?.trim() || null,
        headOfProgram: data.headOfProgram?.trim() || null,
        headNip: data.headNip?.trim() || null,
        status: data.status || 'Aktif',
        studentsCount: Number(data.studentsCount) || 0,
        lecturersCount: Number(data.lecturersCount) || 0,
      },
      include: { faculty: true },
    });

    return {
      id: created.id,
      code: created.code,
      diktiCode: created.diktiCode,
      name: created.name,
      degreeLevel: created.degreeLevel,
      degreeTitle: created.degreeTitle,
      facultyCode: created.faculty?.code,
      facultyName: created.faculty?.name,
      headOfProgram: created.headOfProgram,
      headNip: created.headNip,
      studentsCount: created.studentsCount,
      lecturersCount: created.lecturersCount,
      accreditation: created.accreditation,
      accreditationAgency: created.accreditationAgency,
      skAkreditasi: created.skAkreditasi,
      status: created.status,
    };
  }

  async update(id: string, data: any) {
    const updated = await this.prisma.studyProgram.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim() : undefined,
        diktiCode: data.diktiCode !== undefined ? data.diktiCode.trim() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        degreeLevel: data.degreeLevel !== undefined ? data.degreeLevel : undefined,
        degreeTitle: data.degreeTitle !== undefined ? data.degreeTitle.trim() : undefined,
        accreditation: data.accreditation !== undefined ? data.accreditation : undefined,
        accreditationAgency: data.accreditationAgency !== undefined ? data.accreditationAgency.trim() : undefined,
        skAkreditasi: data.skAkreditasi !== undefined ? data.skAkreditasi.trim() : undefined,
        headOfProgram: data.headOfProgram !== undefined ? data.headOfProgram.trim() : undefined,
        headNip: data.headNip !== undefined ? data.headNip.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        studentsCount: data.studentsCount !== undefined ? Number(data.studentsCount) : undefined,
        lecturersCount: data.lecturersCount !== undefined ? Number(data.lecturersCount) : undefined,
      },
      include: { faculty: true },
    });

    return {
      id: updated.id,
      code: updated.code,
      diktiCode: updated.diktiCode,
      name: updated.name,
      degreeLevel: updated.degreeLevel,
      degreeTitle: updated.degreeTitle,
      facultyCode: updated.faculty?.code,
      facultyName: updated.faculty?.name,
      headOfProgram: updated.headOfProgram,
      headNip: updated.headNip,
      studentsCount: updated.studentsCount,
      lecturersCount: updated.lecturersCount,
      accreditation: updated.accreditation,
      accreditationAgency: updated.accreditationAgency,
      skAkreditasi: updated.skAkreditasi,
      status: updated.status,
    };
  }

  async remove(id: string) {
    await this.prisma.studyProgram.delete({ where: { id } });
    return { success: true, message: 'Program studi berhasil dihapus' };
  }
}
