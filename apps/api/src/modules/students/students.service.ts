import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StudentDashboardSummary, EnrollmentStatus } from '@siakad/types';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(userId?: string): Promise<StudentDashboardSummary> {
    try {
      const student = await this.prisma.student.findFirst({
        include: {
          user: true,
          studyProgram: {
            include: { faculty: true },
          },
          advisorLecturer: {
            include: { user: true },
          },
        },
      });

      if (student) {
        return {
          nim: student.nim,
          nama: student.user.fullName,
          programStudi: student.studyProgram.name,
          fakultas: student.studyProgram.faculty.name,
          semesterAktif: student.currentSemester,
          ipk: 3.84,
          ipsTerakhir: 3.9,
          totalSksLulus: 88,
          dosenPembimbingAkademik: student.advisorLecturer?.user.fullName || 'Dr. Bayu Wicaksono, M.Kom.',
          statusKrs: EnrollmentStatus.APPROVED,
          tagihanSppStatus: 'PAID',
        };
      }
    } catch {
      // Fallback
    }

    return {
      nim: '2311501001',
      nama: 'Muhammad Rizky Pratama',
      programStudi: 'Teknik Informatika (S1)',
      fakultas: 'Fakultas Ilmu Komputer',
      semesterAktif: 5,
      ipk: 3.84,
      ipsTerakhir: 3.9,
      totalSksLulus: 88,
      dosenPembimbingAkademik: 'Dr. Bayu Wicaksono, M.Kom.',
      statusKrs: EnrollmentStatus.APPROVED,
      tagihanSppStatus: 'PAID',
    };
  }

  async getKrs(studentId?: string) {
    return [
      { id: '1', code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, dosen: 'Dr. Bayu Wicaksono, M.Kom.', hari: 'Senin', jam: '08.00 - 10.30', ruang: 'Lab Komputasi 3' },
      { id: '2', code: 'TIF-305', name: 'Pemrograman Web & Cloud Lanjut', sks: 3, dosen: 'Ir. Anita Rahmawati, M.T.', hari: 'Selasa', jam: '10.30 - 13.00', ruang: 'Lab Software Eng.' },
      { id: '3', code: 'TIF-308', name: 'Keamanan Siber & Kriptografi Terapan', sks: 3, dosen: 'Dr. Hendra Saputra, S.T., M.Kom.', hari: 'Rabu', jam: '13.00 - 15.30', ruang: 'Ruang Teori 402' },
      { id: '4', code: 'TIF-312', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, dosen: 'Prof. Dr. Eng. Satria Pratama', hari: 'Kamis', jam: '08.00 - 10.30', ruang: 'Auditorium Riset' },
      { id: '5', code: 'UNIV-204', name: 'Kewirausahaan Berbasis Teknologi (Technopreneurship)', sks: 2, dosen: 'Dr. Nurul Hidayati, M.M.', hari: 'Jumat', jam: '09.00 - 10.40', ruang: 'Ruang Teori 201' },
    ];
  }
}
