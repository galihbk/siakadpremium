import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../shared/prisma/prisma.service';

const MAX_LEN = 1000;
const PAGE = 200;
/** Batas pesan dari satu pengunjung anonim per percakapan -- mencegah satu orang membanjiri panitia. */
const VISITOR_MAX_MESSAGES = 200;

/** Nama yang tampil ke pendaftar/pengunjung untuk pesan staf -- hanya unit, bukan nama akun panitia. */
const STAFF_PUBLIC_NAME = 'Panitia PMB';

export type ChatMode = 'AUTO' | 'OPEN' | 'CLOSED';
export interface ChatDay {
  day: number;
  open: boolean;
  from: string;
  to: string;
}
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DEFAULT_OFFLINE = 'Saat ini di luar jam operasional. Tinggalkan pesan, panitia akan membalas pada jam kerja.';

/** Siapa yang sedang memakai chat -- ditentukan dari token, bukan dari parameter klien. */
export type ChatActor = { kind: 'applicant'; id: string } | { kind: 'visitor'; id: string };

/**
 * Live chat PMB (polling). Dua jenis peserta percakapan:
 *  - pendaftar ber-akun (token PMB_APPLICANT), satu percakapan per akun;
 *  - pengunjung anonim dari beranda PMB (token PMB_VISITOR) yang mengisi nama + kontak dulu.
 * Peserta hanya melihat percakapannya sendiri; panitia melihat semua. Isi pesan = teks polos.
 */
@Injectable()
export class PmbChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ============================ JAM OPERASIONAL ============================

  private defaultSchedule(): ChatDay[] {
    return [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      open: day >= 1 && day <= 5 ? true : day === 6,
      from: '08:00',
      to: day === 6 ? '12:00' : '16:00',
    }));
  }

  private normalizeSchedule(raw: unknown): ChatDay[] {
    const list = Array.isArray(raw) ? raw : [];
    return [0, 1, 2, 3, 4, 5, 6].map((day) => {
      const r: any = list.find((x: any) => Number(x?.day) === day) ?? {};
      const from = TIME_RE.test(String(r.from)) ? String(r.from) : '08:00';
      const to = TIME_RE.test(String(r.to)) ? String(r.to) : '16:00';
      return { day, open: !!r.open, from, to };
    });
  }

  async getSettings() {
    const row = await this.prisma.pmbChatSetting.findUnique({ where: { id: 'default' } });
    return {
      mode: (row?.mode ?? 'AUTO') as ChatMode,
      schedule: row ? this.normalizeSchedule(row.schedule) : this.defaultSchedule(),
      offlineMessage: row?.offlineMessage ?? DEFAULT_OFFLINE,
      allowOfflineMessages: row?.allowOfflineMessages ?? true,
    };
  }

  async saveSettings(dto: { mode?: string; schedule?: unknown; offlineMessage?: string; allowOfflineMessages?: boolean }) {
    if (!['AUTO', 'OPEN', 'CLOSED'].includes(String(dto.mode))) throw new BadRequestException('Mode harus AUTO, OPEN, atau CLOSED.');
    const schedule = this.normalizeSchedule(dto.schedule);
    for (const d of schedule) {
      if (d.open && d.from >= d.to) throw new BadRequestException(`Jam tutup harus setelah jam buka (${DAY_NAMES[d.day]}).`);
    }
    const offlineMessage = String(dto.offlineMessage ?? '').trim() || DEFAULT_OFFLINE;
    if (offlineMessage.length > 300) throw new BadRequestException('Pesan di luar jam operasional maksimal 300 karakter.');
    const data = { mode: String(dto.mode), schedule: schedule as any, offlineMessage, allowOfflineMessages: dto.allowOfflineMessages !== false };
    await this.prisma.pmbChatSetting.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
    return this.status();
  }

  /** Waktu WIB (UTC+7, tanpa DST) sekarang: hari (0 = Minggu) dan menit sejak tengah malam. */
  private wibNow(now = new Date()) {
    const w = new Date(now.getTime() + 7 * 3600_000);
    return { day: w.getUTCDay(), minutes: w.getUTCHours() * 60 + w.getUTCMinutes() };
  }

  private toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

  /** Status publik chat: buka/tutup saat ini, jadwal, dan kapan buka berikutnya. */
  async status() {
    const s = await this.getSettings();
    const { day, minutes } = this.wibNow();
    const today = s.schedule[day];
    const inHours = today.open && minutes >= this.toMin(today.from) && minutes < this.toMin(today.to);
    const open = s.mode === 'OPEN' ? true : s.mode === 'CLOSED' ? false : inHours;

    let nextOpen: string | null = null;
    if (!open && s.mode !== 'OPEN') {
      for (let i = 0; i < 8; i++) {
        const d = s.schedule[(day + i) % 7];
        if (!d.open) continue;
        if (i === 0 && minutes >= this.toMin(d.from)) continue; // hari ini sudah lewat jam buka
        nextOpen = `${i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : DAY_NAMES[d.day]} pukul ${d.from} WIB`;
        break;
      }
    }
    return {
      open,
      mode: s.mode,
      schedule: s.schedule,
      offlineMessage: s.offlineMessage,
      allowOfflineMessages: s.allowOfflineMessages,
      nextOpen,
      serverTime: new Date().toISOString(),
    };
  }

  /** Menolak pesan baru saat chat tutup dan panitia tidak menerima pesan titipan. */
  private async assertAccepting() {
    const st = await this.status();
    if (!st.open && !st.allowOfflineMessages) {
      throw new BadRequestException(`Live chat sedang tutup.${st.nextOpen ? ` Buka kembali ${st.nextOpen}.` : ''}`);
    }
  }

  private cleanBody(raw: unknown): string {
    const text = String(raw ?? '').replace(/\r\n/g, '\n').trim();
    if (!text) throw new BadRequestException('Pesan tidak boleh kosong.');
    if (text.length > MAX_LEN) throw new BadRequestException(`Pesan terlalu panjang (maksimal ${MAX_LEN} karakter).`);
    return text;
  }

  private parseAfter(after?: string): Date | undefined {
    if (!after) return undefined;
    const d = new Date(after);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  /** Percakapan milik pelaku; untuk pendaftar dibuat bila belum ada, untuk pengunjung harus sudah dimulai. */
  private async threadOf(actor: ChatActor) {
    if (actor.kind === 'applicant') {
      const account = await this.prisma.pmbAccount.findUnique({ where: { id: actor.id }, select: { id: true } });
      if (!account) throw new NotFoundException('Akun PMB tidak ditemukan.');
      return this.prisma.pmbChatThread.upsert({ where: { accountId: actor.id }, update: {}, create: { accountId: actor.id } });
    }
    const thread = await this.prisma.pmbChatThread.findUnique({ where: { visitorKey: actor.id } });
    if (!thread) throw new NotFoundException('Percakapan tidak ditemukan.');
    return thread;
  }

  // ============================ PENGUNJUNG ANONIM ===========================

  /** Memulai percakapan sebagai pengunjung: butuh nama + kontak (email atau WhatsApp) + pesan pertama. */
  async startVisitor(dto: { name?: string; contact?: string; message?: string; website?: string }) {
    // honeypot: kolom tersembunyi yang tidak diisi manusia -- bot yang mengisinya kita tolak diam-diam
    if (dto.website && String(dto.website).trim()) throw new BadRequestException('Permintaan tidak dapat diproses.');
    const name = String(dto.name ?? '').trim().replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 60) throw new BadRequestException('Nama wajib diisi (2-60 karakter).');
    const contact = String(dto.contact ?? '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
    const isPhone = /^(\+?62|0)8\d{7,12}$/.test(contact.replace(/[\s-]/g, ''));
    if (!isEmail && !isPhone) throw new BadRequestException('Isi email atau nomor WhatsApp yang valid agar panitia dapat menghubungi Anda.');
    const body = this.cleanBody(dto.message);
    await this.assertAccepting();

    const visitorKey = randomUUID();
    const thread = await this.prisma.pmbChatThread.create({
      data: { visitorKey, visitorName: name, visitorContact: contact, staffUnread: 1 },
    });
    const msg = await this.prisma.pmbChatMessage.create({
      data: { threadId: thread.id, sender: 'APPLICANT', senderName: name, body },
    });
    await this.prisma.pmbChatThread.update({ where: { id: thread.id }, data: { lastMessageAt: msg.createdAt } });
    const token = this.jwt.sign({ sub: visitorKey, role: 'PMB_VISITOR' }, { expiresIn: '7d' });
    return { token, createdAt: msg.createdAt.toISOString() };
  }

  // ================================ PESERTA ================================

  async messages(actor: ChatActor, after?: string) {
    const thread = await this.threadOf(actor);
    const since = this.parseAfter(after);
    const rows = await this.prisma.pmbChatMessage.findMany({
      where: { threadId: thread.id, ...(since ? { createdAt: { gte: since } } : {}) },
      orderBy: { createdAt: since ? 'asc' : 'desc' },
      take: PAGE,
    });
    const messages = (since ? rows : rows.reverse()).map((m) => ({
      id: m.id,
      from: m.sender === 'APPLICANT' ? 'me' : 'staff',
      name: m.sender === 'APPLICANT' ? 'Anda' : STAFF_PUBLIC_NAME,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
    return { status: thread.status, unread: thread.applicantUnread, messages, serverTime: new Date().toISOString() };
  }

  async send(actor: ChatActor, message: unknown) {
    const body = this.cleanBody(message);
    await this.assertAccepting();
    const thread = await this.threadOf(actor);
    if (actor.kind === 'visitor') {
      const count = await this.prisma.pmbChatMessage.count({ where: { threadId: thread.id, sender: 'APPLICANT' } });
      if (count >= VISITOR_MAX_MESSAGES) {
        throw new BadRequestException('Batas pesan percakapan tamu tercapai. Silakan daftar akun PMB atau hubungi hotline panitia.');
      }
    }
    let senderName = thread.visitorName ?? 'Pengunjung';
    if (actor.kind === 'applicant') {
      const account = await this.prisma.pmbAccount.findUnique({ where: { id: actor.id }, select: { fullName: true } });
      senderName = account?.fullName ?? 'Pendaftar';
    }
    const msg = await this.prisma.pmbChatMessage.create({ data: { threadId: thread.id, sender: 'APPLICANT', senderName, body } });
    await this.prisma.pmbChatThread.update({
      where: { id: thread.id },
      // pesan baru dari peserta membuka kembali percakapan yang sempat ditutup
      data: { lastMessageAt: msg.createdAt, staffUnread: { increment: 1 }, status: 'OPEN' },
    });
    return { id: msg.id, createdAt: msg.createdAt.toISOString() };
  }

  async markRead(actor: ChatActor) {
    const thread = await this.threadOf(actor);
    await this.prisma.pmbChatThread.update({ where: { id: thread.id }, data: { applicantUnread: 0 } });
    return { success: true };
  }

  // ================================ PANITIA ================================

  private participant(t: { visitorKey: string | null; visitorName: string | null; visitorContact: string | null; account: { fullName: string; email: string; whatsapp: string } | null }) {
    if (t.account) return { kind: 'APPLICANT' as const, ...t.account };
    const contact = t.visitorContact ?? '';
    const isEmail = contact.includes('@');
    return {
      kind: 'VISITOR' as const,
      fullName: t.visitorName ?? 'Pengunjung',
      email: isEmail ? contact : '',
      whatsapp: isEmail ? '' : contact,
    };
  }

  async staffThreads(q: { search?: string; status?: string }) {
    const search = (q.search ?? '').trim();
    const where: any = { messages: { some: {} } };
    if (q.status === 'OPEN' || q.status === 'CLOSED') where.status = q.status;
    if (q.status === 'UNREAD') where.staffUnread = { gt: 0 };
    if (q.status === 'VISITOR') where.visitorKey = { not: null };
    if (search) {
      where.OR = [
        { account: { fullName: { contains: search, mode: 'insensitive' } } },
        { account: { email: { contains: search, mode: 'insensitive' } } },
        { account: { whatsapp: { contains: search } } },
        { visitorName: { contains: search, mode: 'insensitive' } },
        { visitorContact: { contains: search, mode: 'insensitive' } },
      ];
    }
    const threads = await this.prisma.pmbChatThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      include: {
        account: { select: { fullName: true, email: true, whatsapp: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true, createdAt: true } },
      },
    });
    const total = await this.staffUnreadTotal();
    return {
      unreadTotal: total.unread,
      items: threads.map((t) => ({
        id: t.id,
        status: t.status,
        unread: t.staffUnread,
        lastMessageAt: t.lastMessageAt.toISOString(),
        applicant: this.participant(t),
        lastMessage: t.messages[0]
          ? { body: t.messages[0].body.slice(0, 120), sender: t.messages[0].sender, createdAt: t.messages[0].createdAt.toISOString() }
          : null,
      })),
    };
  }

  async staffUnreadTotal() {
    const agg = await this.prisma.pmbChatThread.aggregate({ _sum: { staffUnread: true }, where: { staffUnread: { gt: 0 } } });
    const threads = await this.prisma.pmbChatThread.count({ where: { staffUnread: { gt: 0 } } });
    return { unread: agg._sum.staffUnread ?? 0, threads };
  }

  private async requireThread(threadId: string) {
    const t = await this.prisma.pmbChatThread.findUnique({
      where: { id: threadId },
      include: { account: { select: { fullName: true, email: true, whatsapp: true } } },
    });
    if (!t) throw new NotFoundException('Percakapan tidak ditemukan.');
    return t;
  }

  async staffMessages(threadId: string, after?: string) {
    const thread = await this.requireThread(threadId);
    const who = this.participant(thread);
    const since = this.parseAfter(after);
    const rows = await this.prisma.pmbChatMessage.findMany({
      where: { threadId, ...(since ? { createdAt: { gte: since } } : {}) },
      orderBy: { createdAt: since ? 'asc' : 'desc' },
      take: PAGE,
    });
    return {
      thread: { id: thread.id, status: thread.status, unread: thread.staffUnread, applicant: who },
      messages: (since ? rows : rows.reverse()).map((m) => ({
        id: m.id,
        from: m.sender === 'STAFF' ? 'staff' : 'applicant',
        name: m.sender === 'STAFF' ? m.senderName : who.fullName,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      })),
      serverTime: new Date().toISOString(),
    };
  }

  async staffSend(threadId: string, user: { sub?: string; fullName?: string }, message: unknown) {
    const body = this.cleanBody(message);
    await this.requireThread(threadId);
    // akun demo tidak punya baris User -- hanya simpan relasi bila akunnya ada
    const exists = user?.sub ? await this.prisma.user.findUnique({ where: { id: user.sub }, select: { id: true } }) : null;
    const msg = await this.prisma.pmbChatMessage.create({
      data: { threadId, sender: 'STAFF', senderUserId: exists?.id ?? null, senderName: user?.fullName || STAFF_PUBLIC_NAME, body },
    });
    await this.prisma.pmbChatThread.update({
      where: { id: threadId },
      data: { lastMessageAt: msg.createdAt, applicantUnread: { increment: 1 }, staffUnread: 0 },
    });
    return { id: msg.id, createdAt: msg.createdAt.toISOString() };
  }

  async staffRead(threadId: string) {
    await this.requireThread(threadId);
    await this.prisma.pmbChatThread.update({ where: { id: threadId }, data: { staffUnread: 0 } });
    return { success: true };
  }

  async staffSetStatus(threadId: string, status: string) {
    if (status !== 'OPEN' && status !== 'CLOSED') throw new BadRequestException('Status harus OPEN atau CLOSED.');
    await this.requireThread(threadId);
    await this.prisma.pmbChatThread.update({ where: { id: threadId }, data: { status } });
    return { success: true, status };
  }
}
