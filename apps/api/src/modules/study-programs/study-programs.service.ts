import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class StudyProgramsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const data = await this.prisma.studyProgram.findMany({
        include: { faculty: true },
      });
      if (data && data.length > 0) return data;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'prodi-1',
        code: 'TIF-S1',
        name: 'Teknik Informatika',
        degreeLevel: 'S1',
        accreditation: 'Unggul',
        headOfProgram: 'Dr. Bayu Wicaksono, M.Kom.',
        faculty: { name: 'Fakultas Ilmu Komputer', code: 'FIK' },
      },
      {
        id: 'prodi-2',
        code: 'SI-S1',
        name: 'Sistem Informasi',
        degreeLevel: 'S1',
        accreditation: 'Unggul',
        headOfProgram: 'Ir. Anita Rahmawati, M.T.',
        faculty: { name: 'Fakultas Ilmu Komputer', code: 'FIK' },
      },
      {
        id: 'prodi-3',
        code: 'TM-S1',
        name: 'Teknik Mesin',
        degreeLevel: 'S1',
        accreditation: 'Unggul',
        headOfProgram: 'Dr. Ir. Budi Hartono, M.T.',
        faculty: { name: 'Fakultas Teknik', code: 'FT' },
      },
      {
        id: 'prodi-4',
        code: 'MNJ-S1',
        name: 'Manajemen Bisnis',
        degreeLevel: 'S1',
        accreditation: 'Unggul',
        headOfProgram: 'Dr. Rina Suryani, S.E., M.M.',
        faculty: { name: 'Fakultas Ekonomi & Bisnis', code: 'FEB' },
      },
    ];
  }
}
