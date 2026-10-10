import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const shifts = await this.prisma.shift.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return shifts.map((s) => ({
      id: s.id,
      name: s.name,
      startPagi: s.startPagi,
      toleransiPagi: s.toleransiPagi,
      startSore: s.startSore,
      toleransiSore: s.toleransiSore,
      isDefault: s.isDefault,
      totalPegawai: s._count.users,
    }));
  }

  async create(data: { name: string; startPagi?: string; toleransiPagi?: number; startSore?: string; toleransiSore?: number; isDefault?: boolean }) {
    if (!data.name?.trim()) throw new BadRequestException('Nama shift wajib diisi');

    if (data.isDefault) {
      await this.prisma.shift.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const shift = await this.prisma.shift.create({
      data: {
        name: data.name.trim(),
        startPagi: data.startPagi || null,
        toleransiPagi: data.toleransiPagi ?? 15,
        startSore: data.startSore || null,
        toleransiSore: data.toleransiSore ?? 15,
        isDefault: !!data.isDefault,
      },
    });
    return { success: true, message: 'Shift berhasil ditambahkan', data: shift };
  }

  async update(
    id: string,
    data: { name?: string; startPagi?: string; toleransiPagi?: number; startSore?: string; toleransiSore?: number; isDefault?: boolean },
  ) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift tidak ditemukan');

    if (data.isDefault) {
      await this.prisma.shift.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
    }

    const shift = await this.prisma.shift.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        startPagi: data.startPagi !== undefined ? data.startPagi || null : undefined,
        toleransiPagi: data.toleransiPagi,
        startSore: data.startSore !== undefined ? data.startSore || null : undefined,
        toleransiSore: data.toleransiSore,
        isDefault: data.isDefault,
      },
    });
    return { success: true, message: 'Shift berhasil disimpan', data: shift };
  }

  async remove(id: string) {
    await this.prisma.user.updateMany({ where: { shiftId: id }, data: { shiftId: null } });
    await this.prisma.shift.delete({ where: { id } });
    return { success: true, message: 'Shift berhasil dihapus' };
  }
}
