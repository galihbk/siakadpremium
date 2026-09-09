import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '@siakad/database';
import { LecturerDashboardSummary } from '@siakad/types';

export interface CreateLecturerDto {
  email: string;
  password?: string;
  fullName: string;
  nidn: string;
  nip?: string;
  titlePrefix?: string;
  titleSuffix?: string;
  studyProgramId?: string;
  phone?: string;
  isAcademicAdvisor?: boolean;
  isActive?: boolean;
}

export interface UpdateLecturerDto {
  email?: string;
  password?: string;
  fullName?: string;
  nidn?: string;
  nip?: string;
  titlePrefix?: string;
  titleSuffix?: string;
  studyProgramId?: string;
  phone?: string;
  isAcademicAdvisor?: boolean;
  isActive?: boolean;
}

@Injectable()
export class LecturersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const lecturers = await this.prisma.lecturer.findMany({
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return lecturers.map((lec) => ({
      id: lec.id,
      userId: lec.userId,
      nidn: lec.nidn,
      nip: lec.nip || '-',
      fullName: lec.user.fullName,
      titlePrefix: lec.titlePrefix || '',
      titleSuffix: lec.titleSuffix || '',
      email: lec.user.email,
      phone: lec.phone || '',
      studyProgramId: lec.studyProgramId,
      studyProgramName: lec.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lec.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lec.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lec.isAcademicAdvisor,
      isActive: lec.user.isActive,
      role: lec.user.role,
      createdAt: lec.createdAt,
    }));
  }

  async findOne(id: string) {
    const lec = await this.prisma.lecturer.findUnique({
      where: { id },
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!lec) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    return {
      id: lec.id,
      userId: lec.userId,
      nidn: lec.nidn,
      nip: lec.nip || '-',
      fullName: lec.user.fullName,
      titlePrefix: lec.titlePrefix || '',
      titleSuffix: lec.titleSuffix || '',
      email: lec.user.email,
      phone: lec.phone || '',
      studyProgramId: lec.studyProgramId,
      studyProgramName: lec.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lec.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lec.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lec.isAcademicAdvisor,
      isActive: lec.user.isActive,
      role: lec.user.role,
      createdAt: lec.createdAt,
    };
  }

  async create(dto: CreateLecturerDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException(`Email "${dto.email}" sudah terdaftar dalam sistem.`);
    }

    // Check if NIDN already exists
    if (dto.nidn) {
      const existingNidn = await this.prisma.lecturer.findUnique({ where: { nidn: dto.nidn } });
      if (existingNidn) {
        throw new BadRequestException(`NIDN "${dto.nidn}" sudah terdaftar.`);
      }
    }

    const password = dto.password || 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve studyProgramId
    let studyProgramId = dto.studyProgramId;
    if (!studyProgramId) {
      const firstProdi = await this.prisma.studyProgram.findFirst();
      studyProgramId = firstProdi ? firstProdi.id : 'default-prodi';
    }

    // Create User with role LECTURER
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: Role.LECTURER,
        passwordHash,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    // Create Lecturer Profile
    const lecturer = await this.prisma.lecturer.create({
      data: {
        userId: user.id,
        studyProgramId,
        nidn: dto.nidn || `04${Date.now().toString().slice(-8)}`,
        nip: dto.nip || null,
        titlePrefix: dto.titlePrefix || null,
        titleSuffix: dto.titleSuffix || null,
        phone: dto.phone || null,
        isAcademicAdvisor: dto.isAcademicAdvisor !== undefined ? dto.isAcademicAdvisor : true,
      },
      include: {
        user: true,
        studyProgram: {
          include: { faculty: true },
        },
      },
    });

    return {
      id: lecturer.id,
      userId: user.id,
      nidn: lecturer.nidn,
      nip: lecturer.nip || '-',
      fullName: user.fullName,
      titlePrefix: lecturer.titlePrefix || '',
      titleSuffix: lecturer.titleSuffix || '',
      email: user.email,
      phone: lecturer.phone || '',
      studyProgramId: lecturer.studyProgramId,
      studyProgramName: lecturer.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: lecturer.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: lecturer.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: lecturer.isAcademicAdvisor,
      isActive: user.isActive,
      role: user.role,
      createdAt: lecturer.createdAt,
    };
  }

  async update(id: string, dto: UpdateLecturerDto) {
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    // Update User details
    const userUpdateData: any = {};
    if (dto.fullName) userUpdateData.fullName = dto.fullName;
    if (dto.email && dto.email !== lecturer.user.email) userUpdateData.email = dto.email;
    if (dto.isActive !== undefined) userUpdateData.isActive = dto.isActive;
    if (dto.password) {
      userUpdateData.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: lecturer.userId },
        data: userUpdateData,
      });
    }

    // Update Lecturer profile
    const lecturerUpdateData: any = {};
    if (dto.nidn) lecturerUpdateData.nidn = dto.nidn;
    if (dto.nip !== undefined) lecturerUpdateData.nip = dto.nip;
    if (dto.titlePrefix !== undefined) lecturerUpdateData.titlePrefix = dto.titlePrefix;
    if (dto.titleSuffix !== undefined) lecturerUpdateData.titleSuffix = dto.titleSuffix;
    if (dto.phone !== undefined) lecturerUpdateData.phone = dto.phone;
    if (dto.studyProgramId) lecturerUpdateData.studyProgramId = dto.studyProgramId;
    if (dto.isAcademicAdvisor !== undefined) lecturerUpdateData.isAcademicAdvisor = dto.isAcademicAdvisor;

    const updated = await this.prisma.lecturer.update({
      where: { id },
      data: lecturerUpdateData,
      include: {
        user: true,
        studyProgram: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      nidn: updated.nidn,
      nip: updated.nip || '-',
      fullName: updated.user.fullName,
      titlePrefix: updated.titlePrefix || '',
      titleSuffix: updated.titleSuffix || '',
      email: updated.user.email,
      phone: updated.phone || '',
      studyProgramId: updated.studyProgramId,
      studyProgramName: updated.studyProgram?.name || 'Program Studi Terpadu',
      facultyCode: updated.studyProgram?.faculty?.code || 'UNIVERSITAS',
      facultyName: updated.studyProgram?.faculty?.name || 'Institut Teknologi & Sains',
      isAcademicAdvisor: updated.isAcademicAdvisor,
      isActive: updated.user.isActive,
      role: updated.user.role,
      createdAt: updated.createdAt,
    };
  }

  async remove(id: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    // Deleting the user will cascade delete the lecturer profile
    await this.prisma.user.delete({ where: { id: lecturer.userId } });
    return { success: true, message: 'Akun dosen berhasil dihapus dari sistem.' };
  }

  async resetPassword(id: string, newPassword?: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) {
      throw new NotFoundException(`Dosen dengan ID "${id}" tidak ditemukan.`);
    }

    const password = newPassword || 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: lecturer.userId },
      data: { passwordHash },
    });

    return { success: true, message: `Password berhasil direset menjadi "${password}".` };
  }

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

  // ================= MAHASISWA BIMBINGAN (ADVISEES) =================
  private static adviseesStore: any[] = [
    {
      id: 'mhs-1',
      nim: '2311501001',
      fullName: 'Muhammad Rizky Pratama',
      gender: 'Laki-laki',
      angkatan: 2023,
      currentSemester: 5,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.82,
      totalSksLulus: 84,
      sksSemesterIni: 21,
      krsStatus: 'Menunggu Persetujuan',
      phone: '0812-3456-7890',
      email: 'rizky.pratama@mhs.itn.ac.id',
      statusBimbingan: 'KRS',
      skripsiTitle: null,
      skripsiProgress: null,
      courses: [
        { code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, class: 'TIF-5A', schedule: 'Senin, 08.00 - 10.30' },
        { code: 'TIF-302', name: 'Pemrograman Web Berbasis Komponen', sks: 3, class: 'TIF-5A', schedule: 'Selasa, 10.00 - 12.30' },
        { code: 'TIF-303', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, class: 'TIF-5A', schedule: 'Rabu, 08.00 - 10.30' },
        { code: 'TIF-304', name: 'Keamanan Jaringan & Kriptografi', sks: 3, class: 'TIF-5B', schedule: 'Kamis, 13.00 - 15.30' },
        { code: 'TIF-305', name: 'Cloud Computing & DevOps', sks: 3, class: 'TIF-5A', schedule: 'Jumat, 08.00 - 10.30' },
        { code: 'MKDU-006', name: 'Kewirausahaan Berbasis Teknologi', sks: 2, class: 'REG-A', schedule: 'Jumat, 13.30 - 15.10' },
        { code: 'TIF-306', name: 'Kapita Selekta Informatika', sks: 4, class: 'TIF-5A', schedule: 'Sabtu, 09.00 - 12.20' },
      ],
      consultations: [
        { id: 'cs-1', date: '25 Agustus 2026', topic: 'Penyusunan Rencana Studi Semester 5', note: 'Direkomendasikan mengambil peminatan Software Engineering & Cloud.' },
      ],
    },
    {
      id: 'mhs-2',
      nim: '2311501045',
      fullName: 'Nadia Salsabila Putri',
      gender: 'Perempuan',
      angkatan: 2023,
      currentSemester: 5,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.91,
      totalSksLulus: 88,
      sksSemesterIni: 22,
      krsStatus: 'Menunggu Persetujuan',
      phone: '0813-9876-5432',
      email: 'nadia.salsabila@mhs.itn.ac.id',
      statusBimbingan: 'KRS',
      skripsiTitle: null,
      skripsiProgress: null,
      courses: [
        { code: 'TIF-301', name: 'Rekayasa Perangkat Lunak', sks: 3, class: 'TIF-5A', schedule: 'Senin, 08.00 - 10.30' },
        { code: 'TIF-302', name: 'Pemrograman Web Berbasis Komponen', sks: 3, class: 'TIF-5A', schedule: 'Selasa, 10.00 - 12.30' },
        { code: 'TIF-303', name: 'Kecerdasan Buatan & Machine Learning', sks: 3, class: 'TIF-5A', schedule: 'Rabu, 08.00 - 10.30' },
        { code: 'TIF-304', name: 'Keamanan Jaringan & Kriptografi', sks: 3, class: 'TIF-5A', schedule: 'Kamis, 08.00 - 10.30' },
        { code: 'TIF-305', name: 'Cloud Computing & DevOps', sks: 3, class: 'TIF-5A', schedule: 'Jumat, 08.00 - 10.30' },
        { code: 'TIF-307', name: 'Etika Profesi & Hukum Siber', sks: 3, class: 'TIF-5B', schedule: 'Jumat, 14.00 - 16.30' },
        { code: 'TIF-306', name: 'Kapita Selekta Informatika', sks: 4, class: 'TIF-5A', schedule: 'Sabtu, 09.00 - 12.20' },
      ],
      consultations: [
        { id: 'cs-2', date: '26 Agustus 2026', topic: 'Rencana Magang Bersertifikat Kampus Merdeka', note: 'Mahasiswa memenuhi kualifikasi IPK untuk program MSIB Kemendikbud.' },
      ],
    },
    {
      id: 'mhs-3',
      nim: '2211501012',
      fullName: 'Fajar Nugroho Wicaksono',
      gender: 'Laki-laki',
      angkatan: 2022,
      currentSemester: 7,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.65,
      totalSksLulus: 124,
      sksSemesterIni: 18,
      krsStatus: 'Disetujui',
      phone: '0815-1122-3344',
      email: 'fajar.nugroho@mhs.itn.ac.id',
      statusBimbingan: 'Skripsi',
      skripsiTitle: 'Implementasi Arsitektur Microservices pada Sistem Informasi Layanan Publik Terdistribusi',
      skripsiProgress: 'Pengajuan Ujian Proposal Skripsi',
      courses: [
        { code: 'TIF-401', name: 'Metodologi Penelitian & Penulisan Ilmiah', sks: 3, class: 'TIF-7A', schedule: 'Senin, 10.00 - 12.30' },
        { code: 'TIF-402', name: 'Tugas Akhir / Proposal Skripsi', sks: 4, class: 'SKRIPSI', schedule: 'Kamis, 10.00 - 14.00' },
        { code: 'TIF-702', name: 'Arsitektur Perangkat Lunak Enterprise', sks: 3, class: 'TIF-7A', schedule: 'Rabu, 08.00 - 10.30' },
      ],
      consultations: [
        { id: 'cs-3', date: '20 Agustus 2026', topic: 'Konsultasi Bab 1 & 2 Proposal Skripsi', note: 'Revisi latar belakang masalah dan tinjauan pustaka terkini disetujui.' },
      ],
    },
    {
      id: 'mhs-4',
      nim: '2211501024',
      fullName: 'Aulia Rahmadani',
      gender: 'Perempuan',
      angkatan: 2022,
      currentSemester: 7,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.74,
      totalSksLulus: 128,
      sksSemesterIni: 16,
      krsStatus: 'Disetujui',
      phone: '0812-7766-5544',
      email: 'aulia.rahmadani@mhs.itn.ac.id',
      statusBimbingan: 'Skripsi',
      skripsiTitle: 'Penerapan Model Deep Learning untuk Deteksi Dini Anomali Trafik Jaringan Kampus',
      skripsiProgress: 'Bimbingan Bab 3 & 4 (Hasil Eksperimen)',
      courses: [
        { code: 'TIF-402', name: 'Tugas Akhir / Skripsi', sks: 6, class: 'SKRIPSI', schedule: 'Kamis, 10.00 - 14.00' },
        { code: 'TIF-702', name: 'Arsitektur Perangkat Lunak Enterprise', sks: 3, class: 'TIF-7A', schedule: 'Rabu, 08.00 - 10.30' },
      ],
      consultations: [
        { id: 'cs-4', date: '18 Agustus 2026', topic: 'Diskusi Dataset Pengujian Model', note: 'Dataset NSL-KDD dan CICIDS2017 disetujui untuk simulasi evaluasi akurasi.' },
      ],
    },
    {
      id: 'mhs-5',
      nim: '2411501008',
      fullName: 'Dimas Aditya Saputra',
      gender: 'Laki-laki',
      angkatan: 2024,
      currentSemester: 3,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.55,
      totalSksLulus: 42,
      sksSemesterIni: 20,
      krsStatus: 'Disetujui',
      phone: '0813-4455-6677',
      email: 'dimas.aditya@mhs.itn.ac.id',
      statusBimbingan: 'KRS',
      skripsiTitle: null,
      skripsiProgress: null,
      courses: [
        { code: 'TIF-201', name: 'Algoritma & Pemrograman Lanjut', sks: 4, class: 'TIF-3A', schedule: 'Selasa, 08.00 - 11.20' },
        { code: 'TIF-202', name: 'Struktur Data & Kompleksitas Algoritma', sks: 3, class: 'TIF-3A', schedule: 'Senin, 13.00 - 15.30' },
        { code: 'TIF-203', name: 'Sistem Operasi & Shell Scripting', sks: 3, class: 'TIF-3B', schedule: 'Rabu, 10.00 - 12.30' },
      ],
      consultations: [
        { id: 'cs-5', date: '22 Agustus 2026', topic: 'Evaluasi Indeks Prestasi Semester 2', note: 'Nilai matematika diskrit dan pemrograman meningkat dengan baik.' },
      ],
    },
    {
      id: 'mhs-6',
      nim: '2411501033',
      fullName: 'Citra Ayu Lestari',
      gender: 'Perempuan',
      angkatan: 2024,
      currentSemester: 3,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.78,
      totalSksLulus: 44,
      sksSemesterIni: 21,
      krsStatus: 'Menunggu Persetujuan',
      phone: '0819-2233-4455',
      email: 'citra.ayu@mhs.itn.ac.id',
      statusBimbingan: 'KRS',
      skripsiTitle: null,
      skripsiProgress: null,
      courses: [
        { code: 'TIF-201', name: 'Algoritma & Pemrograman Lanjut', sks: 4, class: 'TIF-3A', schedule: 'Selasa, 08.00 - 11.20' },
        { code: 'TIF-202', name: 'Struktur Data & Kompleksitas Algoritma', sks: 3, class: 'TIF-3A', schedule: 'Senin, 13.00 - 15.30' },
        { code: 'TIF-203', name: 'Sistem Operasi & Shell Scripting', sks: 3, class: 'TIF-3A', schedule: 'Rabu, 10.00 - 12.30' },
      ],
      consultations: [],
    },
    {
      id: 'mhs-7',
      nim: '2111501005',
      fullName: 'Bagas Pratama Putra',
      gender: 'Laki-laki',
      angkatan: 2021,
      currentSemester: 9,
      studyProgramName: 'Teknik Informatika',
      facultyName: 'Fakultas Ilmu Komputer',
      ipk: 3.42,
      totalSksLulus: 138,
      sksSemesterIni: 6,
      krsStatus: 'Disetujui',
      phone: '0811-2233-9988',
      email: 'bagas.pratama@mhs.itn.ac.id',
      statusBimbingan: 'Skripsi',
      skripsiTitle: 'Sistem Pendukung Keputusan Penentuan Kelayakan Akreditasi Menggunakan Metode TOPSIS',
      skripsiProgress: 'Siap Ujian Sidang Skripsi',
      courses: [
        { code: 'TIF-499', name: 'Ujian Sidang Sarjana / Skripsi', sks: 6, class: 'SKRIPSI', schedule: 'Kamis, 10.00 - 14.00' },
      ],
      consultations: [
        { id: 'cs-6', date: '15 Agustus 2026', topic: 'Pengecekan Plagiarisme Turnitin & Kelayakan Sidang', note: 'Skor Turnitin 12% (Lolos). Berkas pendaftaran sidang skripsi ditandatangani.' },
      ],
    },
  ];

  async getAdvisees(query?: { angkatan?: number; status?: string; search?: string }) {
    let list = [...LecturersService.adviseesStore];

    if (query?.angkatan && Number(query.angkatan) > 0) {
      list = list.filter((m) => m.angkatan === Number(query.angkatan));
    }
    if (query?.status && query.status !== 'Semua') {
      if (query.status === 'KRS Menunggu') {
        list = list.filter((m) => m.krsStatus === 'Menunggu Persetujuan');
      } else if (query.status === 'KRS Disetujui') {
        list = list.filter((m) => m.krsStatus === 'Disetujui');
      } else if (query.status === 'Bimbingan Skripsi') {
        list = list.filter((m) => m.statusBimbingan === 'Skripsi');
      }
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter((m) => m.fullName.toLowerCase().includes(q) || m.nim.includes(q));
    }

    const totalStudents = LecturersService.adviseesStore.length;
    const pendingKrs = LecturersService.adviseesStore.filter((m) => m.krsStatus === 'Menunggu Persetujuan').length;
    const approvedKrs = LecturersService.adviseesStore.filter((m) => m.krsStatus === 'Disetujui').length;
    const thesisStudents = LecturersService.adviseesStore.filter((m) => m.statusBimbingan === 'Skripsi').length;

    return {
      summary: {
        totalStudents,
        pendingKrs,
        approvedKrs,
        thesisStudents,
      },
      students: list,
    };
  }

  async approveStudentKrs(studentId: string, note?: string) {
    const student = LecturersService.adviseesStore.find((m) => m.id === studentId || m.nim === studentId);
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID atau NIM "${studentId}" tidak ditemukan.`);
    }

    student.krsStatus = 'Disetujui';
    if (note) {
      student.consultations.unshift({
        id: `cs-${Date.now()}`,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        topic: 'Validasi & Persetujuan KRS Online',
        note,
      });
    }

    return {
      success: true,
      message: `KRS mahasiswa ${student.fullName} (${student.nim}) berhasil disetujui resmi oleh Dosen PA.`,
      data: student,
    };
  }

  async addAdviseeConsultation(studentId: string, payload: { topic: string; note: string }) {
    const student = LecturersService.adviseesStore.find((m) => m.id === studentId || m.nim === studentId);
    if (!student) {
      throw new NotFoundException(`Mahasiswa dengan ID atau NIM "${studentId}" tidak ditemukan.`);
    }

    const newConsultation = {
      id: `cs-${Date.now()}`,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      topic: payload.topic || 'Bimbingan Konsultasi Akademik',
      note: payload.note,
    };

    student.consultations.unshift(newConsultation);

    return {
      success: true,
      message: 'Catatan konsultasi bimbingan akademik berhasil ditambahkan.',
      data: newConsultation,
    };
  }

  // ================= P3M (PENELITIAN & PENGABDIAN KEPADA MASYARAKAT) =================
  private static p3mStore: any[] = [
    {
      id: 'p3m-1',
      type: 'Penelitian',
      title: 'Rancang Bangun Framework Microservices Berbasis Event-Driven untuk Skalabilitas Sistem Informasi Pendidikan Tinggi',
      scheme: 'Penelitian Terapan Kemendikbudristek (BIMA)',
      focusArea: 'Rekayasa Perangkat Lunak Terdistribusi',
      year: 2025,
      status: 'Selesai',
      fundingAmount: 45000000,
      fundingSource: 'Kemendikbudristek / BIMA',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Ir. Rahmat Hidayat, M.T.', 'Muhammad Rizky Pratama (Mhs - 2311501001)'],
      targetOutput: 'Jurnal Terakreditasi SINTA 2 & Prototipe Sistem Teruji',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-akhir-p3m-1.pdf',
      submittedAt: '15 Maret 2025',
      verifiedAt: '20 April 2025',
      reviewerNote: 'Laporan akhir dan luaran publikasi SINTA 2 telah lengkap diverifikasi LP3M.',
    },
    {
      id: 'p3m-2',
      type: 'Penelitian',
      title: 'Implementasi Algoritma Deep Learning Transformer untuk Deteksi Dini Kerentanan Keamanan Kode Sumber Aplikasi Web',
      scheme: 'Penelitian Fundamental Internal ITN',
      focusArea: 'Kecerdasan Buatan & Keamanan Siber',
      year: 2026,
      status: 'Sedang Berjalan',
      fundingAmount: 20000000,
      fundingSource: 'DIPA Internal ITN',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Nadia Salsabila Putri (Mhs - 2311501045)'],
      targetOutput: 'Prosiding Internasional Terindeks Scopus & Hak Cipta Perangkat Lunak',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-kemajuan-p3m-2.pdf',
      submittedAt: '10 Februari 2026',
      verifiedAt: '05 Maret 2026',
      reviewerNote: 'Laporan kemajuan 70% disetujui. Siap publikasi prosiding konferensi internasional.',
    },
    {
      id: 'p3m-3',
      type: 'Pengabdian',
      title: 'Digitalisasi Tata Kelola Administrasi dan Promosi Produk UMKM Berbasis Web di Desa Wisata Sumbersekar',
      scheme: 'Pengabdian Kemitraan Wilayah Berkelanjutan',
      focusArea: 'Pemberdayaan Ekonomi Digital Desa',
      year: 2025,
      status: 'Selesai',
      fundingAmount: 18000000,
      fundingSource: 'DIPA Internal ITN & CSR Mitra',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Siti Aminah, S.Kom., M.Cs.', 'Dimas Aditya Saputra (Mhs - 2411501008)'],
      targetOutput: 'Publikasi Jurnal Pengabdian SINTA 4, Video Dokumenter & Website Desa',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-akhir-pkm-3.pdf',
      submittedAt: '01 Juni 2025',
      verifiedAt: '15 Agustus 2025',
      reviewerNote: 'Pengabdian selesai dengan hasil kepuasan mitra desa 94%. Luaran video dan web tuntas.',
    },
    {
      id: 'p3m-4',
      type: 'Pengabdian',
      title: 'Pelatihan Literasi Keamanan Siber dan Perlindungan Data Pribadi bagi Siswa dan Guru SMK Informatika Nusantara',
      scheme: 'Penerapan Iptek bagi Masyarakat (PIM)',
      focusArea: 'Literasi Digital & Cyber Hygiene',
      year: 2026,
      status: 'Laporan Akhir',
      fundingAmount: 15000000,
      fundingSource: 'DIPA Internal ITN',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Fajar Nugroho Wicaksono (Mhs - 2211501012)'],
      targetOutput: 'Modul Pelatihan Ber-ISBN, Sertifikat Hak Cipta & Publikasi Media',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/draft-laporan-pkm-4.pdf',
      submittedAt: '20 Januari 2026',
      verifiedAt: '28 Februari 2026',
      reviewerNote: 'Draft laporan akhir sedang dalam proses telaah reviewer akhir P3M.',
    },
    {
      id: 'p3m-5',
      type: 'Penelitian',
      title: 'Optimasi Resource Allocation pada Arsitektur Serverless Multi-Cloud Berbantuan Artificial Intelligence',
      scheme: 'Penelitian Terapan Kerjasama Industri',
      focusArea: 'Cloud Computing & Distributed Systems',
      year: 2026,
      status: 'Laporan Masuk',
      fundingAmount: 35000000,
      fundingSource: 'Hibah Kolaborasi Riset Industri',
      leader: 'Dr. Bayu Wicaksono, M.Kom.',
      members: ['Ir. Bambang Tri, M.T.', 'Aulia Rahmadani (Mhs - 2211501024)'],
      targetOutput: 'Jurnal Internasional Terindeks Scopus Q2 & Paten Sederhana',
      documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-riset-p3m-5.pdf',
      submittedAt: '12 Agustus 2026',
      verifiedAt: '25 Agustus 2026',
      reviewerNote: 'Laporan kegiatan riset telah diverifikasi dan tercatat dalam arsip akreditasi kampus.',
    },
  ];

  async getP3mReports(query?: { type?: string; year?: number; status?: string; search?: string }) {
    let list = [...LecturersService.p3mStore];

    if (query?.type && query.type !== 'Semua') {
      list = list.filter((item) => item.type.toLowerCase() === query.type.toLowerCase());
    }

    if (query?.year && Number(query.year) > 0) {
      list = list.filter((item) => item.year === Number(query.year));
    }

    if (query?.status && query.status !== 'Semua') {
      list = list.filter((item) => item.status.toLowerCase() === query.status.toLowerCase());
    }

    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.scheme.toLowerCase().includes(q) ||
          item.focusArea.toLowerCase().includes(q) ||
          item.leader.toLowerCase().includes(q)
      );
    }

    const totalPenelitian = LecturersService.p3mStore.filter((i) => i.type === 'Penelitian').length;
    const totalPengabdian = LecturersService.p3mStore.filter((i) => i.type === 'Pengabdian').length;
    const totalDana = LecturersService.p3mStore.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);
    const aktifBerjalan = LecturersService.p3mStore.filter((i) => i.status === 'Sedang Berjalan' || i.status === 'Laporan Akhir').length;

    return {
      summary: {
        totalKegiatan: LecturersService.p3mStore.length,
        totalPenelitian,
        totalPengabdian,
        totalDana,
        aktifBerjalan,
      },
      reports: list,
    };
  }

  async createP3mReport(dto: any) {
    const newReport = {
      id: `p3m-${Date.now()}`,
      type: dto.type || 'Penelitian',
      title: dto.title,
      scheme: dto.scheme || 'Penelitian Fundamental Internal ITN',
      focusArea: dto.focusArea || 'Teknologi Informasi & Sains Terapan',
      year: dto.year ? Number(dto.year) : new Date().getFullYear(),
      status: dto.status || 'Laporan Masuk',
      fundingAmount: dto.fundingAmount ? Number(dto.fundingAmount) : 15000000,
      fundingSource: dto.fundingSource || 'DIPA Internal ITN',
      leader: dto.leader || 'Dr. Bayu Wicaksono, M.Kom.',
      members: Array.isArray(dto.members) ? dto.members : (dto.members ? dto.members.split(',').map((s: string) => s.trim()) : []),
      targetOutput: dto.targetOutput || 'Publikasi Jurnal Terakreditasi Nasional & Laporan Akhir',
      documentUrl: dto.documentUrl || 'https://siakad.itn.ac.id/dokumen/p3m/berkas-laporan.pdf',
      submittedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      verifiedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      reviewerNote: 'Laporan kegiatan telah dicatat dan terverifikasi dalam arsip akreditasi Tri Dharma P3M.',
    };

    LecturersService.p3mStore.unshift(newReport);
    return {
      success: true,
      message: `Laporan ${newReport.type} "${newReport.title}" berhasil disimpan ke arsip P3M.`,
      data: newReport,
    };
  }

  async updateP3mReport(id: string, dto: any) {
    const index = LecturersService.p3mStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Laporan P3M dengan ID "${id}" tidak ditemukan.`);
    }

    const current = LecturersService.p3mStore[index];
    const updated = {
      ...current,
      ...dto,
      year: dto.year ? Number(dto.year) : current.year,
      fundingAmount: dto.fundingAmount !== undefined ? Number(dto.fundingAmount) : current.fundingAmount,
      members: Array.isArray(dto.members) ? dto.members : (dto.members ? dto.members.split(',').map((s: string) => s.trim()) : current.members),
    };

    LecturersService.p3mStore[index] = updated;
    return {
      success: true,
      message: `Laporan P3M "${updated.title}" berhasil diperbarui.`,
      data: updated,
    };
  }

  async deleteP3mReport(id: string) {
    const index = LecturersService.p3mStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Laporan P3M dengan ID "${id}" tidak ditemukan.`);
    }

    const deleted = LecturersService.p3mStore.splice(index, 1)[0];
    return {
      success: true,
      message: `Laporan P3M "${deleted.title}" berhasil dihapus.`,
      data: deleted,
    };
  }
}

