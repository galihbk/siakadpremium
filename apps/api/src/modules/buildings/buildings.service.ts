import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface BuildingResponse {
  id: string;
  code: string;
  name: string;
  alias: string;
  functionDesc: string;
  floorsCount: number;
  roomsCount: number;
  capacity: number;
  picName: string;
  picPhone: string;
  status: 'Aktif Beroperasi' | 'Dalam Pemeliharaan';
  establishedYear: number;
  description: string;
}

@Injectable()
export class BuildingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<BuildingResponse[]> {
    const list = await this.prisma.building.findMany({
      orderBy: { code: 'asc' },
      include: {
        rooms: true,
      },
    });

    return list.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      alias: b.alias || '',
      functionDesc: b.functionDesc || '',
      floorsCount: b.floorsCount,
      roomsCount: b.rooms.length > 0 ? b.rooms.length : b.roomsCount,
      capacity: b.capacity,
      picName: b.picName || '',
      picPhone: b.picPhone || '',
      status: (b.status as 'Aktif Beroperasi' | 'Dalam Pemeliharaan') || 'Aktif Beroperasi',
      establishedYear: b.establishedYear,
      description: b.description || '',
    }));
  }

  async findOne(id: string): Promise<BuildingResponse> {
    const b = await this.prisma.building.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        rooms: true,
      },
    });

    if (!b) {
      throw new NotFoundException(`Gedung dengan ID atau kode "${id}" tidak ditemukan`);
    }

    return {
      id: b.id,
      code: b.code,
      name: b.name,
      alias: b.alias || '',
      functionDesc: b.functionDesc || '',
      floorsCount: b.floorsCount,
      roomsCount: b.rooms.length > 0 ? b.rooms.length : b.roomsCount,
      capacity: b.capacity,
      picName: b.picName || '',
      picPhone: b.picPhone || '',
      status: (b.status as 'Aktif Beroperasi' | 'Dalam Pemeliharaan') || 'Aktif Beroperasi',
      establishedYear: b.establishedYear,
      description: b.description || '',
    };
  }

  async create(data: any): Promise<BuildingResponse> {
    const created = await this.prisma.building.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        alias: data.alias?.trim() || null,
        functionDesc: data.functionDesc?.trim() || null,
        floorsCount: Number(data.floorsCount) || 1,
        roomsCount: Number(data.roomsCount) || 0,
        capacity: Number(data.capacity) || 0,
        picName: data.picName?.trim() || null,
        picPhone: data.picPhone?.trim() || null,
        status: data.status || 'Aktif Beroperasi',
        establishedYear: Number(data.establishedYear) || new Date().getFullYear(),
        description: data.description?.trim() || null,
      },
      include: {
        rooms: true,
      },
    });

    return {
      id: created.id,
      code: created.code,
      name: created.name,
      alias: created.alias || '',
      functionDesc: created.functionDesc || '',
      floorsCount: created.floorsCount,
      roomsCount: created.roomsCount,
      capacity: created.capacity,
      picName: created.picName || '',
      picPhone: created.picPhone || '',
      status: (created.status as 'Aktif Beroperasi' | 'Dalam Pemeliharaan') || 'Aktif Beroperasi',
      establishedYear: created.establishedYear,
      description: created.description || '',
    };
  }

  async update(id: string, data: any): Promise<BuildingResponse> {
    const updated = await this.prisma.building.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim().toUpperCase() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        alias: data.alias !== undefined ? data.alias.trim() : undefined,
        functionDesc: data.functionDesc !== undefined ? data.functionDesc.trim() : undefined,
        floorsCount: data.floorsCount !== undefined ? Number(data.floorsCount) : undefined,
        roomsCount: data.roomsCount !== undefined ? Number(data.roomsCount) : undefined,
        capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
        picName: data.picName !== undefined ? data.picName.trim() : undefined,
        picPhone: data.picPhone !== undefined ? data.picPhone.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        establishedYear: data.establishedYear !== undefined ? Number(data.establishedYear) : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
      },
      include: {
        rooms: true,
      },
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      alias: updated.alias || '',
      functionDesc: updated.functionDesc || '',
      floorsCount: updated.floorsCount,
      roomsCount: updated.rooms.length > 0 ? updated.rooms.length : updated.roomsCount,
      capacity: updated.capacity,
      picName: updated.picName || '',
      picPhone: updated.picPhone || '',
      status: (updated.status as 'Aktif Beroperasi' | 'Dalam Pemeliharaan') || 'Aktif Beroperasi',
      establishedYear: updated.establishedYear,
      description: updated.description || '',
    };
  }

  async remove(id: string) {
    await this.prisma.building.delete({
      where: { id },
    });
    return { success: true, message: 'Data gedung berhasil dihapus dari sistem' };
  }

  async findAllRooms(buildingCode?: string) {
    const where: any = {};
    if (buildingCode && buildingCode !== 'Semua') {
      where.buildingCode = buildingCode;
    }
    const rooms = await this.prisma.room.findMany({
      where,
      orderBy: { code: 'asc' },
    });
    return rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      buildingCode: r.buildingCode,
      buildingName: r.buildingName,
      floor: r.floor,
      type: r.type,
      capacity: r.capacity,
      facilities: r.facilities,
      status: r.status,
      notes: r.notes || '',
    }));
  }

  async findRoom(id: string) {
    return this.prisma.room.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
  }

  async createRoom(data: any) {
    let building = await this.prisma.building.findFirst({
      where: { code: data.buildingCode },
    });
    if (!building) {
      building = await this.prisma.building.findFirst();
    }

    const created = await this.prisma.room.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        buildingId: building?.id || 'b-1',
        buildingCode: data.buildingCode || building?.code || 'TWR-A',
        buildingName: data.buildingName || building?.name || 'Gedung BJ Habibie',
        floor: Number(data.floor) || 1,
        type: data.type || 'Kelas Teori',
        capacity: Number(data.capacity) || 40,
        facilities: Array.isArray(data.facilities) ? data.facilities : [],
        status: data.status || 'Tersedia',
        notes: data.notes?.trim() || null,
      },
    });

    await this.prisma.building.update({
      where: { id: created.buildingId },
      data: { roomsCount: { increment: 1 } },
    }).catch(() => {});

    return created;
  }

  async updateRoom(id: string, data: any) {
    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        code: data.code !== undefined ? data.code.trim().toUpperCase() : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        buildingCode: data.buildingCode !== undefined ? data.buildingCode : undefined,
        buildingName: data.buildingName !== undefined ? data.buildingName : undefined,
        floor: data.floor !== undefined ? Number(data.floor) : undefined,
        type: data.type !== undefined ? data.type : undefined,
        capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
        facilities: data.facilities !== undefined ? data.facilities : undefined,
        status: data.status !== undefined ? data.status : undefined,
        notes: data.notes !== undefined ? data.notes.trim() : undefined,
      },
    });
    return updated;
  }

  async deleteRoom(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (room) {
      await this.prisma.room.delete({ where: { id } });
      await this.prisma.building.update({
        where: { id: room.buildingId },
        data: { roomsCount: { decrement: 1 } },
      }).catch(() => {});
    }
    return { success: true, message: 'Ruangan berhasil dihapus' };
  }
}

