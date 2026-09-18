import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class FeeRulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // 1. MASTER KOMPONEN BIAYA (CRUD)
  // ===========================================================================

  async getComponents() {
    return this.prisma.feeComponent.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async createComponent(data: {
    code: string;
    name: string;
    defaultAmount: number;
    category?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const existing = await this.prisma.feeComponent.findUnique({
      where: { code: data.code.toUpperCase().trim() },
    });
    if (existing) {
      throw new BadRequestException(`Komponen biaya dengan kode "${data.code}" sudah ada.`);
    }

    return this.prisma.feeComponent.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name,
        defaultAmount: Number(data.defaultAmount) || 0,
        category: data.category || 'SEMESTER',
        description: data.description,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateComponent(
    id: string,
    data: {
      code?: string;
      name?: string;
      defaultAmount?: number;
      category?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    const component = await this.prisma.feeComponent.findUnique({ where: { id } });
    if (!component) throw new NotFoundException('Komponen biaya tidak ditemukan.');

    const updateData: any = {};
    if (data.code) updateData.code = data.code.toUpperCase().trim();
    if (data.name) updateData.name = data.name;
    if (data.defaultAmount !== undefined) updateData.defaultAmount = Number(data.defaultAmount);
    if (data.category) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return this.prisma.feeComponent.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteComponent(id: string) {
    const component = await this.prisma.feeComponent.findUnique({
      where: { id },
      include: { _count: { select: { ruleItems: true, invoiceItems: true } } },
    });
    if (!component) throw new NotFoundException('Komponen biaya tidak ditemukan.');

    if (component._count.ruleItems > 0 || component._count.invoiceItems > 0) {
      // Soft-deactivate if referenced
      return this.prisma.feeComponent.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.feeComponent.delete({ where: { id } });
  }

  // ===========================================================================
  // 2. ATURAN PEMBIAYAAN (FEE RULES CRUD)
  // ===========================================================================

  async getRules() {
    return this.prisma.feeRule.findMany({
      include: {
        registrationType: true,
        track: true,
        admissionClass: true,
        studyProgram: { select: { id: true, name: true, code: true } },
        wave: true,
        ruleItems: {
          include: { feeComponent: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getRuleById(id: string) {
    const rule = await this.prisma.feeRule.findUnique({
      where: { id },
      include: {
        registrationType: true,
        track: true,
        admissionClass: true,
        studyProgram: true,
        wave: true,
        ruleItems: {
          include: { feeComponent: true },
        },
      },
    });
    if (!rule) throw new NotFoundException('Aturan pembiayaan tidak ditemukan.');
    return rule;
  }

  async createRule(dto: {
    name: string;
    code: string;
    description?: string;
    priority?: number;
    academicYear?: string | null;
    isActive?: boolean;
    registrationTypeId?: string | null;
    trackId?: string | null;
    classId?: string | null;
    studyProgramId?: string | null;
    waveId?: string | null;
    items?: Array<{
      feeComponentId: string;
      actionType: string;
      amountValue?: number | null;
      notes?: string;
    }>;
  }) {
    const code = dto.code.toUpperCase().trim();
    const existing = await this.prisma.feeRule.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Aturan pembiayaan dengan kode "${code}" sudah ada.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.feeRule.create({
        data: {
          name: dto.name,
          code,
          description: dto.description,
          priority: dto.priority !== undefined ? Number(dto.priority) : 10,
          academicYear: dto.academicYear || null,
          isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
          registrationTypeId: dto.registrationTypeId || null,
          trackId: dto.trackId || null,
          classId: dto.classId || null,
          studyProgramId: dto.studyProgramId || null,
          waveId: dto.waveId || null,
        },
      });

      if (dto.items && dto.items.length > 0) {
        for (const item of dto.items) {
          await tx.feeRuleItem.create({
            data: {
              feeRuleId: rule.id,
              feeComponentId: item.feeComponentId,
              actionType: item.actionType || 'NORMAL',
              amountValue: item.amountValue !== undefined && item.amountValue !== null ? Number(item.amountValue) : null,
              notes: item.notes,
            },
          });
        }
      }

      return tx.feeRule.findUnique({
        where: { id: rule.id },
        include: {
          registrationType: true,
          track: true,
          admissionClass: true,
          studyProgram: true,
          wave: true,
          ruleItems: { include: { feeComponent: true } },
        },
      });
    });
  }

  async updateRule(
    id: string,
    dto: {
      name?: string;
      code?: string;
      description?: string;
      priority?: number;
      academicYear?: string | null;
      isActive?: boolean;
      registrationTypeId?: string | null;
      trackId?: string | null;
      classId?: string | null;
      studyProgramId?: string | null;
      waveId?: string | null;
      items?: Array<{
        feeComponentId: string;
        actionType: string;
        amountValue?: number | null;
        notes?: string;
      }>;
    },
  ) {
    const existing = await this.prisma.feeRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Aturan pembiayaan tidak ditemukan.');

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.name) updateData.name = dto.name;
      if (dto.code) updateData.code = dto.code.toUpperCase().trim();
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.priority !== undefined) updateData.priority = Number(dto.priority);
      if (dto.academicYear !== undefined) updateData.academicYear = dto.academicYear || null;
      if (dto.isActive !== undefined) updateData.isActive = Boolean(dto.isActive);
      if (dto.registrationTypeId !== undefined) updateData.registrationTypeId = dto.registrationTypeId || null;
      if (dto.trackId !== undefined) updateData.trackId = dto.trackId || null;
      if (dto.classId !== undefined) updateData.classId = dto.classId || null;
      if (dto.studyProgramId !== undefined) updateData.studyProgramId = dto.studyProgramId || null;
      if (dto.waveId !== undefined) updateData.waveId = dto.waveId || null;

      await tx.feeRule.update({
        where: { id },
        data: updateData,
      });

      // Update items if provided
      if (dto.items !== undefined) {
        await tx.feeRuleItem.deleteMany({ where: { feeRuleId: id } });
        for (const item of dto.items) {
          await tx.feeRuleItem.create({
            data: {
              feeRuleId: id,
              feeComponentId: item.feeComponentId,
              actionType: item.actionType || 'NORMAL',
              amountValue: item.amountValue !== undefined && item.amountValue !== null ? Number(item.amountValue) : null,
              notes: item.notes,
            },
          });
        }
      }

      return tx.feeRule.findUnique({
        where: { id },
        include: {
          registrationType: true,
          track: true,
          admissionClass: true,
          studyProgram: true,
          wave: true,
          ruleItems: { include: { feeComponent: true } },
        },
      });
    });
  }

  async deleteRule(id: string) {
    const rule = await this.prisma.feeRule.findUnique({
      where: { id },
      include: { _count: { select: { assignments: true } } },
    });
    if (!rule) throw new NotFoundException('Aturan pembiayaan tidak ditemukan.');

    if (rule._count.assignments > 0) {
      // Deactivate instead of hard delete to preserve historical integrity
      return this.prisma.feeRule.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.feeRule.delete({ where: { id } });
  }

  // ===========================================================================
  // 3. MATCHING ENGINE (EVALUASI KONDISI & RESOLUSI PRIORITAS)
  // ===========================================================================

  /**
   * Mencocokkan profil calon/mahasiswa dengan aturan pembiayaan di database.
   * Resolusi prioritas:
   * 1. Priority DESC (nilai tertinggi menang)
   * 2. Specificity score DESC (jumlah kondisi spesifik non-null yang cocok)
   * 3. CreatedAt DESC
   */
  async findMatchingRule(criteria: {
    registrationTypeId?: string | null;
    trackId?: string | null;
    classId?: string | null;
    studyProgramId?: string | null;
    waveId?: string | null;
    academicYear?: string | null;
  }) {
    const allActiveRules = await this.prisma.feeRule.findMany({
      where: { isActive: true },
      include: {
        registrationType: true,
        track: true,
        admissionClass: true,
        studyProgram: { select: { id: true, name: true, code: true } },
        wave: true,
        ruleItems: { include: { feeComponent: true } },
      },
    });

    const matchingRulesWithScore = allActiveRules
      .filter((rule) => {
        // Cek Academic Year jika rule menspesifikasikan tahun
        if (rule.academicYear && criteria.academicYear && rule.academicYear !== criteria.academicYear) {
          return false;
        }
        // Cek Jenis Pendaftaran (KIP / NON_KIP)
        if (rule.registrationTypeId && rule.registrationTypeId !== criteria.registrationTypeId) {
          return false;
        }
        // Cek Jenis Mahasiswa (MAHASISWA_BARU / TRANSFER)
        if (rule.trackId && rule.trackId !== criteria.trackId) {
          return false;
        }
        // Cek Pilihan Kelas (REGULER / KARYAWAN)
        if (rule.classId && rule.classId !== criteria.classId) {
          return false;
        }
        // Cek Program Studi
        if (rule.studyProgramId && rule.studyProgramId !== criteria.studyProgramId) {
          return false;
        }
        // Cek Gelombang
        if (rule.waveId && rule.waveId !== criteria.waveId) {
          return false;
        }

        return true;
      })
      .map((rule) => {
        // Hitung skor spesifisitas (berapa banyak kondisi non-null yang dimiliki rule)
        let specificity = 0;
        if (rule.registrationTypeId) specificity += 1;
        if (rule.trackId) specificity += 1;
        if (rule.classId) specificity += 1;
        if (rule.studyProgramId) specificity += 1;
        if (rule.waveId) specificity += 1;
        if (rule.academicYear) specificity += 1;

        return { rule, specificity };
      });

    if (matchingRulesWithScore.length === 0) {
      return null;
    }

    // Urutkan berdasarkan priority DESC, specificity DESC, createdAt DESC
    matchingRulesWithScore.sort((a, b) => {
      if (b.rule.priority !== a.rule.priority) {
        return b.rule.priority - a.rule.priority;
      }
      if (b.specificity !== a.specificity) {
        return b.specificity - a.specificity;
      }
      return b.rule.createdAt.getTime() - a.rule.createdAt.getTime();
    });

    return matchingRulesWithScore[0];
  }

  // ===========================================================================
  // 4. CALCULATION ENGINE & SIMULATOR
  // ===========================================================================

  /**
   * Menghitung tagihan per komponen berdasarkan aturan pembiayaan
   */
  async calculateFees(rule: any, categoryFilter: string = 'SEMESTER') {
    const components = await this.prisma.feeComponent.findMany({
      where: {
        isActive: true,
        ...(categoryFilter ? { category: categoryFilter } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    const ruleItemsMap = new Map<string, any>();
    if (rule && rule.ruleItems) {
      for (const item of rule.ruleItems) {
        ruleItemsMap.set(item.feeComponentId, item);
      }
    }

    let totalBaseAmount = 0;
    let totalDiscount = 0;
    let totalFinalAmount = 0;

    const lineItems = components.map((comp) => {
      const ruleItem = ruleItemsMap.get(comp.id);
      const actionType = ruleItem?.actionType || 'NORMAL';
      const amountValue = ruleItem?.amountValue !== undefined && ruleItem?.amountValue !== null ? Number(ruleItem.amountValue) : null;
      const baseAmount = Number(comp.defaultAmount) || 0;

      let discountAmount = 0;
      let finalAmount = baseAmount;

      switch (actionType) {
        case 'BEBAS':
          discountAmount = baseAmount;
          finalAmount = 0;
          break;
        case 'DISKON_PERSENTASE': {
          const pct = amountValue !== null ? amountValue : 0;
          discountAmount = Math.round((baseAmount * pct) / 100);
          finalAmount = Math.max(0, baseAmount - discountAmount);
          break;
        }
        case 'DISKON_NOMINAL': {
          const cut = amountValue !== null ? amountValue : 0;
          discountAmount = Math.min(baseAmount, cut);
          finalAmount = Math.max(0, baseAmount - discountAmount);
          break;
        }
        case 'TARIF_KHUSUS': {
          finalAmount = amountValue !== null ? amountValue : baseAmount;
          discountAmount = Math.max(0, baseAmount - finalAmount);
          break;
        }
        case 'NORMAL':
        default:
          discountAmount = 0;
          finalAmount = baseAmount;
          break;
      }

      totalBaseAmount += baseAmount;
      totalDiscount += discountAmount;
      totalFinalAmount += finalAmount;

      return {
        feeComponentId: comp.id,
        code: comp.code,
        name: comp.name,
        category: comp.category,
        baseAmount,
        actionType,
        actionValue: amountValue,
        discountAmount,
        finalAmount,
        notes: ruleItem?.notes || null,
      };
    });

    return {
      ruleCode: rule?.code || 'DEFAULT_NORMAL',
      ruleName: rule?.name || 'Tarif Normal Kampus',
      totalBaseAmount,
      totalDiscount,
      totalFinalAmount,
      lineItems,
    };
  }

  /**
   * Simulasi kalkulasi untuk Admin / Calon Mahasiswa
   */
  async simulateCalculation(criteria: {
    registrationTypeId?: string | null;
    trackId?: string | null;
    classId?: string | null;
    studyProgramId?: string | null;
    waveId?: string | null;
    academicYear?: string | null;
  }) {
    const matchResult = await this.findMatchingRule(criteria);
    const rule = matchResult?.rule || null;
    const specificity = matchResult?.specificity || 0;

    const calculation = await this.calculateFees(rule);

    return {
      matchedRule: rule
        ? {
            id: rule.id,
            name: rule.name,
            code: rule.code,
            priority: rule.priority,
            specificity,
            description: rule.description,
          }
        : null,
      ...calculation,
    };
  }

  // ===========================================================================
  // 5. PENETAPAN PEMBIAYAAN MAHASISWA (SNAPSHOT HISTORI)
  // ===========================================================================

  /**
   * Menyimpan snapshot penetapan pembiayaan saat calon mahasiswa diterima & dikonversi
   */
  async assignStudentFeePolicy(data: {
    studentId: string;
    academicYear: string;
    assignedBy?: string;
    customRuleId?: string;
    notes?: string;
  }): Promise<any> {
    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        registrationType: true,
        track: true,
        admissionClass: true,
        studyProgram: true,
        wave: true,
      },
    });

    if (!student) throw new NotFoundException('Data mahasiswa tidak ditemukan.');

    let rule: any = null;
    if (data.customRuleId) {
      rule = await this.prisma.feeRule.findUnique({
        where: { id: data.customRuleId },
        include: { ruleItems: { include: { feeComponent: true } } },
      });
    } else {
      const match = await this.findMatchingRule({
        registrationTypeId: student.registrationTypeId,
        trackId: student.trackId,
        classId: student.classId,
        studyProgramId: student.studyProgramId,
        waveId: student.waveId,
        academicYear: data.academicYear,
      });
      rule = match?.rule || null;
    }

    const feeCalculation = await this.calculateFees(rule);

    // Simpan snapshot JSON lengkap (agar jika admin di masa depan mengubah rule, penetapan mahasiswa ini tetap aman!)
    const snapshotData = {
      ruleId: rule?.id || null,
      ruleCode: rule?.code || 'DEFAULT_NORMAL',
      ruleName: rule?.name || 'Skema Reguler Normal',
      rulePriority: rule?.priority || 0,
      assignedStudent: {
        nim: student.nim,
        studyProgram: student.studyProgram?.name,
        registrationType: student.registrationType?.name || 'NON-KIP',
        track: student.track?.name || 'Mahasiswa Baru',
        class: student.admissionClass?.name || 'Reguler (Pagi)',
      },
      calculation: feeCalculation,
      timestamp: new Date().toISOString(),
    };

    const assignment = await this.prisma.studentFeeAssignment.create({
      data: {
        studentId: student.id,
        feeRuleId: rule?.id || null,
        academicYear: data.academicYear,
        schemeName: rule?.name || 'Skema Reguler Mandiri',
        snapshotData,
        notes: data.notes || `Penetapan pembiayaan angkatan ${data.academicYear}`,
        assignedBy: data.assignedBy || 'SISTEM_PMB',
      },
    });

    return {
      assignment,
      calculation: feeCalculation,
    };
  }

  // ===========================================================================
  // 6. GENERATE TAGIHAN SEMESTER BERBASIS PENETAPAN & ATURAN
  // ===========================================================================

  /**
   * Menghasilkan invoice semester resmi dengan rincian komponen tagihan
   */
  async generateStudentSemesterInvoice(params: {
    studentId: string;
    semester: number;
    academicYear?: string;
    dueDate?: string;
  }) {
    const student = await this.prisma.student.findUnique({
      where: { id: params.studentId },
      include: {
        user: true,
        studyProgram: true,
        registrationType: true,
        track: true,
        admissionClass: true,
      },
    });

    if (!student) throw new NotFoundException('Data mahasiswa tidak ditemukan.');

    const academicYear = params.academicYear || '2026/2027';

    // Cari penetapan pembiayaan aktif untuk mahasiswa ini
    let assignment = await this.prisma.studentFeeAssignment.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: { feeRule: { include: { ruleItems: { include: { feeComponent: true } } } } },
    });

    // Jika belum ada assignment, lakukan penetapan sekarang
    let calculation: any;
    if (!assignment) {
      const assigned = await this.assignStudentFeePolicy({
        studentId: student.id,
        academicYear,
        assignedBy: 'SISTEM_TAGIHAN_OTOMATIS',
      });
      assignment = assigned.assignment as any;
      calculation = assigned.calculation;
    } else {
      // Gunakan snapshot jika tersedia, atau hitung ulang dari snapshot
      calculation = (assignment.snapshotData as any)?.calculation;
      if (!calculation) {
        calculation = await this.calculateFees(assignment.feeRule);
      }
    }

    const invoiceNo = `INV/${new Date().getFullYear()}/SEM${params.semester}/${Math.floor(10000 + Math.random() * 90000)}`;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.paymentInvoice.create({
        data: {
          invoiceNo,
          nim: student.nim,
          studentName: student.user.fullName,
          studyProgram: student.studyProgram.name,
          semester: Number(params.semester),
          paymentType: `UKT / SPP Semester ${params.semester} (${academicYear})`,
          amount: calculation.totalFinalAmount,
          originalAmount: calculation.totalBaseAmount,
          totalDiscount: calculation.totalDiscount,
          ruleCode: calculation.ruleCode,
          ruleName: calculation.ruleName,
          status: calculation.totalFinalAmount === 0 ? 'LUNAS' : 'TERTUNDA',
          paidAt: calculation.totalFinalAmount === 0 ? new Date().toLocaleDateString('id-ID') : null,
          receiptNo: calculation.totalFinalAmount === 0 ? `KWT/BEBAS/${Date.now().toString().slice(-6)}` : null,
          paymentMethod: calculation.totalFinalAmount === 0 ? 'Beasiswa / Pembebasan Biaya' : 'BNI Virtual Account',
          dueDate: params.dueDate || '30 September 2026',
          academicYear,
          notes: `Diterbitkan berdasarkan ${calculation.ruleName}`,
        },
      });

      // Simpan rincian item tagihan (PaymentInvoiceItem)
      for (const item of calculation.lineItems) {
        await tx.paymentInvoiceItem.create({
          data: {
            invoiceId: invoice.id,
            feeComponentId: item.feeComponentId,
            componentName: item.name,
            baseAmount: item.baseAmount,
            actionType: item.actionType,
            actionValue: item.actionValue,
            discountAmount: item.discountAmount,
            finalAmount: item.finalAmount,
          },
        });
      }

      return tx.paymentInvoice.findUnique({
        where: { id: invoice.id },
        include: { items: true },
      });
    });
  }

  // ===========================================================================
  // 7. GET STUDENT ASSIGNMENTS & SUMMARY
  // ===========================================================================

  async getStudentAssignments(query?: { search?: string; academicYear?: string }): Promise<any> {
    const where: any = {};
    if (query?.academicYear && query.academicYear !== 'ALL') {
      where.academicYear = query.academicYear;
    }
    if (query?.search) {
      where.OR = [
        { student: { nim: { contains: query.search } } },
        { student: { user: { fullName: { contains: query.search, mode: 'insensitive' } } } },
        { schemeName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.studentFeeAssignment.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            studyProgram: { select: { name: true, code: true } },
            registrationType: true,
            track: true,
            admissionClass: true,
          },
        },
        feeRule: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
