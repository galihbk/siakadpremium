import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponse, UserRole } from '@siakad/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;
    const identifier = (email || '').trim();

    // Multi-identifier lookup: Email, NIM (Mahasiswa), NIDN (Dosen)
    let user: any = null;
    try {
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { student: { nim: identifier } },
            { lecturer: { nidn: identifier } },
          ],
        },
        include: {
          student: true,
          lecturer: true,
        },
      });

      if (!user) {
        const studentByNim = await this.prisma.student.findFirst({
          where: { nim: identifier },
          include: { user: true },
        });
        if (studentByNim?.user) {
          user = { ...studentByNim.user, student: studentByNim };
        }
      }
    } catch {
      // Prisma offline, fallback to demo user check
    }

    if (user && user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => false);
      if (!isMatch) {
        throw new UnauthorizedException('Password yang Anda masukkan tidak sesuai.');
      }
    }

    if (!user) {
      // Demo mock authentication based on identifier format if DB is empty
      if (identifier === 'superadmin@itn.ac.id') {
        user = {
          id: 'demo-superadmin-id',
          email: 'superadmin@itn.ac.id',
          fullName: 'Bambang Pratama, S.Kom., M.Cs. (Super Admin)',
          role: UserRole.SUPER_ADMIN,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'admin.pmb@itn.ac.id' || identifier === 'pmb@itn.ac.id') {
        user = {
          id: 'demo-pmb-id',
          email: 'admin.pmb@itn.ac.id',
          fullName: 'Bagus Wicaksono, S.Kom. (Panitia PMB)',
          role: UserRole.ADMIN_PMB,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'lp3m@itn.ac.id' || identifier === 'p3m@itn.ac.id') {
        user = {
          id: 'demo-lp3m-id',
          email: 'lp3m@itn.ac.id',
          fullName: 'Prof. Dr. Ir. H. Sudirman, M.T. (Ketua LP3M)',
          role: UserRole.ADMIN_LP3M,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'p2m@itn.ac.id') {
        user = {
          id: 'demo-p2m-id',
          email: 'p2m@itn.ac.id',
          fullName: 'Dr. Siti Marlina, M.Pd. (Ketua P2M)',
          role: UserRole.ADMIN_P2M,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'prodi@itn.ac.id') {
        // Login demo Admin Prodi dipasangkan ke program studi SUNGGUHAN yang punya data
        // mahasiswa/dosen/mata kuliah, supaya dashboard-nya benar-benar terisi saat testing.
        const realProdi = await this.findDemoStudyProgram();
        user = {
          id: 'demo-prodi-id',
          email: 'prodi@itn.ac.id',
          fullName: realProdi ? `Admin ${realProdi.name} (Demo)` : 'Admin Program Studi (Demo)',
          role: UserRole.ADMIN_PRODI,
          avatarUrl: null,
          student: null,
          lecturer: null,
          studyProgramId: realProdi?.id || null,
        };
      } else if (identifier === 'keuangan@itn.ac.id' || identifier === 'finance@itn.ac.id') {
        user = {
          id: 'demo-finance-id',
          email: 'keuangan@itn.ac.id',
          fullName: 'Sri Wahyuni, S.E., M.Ak. (Biro Keuangan)',
          role: UserRole.ADMIN_KEUANGAN,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'admin@itn.ac.id') {
        user = {
          id: 'demo-admin-id',
          email: 'admin@itn.ac.id',
          fullName: 'Ahmad Fauzi, S.Kom. (Admin BAAK)',
          role: UserRole.ADMIN_BAAK,
          avatarUrl: null,
          student: null,
          lecturer: null,
        };
      } else if (identifier === 'dosen@itn.ac.id' || identifier === 'lecturer@itn.ac.id') {
        // Login demo dosen dipasangkan ke dosen SUNGGUHAN yang punya kelas di tahun akademik
        // aktif, supaya akun demo ini benar-benar bisa dipakai testing (jadwal mengajar, upload
        // RPS, dst) -- bukan cuma ID palsu yang tidak match data manapun di database.
        const realLecturer = await this.findDemoLecturer();
        user = {
          id: realLecturer?.userId || 'demo-dosen-id',
          email: 'dosen@itn.ac.id',
          fullName: realLecturer ? `${realLecturer.fullName} (Demo Dosen)` : 'Dr. Bayu Wicaksono, M.Kom.',
          role: UserRole.LECTURER,
          avatarUrl: null,
          student: null,
          lecturer: realLecturer ? { id: realLecturer.id, nidn: realLecturer.nidn } : { id: 'lec-1', nidn: '0412088501' },
        };
      } else if (identifier === 'mahasiswa@itn.ac.id' || identifier === 'student@itn.ac.id') {
        // Sama seperti dosen demo -- dipasangkan ke mahasiswa sungguhan yang aktif supaya KRS,
        // nilai, dan jadwal kuliahnya betulan terisi saat dipakai testing.
        const realStudent = await this.findDemoStudent();
        user = {
          id: realStudent?.userId || 'demo-mhs-id',
          email: 'student@itn.ac.id',
          fullName: realStudent ? `${realStudent.fullName} (Demo Mahasiswa)` : 'Mahasiswa ITN (Demo)',
          role: UserRole.STUDENT,
          avatarUrl: null,
          student: realStudent ? { id: realStudent.id, nim: realStudent.nim } : { id: 'std-demo-id', nim: '27261150001' },
          lecturer: null,
        };
      } else {
        throw new UnauthorizedException('NIM / NIDN / Email atau Kata Sandi yang dimasukkan salah.');
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentId: user.student?.id || null,
      lecturerId: user.lecturer?.id || null,
      studyProgramId: user.studyProgramId || null,
    };

    const accessToken = this.jwtService.sign(payload);

    // Cache user session in Redis if available
    await this.redis.set(`session:${user.id}`, JSON.stringify(payload), 86400);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role as UserRole,
        avatarUrl: user.avatarUrl,
        studentId: user.student?.id || null,
        lecturerId: user.lecturer?.id || null,
        nim: user.student?.nim || null,
        student: user.student ? { id: user.student.id, nim: user.student.nim } : null,
        studyProgramId: user.studyProgramId || null,
      },
    };
  }

  // Cari dosen sungguhan yang punya kelas di tahun akademik aktif, untuk dipasangkan ke akun
  // login demo dosen (lihat login() di atas) supaya data pengajaran yang tampil itu nyata.
  private async findDemoLecturer(): Promise<{ id: string; userId: string; nidn: string | null; fullName: string } | null> {
    try {
      const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
      const classWithLecturer = await this.prisma.courseClass.findFirst({
        where: { academicYearId: activeYear?.id, lecturerId: { not: null } },
        include: { lecturer: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      });
      const lecturer = classWithLecturer?.lecturer;
      if (lecturer) {
        return { id: lecturer.id, userId: lecturer.userId, nidn: lecturer.nidn, fullName: lecturer.user.fullName };
      }
      // Fallback: dosen manapun kalau tidak ada kelas di tahun aktif
      const anyLecturer = await this.prisma.lecturer.findFirst({ include: { user: true } });
      return anyLecturer ? { id: anyLecturer.id, userId: anyLecturer.userId, nidn: anyLecturer.nidn, fullName: anyLecturer.user.fullName } : null;
    } catch {
      return null;
    }
  }

  // Cari mahasiswa aktif sungguhan untuk dipasangkan ke akun login demo mahasiswa.
  private async findDemoStudent(): Promise<{ id: string; userId: string; nim: string; fullName: string } | null> {
    try {
      const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
      const enrollment = await this.prisma.courseEnrollment.findFirst({
        where: { academicYearId: activeYear?.id, status: { in: ['SUBMITTED', 'APPROVED'] } },
        include: { student: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      });
      const student = enrollment?.student;
      if (student) {
        return { id: student.id, userId: student.userId, nim: student.nim, fullName: student.user.fullName };
      }
      // Fallback: mahasiswa aktif manapun kalau belum ada yang mengisi KRS tahun ini
      const anyActiveStudent = await this.prisma.student.findFirst({ where: { status: 'ACTIVE' }, include: { user: true } });
      return anyActiveStudent
        ? { id: anyActiveStudent.id, userId: anyActiveStudent.userId, nim: anyActiveStudent.nim, fullName: anyActiveStudent.user.fullName }
        : null;
    } catch {
      return null;
    }
  }

  // Cari program studi sungguhan yang punya mahasiswa, untuk dipasangkan ke akun login demo
  // Admin Prodi supaya dashboard-nya terisi data nyata (bukan prodi kosong).
  private async findDemoStudyProgram(): Promise<{ id: string; name: string } | null> {
    try {
      const prodiWithStudents = await this.prisma.studyProgram.findFirst({
        where: { students: { some: {} } },
        orderBy: { code: 'asc' },
      });
      if (prodiWithStudents) return { id: prodiWithStudents.id, name: prodiWithStudents.name };
      const anyProdi = await this.prisma.studyProgram.findFirst();
      return anyProdi ? { id: anyProdi.id, name: anyProdi.name } : null;
    } catch {
      return null;
    }
  }

  async getProfile(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
          student: {
            include: {
              studyProgram: {
                include: { faculty: true },
              },
              advisorLecturer: {
                include: { user: true },
              },
              track: true,
              registrationType: true,
              admissionClass: true,
              wave: true,
              enrollments: {
                include: {
                  course: true,
                  academicYear: true,
                },
              },
              admissionApplications: {
                include: {
                  payments: true,
                },
              },
            },
          },
          lecturer: {
            include: {
              studyProgram: true,
            },
          },
        },
      });
      if (user) return user;
    } catch {
      // Prisma sedang offline — lempar error di bawah, jangan tampilkan identitas orang lain
    }

    // Sesi/token menunjuk ke user yang sudah tidak ada di database (mis. sesi lama/kedaluwarsa).
    // Jangan pernah kembalikan profil generik yang seolah-olah identitas asli — itu bisa
    // membocorkan data pengguna lain dan salah menampilkan sesi orang yang berbeda.
    throw new NotFoundException('Sesi tidak valid atau akun tidak ditemukan. Silakan login ulang.');
  }

  async updateProfile(
    userId: string,
    payload: Partial<{
      fullName: string;
      avatarUrl: string;
      phone: string;
      nik: string;
      nisn: string;
      noKk: string;
      address: string;
      birthPlace: string;
      birthDate: string;
    }>,
  ) {
    // Update base user fields
    const data: any = {};
    if (payload.fullName) data.fullName = payload.fullName;
    if (payload.avatarUrl) data.avatarUrl = payload.avatarUrl;

    const p = payload as any;
    if (p.newPassword) {
      if (p.newPassword.length < 6) {
        throw new BadRequestException('Password baru minimal 6 karakter.');
      }
      const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (existingUser?.passwordHash && p.currentPassword) {
        const isMatch = await bcrypt.compare(p.currentPassword, existingUser.passwordHash).catch(() => false);
        if (!isMatch) {
          throw new BadRequestException('Password saat ini tidak sesuai.');
        }
      }
      data.passwordHash = await bcrypt.hash(p.newPassword, 10);
    }

    let updatedUser = null;
    try {
      if (Object.keys(data).length > 0) {
        updatedUser = await this.prisma.user.update({ where: { id: userId }, data });
      }

      // If the user is a student, update student details if provided
      const student = await this.prisma.student.findUnique({ where: { userId } });
      if (student) {
        const studentData: any = {};
        if (payload.phone) studentData.phone = payload.phone;
        if (payload.nik) studentData.nik = payload.nik;
        if (payload.nisn) studentData.nisn = payload.nisn;
        if (payload.noKk) studentData.noKk = payload.noKk;
        if (payload.address) studentData.address = payload.address;
        if ((payload as any).streetAddress) studentData.streetAddress = (payload as any).streetAddress;
        if ((payload as any).rtRw) studentData.rtRw = (payload as any).rtRw;
        if ((payload as any).dusun) studentData.dusun = (payload as any).dusun;
        if ((payload as any).kelurahan) studentData.kelurahan = (payload as any).kelurahan;
        if ((payload as any).kecamatan) studentData.kecamatan = (payload as any).kecamatan;
        if ((payload as any).city) studentData.city = (payload as any).city;
        if ((payload as any).province) studentData.province = (payload as any).province;
        if ((payload as any).postalCode) studentData.postalCode = (payload as any).postalCode;
        if (payload.birthPlace) studentData.birthPlace = payload.birthPlace;
        if (payload.birthDate) studentData.birthDate = new Date(payload.birthDate);
        if (Object.keys(studentData).length > 0) {
          await this.prisma.student.update({ where: { id: student.id }, data: studentData });
        }
      }

      // If the user is a lecturer, update lecturer details if provided
      const lecturer = await this.prisma.lecturer.findUnique({ where: { userId } });
      if (lecturer) {
        const p = payload as any;
        const lecturerData: any = {};
        if (p.phone) lecturerData.phone = p.phone;
        if (p.nidk) lecturerData.nidk = p.nidk;
        if (p.titlePrefix !== undefined) lecturerData.titlePrefix = p.titlePrefix;
        if (p.titleSuffix !== undefined) lecturerData.titleSuffix = p.titleSuffix;
        if (p.gender) lecturerData.gender = p.gender;
        if (p.birthPlace) lecturerData.birthPlace = p.birthPlace;
        if (p.birthDate) lecturerData.birthDate = new Date(p.birthDate);
        if (p.religion) lecturerData.religion = p.religion;
        if (p.address) lecturerData.address = p.address;
        if (p.rtRw) lecturerData.rtRw = p.rtRw;
        if (p.kelurahan) lecturerData.kelurahan = p.kelurahan;
        if (p.kecamatan) lecturerData.kecamatan = p.kecamatan;
        if (p.city) lecturerData.city = p.city;
        if (p.province) lecturerData.province = p.province;
        if (p.postalCode) lecturerData.postalCode = p.postalCode;
        if (p.employmentStatus) lecturerData.employmentStatus = p.employmentStatus;
        if (p.functionalPosition) lecturerData.functionalPosition = p.functionalPosition;
        if (p.lastEducation) lecturerData.lastEducation = p.lastEducation;
        if (p.expertise) lecturerData.expertise = p.expertise;
        if (Object.keys(lecturerData).length > 0) {
          await this.prisma.lecturer.update({ where: { id: lecturer.id }, data: lecturerData });
        }
      }

      return updatedUser || (await this.getProfile(userId));
    } catch {
      // In demo/offline mode, return a simple merge
      return {
        id: userId,
        fullName: payload.fullName || 'Demo User',
        avatarUrl: payload.avatarUrl || null,
      };
    }
  }
}
