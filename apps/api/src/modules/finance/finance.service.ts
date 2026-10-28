import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
        bebanMengajarSks: u.salarySetting?.bebanMengajarSks ?? 0,
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
      bebanMengajarSks?: number;
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
          bebanMengajarSks: data.bebanMengajarSks ?? 0,
          notes: data.notes,
          updatedBy: data.updatedBy,
        },
        update: {
          baseSalary: data.baseSalary ?? 0,
          bebanMengajarSks: data.bebanMengajarSks ?? 0,
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

  // --- Tarif honor per SKS berdasarkan jenjang prodi yang diajar ---
  async getHonorRateJenjang() {
    const ALL_LEVELS = ['D3', 'D4', 'S1', 'S2', 'S3', 'PROFESI'] as const;
    const rates = await this.prisma.honorRateJenjang.findMany();
    const byLevel = new Map(rates.map((r) => [r.degreeLevel, r]));
    return ALL_LEVELS.map((level) => ({
      degreeLevel: level,
      ratePerSks: byLevel.get(level)?.ratePerSks ?? 0,
    }));
  }

  async upsertHonorRateJenjang(degreeLevel: string, ratePerSks: number) {
    const rate = await this.prisma.honorRateJenjang.upsert({
      where: { degreeLevel: degreeLevel as any },
      create: { degreeLevel: degreeLevel as any, ratePerSks: ratePerSks || 0 },
      update: { ratePerSks: ratePerSks || 0 },
    });
    return { success: true, message: 'Tarif honor jenjang berhasil disimpan', data: rate };
  }

  // Honor mengajar per dosen dalam satu tahun akademik, dihitung per-kelas berdasarkan jenjang
  // prodi dari mata kuliah yang diajar (bukan satu tarif flat per dosen) -- kembalikan Map<lecturerId, rupiah/bulan>.
  private async computeHonorMengajarByLecturer(year: { id: string }): Promise<Map<string, number>> {
    const [classes, programs, rates] = await Promise.all([
      this.prisma.courseClass.findMany({
        where: { academicYearId: year.id, lecturerId: { not: null } },
        include: {
          course: { select: { sks: true, studyProgramId: true, studyProgramName: true } },
          lecturer: { select: { id: true, studyProgram: { select: { degreeLevel: true } } } },
        },
      }),
      this.prisma.studyProgram.findMany({ select: { id: true, name: true, degreeLevel: true } }),
      this.prisma.honorRateJenjang.findMany(),
    ]);

    const programById = new Map(programs.map((p) => [p.id, p]));
    const programByName = new Map(programs.map((p) => [p.name, p]));
    const rateByLevel = new Map(rates.map((r) => [r.degreeLevel, r.ratePerSks]));

    const result = new Map<string, number>();
    for (const c of classes) {
      if (!c.lecturer) continue;
      const prodi =
        (c.course.studyProgramId && programById.get(c.course.studyProgramId)) ||
        (c.course.studyProgramName && programByName.get(c.course.studyProgramName)) ||
        null;
      const degreeLevel = prodi?.degreeLevel ?? c.lecturer.studyProgram?.degreeLevel ?? 'S1';
      const rate = rateByLevel.get(degreeLevel) ?? 0;
      const contribution = Math.round(
        (c.course.sks * rate * FinanceService.MEETINGS_PER_SEMESTER) / FinanceService.PAYMENTS_PER_SEMESTER,
      );
      result.set(c.lecturer.id, (result.get(c.lecturer.id) ?? 0) + contribution);
    }
    return result;
  }

  // --- Rekap honor (gabungan rekap mengajar + pengaturan gaji + transport kehadiran) ---
  // month/year menentukan periode pembayaran yang dicek status "sudah dibayar"-nya; default bulan berjalan.
  async getHonorRecap(academicYearId?: string, month?: number, year?: number) {
    const now = new Date();
    const periodMonth = month ?? now.getMonth() + 1;
    const periodYear = year ?? now.getFullYear();

    const teaching = await this.getTeachingRecap(academicYearId);

    const [users, selectedYear, payments] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'LECTURER', 'STAFF'] as any } },
        include: {
          lecturer: { include: { studyProgram: { select: { name: true } } } },
          salarySetting: true,
          salaryComponents: true,
        },
        orderBy: { fullName: 'asc' },
      }),
      teaching.selectedAcademicYearId
        ? this.prisma.academicYear.findUnique({ where: { id: teaching.selectedAcademicYearId } })
        : Promise.resolve(null),
      this.prisma.honorPayment.findMany({ where: { periodMonth, periodYear } }),
    ]);

    const [transport, honorByLecturerId] = await Promise.all([
      selectedYear ? this.attendanceService.getAttendanceTransportTotals(selectedYear.startDate, selectedYear.endDate) : Promise.resolve(null),
      selectedYear ? this.computeHonorMengajarByLecturer(selectedYear) : Promise.resolve(new Map<string, number>()),
    ]);

    const sksByLecturerId = new Map(teaching.lecturers.map((l: any) => [l.lecturerId, l]));
    const paymentByUserId = new Map(payments.map((p) => [p.userId, p]));

    const rows = users.map((u) => {
      const isLecturer = u.role === 'LECTURER';
      const teach = isLecturer && u.lecturer ? sksByLecturerId.get(u.lecturer.id) : undefined;
      const totalSks = teach?.totalSks ?? 0;

      const payment = paymentByUserId.get(u.id);
      if (payment) {
        // Sudah dibayar untuk periode ini -- tampilkan snapshot beku, BUKAN hasil hitung ulang live,
        // supaya koreksi data SKS/tarif belakangan tidak mengubah angka yang sudah benar-benar dikirim.
        return {
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          category: isLecturer ? 'Dosen' : 'Karyawan',
          studyProgram: u.lecturer?.studyProgram?.name ?? null,
          nidn: u.lecturer?.nidn ?? null,
          totalClasses: teach?.totalClasses ?? 0,
          totalSks,
          bebanMengajarSks: u.salarySetting?.bebanMengajarSks ?? 0,
          sksBersih: Math.max(0, totalSks - (u.salarySetting?.bebanMengajarSks ?? 0)),
          baseSalary: payment.baseSalary,
          totalTunjangan: payment.totalTunjangan,
          totalPotongan: payment.totalPotongan,
          honorMengajar: payment.honorMengajar,
          hadirPagi: 0,
          hadirSore: 0,
          transportTotal: payment.transportTotal,
          totalHonor: payment.totalHonor,
          isPaid: true,
          paidAt: payment.paidAt,
        };
      }

      const baseSalary = u.salarySetting?.baseSalary ?? 0;
      const totalTunjangan = u.salaryComponents.filter((c) => c.type === 'TUNJANGAN').reduce((a, c) => a + c.amount, 0);
      const totalPotongan = u.salaryComponents.filter((c) => c.type === 'POTONGAN').reduce((a, c) => a + c.amount, 0);
      const bebanMengajarSks = u.salarySetting?.bebanMengajarSks ?? 0;
      const sksBersih = Math.max(0, totalSks - bebanMengajarSks);
      const honorMengajarKotor = isLecturer && u.lecturer ? (honorByLecturerId.get(u.lecturer.id) ?? 0) : 0;
      // Honor mengajar hanya dibayar untuk SKS bersih (Total SKS - Beban Mengajar wajib), dikurangi
      // proporsional dari honor kotor hasil hitung per-kelas supaya tetap konsisten lintas jenjang/tarif.
      const honorMengajarPerBulan = totalSks > 0 ? Math.round(honorMengajarKotor * (sksBersih / totalSks)) : 0;
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
        bebanMengajarSks,
        sksBersih,
        baseSalary,
        totalTunjangan,
        totalPotongan,
        honorMengajar: honorMengajarPerBulan,
        hadirPagi,
        hadirSore,
        transportTotal,
        totalHonor,
        isPaid: false,
        paidAt: null as Date | null,
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
      totalPaid: rows.filter((r) => r.isPaid).length,
    };

    return {
      academicYears: teaching.academicYears,
      selectedAcademicYearId: teaching.selectedAcademicYearId,
      transportRate: transport?.rate ?? { ratePagi: 0, rateSore: 0 },
      periodMonth,
      periodYear,
      rows,
      totals,
    };
  }

  // Tandai honor satu pegawai sebagai sudah dibayarkan untuk periode bulan tertentu --
  // membekukan (snapshot) angka hasil hitung live saat ini supaya tidak berubah kalau data dikoreksi belakangan.
  async markHonorPaid(
    userId: string,
    data: { academicYearId?: string; month: number; year: number; paidBy?: string; notes?: string },
  ) {
    const recap = await this.getHonorRecap(data.academicYearId, data.month, data.year);
    const row = recap.rows.find((r) => r.userId === userId);
    if (!row) throw new NotFoundException('Data honor pegawai tidak ditemukan untuk periode ini');
    if (row.isPaid) throw new BadRequestException('Honor pegawai ini sudah ditandai dibayar untuk periode ini');

    const payment = await this.prisma.honorPayment.upsert({
      where: { userId_periodMonth_periodYear: { userId, periodMonth: data.month, periodYear: data.year } },
      create: {
        userId,
        periodMonth: data.month,
        periodYear: data.year,
        academicYearId: data.academicYearId,
        baseSalary: row.baseSalary,
        totalTunjangan: row.totalTunjangan,
        totalPotongan: row.totalPotongan,
        honorMengajar: row.honorMengajar,
        transportTotal: row.transportTotal,
        totalHonor: row.totalHonor,
        paidBy: data.paidBy,
        notes: data.notes,
      },
      update: {
        baseSalary: row.baseSalary,
        totalTunjangan: row.totalTunjangan,
        totalPotongan: row.totalPotongan,
        honorMengajar: row.honorMengajar,
        transportTotal: row.transportTotal,
        totalHonor: row.totalHonor,
        paidBy: data.paidBy,
        notes: data.notes,
      },
    });

    return { success: true, message: 'Honor berhasil ditandai sudah dibayar', data: payment };
  }

  async unmarkHonorPaid(userId: string, month: number, year: number) {
    await this.prisma.honorPayment
      .delete({ where: { userId_periodMonth_periodYear: { userId, periodMonth: month, periodYear: year } } })
      .catch(() => null);
    return { success: true, message: 'Status pembayaran honor dibatalkan' };
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
    const bankName = String(dto.bankName ?? '').trim();
    const accountNumber = String(dto.accountNumber ?? '').trim();
    const accountName = String(dto.accountName ?? '').trim();
    if (!bankName || !accountNumber || !accountName) {
      throw new BadRequestException('Nama bank, nomor rekening, dan atas nama wajib diisi.');
    }
    return {
      bankName,
      description: dto.description ? String(dto.description).trim() || null : null,
      accountNumber,
      accountName,
      // Saldo hanya diubah bila dikirim (pengaturan pembayaran tidak mengirim saldo -> saldo lama tetap).
      ...(dto.balance !== undefined ? { balance: Number(dto.balance) || 0 } : {}),
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

  /** NIM mahasiswa yang login (dari token). Dipakai agar mahasiswa hanya menyentuh tagihannya sendiri. */
  private async ownNim(user: { sub?: string }): Promise<string> {
    const st = user?.sub
      ? await this.prisma.student.findUnique({ where: { userId: user.sub }, select: { nim: true } })
      : null;
    if (!st) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    return st.nim;
  }

  async assertOwnNim(user: { sub?: string }, nim: string) {
    if ((await this.ownNim(user)) !== nim) throw new ForbiddenException('Anda hanya dapat melihat tagihan milik Anda sendiri.');
  }

  async assertOwnInvoice(user: { sub?: string }, invoiceId: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id: invoiceId }, select: { nim: true } });
    if (!trx) throw new NotFoundException('Tagihan tidak ditemukan.');
    if ((await this.ownNim(user)) !== trx.nim) throw new ForbiddenException('Tagihan ini bukan milik Anda.');
  }

  async getTransactions(query?: { status?: string; search?: string; type?: string; limit?: string }) {
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
    const transactions = await this.prisma.paymentInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, ...(query?.limit === 'all' ? {} : { take: 100 }) });
    const mapped = transactions.map((t) => ({ ...t, status: t.status === 'MENUNGGU_VERIFIKASI' ? 'MENUNGGU VERIFIKASI' : t.status }));
    const summary = await this.getSummary();
    return { summary, transactions: mapped };
  }

  /**
   * KRS yang masih DRAFT (menunggu pembayaran UKT) baru resmi diajukan ke Dosen PA
   * begitu tagihan semester itu LUNAS.
   */
  private async promoteKrsAfterPayment(nim: string, academicYear: string, invoiceId?: string) {
    // Hanya pelunasan UKT/SPP yang meloloskan KRS; biaya khusus kegiatan lapangan tidak.
    if (invoiceId && (await this.prisma.fieldCharge.count({ where: { invoiceId } })) > 0) return;
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

  /**
   * Bila tagihan yang lunas adalah biaya khusus kegiatan lapangan: catat di riwayat mahasiswa dan beri tahu mahasiswa serta BAAK
   * (mahasiswa kini siap diplot pembimbing / dikelompokkan). Kegagalan di sini tidak boleh menggagalkan pelunasan.
   */
  private async afterInvoicePaid(invoiceId: string) {
    try {
      const charge = await this.prisma.fieldCharge.findUnique({
        where: { invoiceId },
        include: { student: { select: { userId: true, nim: true, user: { select: { fullName: true } } } }, category: { select: { name: true } } },
      });
      if (!charge) return;
      const amount = `Rp ${Math.round(charge.amount).toLocaleString('id-ID')}`;
      await this.prisma.fieldEvent.create({
        data: {
          studentId: charge.studentId,
          courseId: charge.courseId,
          academicYearId: charge.academicYearId,
          categoryId: charge.categoryId,
          type: 'CHARGE_PAID',
          title: 'Pembayaran biaya lunas',
          detail: `${charge.label}: ${amount}`,
        },
      });
      await this.prisma.notification.create({
        data: { userId: charge.student.userId, type: 'FIELD', title: `${charge.label} lunas`, body: 'Pembayaran Anda terverifikasi. Anda dapat diproses ke tahap berikutnya.', link: '/student/kegiatan-lapangan' },
      });
      const staff = await this.prisma.user.findMany({ where: { role: { in: ['ADMIN_BAAK', 'STAFF'] as any }, isActive: true }, select: { id: true } });
      if (staff.length) {
        await this.prisma.notification.createMany({
          data: staff.map((u) => ({
            userId: u.id,
            type: 'FIELD',
            title: `${charge.category.name}: biaya lunas`,
            body: `${charge.student.user.fullName} (${charge.student.nim}) telah melunasi ${charge.label}.`,
            link: `/admin/kegiatan-lapangan?jenis=${encodeURIComponent(charge.category.name)}`,
          })),
        });
      }
    } catch {
      // abaikan: pelunasan sudah tercatat
    }
  }

  /** Tagihan dibebaskan penuh lewat keringanan: nyatakan lunas dan jalankan akibat pelunasan yang sama seperti pembayaran biasa. */
  async settleInvoiceFree(id: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx || trx.status === 'LUNAS') return;
    const receiptNo = `KWT/BEBAS/${Date.now().toString().slice(-6)}`;
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', Keringanan';
    await this.prisma.paymentInvoice.update({ where: { id }, data: { status: 'LUNAS', receiptNo, paidAt, paymentMethod: 'Keringanan / Pembebasan Biaya' } });
    await this.promoteKrsAfterPayment(trx.nim, trx.academicYear, id);
    await this.afterInvoicePaid(id);
  }

  async verifyTransaction(id: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Transaksi dengan ID "${id}" tidak ditemukan.`);
    const receiptNo = `KWT/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;
    const paidAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ', Kasir Diverifikasi';
    const updated = await this.prisma.paymentInvoice.update({ where: { id }, data: { status: 'LUNAS', receiptNo, paidAt } });
    await this.promoteKrsAfterPayment(trx.nim, trx.academicYear, id);
    await this.afterInvoicePaid(id);
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_VERIFY', detail: `Verifikasi ${trx.invoiceNo} (${trx.studentName}) Rp ${trx.amount}`, userEmail: 'keuangan' } }).catch(() => null);
    return { success: true, message: `Pembayaran ${trx.studentName} berhasil diverifikasi LUNAS.`, data: { ...updated, status: 'LUNAS' } };
  }

  /** Tolak bukti transfer: tagihan kembali "belum bayar" supaya mahasiswa bisa mengunggah ulang. */
  async rejectTransaction(id: string, reason?: string) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Transaksi dengan ID "${id}" tidak ditemukan.`);
    if (trx.status === 'LUNAS') throw new BadRequestException('Tagihan ini sudah lunas dan tidak bisa ditolak.');
    const note = reason?.trim() ? `Bukti ditolak Keuangan: ${reason.trim()}` : 'Bukti ditolak Keuangan: mohon unggah ulang bukti transfer yang valid.';
    const updated = await this.prisma.paymentInvoice.update({ where: { id }, data: { status: 'TERTUNDA', notes: note } });
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_REJECT', detail: `Tolak bukti ${trx.invoiceNo} (${trx.studentName})`, userEmail: 'keuangan' } }).catch(() => null);
    return { success: true, message: 'Bukti pembayaran ditolak; mahasiswa diminta mengunggah ulang.', data: { ...updated, status: 'TERTUNDA' } };
  }

  async createInvoice(dto: any) {
    if (!dto.nim || !dto.studentName) {
      throw new BadRequestException('NIM dan nama mahasiswa wajib diisi.');
    }
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Nominal tagihan harus lebih dari 0.');
    }
    // Tahun akademik & jatuh tempo mengikuti data sungguhan, bukan nilai tetap.
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    const academicYear = dto.academicYear || activeYear?.name || '';
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const dueDate = dto.dueDate || fmt(new Date(Date.now() + 14 * 24 * 3600 * 1000));

    const invoiceNo = `INV/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
    const dbStatus = dto.status === 'LUNAS' ? 'LUNAS' : dto.status === 'MENUNGGU VERIFIKASI' ? 'MENUNGGU_VERIFIKASI' : 'TERTUNDA';
    const newTrx = await this.prisma.paymentInvoice.create({
      data: {
        invoiceNo, nim: dto.nim, studentName: dto.studentName, studyProgram: dto.studyProgram || '-',
        semester: dto.semester ? Number(dto.semester) : 1, paymentType: dto.paymentType || 'SPP / UKT',
        amount, paymentMethod: dto.paymentMethod || 'Belum dipilih',
        paidAt: dto.status === 'LUNAS' ? new Date().toLocaleDateString('id-ID') : null,
        status: dbStatus as any,
        receiptNo: dto.status === 'LUNAS' ? `KWT/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}` : null,
        notes: dto.notes || 'Tagihan baru diterbitkan oleh Biro Keuangan',
        dueDate, academicYear,
      },
    });
    await this.prisma.systemAuditLog.create({ data: { action: 'FINANCE_INVOICE_CREATE', detail: `Invoice ${invoiceNo} untuk ${dto.studentName}`, userEmail: 'keuangan' } }).catch(() => null);
    return { success: true, message: `Tagihan berhasil dibuat.`, data: newTrx };
  }

  private static readonly MANUAL_TRANSFER_CHANNEL = 'Transfer Bank Manual';

  /**
   * Metode konfirmasi pembayaran yang berlaku. Selama integrasi payment gateway belum aktif (provider MANUAL atau
   * dinonaktifkan), SEMUA pembayaran dikonfirmasi manual: mahasiswa/calon mahasiswa unggah bukti transfer, lalu
   * admin keuangan memverifikasi. Rekening tujuan = rekening aktif di menu Rekening Bank & Kas (tanpa saldo).
   */
  async getPaymentMode() {
    const setting = await this.prisma.bankGatewaySetting.findUnique({ where: { id: 'default-bank-setting' } }).catch(() => null);
    const mode = setting && setting.isActive && setting.provider !== 'MANUAL' ? 'GATEWAY' : 'MANUAL';
    const accounts = await this.prisma.financeBankAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, bankName: true, accountNumber: true, accountName: true, description: true },
    });
    return { mode, provider: mode === 'GATEWAY' ? setting!.provider : 'MANUAL', accounts };
  }

  async submitStudentPayment(id: string, dto: { channel: string; proofUrl?: string; bankAccountId?: string }) {
    const trx = await this.prisma.paymentInvoice.findUnique({ where: { id } });
    if (!trx) throw new NotFoundException(`Tagihan dengan ID "${id}" tidak ditemukan.`);
    if (trx.status === 'LUNAS') {
      return { success: true, message: 'Tagihan ini sudah lunas.', data: { ...trx, status: 'LUNAS' } };
    }

    if ((await this.prisma.paymentReliefRequest.count({ where: { invoiceId: id, status: 'PENDING' } })) > 0) {
      throw new BadRequestException('Tagihan ini sedang dalam pengajuan keringanan. Tunggu keputusan Keuangan atau batalkan pengajuan terlebih dahulu.');
    }

    const { mode } = await this.getPaymentMode();
    if (mode === 'MANUAL' && dto.channel !== FinanceService.MANUAL_TRANSFER_CHANNEL) {
      throw new BadRequestException('Pembayaran saat ini dikonfirmasi manual. Lakukan transfer lalu unggah bukti transfer.');
    }

    if (dto.channel === FinanceService.MANUAL_TRANSFER_CHANNEL) {
      if (!dto.proofUrl) {
        throw new BadRequestException('Bukti transfer wajib diunggah untuk metode Transfer Bank Manual.');
      }
      // Pembayar wajib menyebut rekening kampus tujuan transfer, agar Keuangan bisa mencocokkan dengan mutasi bank.
      const activeCount = await this.prisma.financeBankAccount.count({ where: { isActive: true } });
      if (activeCount === 0) {
        throw new BadRequestException('Rekening tujuan pembayaran belum diatur. Silakan hubungi Biro Keuangan.');
      }
      const account = dto.bankAccountId
        ? await this.prisma.financeBankAccount.findFirst({ where: { id: dto.bankAccountId, isActive: true } })
        : null;
      if (!account) {
        throw new BadRequestException('Pilih rekening bank kampus tempat Anda mengirim pembayaran.');
      }
      const updated = await this.prisma.paymentInvoice.update({
        where: { id },
        data: {
          status: 'MENUNGGU_VERIFIKASI',
          paymentMethod: `Transfer ke ${account.bankName} ${account.accountNumber} a.n. ${account.accountName}`,
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
    await this.promoteKrsAfterPayment(trx.nim, trx.academicYear, id);
    await this.afterInvoicePaid(id);
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
