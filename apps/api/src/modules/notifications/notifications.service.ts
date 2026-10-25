import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export interface NotifyInput {
  type: string;
  title: string;
  body?: string;
  /** Alamat halaman terkait (relatif), mis. /student/skripsi */
  link?: string;
}

/**
 * Notifikasi dalam aplikasi (lonceng portal). Pengirim notifikasi tidak boleh menggagalkan proses utama,
 * jadi setiap fungsi `notify*` menelan galatnya dan hanya mencatatnya.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async notifyUser(userId: string | null | undefined, input: NotifyInput) {
    if (!userId) return;
    try {
      await this.prisma.notification.create({
        data: { userId, type: input.type, title: input.title, body: input.body ?? null, link: input.link ?? null },
      });
    } catch (err: any) {
      this.logger.warn(`Gagal membuat notifikasi: ${err?.message || err}`);
    }
  }

  async notifyUsers(userIds: Array<string | null | undefined>, input: NotifyInput) {
    const ids = Array.from(new Set(userIds.filter((x): x is string => Boolean(x))));
    if (ids.length === 0) return;
    try {
      await this.prisma.notification.createMany({
        data: ids.map((userId) => ({ userId, type: input.type, title: input.title, body: input.body ?? null, link: input.link ?? null })),
      });
    } catch (err: any) {
      this.logger.warn(`Gagal membuat notifikasi: ${err?.message || err}`);
    }
  }

  async notifyStudent(studentId: string | null | undefined, input: NotifyInput) {
    if (!studentId) return;
    const s = await this.prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } }).catch(() => null);
    await this.notifyUser(s?.userId, input);
  }

  async notifyLecturers(lecturerIds: Array<string | null | undefined>, input: NotifyInput) {
    const ids = lecturerIds.filter((x): x is string => Boolean(x));
    if (ids.length === 0) return;
    const rows = await this.prisma.lecturer.findMany({ where: { id: { in: ids } }, select: { userId: true } }).catch(() => []);
    await this.notifyUsers(rows.map((r) => r.userId), input);
  }

  /** Semua akun dengan salah satu peran (mis. BAAK) -- untuk pekerjaan baru yang perlu ditindak. */
  async notifyRoles(roles: string[], input: NotifyInput) {
    const users = await this.prisma.user.findMany({ where: { role: { in: roles as any }, isActive: true }, select: { id: true } }).catch(() => []);
    await this.notifyUsers(users.map((u) => u.id), input);
  }

  // ---- untuk pemilik notifikasi
  async list(userId: string, limit = 30) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: Math.min(100, Math.max(1, limit)) }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { unread, items };
  }

  async unreadCount(userId: string) {
    return { unread: await this.prisma.notification.count({ where: { userId, readAt: null } }) };
  }

  async markRead(userId: string, ids?: string[]) {
    const r = await this.prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids?.length ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
    return { updated: r.count };
  }
}
