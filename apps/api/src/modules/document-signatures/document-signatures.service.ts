import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export const SIGNER_ROLES = ['DOSEN_PA', 'KAPRODI', 'DEKAN', 'WAKIL_REKTOR_AKADEMIK', 'REKTOR'] as const;
export type SignerRole = (typeof SIGNER_ROLES)[number];

const DEFAULT_ROLE_LABEL: Record<SignerRole, string> = {
  DOSEN_PA: 'Dosen Pembimbing Akademik',
  KAPRODI: 'Ketua Program Studi',
  DEKAN: 'Dekan Fakultas',
  WAKIL_REKTOR_AKADEMIK: 'Wakil Rektor Bidang Akademik',
  REKTOR: 'Rektor',
};

// Dokumen bawaan yang sudah/segera punya tampilan cetak di portal. Admin tetap bisa
// menambah kode dokumen lain lewat halaman pengaturan -- daftar ini hanya nilai awal (seed).
const DEFAULT_RULES: { code: string; label: string; signer1: SignerRole; signer2?: SignerRole }[] = [
  { code: 'KRS', label: 'Kartu Rencana Studi (KRS)', signer1: 'DOSEN_PA' },
  { code: 'KHS', label: 'Kartu Hasil Studi (KHS)', signer1: 'DOSEN_PA', signer2: 'KAPRODI' },
  { code: 'SKAK', label: 'Surat Keterangan Aktif Kuliah', signer1: 'WAKIL_REKTOR_AKADEMIK' },
  { code: 'SKP', label: 'Surat Pengantar Kerja Praktik / Magang', signer1: 'WAKIL_REKTOR_AKADEMIK' },
  { code: 'SIP', label: 'Surat Izin Penelitian / Pengambilan Data', signer1: 'WAKIL_REKTOR_AKADEMIK' },
  { code: 'SRB', label: 'Surat Rekomendasi Beasiswa & Kompetisi', signer1: 'WAKIL_REKTOR_AKADEMIK' },
  { code: 'SKBB', label: 'Surat Keterangan Berkelakuan Baik', signer1: 'WAKIL_REKTOR_AKADEMIK' },
  { code: 'SKBP', label: 'Surat Keterangan Bebas Perpustakaan & Lab', signer1: 'WAKIL_REKTOR_AKADEMIK' },
];

export interface ResolvedSigner {
  role: SignerRole;
  roleLabel: string;
  name: string | null;
  nip: string | null;
  available: boolean;
}

@Injectable()
export class DocumentSignaturesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.documentSignatureRule.count().catch(() => 0);
    if (count > 0) return;
    await this.prisma.documentSignatureRule
      .createMany({
        data: DEFAULT_RULES.map((r) => ({
          documentCode: r.code,
          documentLabel: r.label,
          signer1Role: r.signer1,
          signer2Role: r.signer2 ?? null,
        })),
      })
      .catch(() => null);
  }

  getRoles() {
    return SIGNER_ROLES.map((role) => ({ role, label: DEFAULT_ROLE_LABEL[role] }));
  }

  async getRules() {
    return this.prisma.documentSignatureRule.findMany({ orderBy: { documentCode: 'asc' } });
  }

  async upsertRule(dto: {
    documentCode: string;
    documentLabel: string;
    signer1Role: SignerRole;
    signer1Label?: string | null;
    signer2Role?: SignerRole | null;
    signer2Label?: string | null;
    notes?: string | null;
  }) {
    const code = dto.documentCode?.trim().toUpperCase();
    if (!code) throw new BadRequestException('Kode dokumen wajib diisi.');
    if (!dto.documentLabel?.trim()) throw new BadRequestException('Nama dokumen wajib diisi.');
    if (!SIGNER_ROLES.includes(dto.signer1Role)) throw new BadRequestException('Penandatangan 1 tidak valid.');
    if (dto.signer2Role && !SIGNER_ROLES.includes(dto.signer2Role)) throw new BadRequestException('Penandatangan 2 tidak valid.');

    return this.prisma.documentSignatureRule.upsert({
      where: { documentCode: code },
      create: {
        documentCode: code,
        documentLabel: dto.documentLabel.trim(),
        signer1Role: dto.signer1Role,
        signer1Label: dto.signer1Label?.trim() || null,
        signer2Role: dto.signer2Role || null,
        signer2Label: dto.signer2Label?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      update: {
        documentLabel: dto.documentLabel.trim(),
        signer1Role: dto.signer1Role,
        signer1Label: dto.signer1Label?.trim() || null,
        signer2Role: dto.signer2Role || null,
        signer2Label: dto.signer2Label?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
  }

  async deleteRule(documentCode: string) {
    const code = documentCode.trim().toUpperCase();
    const exists = await this.prisma.documentSignatureRule.findUnique({ where: { documentCode: code } });
    if (!exists) throw new NotFoundException(`Aturan tanda tangan untuk dokumen "${code}" tidak ditemukan.`);
    await this.prisma.documentSignatureRule.delete({ where: { documentCode: code } });
    return { success: true, message: `Aturan tanda tangan "${exists.documentLabel}" berhasil dihapus.` };
  }

  /** Mengubah satu SignerRole menjadi {nama, NIP} nyata untuk konteks mahasiswa tertentu. */
  private async resolveRole(role: SignerRole, studentId?: string): Promise<{ name: string | null; nip: string | null }> {
    if (role === 'DOSEN_PA') {
      if (!studentId) return { name: null, nip: null };
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { advisorLecturer: { include: { user: true } } },
      });
      const l = student?.advisorLecturer;
      if (!l) return { name: null, nip: null };
      return { name: `${l.titlePrefix ? l.titlePrefix + ' ' : ''}${l.user.fullName}${l.titleSuffix ? ', ' + l.titleSuffix : ''}`, nip: l.nip || l.nidn };
    }

    if (role === 'KAPRODI') {
      if (!studentId) return { name: null, nip: null };
      const student = await this.prisma.student.findUnique({ where: { id: studentId }, include: { studyProgram: true } });
      if (!student?.studyProgram) return { name: null, nip: null };
      const kaprodi = await this.prisma.lecturer.findFirst({
        where: { structuralPosition: 'KAPRODI', structuralStudyProgramId: student.studyProgram.id },
        include: { user: true },
      });
      if (!kaprodi) return { name: null, nip: null };
      return {
        name: `${kaprodi.titlePrefix ? kaprodi.titlePrefix + ' ' : ''}${kaprodi.user.fullName}${kaprodi.titleSuffix ? ', ' + kaprodi.titleSuffix : ''}`,
        nip: kaprodi.nip || kaprodi.nidn,
      };
    }

    if (role === 'DEKAN') {
      if (!studentId) return { name: null, nip: null };
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: { studyProgram: true },
      });
      if (!student?.studyProgram) return { name: null, nip: null };
      const dekan = await this.prisma.lecturer.findFirst({
        where: { structuralPosition: 'DEKAN', structuralFacultyId: student.studyProgram.facultyId },
        include: { user: true },
      });
      if (!dekan) return { name: null, nip: null };
      return {
        name: `${dekan.titlePrefix ? dekan.titlePrefix + ' ' : ''}${dekan.user.fullName}${dekan.titleSuffix ? ', ' + dekan.titleSuffix : ''}`,
        nip: dekan.nip || dekan.nidn,
      };
    }

    const setting = await this.prisma.landingPageSetting.findUnique({ where: { id: 'default-setting' } });
    if (role === 'REKTOR') {
      return { name: setting?.rectorName || null, nip: null };
    }
    // WAKIL_REKTOR_AKADEMIK — field menyimpan "Nama, Gelar (Bidang Tugas)", ambil nama sebelum tanda kurung.
    const raw = setting?.viceRector1 || null;
    const name = raw ? raw.replace(/\s*\([^)]*\)\s*$/, '').trim() : null;
    return { name, nip: null };
  }

  async resolveSigners(documentCode: string, studentId?: string): Promise<{ signer1: ResolvedSigner; signer2: ResolvedSigner | null }> {
    const rule = await this.prisma.documentSignatureRule.findUnique({ where: { documentCode: documentCode.toUpperCase() } });
    if (!rule) throw new NotFoundException(`Belum ada aturan tanda tangan untuk dokumen "${documentCode}".`);

    const r1 = await this.resolveRole(rule.signer1Role as SignerRole, studentId);
    const signer1: ResolvedSigner = {
      role: rule.signer1Role as SignerRole,
      roleLabel: rule.signer1Label || DEFAULT_ROLE_LABEL[rule.signer1Role as SignerRole],
      name: r1.name,
      nip: r1.nip,
      available: Boolean(r1.name),
    };

    let signer2: ResolvedSigner | null = null;
    if (rule.signer2Role) {
      const r2 = await this.resolveRole(rule.signer2Role as SignerRole, studentId);
      signer2 = {
        role: rule.signer2Role as SignerRole,
        roleLabel: rule.signer2Label || DEFAULT_ROLE_LABEL[rule.signer2Role as SignerRole],
        name: r2.name,
        nip: r2.nip,
        available: Boolean(r2.name),
      };
    }

    return { signer1, signer2 };
  }
}
