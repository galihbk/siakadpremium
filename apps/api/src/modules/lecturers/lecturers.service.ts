import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LecturerDashboardSummary } from '@siakad/types';

@Injectable()
export class LecturersService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(): Promise<LecturerDashboardSummary> {
    return {
      nidn: '0412088501',
      nama: 'Dr. Bayu Wicaksono, M.Kom.',
      jabatanFungsional: 'Lektor Kepala / Dosen Pembimbing Akademik',
      fakultas: 'Fakultas Ilmu Komputer',
      totalKelasMengajar: 4,
      totalMahasiswaBimbingan: 28,
      statusInputNilai: 'PROSES',
    };
  }

  async getTeachingSchedule() {
    return [
      { id: 'c1', mataKuliah: 'Rekayasa Perangkat Lunak', kelas: 'TIF-5A', hari: 'Senin', waktu: '08.00 - 10.30 WIB', ruang: 'Lab Komputasi 3', jumlahMahasiswa: 35 },
      { id: 'c2', mataKuliah: 'Rekayasa Perangkat Lunak', kelas: 'TIF-5B', hari: 'Senin', waktu: '13.00 - 15.30 WIB', ruang: 'Lab Komputasi 3', jumlahMahasiswa: 34 },
      { id: 'c3', mataKuliah: 'Arsitektur Perangkat Lunak Enterprise', kelas: 'TIF-7A', hari: 'Rabu', waktu: '08.00 - 10.30 WIB', ruang: 'Ruang Seminar 204', jumlahMahasiswa: 28 },
      { id: 'c4', mataKuliah: 'Bimbingan Tugas Akhir / Skripsi', kelas: 'SKRIPSI', hari: 'Kamis', waktu: '10.00 - 14.00 WIB', ruang: 'Ruang Dosen FIK', jumlahMahasiswa: 12 },
    ];
  }
}
