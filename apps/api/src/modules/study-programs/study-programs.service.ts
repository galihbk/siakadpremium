import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

const KAPRODI_INCLUDE = {
  kaprodiLecturers: {
    include: { user: { select: { fullName: true } } },
  },
} as const;

function formatLecturerName(lecturer: { titlePrefix: string | null; titleSuffix: string | null; user: { fullName: string } }) {
  const prefix = lecturer.titlePrefix ? `${lecturer.titlePrefix} ` : '';
  const suffix = lecturer.titleSuffix ? `, ${lecturer.titleSuffix}` : '';
  return `${prefix}${lecturer.user.fullName}${suffix}`;
}

@Injectable()
export class StudyProgramsService {
  constructor(private prisma: PrismaService) {}

  // headOfProgram/headNip TIDAK disimpan sebagai teks manual -- diturunkan dari
  // Lecturer yang structuralPosition-nya KAPRODI di prodi ini. Ganti jabatan
  // struktural dosen di menu Data Dosen, bukan di sini.
  //
  // studentsCount/lecturersCount JUGA tidak dipakai dari kolom tersimpan -- kolom itu
  // cuma angka statis yang diisi manual saat prodi dibuat dan TIDAK ikut bertambah saat
  // dosen/mahasiswa baru disinkronkan dari Feeder, jadi selalu basi (sering nyangkut di
  // 0). Dihitung langsung dari jumlah baris Lecturer/Student yang sungguhan menunjuk ke
  // prodi ini lewat relasi, supaya selalu akurat.
  async findAll() {
    const list = await this.prisma.studyProgram.findMany({
      include: {
        faculty: true,
        ...KAPRODI_INCLUDE,
        _count: { select: { students: true, lecturers: true } },
      },
      orderBy: { code: 'asc' },
    });

    return list.map((p) => {
      const kaprodi = p.kaprodiLecturers[0];
      return {
        id: p.id,
        code: p.code,
        diktiCode: p.diktiCode,
        name: p.name,
        degreeLevel: p.degreeLevel,
        degreeTitle: p.degreeTitle,
        facultyId: p.facultyId,
        facultyCode: p.faculty?.code,
        facultyName: p.faculty?.name,
        headOfProgram: kaprodi ? formatLecturerName(kaprodi) : null,
        headNip: kaprodi?.nip ?? null,
        studentsCount: p._count.students,
        lecturersCount: p._count.lecturers,
        accreditation: p.accreditation,
        accreditationAgency: p.accreditationAgency,
        skAkreditasi: p.skAkreditasi,
        status: p.status,
      };
    });
  }

  // Ringkasan untuk dashboard Admin Prodi: identitas prodi + statistik mahasiswa/dosen/mata
  // kuliah yang sungguhan dihitung dari basis data, bukan kolom cache yang bisa basi.
  async getSummary(id: string) {
    const prodi = await this.prisma.studyProgram.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { faculty: true, ...KAPRODI_INCLUDE },
    });
    if (!prodi) throw new NotFoundException('Program studi tidak ditemukan');

    const [studentStatusGroups, lecturersCount, coursesCount, activeClassesCount] = await Promise.all([
      this.prisma.student.groupBy({ by: ['status'], where: { studyProgramId: prodi.id }, _count: { _all: true } }),
      this.prisma.lecturer.count({ where: { studyProgramId: prodi.id } }),
      this.prisma.course.count({ where: { studyProgramId: prodi.id } }),
      this.prisma.courseClass.count({ where: { course: { studyProgramId: prodi.id }, status: 'Berjalan' } }),
    ]);

    const statusLabels: Record<string, string> = {
      ACTIVE: 'Aktif',
      LEAVE: 'Cuti',
      GRADUATED: 'Lulus',
      DROPOUT: 'DO',
      TRANSFERRED: 'Pindah',
    };
    const studentStatusBreakdown = studentStatusGroups.map((g) => ({
      status: statusLabels[g.status] || g.status,
      count: g._count._all,
    }));
    const totalStudents = studentStatusBreakdown.reduce((sum, s) => sum + s.count, 0);
    const activeStudents = studentStatusGroups.find((g) => g.status === 'ACTIVE')?._count._all || 0;

    const kaprodi = prodi.kaprodiLecturers[0];

    return {
      id: prodi.id,
      code: prodi.code,
      name: prodi.name,
      degreeLevel: prodi.degreeLevel,
      facultyName: prodi.faculty?.name || null,
      accreditation: prodi.accreditation,
      status: prodi.status,
      headOfProgram: kaprodi ? formatLecturerName(kaprodi) : null,
      totalStudents,
      activeStudents,
      studentStatusBreakdown,
      totalLecturers: lecturersCount,
      totalCourses: coursesCount,
      activeClasses: activeClassesCount,
    };
  }

  async findOne(id: string) {
    const p = await this.prisma.studyProgram.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        faculty: true,
        ...KAPRODI_INCLUDE,
        _count: { select: { students: true, lecturers: true } },
      },
    });
    if (!p) throw new NotFoundException('Program studi tidak ditemukan');
    const kaprodi = p.kaprodiLecturers[0];
    return {
      id: p.id,
      code: p.code,
      diktiCode: p.diktiCode,
      name: p.name,
      degreeLevel: p.degreeLevel,
      degreeTitle: p.degreeTitle,
      facultyId: p.facultyId,
      facultyCode: p.faculty?.code,
      facultyName: p.faculty?.name,
      headOfProgram: kaprodi ? formatLecturerName(kaprodi) : null,
      headNip: kaprodi?.nip ?? null,
      studentsCount: p._count.students,
      lecturersCount: p._count.lecturers,
      accreditation: p.accreditation,
      accreditationAgency: p.accreditationAgency,
      skAkreditasi: p.skAkreditasi,
      status: p.status,
    };
  }

  // CATATAN: dulu kalau facultyCode yang dikirim tidak cocok dengan fakultas mana pun
  // (mis. dropdown frontend masih pakai kode hardcoded lama), prodi DIAM-DIAM dibuat
  // di fakultas PERTAMA yang ditemukan di database -- bukan fakultas yang sungguhan
  // dipilih admin. Sekarang wajib ada facultyId valid, kalau tidak ada langsung ditolak.
  async create(data: any) {
    if (!data.facultyId) {
      throw new BadRequestException('Fakultas induk wajib dipilih.');
    }
    const faculty = await this.prisma.faculty.findUnique({ where: { id: data.facultyId } });
    if (!faculty) {
      throw new BadRequestException('Fakultas induk yang dipilih tidak ditemukan.');
    }

    const created = await this.prisma.studyProgram.create({
      data: {
        facultyId: faculty.id,
        code: data.code.trim(),
        diktiCode: data.diktiCode?.trim() || null,
        name: data.name.trim(),
        degreeLevel: data.degreeLevel || 'S1',
        degreeTitle: data.degreeTitle?.trim() || null,
        accreditation: data.accreditation || 'Unggul',
        accreditationAgency: data.accreditationAgency?.trim() || null,
        skAkreditasi: data.skAkreditasi?.trim() || null,
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
      facultyId: created.facultyId,
      facultyCode: created.faculty?.code,
      facultyName: created.faculty?.name,
      // Prodi baru belum punya kaprodi -- assign lewat menu Data Dosen.
      headOfProgram: null,
      headNip: null,
      studentsCount: created.studentsCount,
      lecturersCount: created.lecturersCount,
      accreditation: created.accreditation,
      accreditationAgency: created.accreditationAgency,
      skAkreditasi: created.skAkreditasi,
      status: created.status,
    };
  }

  async update(id: string, data: any) {
    if (data.facultyId !== undefined) {
      const faculty = await this.prisma.faculty.findUnique({ where: { id: data.facultyId } });
      if (!faculty) {
        throw new BadRequestException('Fakultas induk yang dipilih tidak ditemukan.');
      }
    }

    const updated = await this.prisma.studyProgram.update({
      where: { id },
      data: {
        facultyId: data.facultyId !== undefined ? data.facultyId : undefined,
        code: data.code !== undefined ? data.code.trim() : undefined,
        diktiCode: data.diktiCode !== undefined ? data.diktiCode.trim() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        degreeLevel: data.degreeLevel !== undefined ? data.degreeLevel : undefined,
        degreeTitle: data.degreeTitle !== undefined ? data.degreeTitle.trim() : undefined,
        accreditation: data.accreditation !== undefined ? data.accreditation : undefined,
        accreditationAgency: data.accreditationAgency !== undefined ? data.accreditationAgency.trim() : undefined,
        skAkreditasi: data.skAkreditasi !== undefined ? data.skAkreditasi.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        studentsCount: data.studentsCount !== undefined ? Number(data.studentsCount) : undefined,
        lecturersCount: data.lecturersCount !== undefined ? Number(data.lecturersCount) : undefined,
      },
      include: { faculty: true, ...KAPRODI_INCLUDE },
    });
    const kaprodi = updated.kaprodiLecturers[0];

    return {
      id: updated.id,
      code: updated.code,
      diktiCode: updated.diktiCode,
      name: updated.name,
      degreeLevel: updated.degreeLevel,
      degreeTitle: updated.degreeTitle,
      facultyId: updated.facultyId,
      facultyCode: updated.faculty?.code,
      facultyName: updated.faculty?.name,
      headOfProgram: kaprodi ? formatLecturerName(kaprodi) : null,
      headNip: kaprodi?.nip ?? null,
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
