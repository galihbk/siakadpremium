import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async getSummary() {
    const [invoiceGroups, unpaidInvoices, bankAccounts, budgetItems] = await Promise.all([
      this.prisma.paymentInvoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.paymentInvoice.findMany({
        where: { status: { not: 'LUNAS' } },
        select: { nim: true, dueDate: true },
      }),
      this.prisma.financeBankAccount.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.financeBudgetItem.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

    const sumOf = (status: string) => (invoiceGroups.find((g) => g.status === status)?._sum.amount ?? 0);
    const totalPenerimaan = sumOf('LUNAS');
    const totalTunggakan = sumOf('TERTUNDA') + sumOf('MENUNGGU_VERIFIKASI');
    const targetPenerimaan = totalPenerimaan + totalTunggakan;
    const persentaseTarget = targetPenerimaan > 0 ? Math.round((totalPenerimaan / targetPenerimaan) * 1000) / 10 : 0;
    const jumlahMahasiswaTunggakan = new Set(unpaidInvoices.map((i) => i.nim)).size;
    const batasPelunasan = unpaidInvoices.map((i) => i.dueDate).filter(Boolean).sort()[0] ?? null;

    const totalPagu = budgetItems.reduce((acc, b) => acc + b.allocated, 0);
    const totalPengeluaran = budgetItems.reduce((acc, b) => acc + b.spent, 0);
    const saldoKasBank = bankAccounts.reduce((acc, b) => acc + b.balance, 0);

    return {
      totalPenerimaan,
      targetPenerimaan,
      persentaseTarget,
      totalTunggakan,
      jumlahMahasiswaTunggakan,
      batasPelunasan,
      totalPagu,
      totalPengeluaran,
      saldoKasBank,
      bankAccounts: bankAccounts.map((b) => ({
        id: b.id,
        bank: b.bankName,
        description: b.description,
        accountNumber: b.accountNumber,
        accountName: b.accountName,
        balance: b.balance,
      })),
      budgetAllocation: budgetItems.map((b) => ({
        id: b.id,
        category: b.category,
        allocated: b.allocated,
        spent: b.spent,
        percentage: b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0,
      })),
    };
  }

  // --- Rekapitulasi mengajar ---
  async getTeachingRecap(academicYearId?: string) {
    const years = await this.prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
    const year = years.find((y) => y.id === academicYearId) ?? years.find((y) => y.isActive) ?? years[0];
    if (!year) return { academicYears: [], selectedAcademicYearId: null, lecturers: [], totals: null };

    const classes = await this.prisma.courseClass.findMany({
      where: { academicYearId: year.id, lecturerId: { not: null } },
      include: {
        course: { select: { code: true, name: true, sks: true } },
        lecturer: { include: { user: { select: { fullName: true } }, studyProgram: { select: { name: true } } } },
        _count: { select: { attendanceSessions: true } },
      },
      orderBy: { className: 'asc' },
    });

    const byLecturer = new Map<string, any>();
    for (const c of classes) {
      if (!c.lecturer) continue;
      const meetings = c._count.attendanceSessions;

      let row = byLecturer.get(c.lecturer.id);
      if (!row) {
        const l = c.lecturer;
        row = {
          lecturerId: l.id,
          nidn: l.nidn,
          name: `${l.titlePrefix ? l.titlePrefix + ' ' : ''}${l.user.fullName}${l.titleSuffix ? ', ' + l.titleSuffix : ''}`,
          studyProgram: l.studyProgram?.name ?? '-',
          totalClasses: 0,
          totalSks: 0,
          totalMeetings: 0,
          classes: [],
        };
        byLecturer.set(l.id, row);
      }
      row.totalClasses += 1;
      row.totalSks += c.course.sks;
      row.totalMeetings += meetings;
      row.classes.push({
        id: c.id,
        className: c.className,
        courseCode: c.course.code,
        courseName: c.course.name,
        sks: c.course.sks,
        day: c.day,
        time: `${c.startTime}-${c.endTime}`,
        meetings,
      });
    }

    const lecturers = [...byLecturer.values()].sort((a, b) => a.name.localeCompare(b.name));

    const totals = {
      lecturers: lecturers.length,
      classes: lecturers.reduce((a, r) => a + r.totalClasses, 0),
      sks: lecturers.reduce((a, r) => a + r.totalSks, 0),
      meetings: lecturers.reduce((a, r) => a + r.totalMeetings, 0),
    };

    return {
      academicYears: years.map((y) => ({ id: y.id, name: y.name, semesterType: y.semesterType, isActive: y.isActive })),
      selectedAcademicYearId: year.id,
      lecturers,
      totals,
    };
  }

  // --- Pengaturan gaji dosen & karyawan ---
  async getPayrollSettings(search?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'LECTURER', 'STAFF'] as any },
        ...(search
          ? { fullName: { contains: search, mode: 'insensitive' as const } }
          : {}),
      },
      include: {
        lecturer: { include: { studyProgram: { select: { name: true } } } },
        salarySetting: true,
        salaryComponents: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return users.map((u) => {
      const tunjangan = u.salaryComponents.filter((c) => c.type === 'TUNJANGAN');
      const potongan = u.salaryComponents.filter((c) => c.type === 'POTONGAN');
      const totalTunjangan = tunjangan.reduce((a, c) => a + c.amount, 0);
      const totalPotongan = potongan.reduce((a, c) => a + c.amount, 0);
      const baseSalary = u.salarySetting?.baseSalary ?? 0;

      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        category: u.role === 'LECTURER' ? 'Dosen' : 'Karyawan',
        studyProgram: u.lecturer?.studyProgram?.name ?? null,
        nidn: u.lecturer?.nidn ?? null,
        isActive: u.isActive,
        baseSalary,
        honorPerSks: u.salarySetting?.honorPerSks ?? 0,
        tunjangan: tunjangan.map((c) => ({ id: c.id, name: c.name, amount: c.amount })),
        potongan: potongan.map((c) => ({ id: c.id, name: c.name, amount: c.amount })),
        totalTunjangan,
        totalPotongan,
        gajiBersih: baseSalary + totalTunjangan - totalPotongan,
        notes: u.salarySetting?.notes ?? null,
        updatedAt: u.salarySetting?.updatedAt ?? null,
      };
    });
  }

  async upsertPayrollSetting(
    userId: string,
    data: {
      baseSalary?: number;
      honorPerSks?: number;
      notes?: string;
      updatedBy?: string;
      tunjangan?: { name: string; amount: number }[];
      potongan?: { name: string; amount: number }[];
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');

    const components = [
      ...(data.tunjangan ?? [])
        .filter((c) => c.name?.trim())
        .map((c) => ({ userId, type: 'TUNJANGAN', name: c.name.trim(), amount: c.amount || 0 })),
      ...(data.potongan ?? [])
        .filter((c) => c.name?.trim())
        .map((c) => ({ userId, type: 'POTONGAN', name: c.name.trim(), amount: c.amount || 0 })),
    ];

    const [setting] = await this.prisma.$transaction([
      this.prisma.salarySetting.upsert({
        where: { userId },
        create: {
          userId,
          baseSalary: data.baseSalary ?? 0,
          honorPerSks: data.honorPerSks ?? 0,
          notes: data.notes,
          updatedBy: data.updatedBy,
        },
        update: {
          baseSalary: data.baseSalary ?? 0,
          honorPerSks: data.honorPerSks ?? 0,
          notes: data.notes,
          updatedBy: data.updatedBy,
        },
      }),
      this.prisma.salaryComponent.deleteMany({ where: { userId } }),
      ...(components.length ? [this.prisma.salaryComponent.createMany({ data: components })] : []),
    ]);

    return { success: true, message: 'Pengaturan gaji berhasil disimpan', data: setting };
  }

  // Honor mengajar dihitung per 1 semester (14 pertemuan), dicairkan dalam 6 kali pembayaran,
  // sehingga nominal yang tampil di sini adalah honor mengajar PER BULAN (bukan per semester).
  private static readonly MEETINGS_PER_SEMESTER = 14;
  private static readonly PAYMENTS_PER_SEMESTER = 6;

  // --- Rekap honor (gabungan rekap mengajar + pengaturan gaji + transport kehadiran) ---
  async getHonorRecap(academicYearId?: string) {
    const [teaching, users] = await Promise.all([
      this.getTeachingRecap(academicYearId),
      this.prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'LECTURER', 'STAFF'] as any } },
        include: {
          lecturer: { include: { studyProgram: { select: { name: true } } } },
          salarySetting: true,
          salaryComponents: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const selectedYear = teaching.selectedAcademicYearId
      ? await this.prisma.academicYear.findUnique({ where: { id: teaching.selectedAcademicYearId } })
      : null;
    const transport = selectedYear
      ? await this.attendanceService.getAttendanceTransportTotals(selectedYear.startDate, selectedYear.endDate)
      : null;

    const sksByLecturerId = new Map(teaching.lecturers.map((l: any) => [l.lecturerId, l]));

    const rows = users.map((u) => {
      const isLecturer = u.role === 'LECTURER';
      const teach = isLecturer && u.lecturer ? sksByLecturerId.get(u.lecturer.id) : undefined;
      const baseSalary = u.salarySetting?.baseSalary ?? 0;
      const totalTunjangan = u.salaryComponents.filter((c) => c.type === 'TUNJANGAN').reduce((a, c) => a + c.amount, 0);
      const totalPotongan = u.salaryComponents.filter((c) => c.type === 'POTONGAN').reduce((a, c) => a + c.amount, 0);
      const honorPerSks = u.salarySetting?.honorPerSks ?? 0;
      const totalSks = teach?.totalSks ?? 0;
      const honorMengajarPerBulan = isLecturer
        ? Math.round(
            (totalSks * honorPerSks * FinanceService.MEETINGS_PER_SEMESTER) / FinanceService.PAYMENTS_PER_SEMESTER,
          )
        : 0;
      const attendance = transport?.byUser.get(u.id);
      const hadirPagi = attendance?.hadirPagi ?? 0;
      const hadirSore = attendance?.hadirSore ?? 0;
      const transportTotal = attendance?.transportTotal ?? 0;
      const totalHonor = baseSalary + totalTunjangan - totalPotongan + honorMengajarPerBulan + transportTotal;

      return {
        userId: u.id,
        fullName: u.fullName,
        email: u.email,
        category: isLecturer ? 'Dosen' : 'Karyawan',
        studyProgram: u.lecturer?.studyProgram?.name ?? null,
        nidn: u.lecturer?.nidn ?? null,
        totalClasses: teach?.totalClasses ?? 0,
        totalSks,
        baseSalary,
        totalTunjangan,
        totalPotongan,
        honorPerSks,
        honorMengajar: honorMengajarPerBulan,
        hadirPagi,
        hadirSore,
        transportTotal,
        totalHonor,
      };
    });

    const totals = {
      count: rows.length,
      totalBaseSalary: rows.reduce((a, r) => a + r.baseSalary, 0),
      totalHonorMengajar: rows.reduce((a, r) => a + r.honorMengajar, 0),
      totalTunjangan: rows.reduce((a, r) => a + r.totalTunjangan, 0),
      totalPotongan: rows.reduce((a, r) => a + r.totalPotongan, 0),
      totalTransport: rows.reduce((a, r) => a + r.transportTotal, 0),
      grandTotal: rows.reduce((a, r) => a + r.totalHonor, 0),
    };

    return {
      academicYears: teaching.academicYears,
      selectedAcademicYearId: teaching.selectedAcademicYearId,
      transportRate: transport?.rate ?? { ratePagi: 0, rateSore: 0 },
      rows,
      totals,
    };
  }

  // --- Tarif uang transport (pagi/sore) ---
  async getTransportRate() {
    return this.attendanceService.getRateSettings();
  }

  async updateTransportRate(data: { ratePagi?: number; rateSore?: number; updatedBy?: string }) {
    return this.attendanceService.updateRateSettings(data);
  }

  // --- Rekening bank ---
  getBankAccounts() {
    return this.prisma.financeBankAccount.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createBankAccount(dto: any) {
    return await this.prisma.financeBankAccount.create({ data: this.pickBank(dto) });
  }

  async updateBankAccount(id: string, dto: any) {
    return await this.prisma.financeBankAccount.update({ where: { id }, data: this.pickBank(dto) });
  }

  async deleteBankAccount(id: string) {
    await this.prisma.financeBankAccount.delete({ where: { id } });
    return { success: true };
  }

  private pickBank(dto: any) {
    return {
      bankName: String(dto.bankName ?? '').trim(),
      description: dto.description || null,
      accountNumber: String(dto.accountNumber ?? '').trim(),
      accountName: String(dto.accountName ?? '').trim(),
      balance: Number(dto.balance) || 0,
      ...(dto.isActive !== undefined ? { isActive: !!dto.isActive } : {}),
    };
  }

  // --- Anggaran ---
  getBudgetItems() {
    return this.prisma.financeBudgetItem.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createBudgetItem(dto: any) {
    return await this.prisma.financeBudgetItem.create({ data: this.pickBudget(dto) });
  }

  async updateBudgetItem(id: string, dto: any) {
    return await this.prisma.financeBudgetItem.update({ where: { id }, data: this.pickBudget(dto) });
  }

  async deleteBudgetItem(id: string) {
    await this.prisma.financeBudgetItem.delete({ where: { id } });
    return { success: true };
  }

  private pickBudget(dto: any) {
    return {
      category: String(dto.category ?? '').trim(),
      allocated: Number(dto.allocated) || 0,
      spent: Number(dto.spent) || 0,
      ...(dto.academicYear ? { academicYear: String(dto.academicYear) } : {}),
    };
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

  /**
   * KRS yang masih DRAFT (menunggu pembayaran UKT) baru resmi diajukan ke Dosen PA
   * begitu tagihan semester itu LUNAS.
   */
  private async promoteKrsAfterPayment(nim: string, academicYear: string) {
    const [student, year] = await Promise.all([
      this.prisma.student.findUnique({ where: { nim } }),
      this.prisma.academicYear.findFirst({ where: { name: academicYear } }),
    ]);
    if (!student || !year) return;

    await this.prisma.courseEnrollment.updateMany({
      where: { studentId: student.id, academicYearId: year.id, status: 'DRAFT' },
      data: { status: 'SUBMITTED' },
    });
  }

  async verifyTransaction(id: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Transaksi dengan ID "${id}" tidak ditemukan.`);
    const receiptNo = `KWT/ITN/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', Kasir Diverifikasi';
    const updated = await this.prisma.paymentInvoice.update({ where: { id }, data: { status: 'LUNAS', receiptNo, paidAt } });
    await this.promoteKrsAfterPayment(trx.nim, trx.academicYear);
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

  private static readonly MANUAL_TRANSFER_CHANNEL = 'Transfer Bank Manual';

  async submitStudentPayment(id: string, dto: { channel: string; proofUrl?: string }) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Tagihan dengan ID "${id}" tidak ditemukan.`);
    if (trx.status === 'LUNAS') {
      return { success: true, message: 'Tagihan ini sudah lunas.', data: { ...trx, status: 'LUNAS' } };
    }

    if (dto.channel === FinanceService.MANUAL_TRANSFER_CHANNEL) {
      if (!dto.proofUrl) {
        throw new BadRequestException('Bukti transfer wajib diunggah untuk metode Transfer Bank Manual.');
      }
      const updated = await this.prisma.paymentInvoice.update({
        where: { id },
        data: {
          status: 'MENUNGGU_VERIFIKASI',
          paymentMethod: dto.channel,
          notes: `Bukti transfer diunggah mahasiswa: ${dto.proofUrl}`,
        },
      });
      await this.prisma.systemAuditLog
        .create({ data: { action: 'FINANCE_PAYMENT_SUBMITTED', detail: `${trx.studentName} mengunggah bukti transfer untuk ${trx.invoiceNo}`, userEmail: trx.nim } })
        .catch(() => null);
      return {
        success: true,
        message: 'Bukti pembayaran berhasil dikirim, menunggu verifikasi Biro Keuangan.',
        data: { ...updated, status: 'MENUNGGU VERIFIKASI' },
      };
    }

    // Kanal otomatis (VA/QRIS/Host-to-Host): disimulasikan langsung lunas layaknya notifikasi gateway pembayaran
    const receiptNo = `KWT/ITN/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + `, ${dto.channel}`;
    const updated = await this.prisma.paymentInvoice.update({
      where: { id },
      data: { status: 'LUNAS', receiptNo, paidAt, paymentMethod: dto.channel },
    });
    await this.promoteKrsAfterPayment(trx.nim, trx.academicYear);
    await this.prisma.systemAuditLog
      .create({ data: { action: 'FINANCE_PAYMENT_AUTO', detail: `${trx.studentName} membayar ${trx.invoiceNo} via ${dto.channel}`, userEmail: trx.nim } })
      .catch(() => null);
    return { success: true, message: `Pembayaran via ${dto.channel} berhasil, tagihan LUNAS.`, data: { ...updated, status: 'LUNAS' } };
  }

  async getInvoicesByStudent(nim: string) {
    const invoices = await this.prisma.paymentInvoice.findMany({ where: { nim }, orderBy: { createdAt: 'desc' } });
    return invoices.map((t) => ({ ...t, status: t.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI' : t.status }));
  }
}
