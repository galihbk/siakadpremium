import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Role } from '@siakad/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ================= 1. FIND ALL USERS WITH METRICS =================
  async findAll(query?: {
    role?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (query?.role && query.role !== 'Semua') {
      where.role = query.role as Role;
    }

    if (query?.status && query.status !== 'Semua') {
      where.isActive = query.status === 'Aktif';
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [users, allUsers] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              nim: true,
              currentSemester: true,
              status: true,
              studyProgram: { select: { name: true, code: true } },
            },
          },
          lecturer: {
            select: {
              nidn: true,
              nip: true,
              titlePrefix: true,
              titleSuffix: true,
              studyProgram: { select: { name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.user.findMany({
        select: { role: true, isActive: true },
      }),
    ]);

    // Aggregate statistics
    const stats = {
      total: allUsers.length,
      superadmin: allUsers.filter((u) => u.role === 'SUPER_ADMIN').length,
      adminBaak: allUsers.filter((u) => u.role === 'ADMIN_BAAK').length,
      adminKeuangan: allUsers.filter((u) => u.role === 'ADMIN_KEUANGAN').length,
      adminLp3m: allUsers.filter((u) => ['ADMIN_LP3M', 'LP3M'].includes(u.role)).length,
      lecturers: allUsers.filter((u) => u.role === 'LECTURER').length,
      students: allUsers.filter((u) => u.role === 'STUDENT').length,
      staff: allUsers.filter((u) => u.role === 'STAFF').length,
      active: allUsers.filter((u) => u.isActive).length,
      inactive: allUsers.filter((u) => !u.isActive).length,
    };

    return {
      success: true,
      stats,
      total: users.length,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        isActive: u.isActive,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        studentInfo: u.student
          ? {
              nim: u.student.nim,
              prodi: u.student.studyProgram?.name,
              semester: u.student.currentSemester,
            }
          : null,
        lecturerInfo: u.lecturer
          ? {
              nidn: u.lecturer.nidn,
              nip: u.lecturer.nip,
              prodi: u.lecturer.studyProgram?.name,
              gelar: `${u.lecturer.titlePrefix || ''} ${u.fullName} ${u.lecturer.titleSuffix || ''}`.trim(),
            }
          : null,
      })),
    };
  }

  // ================= 2. FIND ONE USER =================
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        student: { include: { studyProgram: true } },
        lecturer: { include: { studyProgram: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan.`);
    }

    return { success: true, data: user };
  }

  // ================= 3. CREATE USER =================
  async create(dto: {
    email: string;
    fullName: string;
    role: Role;
    password?: string;
    isActive?: boolean;
    avatarUrl?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException(`Email "${dto.email}" sudah terdaftar dalam sistem.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password || 'Password123!', salt);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        role: dto.role || Role.STUDENT,
        passwordHash,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        avatarUrl: dto.avatarUrl || null,
      },
    });

    return {
      success: true,
      message: `Pengguna "${newUser.fullName}" dengan peran ${newUser.role} berhasil didaftarkan.`,
      data: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    };
  }

  // ================= 4. UPDATE USER =================
  async update(
    id: string,
    dto: {
      fullName?: string;
      email?: string;
      role?: Role;
      isActive?: boolean;
      avatarUrl?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan.`);
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException(`Email "${dto.email}" sudah digunakan oleh pengguna lain.`);
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName !== undefined ? dto.fullName : user.fullName,
        email: dto.email !== undefined ? dto.email : user.email,
        role: dto.role !== undefined ? dto.role : user.role,
        isActive: dto.isActive !== undefined ? dto.isActive : user.isActive,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : user.avatarUrl,
      },
    });

    return {
      success: true,
      message: `Data pengguna "${updated.fullName}" berhasil diperbarui.`,
      data: updated,
    };
  }

  // ================= 5. RESET PASSWORD =================
  async resetPassword(id: string, newPassword?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan.`);
    }

    const pwdToHash = newPassword || 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pwdToHash, salt);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      success: true,
      message: `Password untuk akun "${user.email}" berhasil direset menjadi kata sandi baru.`,
    };
  }

  // ================= 6. TOGGLE ACTIVE STATUS =================
  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan.`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return {
      success: true,
      message: `Status akun "${updated.email}" diubah menjadi: ${updated.isActive ? 'Aktif' : 'Non-aktif'}.`,
      data: { id: updated.id, isActive: updated.isActive },
    };
  }

  // ================= 7. DELETE USER =================
  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Pengguna dengan ID "${id}" tidak ditemukan.`);
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      success: true,
      message: `Akun pengguna "${user.fullName}" (${user.email}) berhasil dihapus permanen.`,
    };
  }
}
