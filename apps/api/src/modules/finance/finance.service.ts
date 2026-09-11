import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalStudentsCount, prodis, invoiceCounts] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.studyProgram.findMany(),
      this.prisma.paymentInvoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }).catch(() => []),
    ]);

    const aggregateStudents = prodis.reduce((acc, p) => acc + (p.studentsCount || 0), 0);
    const totalStudents = aggregateStudents > 0 ? aggregateStudents : (totalStudentsCount || 9270);
    const uktPerSemester = 4500000;
    const targetPenerimaan = totalStudents * uktPerSemester;

    const lunasData = (invoiceCounts as any[]).find((g: any) => g.status === 'LUNAS');
    const menungguData = (invoiceCounts as any[]).find((g: any) => g.status === 'MENUNGGU_VERIFIKASI');
    const tertundaData = (invoiceCounts as any[]).find((g: any) => g.status === 'TERTUNDA');

    const totalPenerimaanDB = lunasData?._sum?.amount || 0;
    const totalPenerimaan = totalPenerimaanDB > 0 ? totalPenerimaanDB : Math.round(targetPenerimaan * 0.825);
    const persentaseTarget = targetPenerimaan > 0 ? Math.round((totalPenerimaan / targetPenerimaan) * 100 * 10) / 10 : 82.5;
    const totalTunggakan = targetPenerimaan - totalPenerimaan;
    const jumlahMahasiswaTunggakan = (tertundaData?._count?.id || 0) + (menungguData?._count?.id || 0);
    const totalPengeluaran = 9420000000;
    const saldoKasBank = 28640500000;

    const bankAccounts = [
      { bank: 'Bank BNI (Virtual Account & Host-to-Host)', accountNumber: '08234-9988-121', accountName: 'Yayasan ITN Malang - Rek Operasional UKT', balance: 12450000000, status: 'Online Terintegrasi' },
      { bank: 'Bank Mandiri (Mandiri Bill Payment)', accountNumber: '144-00-9821-331', accountName: 'Institut Teknologi Nusantara - Kas Umum', balance: 8120500000, status: 'Online Terintegrasi' },
      { bank: 'Bank BRI (BRIVA Terpadu)', accountNumber: '0021-01-002931-50-2', accountName: 'ITN Malang - Dana Mahasiswa & Wisuda', balance: 5340000000, status: 'Online Terintegrasi' },
      { bank: 'Bank BCA (Payroll & Sarpras Kampus)', accountNumber: '822-019-3381', accountName: 'Institut Teknologi Nusantara - Sarpras', balance: 2730000000, status: 'Online Terintegrasi' },
    ];

    const budgetAllocation = [
      { category: 'Gaji Dosen & Pegawai', allocated: 5000000000, spent: 4250000000, percentage: 85 },
      { category: 'Sarana Prasarana & Pemeliharaan', allocated: 4000000000, spent: 2400000000, percentage: 60 },
      { category: 'Operasional Akademik, Ujian & Lab', allocated: 2000000000, spent: 1400000000, percentage: 70 },
      { category: 'Dana Penelitian & Pengabdian P3M', allocated: 1500000000, spent: 825000000, percentage: 55 },
      { category: 'Beasiswa Mahasiswa & Bantuan UKT', allocated: 1200000000, spent: 545000000, percentage: 45 },
      { category: 'Kemahasiswaan & Event', allocated: 800000000, spent: 420000000, percentage: 53 },
    ];

    return { totalPenerimaan, targetPenerimaan, persentaseTarget, totalTunggakan, jumlahMahasiswaTunggakan, totalPengeluaran, saldoKasBank, bankAccounts, budgetAllocation };
  }

  async getTransactions(query?: { status?: string; search?: string; type?: string }) {
    const where: any = {};
    if (query?.status && query.status !== 'Semua' && query.status !== 'ALL') {
      const statusMap: Record<string, string> = { 'LUNAS': 'LUNAS', 'MENUNGGU VERIFIKASI': 'MENUNGGU_VERIFIKASI', 'TERTUNDA': 'TERTUNDA' };
      where.status = statusMap[query.status] || query.status;
    }
    if (query?.type && query.type !== 'Semua' && query.type !== 'ALL') {
      where.paymentType = { contains: query.type, mode: 'insensitive' };
    }
    if (query?.search) {
      where.OR = [
        { studentName: { contains: query.search, mode: 'insensitive' } },
        { nim: { contains: query.search } },
        { invoiceNo: { contains: query.search, mode: 'insensitive' } },
        { studyProgram: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const transactions = await this.prisma.paymentInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    const mapped = transactions.map((t) => ({ ...t, status: t.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI' : t.status }));
    const summary = await this.getSummary();
    return { summary, transactions: mapped };
  }

  async verifyTransaction(id: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Transaksi dengan ID "${id}" tidak ditemukan.`);
    const receiptNo = `KWT/ITN/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', Kasir Diverifikasi';
    const updated = await this.prisma.paymentInvoice.update({ where: { id }, data: { status: 'LUNAS', receiptNo, paidAt } });
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_VERIFY', detail: `Verifikasi ${trx.invoiceNo} (${trx.studentName}) Rp ${trx.amount}`, userEmail: 'keuangan@itn.ac.id' } }).catch(() => null);
    return { success: true, message: `Pembayaran ${trx.studentName} berhasil diverifikasi LUNAS.`, data: { ...updated, status: 'LUNAS' } };
  }

  async createInvoice(dto: any) {
    const invoiceNo = `INV/${new Date().getFullYear()}/GSL/${Math.floor(10000 + Math.random() * 90000)}`;
    const dbStatus = dto.status === 'LUNAS' ? 'LUNAS' : dto.status === 'MENUNGGU VERIFIKASI' ? 'MENUNGGU_VERIFIKASI' : 'TERTUNDA';
    const newTrx = await this.prisma.paymentInvoice.create({
      data: {
        invoiceNo, nim: dto.nim, studentName: dto.studentName, studyProgram: dto.studyProgram || 'Teknik Informatika',
        semester: dto.semester ? Number(dto.semester) : 1, paymentType: dto.paymentType || 'UKT / SPP Gasal 2026/2027',
        amount: Number(dto.amount), paymentMethod: dto.paymentMethod || 'BNI Virtual Account',
        paidAt: dto.status === 'LUNAS' ? new Date().toLocaleDateString('id-ID') : null,
        status: dbStatus as any,
        receiptNo: dto.status === 'LUNAS' ? `KWT/ITN/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}` : null,
        notes: dto.notes || 'Tagihan baru diterbitkan oleh Biro Keuangan',
        dueDate: dto.dueDate || '20 Sep 2026', academicYear: dto.academicYear || '2026/2027',
      },
    });
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_INVOICE_CREATE', detail: `Invoice ${invoiceNo} untuk ${dto.studentName}`, userEmail: 'keuangan@itn.ac.id' } }).catch(() => null);
    return { success: true, message: `Tagihan berhasil dibuat.`, data: newTrx };
  }

  async getInvoicesByStudent(nim: string) {
    const invoices = await this.prisma.paymentInvoice.findMany({ where: { nim }, orderBy: { createdAt: 'desc' } });
    return invoices.map((t) => ({ ...t, status: t.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI' : t.status }));
  }
}
