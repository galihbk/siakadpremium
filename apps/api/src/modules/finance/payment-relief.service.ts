import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { FinanceService } from './finance.service';

export interface ReliefCreateDto {
  invoiceId?: string;
  type?: string;
  reason?: string;
  requestedAmount?: number | string | null;
  requestedDueDate?: string | null;
  attachmentUrl?: string | null;
}

export interface ReliefDecisionDto {
  decision?: string;
  approvedAmount?: number | string | null;
  approvedDueDate?: string | null;
  note?: string;
}

const TYPES = ['POTONGAN', 'PEMBEBASAN', 'PENUNDAAN'] as const;
const TYPE_LABEL: Record<string, string> = { POTONGAN: 'potongan biaya', PEMBEBASAN: 'pembebasan biaya', PENUNDAAN: 'penundaan jatuh tempo' };

/**
 * Keringanan pembayaran: mahasiswa mengajukan potongan/pembebasan/penundaan atas satu tagihan yang belum lunas;
 * Keuangan menyetujui (boleh dengan nominal/tanggal berbeda) atau menolak, dan tagihan otomatis menyesuaikan.
 */
@Injectable()
export class PaymentReliefService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private storage: StorageService,
    private finance: FinanceService,
  ) {}

  private rupiah(n: number) {
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  }

  private fmtDate(d: Date) {
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  }

  /** Tanggal polos (YYYY-MM-DD) dibaca sebagai akhir hari WIB. */
  private parseDate(value?: string | null) {
    const v = (value ?? '').trim();
    if (!v) return null;
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T23:59:59+07:00`) : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private async studentByUser(userId: string) {
    const st = await this.prisma.student.findUnique({ where: { userId }, include: { user: { select: { fullName: true } } } });
    if (!st) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    return st;
  }

  private shape(r: any) {
    return {
      id: r.id,
      type: r.type,
      reason: r.reason,
      requestedAmount: r.requestedAmount,
      requestedDueDate: r.requestedDueDate,
      attachmentUrl: r.attachmentUrl ? this.storage.refreshPrivateUrl(r.attachmentUrl) : null,
      invoiceAmountAtRequest: r.invoiceAmountAtRequest,
      invoiceDueDateAtRequest: r.invoiceDueDateAtRequest,
      status: r.status,
      approvedAmount: r.approvedAmount,
      approvedDueDate: r.approvedDueDate,
      financeNote: r.financeNote,
      decidedAt: r.decidedAt,
      decidedByName: r.decidedByName,
      createdAt: r.createdAt,
      invoice: r.invoice
        ? { id: r.invoice.id, invoiceNo: r.invoice.invoiceNo, paymentType: r.invoice.paymentType, amount: r.invoice.amount, dueDate: r.invoice.dueDate, status: r.invoice.status }
        : undefined,
    };
  }

  // ================================================================ MAHASISWA
  async listMine(userId: string) {
    const student = await this.studentByUser(userId);
    const rows = await this.prisma.paymentReliefRequest.findMany({
      where: { studentId: student.id },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((r) => this.shape(r)) };
  }

  async create(userId: string, dto: ReliefCreateDto) {
    const student = await this.studentByUser(userId);
    if (!dto.invoiceId) throw new BadRequestException('Tagihan wajib dipilih.');
    const inv = await this.prisma.paymentInvoice.findUnique({ where: { id: dto.invoiceId } });
    if (!inv) throw new NotFoundException('Tagihan tidak ditemukan.');
    if (inv.nim !== student.nim) throw new ForbiddenException('Tagihan ini bukan milik Anda.');
    if (inv.status === 'LUNAS') throw new BadRequestException('Tagihan ini sudah lunas.');
    if (inv.status === 'MENUNGGU_VERIFIKASI') throw new BadRequestException('Bukti pembayaran tagihan ini sedang diverifikasi Keuangan; keringanan tidak dapat diajukan.');
    if ((await this.prisma.paymentReliefRequest.count({ where: { invoiceId: inv.id, status: 'PENDING' } })) > 0) {
      throw new BadRequestException('Masih ada pengajuan keringanan untuk tagihan ini yang menunggu keputusan Keuangan.');
    }

    const type = (dto.type ?? '').toUpperCase();
    if (!(TYPES as readonly string[]).includes(type)) throw new BadRequestException('Jenis keringanan tidak valid.');
    const reason = (dto.reason ?? '').trim();
    if (reason.length < 10) throw new BadRequestException('Alasan pengajuan wajib diisi (minimal 10 karakter).');

    let requestedAmount: number | null = null;
    let requestedDueDate: Date | null = null;
    if (type === 'POTONGAN') {
      requestedAmount = Math.round(Number(dto.requestedAmount));
      if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) throw new BadRequestException('Nominal potongan yang diminta wajib diisi.');
      if (requestedAmount >= inv.amount) throw new BadRequestException('Nominal potongan harus lebih kecil dari tagihan. Untuk membebaskan seluruh tagihan pilih "Pembebasan".');
    } else if (type === 'PENUNDAAN') {
      requestedDueDate = this.parseDate(dto.requestedDueDate);
      if (!requestedDueDate || requestedDueDate.getTime() <= Date.now()) throw new BadRequestException('Tanggal jatuh tempo yang diminta harus setelah hari ini.');
    }

    const saved = await this.prisma.paymentReliefRequest.create({
      data: {
        invoiceId: inv.id,
        studentId: student.id,
        type,
        reason,
        requestedAmount,
        requestedDueDate,
        attachmentUrl: (dto.attachmentUrl ?? '').trim() || null,
        invoiceAmountAtRequest: inv.amount,
        invoiceDueDateAtRequest: inv.dueDate,
      },
    });
    void this.notifications.notifyRoles(['ADMIN_KEUANGAN'], {
      type: 'FINANCE',
      title: 'Pengajuan keringanan pembayaran',
      body: `${student.user.fullName} (${student.nim}) mengajukan ${TYPE_LABEL[type]} untuk ${inv.invoiceNo}.`,
      link: '/finance/keringanan',
    });
    return { success: true, message: 'Pengajuan keringanan terkirim dan menunggu keputusan Keuangan.', data: this.shape(saved) };
  }

  async cancel(userId: string, id: string) {
    const student = await this.studentByUser(userId);
    const r = await this.prisma.paymentReliefRequest.findUnique({ where: { id } });
    if (!r || r.studentId !== student.id) throw new NotFoundException('Pengajuan tidak ditemukan.');
    if (r.status !== 'PENDING') throw new BadRequestException('Hanya pengajuan yang masih menunggu yang dapat dibatalkan.');
    await this.prisma.paymentReliefRequest.update({ where: { id }, data: { status: 'CANCELLED', decidedAt: new Date(), decidedByName: student.user.fullName, financeNote: 'Dibatalkan oleh mahasiswa.' } });
    return { success: true, message: 'Pengajuan keringanan dibatalkan. Tagihan dapat dibayar kembali.' };
  }

  // ================================================================ KEUANGAN
  async list(q: { status?: string; search?: string }) {
    const rows = await this.prisma.paymentReliefRequest.findMany({
      where: q.status ? { status: q.status } : {},
      include: { invoice: true, student: { include: { user: { select: { fullName: true } }, studyProgram: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    const grouped = await this.prisma.paymentReliefRequest.groupBy({ by: ['status'], _count: { _all: true } });
    const counts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, CANCELLED: 0 };
    for (const g of grouped) counts[g.status] = g._count._all;
    const needle = q.search?.trim().toLowerCase();
    const items = rows
      .filter((r) => !needle || r.student.user.fullName.toLowerCase().includes(needle) || r.student.nim.includes(needle) || r.invoice.invoiceNo.toLowerCase().includes(needle))
      .map((r) => ({ ...this.shape(r), nim: r.student.nim, studentName: r.student.user.fullName, studyProgram: r.student.studyProgram?.name ?? '-' }));
    return { counts, items };
  }

  async pendingCount() {
    return { pending: await this.prisma.paymentReliefRequest.count({ where: { status: 'PENDING' } }) };
  }

  async decide(id: string, dto: ReliefDecisionDto, actorUserId?: string) {
    const r = await this.prisma.paymentReliefRequest.findUnique({ where: { id }, include: { invoice: true } });
    if (!r) throw new NotFoundException('Pengajuan tidak ditemukan.');
    if (r.status !== 'PENDING') throw new BadRequestException('Pengajuan ini sudah diputuskan.');
    const decision = (dto.decision ?? '').toUpperCase();
    if (decision !== 'APPROVED' && decision !== 'REJECTED') throw new BadRequestException('Keputusan harus APPROVED atau REJECTED.');
    const note = (dto.note ?? '').trim();
    const actor = actorUserId ? await this.prisma.user.findUnique({ where: { id: actorUserId }, select: { fullName: true, email: true } }) : null;
    const actorName = actor?.fullName ?? 'Keuangan';

    if (decision === 'REJECTED') {
      if (note.length < 3) throw new BadRequestException('Alasan penolakan wajib diisi.');
      await this.prisma.paymentReliefRequest.update({ where: { id }, data: { status: 'REJECTED', financeNote: note, decidedAt: new Date(), decidedByName: actorName } });
      await this.notifyStudent(r.studentId, 'Keringanan pembayaran ditolak', `Pengajuan untuk ${r.invoice.invoiceNo} ditolak. Alasan: ${note}`);
      await this.audit(`Keringanan ${r.invoice.invoiceNo} ditolak`, actor?.email);
      return { success: true, message: 'Pengajuan ditolak.' };
    }

    const inv = r.invoice;
    if (inv.status !== 'TERTUNDA') throw new BadRequestException('Status tagihan sudah berubah (sudah lunas atau sedang diverifikasi), pengajuan tidak dapat disetujui.');

    let approvedAmount: number | null = null;
    let approvedDueDate: Date | null = null;
    let summary: string;

    if (r.type === 'PENUNDAAN') {
      approvedDueDate = this.parseDate(dto.approvedDueDate) ?? r.requestedDueDate;
      if (!approvedDueDate || approvedDueDate.getTime() <= Date.now()) throw new BadRequestException('Tanggal jatuh tempo baru harus setelah hari ini.');
      await this.prisma.paymentInvoice.update({
        where: { id: inv.id },
        data: { dueDate: this.fmtDate(approvedDueDate), notes: `${inv.notes ? inv.notes + ' | ' : ''}Jatuh tempo diundur ke ${this.fmtDate(approvedDueDate)} (keringanan).` },
      });
      summary = `Jatuh tempo ${inv.invoiceNo} diundur ke ${this.fmtDate(approvedDueDate)}.`;
    } else {
      const wanted = r.type === 'PEMBEBASAN' ? inv.amount : Math.round(Number(dto.approvedAmount ?? r.requestedAmount));
      if (!Number.isFinite(wanted) || wanted <= 0 || wanted > inv.amount) throw new BadRequestException(`Nominal potongan harus antara Rp 1 dan ${this.rupiah(inv.amount)}.`);
      approvedAmount = wanted;
      const remaining = inv.amount - wanted;
      await this.prisma.$transaction([
        this.prisma.paymentInvoice.update({
          where: { id: inv.id },
          data: {
            amount: remaining,
            originalAmount: inv.originalAmount ?? inv.amount,
            totalDiscount: (inv.totalDiscount ?? 0) + wanted,
            notes: `${inv.notes ? inv.notes + ' | ' : ''}Keringanan ${this.rupiah(wanted)} disetujui Keuangan.`,
          },
        }),
        this.prisma.paymentInvoiceItem.create({
          data: { invoiceId: inv.id, componentName: 'Keringanan pembayaran', baseAmount: 0, actionType: 'KERINGANAN', discountAmount: wanted, finalAmount: -wanted },
        }),
      ]);
      if (remaining === 0) await this.finance.settleInvoiceFree(inv.id);
      summary = remaining === 0 ? `${inv.invoiceNo} dibebaskan dan dinyatakan lunas.` : `Tagihan ${inv.invoiceNo} dipotong ${this.rupiah(wanted)}; sisa ${this.rupiah(remaining)}.`;
    }

    await this.prisma.paymentReliefRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedAmount, approvedDueDate, financeNote: note || null, decidedAt: new Date(), decidedByName: actorName },
    });
    await this.notifyStudent(r.studentId, 'Keringanan pembayaran disetujui', `${summary}${note ? ` Catatan: ${note}` : ''}`);
    await this.audit(`Keringanan ${inv.invoiceNo} disetujui: ${summary}`, actor?.email);
    return { success: true, message: `Pengajuan disetujui. ${summary}` };
  }

  private async notifyStudent(studentId: string, title: string, body: string) {
    await this.notifications.notifyStudent(studentId, { type: 'FINANCE', title, body, link: '/student/keuangan' });
  }

  private async audit(detail: string, email?: string | null) {
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_RELIEF', detail, userEmail: email ?? 'keuangan' } }).catch(() => null);
  }
}
