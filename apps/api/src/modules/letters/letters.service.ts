import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LETTER_CATALOG, ROMAN_MONTHS } from './letters.catalog';

@Injectable()
export class LettersService {
  constructor(private readonly prisma: PrismaService) {}

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
    return `LTR/${year}/${Date.now().toString().slice(-6)}`;
  }

  private async generateLetterNo(typeCode: string): Promise<string> {
    const entry = LETTER_CATALOG[typeCode];
    const year = new Date().getFullYear();
    const romanMonth = ROMAN_MONTHS[new Date().getMonth()];
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const countThisYear = await this.prisma.letterRequest.count({
      where: { letterNo: { not: null }, createdAt: { gte: yearStart, lt: yearEnd } },
    });
    const seqNo = countThisYear + 1;

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
      return { success: true, message: 'Permohonan disetujui dan diteruskan ke BAAK.', data: updated };
    }

    if (!note?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi.');
    const updated = await this.prisma.letterRequest.update({
      where: { id },
      data: { status: 'DITOLAK', rejectedBy: 'ADVISOR', rejectionReason: note.trim() },
    });
    return { success: true, message: 'Permohonan surat ditolak.', data: updated };
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
    return { success: true, message: `Surat ${letterNo} berhasil diterbitkan.`, data: updated };
  }

  async baakReject(id: string, processedByEmail: string | undefined, reason: string) {
    if (!reason?.trim()) throw new BadRequestException('Alasan penolakan wajib diisi.');
    const letter = await this.prisma.letterRequest.findUnique({ where: { id } });
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
    return { success: true, message: 'Permohonan surat ditolak.', data: updated };
  }
}
