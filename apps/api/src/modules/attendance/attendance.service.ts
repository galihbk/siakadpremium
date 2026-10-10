import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

type Session = 'PAGI' | 'SORE';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private todayDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // null = tidak bisa ditentukan (belum absen atau shift tidak punya jam untuk sesi ini).
  private isLate(checkIn: Date | null | undefined, shiftStart: string | null | undefined, toleranceMin: number): boolean | null {
    if (!checkIn || !shiftStart) return null;
    const [h, m] = shiftStart.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const deadline = new Date(checkIn);
    deadline.setHours(h, m + (toleranceMin || 0), 0, 0);
    return checkIn.getTime() > deadline.getTime();
  }

  // Shift milik user kalau diassign; kalau tidak, jatuh ke shift yang ditandai default.
  private async getEffectiveShift(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { shift: true } });
    if (user?.shift) return user.shift;
    return this.prisma.shift.findFirst({ where: { isDefault: true } });
  }

  async getToday(userId: string) {
    const date = this.todayDate();
    const [record, rate, shift] = await Promise.all([
      this.prisma.dailyAttendance.findUnique({ where: { userId_date: { userId, date } } }),
      this.getRateSettings(),
      this.getEffectiveShift(userId),
    ]);

    return {
      date: date.toISOString().slice(0, 10),
      checkInPagi: record?.checkInPagi ?? null,
      checkInSore: record?.checkInSore ?? null,
      ratePagi: rate.ratePagi,
      rateSore: rate.rateSore,
      shift: shift
        ? {
            id: shift.id,
            name: shift.name,
            startPagi: shift.startPagi,
            toleransiPagi: shift.toleransiPagi,
            startSore: shift.startSore,
            toleransiSore: shift.toleransiSore,
          }
        : null,
      isLatePagi: this.isLate(record?.checkInPagi, shift?.startPagi, shift?.toleransiPagi ?? 0),
      isLateSore: this.isLate(record?.checkInSore, shift?.startSore, shift?.toleransiSore ?? 0),
    };
  }

  async checkIn(userId: string, session: Session) {
    if (session !== 'PAGI' && session !== 'SORE') {
      throw new BadRequestException('Sesi absensi tidak valid');
    }

    const date = this.todayDate();
    const existing = await this.prisma.dailyAttendance.findUnique({ where: { userId_date: { userId, date } } });

    if (session === 'PAGI' && existing?.checkInPagi) {
      throw new BadRequestException('Anda sudah absen pagi hari ini');
    }
    if (session === 'SORE' && existing?.checkInSore) {
      throw new BadRequestException('Anda sudah absen sore hari ini');
    }

    const patch = session === 'PAGI' ? { checkInPagi: new Date() } : { checkInSore: new Date() };
    const record = await this.prisma.dailyAttendance.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...patch },
      update: patch,
    });

    return {
      success: true,
      message: `Absen ${session === 'PAGI' ? 'pagi' : 'sore'} berhasil dicatat`,
      data: record,
    };
  }

  async getHistory(userId: string, month?: number, year?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = (month ?? now.getMonth() + 1) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const [records, shift] = await Promise.all([
      this.prisma.dailyAttendance.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      this.getEffectiveShift(userId),
    ]);

    return records.map((r) => ({
      ...r,
      isLatePagi: this.isLate(r.checkInPagi, shift?.startPagi, shift?.toleransiPagi ?? 0),
      isLateSore: this.isLate(r.checkInSore, shift?.startSore, shift?.toleransiSore ?? 0),
    }));
  }

  // Import massal absensi harian dari Excel (dipakai SDM untuk entri data lama/offline).
  async bulkImportAttendance(rows: { email: string; date: string; pagi?: string; sore?: string }[]) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const email = row.email?.trim();
      if (!email || !row.date) {
        skipped++;
        continue;
      }

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        errors.push(`Email tidak ditemukan: ${email}`);
        skipped++;
        continue;
      }

      const dateOnly = new Date(row.date);
      if (isNaN(dateOnly.getTime())) {
        errors.push(`Tanggal tidak valid untuk ${email}: ${row.date}`);
        skipped++;
        continue;
      }
      dateOnly.setHours(0, 0, 0, 0);

      const patch: { checkInPagi?: Date; checkInSore?: Date } = {};
      if (row.pagi?.trim()) {
        const [h, m] = row.pagi.trim().split(':').map(Number);
        const d = new Date(dateOnly);
        d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
        patch.checkInPagi = d;
      }
      if (row.sore?.trim()) {
        const [h, m] = row.sore.trim().split(':').map(Number);
        const d = new Date(dateOnly);
        d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
        patch.checkInSore = d;
      }

      if (Object.keys(patch).length === 0) {
        skipped++;
        continue;
      }

      await this.prisma.dailyAttendance.upsert({
        where: { userId_date: { userId: user.id, date: dateOnly } },
        create: { userId: user.id, date: dateOnly, ...patch },
        update: patch,
      });
      imported++;
    }

    return {
      success: true,
      message: `${imported} data absensi berhasil diimpor${skipped ? `, ${skipped} baris dilewati` : ''}`,
      imported,
      skipped,
      errors,
    };
  }

  async getRateSettings() {
    const setting = await this.prisma.transportRateSetting.findUnique({ where: { id: 'default-transport-rate' } });
    return {
      ratePagi: setting?.ratePagi ?? 0,
      rateSore: setting?.rateSore ?? 0,
      updatedAt: setting?.updatedAt ?? null,
    };
  }

  async updateRateSettings(data: { ratePagi?: number; rateSore?: number; updatedBy?: string }) {
    const setting = await this.prisma.transportRateSetting.upsert({
      where: { id: 'default-transport-rate' },
      create: {
        id: 'default-transport-rate',
        ratePagi: data.ratePagi ?? 0,
        rateSore: data.rateSore ?? 0,
        updatedByUserId: data.updatedBy,
      },
      update: {
        ratePagi: data.ratePagi ?? 0,
        rateSore: data.rateSore ?? 0,
        updatedByUserId: data.updatedBy,
      },
    });

    return { success: true, message: 'Tarif uang transport berhasil disimpan', data: setting };
  }

  // Dipakai oleh Rekap Honor (Biro Keuangan) untuk menjumlah uang transport hasil kehadiran
  // seluruh dosen & karyawan dalam satu rentang tanggal (mis. periode satu semester).
  async getAttendanceTransportTotals(startDate: Date, endDate: Date) {
    const [records, rate] = await Promise.all([
      this.prisma.dailyAttendance.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      this.getRateSettings(),
    ]);

    const byUser = new Map<string, { hadirPagi: number; hadirSore: number }>();
    for (const r of records) {
      const entry = byUser.get(r.userId) ?? { hadirPagi: 0, hadirSore: 0 };
      if (r.checkInPagi) entry.hadirPagi += 1;
      if (r.checkInSore) entry.hadirSore += 1;
      byUser.set(r.userId, entry);
    }

    const result = new Map<string, { hadirPagi: number; hadirSore: number; transportTotal: number }>();
    for (const [userId, entry] of byUser) {
      result.set(userId, {
        ...entry,
        transportTotal: entry.hadirPagi * rate.ratePagi + entry.hadirSore * rate.rateSore,
      });
    }
    return { byUser: result, rate };
  }

  // Dipakai oleh SDM untuk memantau kehadiran seluruh dosen & karyawan dalam satu bulan.
  async getMonthlyRecapAllEmployees(month?: number, year?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = (month ?? now.getMonth() + 1) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59);

    const [users, records, rate, defaultShift] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'SDM', 'LECTURER', 'STAFF'] as any } },
        include: { lecturer: { include: { studyProgram: { select: { name: true } } } }, shift: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.dailyAttendance.findMany({ where: { date: { gte: start, lte: end } } }),
      this.getRateSettings(),
      this.prisma.shift.findFirst({ where: { isDefault: true } }),
    ]);

    const shiftByUserId = new Map(users.map((u) => [u.id, u.shift ?? defaultShift ?? null]));

    const byUser = new Map<string, { hadirPagi: number; hadirSore: number; telatPagi: number; telatSore: number }>();
    for (const r of records) {
      const entry = byUser.get(r.userId) ?? { hadirPagi: 0, hadirSore: 0, telatPagi: 0, telatSore: 0 };
      const shift = shiftByUserId.get(r.userId);
      if (r.checkInPagi) {
        entry.hadirPagi += 1;
        if (this.isLate(r.checkInPagi, shift?.startPagi, shift?.toleransiPagi ?? 0)) entry.telatPagi += 1;
      }
      if (r.checkInSore) {
        entry.hadirSore += 1;
        if (this.isLate(r.checkInSore, shift?.startSore, shift?.toleransiSore ?? 0)) entry.telatSore += 1;
      }
      byUser.set(r.userId, entry);
    }

    const workingDaysSoFar = new Set(records.map((r) => r.date.toISOString().slice(0, 10))).size;

    const rows = users.map((u) => {
      const entry = byUser.get(u.id) ?? { hadirPagi: 0, hadirSore: 0, telatPagi: 0, telatSore: 0 };
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        category: u.role === 'LECTURER' ? 'Dosen' : 'Karyawan',
        studyProgram: u.lecturer?.studyProgram?.name ?? null,
        shiftName: shiftByUserId.get(u.id)?.name ?? null,
        hadirPagi: entry.hadirPagi,
        hadirSore: entry.hadirSore,
        telatPagi: entry.telatPagi,
        telatSore: entry.telatSore,
        transportTotal: entry.hadirPagi * rate.ratePagi + entry.hadirSore * rate.rateSore,
      };
    });

    return {
      month: m + 1,
      year: y,
      workingDaysSoFar,
      rate,
      rows,
    };
  }

  // Dipakai oleh SDM untuk evaluasi kehadiran tahunan (rekap per tahun, per bulan aktif).
  async getYearlyRecapAllEmployees(year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);

    const [users, records, defaultShift] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'SDM', 'LECTURER', 'STAFF'] as any } },
        include: { lecturer: { include: { studyProgram: { select: { name: true } } } }, shift: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.dailyAttendance.findMany({ where: { date: { gte: start, lte: end } } }),
      this.prisma.shift.findFirst({ where: { isDefault: true } }),
    ]);

    const shiftByUserId = new Map(users.map((u) => [u.id, u.shift ?? defaultShift ?? null]));

    const byUser = new Map<
      string,
      { hadirPagi: number; hadirSore: number; telatPagi: number; telatSore: number; hariHadir: Set<string>; bulanAktif: Set<number> }
    >();
    for (const r of records) {
      const entry =
        byUser.get(r.userId) ??
        { hadirPagi: 0, hadirSore: 0, telatPagi: 0, telatSore: 0, hariHadir: new Set<string>(), bulanAktif: new Set<number>() };
      const shift = shiftByUserId.get(r.userId);
      if (r.checkInPagi) {
        entry.hadirPagi += 1;
        if (this.isLate(r.checkInPagi, shift?.startPagi, shift?.toleransiPagi ?? 0)) entry.telatPagi += 1;
      }
      if (r.checkInSore) {
        entry.hadirSore += 1;
        if (this.isLate(r.checkInSore, shift?.startSore, shift?.toleransiSore ?? 0)) entry.telatSore += 1;
      }
      if (r.checkInPagi || r.checkInSore) {
        entry.hariHadir.add(r.date.toISOString().slice(0, 10));
        entry.bulanAktif.add(r.date.getMonth() + 1);
      }
      byUser.set(r.userId, entry);
    }

    const rows = users.map((u) => {
      const entry = byUser.get(u.id);
      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        category: u.role === 'LECTURER' ? 'Dosen' : 'Karyawan',
        studyProgram: u.lecturer?.studyProgram?.name ?? null,
        shiftName: shiftByUserId.get(u.id)?.name ?? null,
        hadirPagi: entry?.hadirPagi ?? 0,
        hadirSore: entry?.hadirSore ?? 0,
        telatPagi: entry?.telatPagi ?? 0,
        telatSore: entry?.telatSore ?? 0,
        totalHariHadir: entry?.hariHadir.size ?? 0,
        bulanAktif: entry?.bulanAktif.size ?? 0,
      };
    });

    return { year: y, rows };
  }
}
