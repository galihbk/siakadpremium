import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LETTER_CATALOG, ROMAN_MONTHS } from './letters.catalog';

@Injectable()
export class LettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private readonly BAAK_ROLES = ['ADMIN_BAAK', 'STAFF'];

  /**
   * Nomor urut atomik: kenaikan dilakukan di database (UPDATE ... SET value = value + 1), sehingga dua surat yang terbit
   * bersamaan tidak mendapat nomor yang sama dan menghapus surat tidak menggeser nomor berikutnya.
   */
  private async nextCounter(key: string, initial: () => Promise<number>): Promise<number> {
    const existing = await this.prisma.letterCounter.findUnique({ where: { key } });
    if (!existing) {
      // skipDuplicates: bila proses lain membuatnya bersamaan, lanjut saja menaikkan nilainya
      await this.prisma.letterCounter.createMany({ data: [{ key, value: await initial() }], skipDuplicates: true });
    }
    const row = await this.prisma.letterCounter.update({ where: { key }, data: { value: { increment: 1 } } });
    return row.value;
  }

  getCatalog() {
    return Object.values(LETTER_CATALOG);
  }

  private async findStudentByUserId(userId: string | undefined) {
    if (!userId) return null;
    return this.prisma.student.findFirst({
      where: { OR: [{ userId }, { id: userId }, { nim: userId }] },
      include: { user: true, studyProgram: { include: { faculty: true } }, advisorLecturer: { include: { user: true } } },
    });
  }

  private async generateRequestNo(): Promise<string> {
    const year = new Date().getFullYear();
    const seq = await this.nextCounter(`req-${year}`, () =>
      this.prisma.letterRequest.count({ where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`), lt: new Date(`${year + 1}-01-01T00:00:00.000Z`) } } }),
    );
    return `LTR/${year}/${String(seq).padStart(5, '0')}`;
  }

  private async generateLetterNo(typeCode: string): Promise<string> {
    const entry = LETTER_CATALOG[typeCode];
    const year = new Date().getFullYear();
    const romanMonth = ROMAN_MONTHS[new Date().getMonth()];
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const seqNo = await this.nextCounter(`letter-${year}`, () =>
      this.prisma.letterRequest.count({ where: { letterNo: { not: null }, createdAt: { gte: yearStart, lt: yearEnd } } }),
    );

    // Format dari Profil Institusi > Pengaturan Identitas > Format Nomor. Isi bawaan contoh (ITN) dianggap belum diatur.
    const setting = await this.prisma.landingPageSetting
      .findUnique({ where: { id: 'default-setting' }, select: { nomorSuratFormat: true, campusName: true } })
      .catch(() => null);
    const DEMO = '{NO}/ITN-BAAK/{BULAN_ROMAWI}/{TAHUN}';
    let template = String(setting?.nomorSuratFormat ?? '').trim();
    if (!template || template === DEMO) template = '{KODE_SURAT}/{NO}/BAAK/{BULAN_ROMAWI}/{TAHUN}';
    if (!/\{NO(_\dDIGIT)?\}/.test(template)) template = `${template}/{NO}`; // nomor urut wajib ada agar nomor unik

    return template
      .replace(/\{KODE_SURAT\}/g, entry.numberPrefix)
      .replace(/\{BULAN_ROMAWI\}/g, romanMonth)
      .replace(/\{BULAN\}/g, String(new Date().getMonth() + 1).padStart(2, '0'))
      .replace(/\{TAHUN\}/g, String(year))
      .replace(/\{NO_(\d)DIGIT\}/g, (_m, n) => String(seqNo).padStart(Number(n), '0'))
      .replace(/\{NO\}/g, String(seqNo).padStart(3, '0'));
  }

  /** Cek kelayakan administratif SKAK: status akademik aktif & UKT semester berjalan lunas. */
  private async checkSkakEligibility(studentId: string, nim: string): Promise<{ eligible: boolean; reason?: string }> {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return { eligible: false, reason: 'Data mahasiswa tidak ditemukan.' };
    if (student.status !== 'ACTIVE') {
      return { eligible: false, reason: `Status akademik mahasiswa saat ini "${student.status}", bukan aktif.` };
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    if (!activeYear) return { eligible: false, reason: 'Tidak ada tahun akademik aktif untuk verifikasi UKT.' };

    const paidInvoice = await this.prisma.paymentInvoice.findFirst({
      where: { nim, academicYear: activeYear.name, status: 'LUNAS' },
    });
    if (!paidInvoice) {
      return { eligible: false, reason: `Belum ditemukan tagihan UKT LUNAS untuk tahun akademik ${activeYear.name}.` };
    }
    return { eligible: true };
  }

  /** Nama institusi dari Profil Institusi (bukan teks tetap). */
  private async campusName(): Promise<string> {
    const setting = await this.prisma.landingPageSetting.findUnique({ where: { id: 'default-setting' }, select: { campusName: true } }).catch(() => null);
    return String(setting?.campusName ?? '').trim();
  }

  private buildLetterBody(params: {
    studentName: string;
    nim: string;
    studyProgramName: string;
    facultyName: string;
    semester: number;
    academicYearName: string;
    typeName: string;
    purpose: string;
    targetInstitution: string;
    campusName: string;
  }): string {
    const { studentName, nim, studyProgramName, facultyName, semester, academicYearName, typeName, purpose, targetInstitution, campusName } = params;
    // Identitas ditulis per baris "Label: nilai" agar rapi (halaman pratinjau menyejajarkannya sebagai tabel)
    return (
      `Yang bertanda tangan di bawah ini, menerangkan dengan sebenarnya bahwa mahasiswa:

` +
      `Nama: ${studentName}
` +
      `NIM: ${nim}
` +
      `Program Studi: ${studyProgramName}
` +
      `Fakultas: ${facultyName}

` +
      `adalah benar mahasiswa terdaftar aktif pada Semester ${semester} Tahun Akademik ${academicYearName}` +
      `${campusName ? ` di lingkungan ${campusName}` : ''}.

` +
      `${typeName} ini diterbitkan untuk keperluan: ${purpose}, yang ditujukan kepada ${targetInstitution}.

` +
      `Demikian surat ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.`
    );
  }

  async createForStudent(
    userId: string | undefined,
    dto: { typeCode: string; purpose: string; targetInstitution: string; targetPerson?: string; studentNote?: string },
  ) {
    const student = await this.findStudentByUserId(userId);
    if (!student) throw new NotFoundException('Data mahasiswa tidak ditemukan. Silakan login ulang.');

    const catalogEntry = LETTER_CATALOG[dto.typeCode];
    if (!catalogEntry) throw new BadRequestException(`Jenis surat "${dto.typeCode}" tidak dikenali.`);
    if (!dto.purpose?.trim()) throw new BadRequestException('Keperluan surat wajib diisi.');
    if (!dto.targetInstitution?.trim()) throw new BadRequestException('Instansi tujuan wajib diisi.');

    const requestNo = await this.generateRequestNo();

    let status: 'MENUNGGU_PA' | 'DIPROSES_BAAK' | 'SELESAI' = catalogEntry.requiresAdvisorApproval
      ? 'MENUNGGU_PA'
      : 'DIPROSES_BAAK';
    let letterNo: string | undefined;
    let letterBody: string | undefined;
    let processedAt: Date | undefined;
    let advisorNote: string | undefined;

    if (catalogEntry.autoIssueEligible) {
      const eligibility = await this.checkSkakEligibility(student.id, student.nim);
      if (eligibility.eligible) {
        const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
        letterNo = await this.generateLetterNo(dto.typeCode);
        letterBody = this.buildLetterBody({
          studentName: student.user.fullName,
          nim: student.nim,
          studyProgramName: student.studyProgram?.name || '-',
          facultyName: student.studyProgram?.faculty?.name || '-',
          semester: student.currentSemester,
          academicYearName: activeYear?.name || '-',
          typeName: catalogEntry.name,
          purpose: dto.purpose,
          targetInstitution: dto.targetInstitution,
          campusName: await this.campusName(),
        });
        status = 'SELESAI';
        processedAt = new Date();
      } else {
        // Tidak memenuhi syarat otomatis -> tetap dibuat, masuk antrian manual BAAK dengan alasannya.
        advisorNote = `Verifikasi otomatis gagal: ${eligibility.reason} Perlu pemeriksaan manual BAAK.`;
      }
    }

    const created = await this.prisma.letterRequest.create({
      data: {
        requestNo,
        letterNo,
        typeCode: catalogEntry.code,
        typeName: catalogEntry.name,
        purpose: dto.purpose.trim(),
        targetInstitution: dto.targetInstitution.trim(),
        targetPerson: dto.targetPerson?.trim() || null,
        studentNote: dto.studentNote?.trim() || null,
        requiresAdvisorApproval: catalogEntry.requiresAdvisorApproval,
        status,
        letterBody,
        processedAt,
        advisorNote,
        studentId: student.id,
      },
    });

    if (status === 'MENUNGGU_PA') {
      void this.notifications.notifyLecturers([student.advisorLecturerId], {
        type: 'LETTER',
        title: 'Surat menunggu persetujuan Anda',
        body: `${student.user.fullName} (${student.nim}) mengajukan ${catalogEntry.name}.`,
        link: '/lecturer/surat',
      });
    } else if (status === 'DIPROSES_BAAK') {
      void this.notifications.notifyRoles(this.BAAK_ROLES, {
        type: 'LETTER',
        title: 'Permohonan surat baru',
        body: `${student.user.fullName} (${student.nim}) mengajukan ${catalogEntry.name}.`,
        link: '/admin/surat',
      });
    } else if (status === 'SELESAI') {
      void this.notifications.notifyUser(student.userId, { type: 'LETTER', title: `${catalogEntry.name} terbit`, body: `Nomor ${letterNo}. Surat siap diunduh.`, link: '/student/surat' });
    }

    return {
      success: true,
      message:
        status === 'SELESAI'
          ? `${catalogEntry.name} berhasil diterbitkan otomatis.`
          : `Permohonan ${catalogEntry.name} berhasil diajukan dengan nomor tiket ${requestNo}.`,
      data: created,
    };
  }

  async listForStudent(userId: string | undefined) {
    const student = await this.findStudentByUserId(userId);
    if (!student) return [];
    return this.prisma.letterRequest.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' } });
  }

  async listForAdvisor(lecturerId: string | undefined, query?: { status?: string }) {
    if (!lecturerId) return [];
    const where: any = { student: { advisorLecturerId: lecturerId } };
    if (query?.status && query.status !== 'Semua') where.status = query.status;
    else where.status = 'MENUNGGU_PA';

    return this.prisma.letterRequest.findMany({
      where,
      include: { student: { include: { user: true, studyProgram: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async advisorDecision(lecturerId: string | undefined, id: string, action: 'APPROVE' | 'REJECT', note?: string) {
    if (!lecturerId) throw new BadRequestException('Dosen tidak teridentifikasi. Silakan login ulang.');

    const letter = await this.prisma.letterRequest.findUnique({ where: { id }, include: { student: true } });
    if (!letter) throw new NotFoundException(`Permohonan surat dengan ID "${id}" tidak ditemukan.`);
    if (letter.student.advisorLecturerId !== lecturerId) {
      throw new BadRequestException('Permohonan ini bukan milik mahasiswa bimbingan Anda.');
    }
    if (letter.status !== 'MENUNGGU_PA') {
      throw new BadRequestException('Permohonan ini sudah tidak dalam tahap menunggu verifikasi Dosen PA.');
    }

    if (action === 'APPROVE') {
      const updated = await this.prisma.letterRequest.update({
        where: { id },
        data: { status: 'DIPROSES_BAAK', advisorApprovedAt: new Date(), advisorNote: note?.trim() || null },
      });
      void this.notifications.notifyRoles(this.BAAK_ROLES, {
        type: 'LETTER',
        title: 'Permohonan surat baru',
        body: `${letter.typeName} milik ${letter.student.nim} sudah disetujui Dosen PA.`,
        link: '/admin/surat',
      });
      void this.notifications.notifyUser(letter.student.userId, { type: 'LETTER', title: 'Permohonan surat disetujui Dosen PA', body: `${letter.typeName} diteruskan ke BAAK.`, link: '/student/surat' });
      return { success: true, message: 'Permohonan disetujui dan diteruskan ke BAAK.', data: updated };
    }

    if (!note?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi.');
    const updated = await this.prisma.letterRequest.update({
      where: { id },
      data: { status: 'DITOLAK', rejectedBy: 'ADVISOR', rejectionReason: note.trim() },
    });
    void this.notifications.notifyUser(letter.student.userId, { type: 'LETTER', title: 'Permohonan surat ditolak Dosen PA', body: `${letter.typeName}: ${note.trim()}`, link: '/student/surat' });
    return { success: true, message: 'Permohonan surat ditolak.', data: updated };
  }

  /**
   * Validasi dokumen untuk umum (dipindai lewat QR). Hanya data minimum: tidak ada isi surat, NIK, atau kontak.
   * type: surat (kode = nomor tiket), ktm (kode = NIM), pmb (kode = nomor registrasi).
   */
  async verifyDocument(type: string, code: string) {
    const c = String(code ?? '').trim();
    const maskName = (n: string) => n.split(' ').map((w, i) => (i === 0 ? w : `${w.charAt(0)}${'*'.repeat(Math.max(0, Math.min(w.length - 1, 5)))}`)).join(' ');
    const maskNim = (nim: string) => (nim.length > 4 ? `${'*'.repeat(nim.length - 3)}${nim.slice(-3)}` : nim);
    const campus = await this.campusName();
    if (!c) return { valid: false, campus, message: 'Kode dokumen kosong.' };

    if (type === 'surat') {
      const l = await this.prisma.letterRequest.findUnique({ where: { requestNo: c }, include: { student: { include: { user: { select: { fullName: true } } } } } }).catch(() => null);
      if (!l) return { valid: false, campus, message: 'Dokumen tidak ditemukan dalam sistem.' };
      const issued = l.status === 'SELESAI';
      return {
        valid: issued,
        campus,
        documentType: l.typeName,
        number: l.letterNo,
        holder: maskName(l.student.user.fullName),
        identifier: maskNim(l.student.nim),
        issuedAt: l.processedAt,
        message: issued ? 'Dokumen ini diterbitkan secara resmi.' : l.status === 'DITOLAK' ? 'Permohonan ini ditolak; dokumen tidak pernah diterbitkan.' : 'Dokumen ini belum diterbitkan.',
      };
    }
    if (type === 'ktm') {
      const s = await this.prisma.student.findUnique({ where: { nim: c }, include: { user: { select: { fullName: true } }, studyProgram: { select: { name: true } } } }).catch(() => null);
      if (!s) return { valid: false, campus, message: 'NIM tidak ditemukan dalam sistem.' };
      return {
        valid: s.status === 'ACTIVE',
        campus,
        documentType: 'Kartu Tanda Mahasiswa',
        number: s.nim,
        holder: maskName(s.user.fullName),
        identifier: s.studyProgram?.name ?? null,
        message: s.status === 'ACTIVE' ? 'Mahasiswa terdaftar dan berstatus aktif.' : `Status mahasiswa saat ini: ${s.status}.`,
      };
    }
    if (type === 'pmb') {
      const a = await this.prisma.admissionApplication.findFirst({ where: { registrationNumber: c }, select: { fullName: true, registrationNumber: true, createdAt: true } }).catch(() => null);
      if (!a) return { valid: false, campus, message: 'Nomor registrasi tidak ditemukan dalam sistem.' };
      return {
        valid: true,
        campus,
        documentType: 'Kartu Bukti Pendaftaran PMB',
        number: a.registrationNumber,
        holder: maskName(a.fullName),
        issuedAt: a.createdAt,
        message: 'Pendaftaran ini tercatat resmi di sistem PMB.',
      };
    }
    return { valid: false, campus, message: 'Jenis dokumen tidak dikenali.' };
  }

  /** Jumlah permohonan yang menunggu diproses BAAK (untuk lencana sidebar). */
  async pendingCountForBaak() {
    const pending = await this.prisma.letterRequest.count({ where: { status: 'DIPROSES_BAAK' } });
    return { pending };
  }

  async listForBaak(query?: { status?: string; search?: string }) {
    const where: any = {};
    if (query?.status && query.status !== 'Semua') where.status = query.status;
    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { requestNo: { contains: q, mode: 'insensitive' } },
        { letterNo: { contains: q, mode: 'insensitive' } },
        { typeName: { contains: q, mode: 'insensitive' } },
        { targetInstitution: { contains: q, mode: 'insensitive' } },
        { student: { nim: { contains: q } } },
        { student: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const items = await this.prisma.letterRequest.findMany({
      where,
      include: { student: { include: { user: true, studyProgram: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const summary = {
      total: items.length,
      menungguPa: items.filter((i) => i.status === 'MENUNGGU_PA').length,
      diprosesBaak: items.filter((i) => i.status === 'DIPROSES_BAAK').length,
      selesai: items.filter((i) => i.status === 'SELESAI').length,
      ditolak: items.filter((i) => i.status === 'DITOLAK').length,
    };
    return { success: true, summary, data: items };
  }

  async baakIssue(id: string, processedByEmail: string | undefined, body?: { letterBody?: string }) {
    const letter = await this.prisma.letterRequest.findUnique({
      where: { id },
      include: { student: { include: { user: true, studyProgram: { include: { faculty: true } } } } },
    });
    if (!letter) throw new NotFoundException(`Permohonan surat dengan ID "${id}" tidak ditemukan.`);
    if (letter.status !== 'DIPROSES_BAAK') {
      throw new BadRequestException('Hanya permohonan berstatus "Diproses BAAK" yang dapat diterbitkan.');
    }

    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true } });
    const letterNo = await this.generateLetterNo(letter.typeCode);
    const letterBody =
      body?.letterBody?.trim() ||
      this.buildLetterBody({
        studentName: letter.student.user.fullName,
        nim: letter.student.nim,
        studyProgramName: letter.student.studyProgram?.name || '-',
        facultyName: letter.student.studyProgram?.faculty?.name || '-',
        semester: letter.student.currentSemester,
        academicYearName: activeYear?.name || '-',
        typeName: letter.typeName,
        purpose: letter.purpose,
        targetInstitution: letter.targetInstitution,
        campusName: await this.campusName(),
      });

    const updated = await this.prisma.letterRequest.update({
      where: { id },
      data: {
        status: 'SELESAI',
        letterNo,
        letterBody,
        processedAt: new Date(),
        processedByEmail: processedByEmail || 'baak@itn.ac.id',
      },
    });
    void this.notifications.notifyUser(letter.student.userId, { type: 'LETTER', title: `${letter.typeName} terbit`, body: `Nomor ${letterNo}. Surat siap diunduh.`, link: '/student/surat' });
    return { success: true, message: `Surat ${letterNo} berhasil diterbitkan.`, data: updated };
  }

  async baakReject(id: string, processedByEmail: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi.');
    const letter = await this.prisma.letterRequest.findUnique({ where: { id }, include: { student: { select: { userId: true } } } });
    if (!letter) throw new NotFoundException(`Permohonan surat dengan ID "${id}" tidak ditemukan.`);
    if (letter.status === 'SELESAI' || letter.status === 'DITOLAK') {
      throw new BadRequestException('Permohonan ini sudah final dan tidak dapat ditolak lagi.');
    }

    const updated = await this.prisma.letterRequest.update({
      where: { id },
      data: {
        status: 'DITOLAK',
        rejectedBy: 'BAAK',
        rejectionReason: reason.trim(),
        processedAt: new Date(),
        processedByEmail: processedByEmail || 'baak@itn.ac.id',
      },
    });
    void this.notifications.notifyUser(letter.student.userId, { type: 'LETTER', title: 'Permohonan surat ditolak BAAK', body: `${letter.typeName}: ${reason.trim()}`, link: '/student/surat' });
    return { success: true, message: 'Permohonan surat ditolak.', data: updated };
  }
}
