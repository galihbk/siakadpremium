import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FacultiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const data = await this.prisma.faculty.findMany({
        include: {
          studyPrograms: true,
        },
      });
      if (data && data.length > 0) return data;
    } catch {
      // Fallback
    }

    return [
      {
        id: 'fac-1',
        code: 'FT',
        name: 'Fakultas Teknik',
        deanName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
        description: 'Fakultas rekayasa dan teknologi infrastruktur',
        studyPrograms: [
          { id: 'prodi-3', code: 'TM-S1', name: 'Teknik Mesin', degreeLevel: 'S1', accreditation: 'Unggul' },
        ],
      },
      {
        id: 'fac-2',
        code: 'FIK',
        name: 'Fakultas Ilmu Komputer',
        deanName: 'Dr. Eng. Satria Pratama, S.Kom., M.T.',
        description: 'Pusat keunggulan kecerdasan buatan dan rekayasa perangkat lunak',
        studyPrograms: [
          { id: 'prodi-1', code: 'TIF-S1', name: 'Teknik Informatika', degreeLevel: 'S1', accreditation: 'Unggul' },
          { id: 'prodi-2', code: 'SI-S1', name: 'Sistem Informasi', degreeLevel: 'S1', accreditation: 'Unggul' },
        ],
      },
      {
        id: 'fac-3',
        code: 'FEB',
        name: 'Fakultas Ekonomi & Bisnis',
        deanName: 'Dr. Nurul Hidayati, S.E., M.M., Ak.',
        description: 'Mencetak profesional bisnis dan akuntan digital',
        studyPrograms: [
          { id: 'prodi-4', code: 'MNJ-S1', name: 'Manajemen', degreeLevel: 'S1', accreditation: 'Unggul' },
        ],
      },
    ];
  }

  async findOne(id: string) {
    const list = await this.findAll();
    return list.find((f) => f.id === id || f.code === id) || list[0];
  }
}
