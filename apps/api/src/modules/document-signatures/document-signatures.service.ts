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

// Jenis dokumen ditetapkan pengembang di daftar ini (bukan ditambah dari halaman pengaturan), supaya master dokumen
// tetap seragam dengan tampilan cetak di portal. Setiap kali server menyala, jenis yang belum ada otomatis ditambahkan
// dengan penandatangan awal di bawah; penandatangan yang sudah diubah Super Admin tidak ditimpa.
const DEFAULT_RULES: { code: string; label: string; signer1: SignerRole; signer2?: SignerRole }[] = [
  { code: 'KRS', label: 'Kartu Rencana Studi (KRS)', signer1: 'DOSEN_PA' },
  { code: 'KHS', label: 'Kartu Hasil Studi (KHS)', signer1: 'DOSEN_PA', signer2: 'KAPRODI' },
  { code: 'TRANSKRIP', label: 'Transkrip Nilai Sementara', signer1: 'WAKIL_REKTOR_AKADEMIK', signer2: 'KAPRODI' },
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
    const existing = await this.prisma.documentSignatureRule.findMany({ select: { documentCode: true } }).catch(() => null);
    if (!existing) return;
    const have = new Set(existing.map((r) => r.documentCode));
    const missing = DEFAULT_RULES.filter((r) => !have.has(r.code));
    if (missing.length === 0) return;
    await this.prisma.documentSignatureRule
      .createMany({
        data: missing.map((r) => ({
          documentCode: r.code,
          documentLabel: r.label,
          signer1Role: r.signer1,
          signer2Role: r.signer2 ?? null,
        })),
        skipDuplicates: true,
      })
      .catch(() => null);
  }

  getRoles() {
    return SIGNER_ROLES.map((role) => ({ role, label: DEFAULT_ROLE_LABEL[role] }));
  }

  async getRules() {
    return this.prisma.documentSignatureRule.findMany({ orderBy: { documentCode: 'asc' } });
  }

  /** Mengubah penandatangan sebuah jenis dokumen. Kode & nama jenis dokumen tetap (ditetapkan pengembang). */
  async updateRule(
    documentCode: string,
    dto: {
      signer1Role: SignerRole;
      signer1Label?: string | null;
      signer2Role?: SignerRole | null;
      signer2Label?: string | null;
      notes?: string | null;
    },
  ) {
    const code = documentCode?.trim().toUpperCase();
    const existing = code ? await this.prisma.documentSignatureRule.findUnique({ where: { documentCode: code } }) : null;
    if (!existing) {
      throw new NotFoundException(`Jenis dokumen "${documentCode}" tidak terdaftar. Jenis dokumen ditetapkan oleh pengembang sistem.`);
    }
    if (!SIGNER_ROLES.includes(dto.signer1Role)) throw new BadRequestException('Penandatangan 1 tidak valid.');
    if (dto.signer2Role && !SIGNER_ROLES.includes(dto.signer2Role)) throw new BadRequestException('Penandatangan 2 tidak valid.');

    return this.prisma.documentSignatureRule.update({
      where: { documentCode: code },
      data: {
        signer1Role: dto.signer1Role,
        signer1Label: dto.signer1Label?.trim() || null,
        signer2Role: dto.signer2Role || null,
        signer2Label: dto.signer2Role ? dto.signer2Label?.trim() || null : null,
        notes: dto.notes?.trim() || null,
      },
    });
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
