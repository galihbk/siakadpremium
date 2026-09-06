import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AdminDashboardSummary } from '@siakad/types';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  async getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
    return {
      totalMahasiswaAktif: 8540,
      totalDosen: 324,
      totalProgramStudi: 22,
      totalFakultas: 6,
      persentaseRegistrasiKRS: 96.8,
      mahasiswaBaruTerdaftar: 1850,
    };
  }

  async getActiveAcademicYear() {
    return {
      code: '20261',
      name: 'Tahun Akademik 2026/2027',
      semester: 'Gasal (Ganjil)',
      krsPeriod: '15 Agustus 2026 - 31 Agustus 2026',
      status: 'Sedang Berlangsung',
      currentWeek: 4,
    };
  }

  async getCourses() {
    return [
      { code: 'TIF-101', name: 'Algoritma & Pemrograman Dasar', sks: 3, semester: 1, prodi: 'Teknik Informatika' },
      { code: 'TIF-201', name: 'Struktur Data & Analisis Algoritma', sks: 3, semester: 3, prodi: 'Teknik Informatika' },
      { code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, semester: 5, prodi: 'Teknik Informatika' },
      { code: 'TIF-305', name: 'Pemrograman Web & Cloud Lanjut', sks: 3, semester: 5, prodi: 'Teknik Informatika' },
      { code: 'TIF-401', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, semester: 7, prodi: 'Teknik Informatika' },
      { code: 'SI-202', name: 'Analisis & Perancangan Sistem Informasi', sks: 3, semester: 3, prodi: 'Sistem Informasi' },
    ];
  }
}
