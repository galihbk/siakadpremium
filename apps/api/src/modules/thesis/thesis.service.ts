import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ThesisDefenseType, ThesisPhase, ThesisStage } from '@siakad/database';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export interface SubmitProposalDto {
  title?: string;
  abstract?: string;
  fileUrl?: string;
}

export interface AddGuidanceDto {
  topic?: string;
  notes?: string;
  fileUrl?: string;
  meetingDate?: string;
  lecturerId?: string;
}

export interface RecordGuidanceDto {
  chapter?: string;
  notes?: string;
  meetingDate?: string;
}

export interface UpdateThesisSettingsDto {
  gradeStatus?: string;
  minGuidanceProposal?: number;
  minGuidanceSkripsi?: number;
  chapters?: string[];
}

export interface RegisterDefenseDto {
  type?: string;
  fileUrl?: string;
}

export interface AssignSupervisorsDto {
  supervisor1Id?: string;
  supervisor2Id?: string | null;
}

export interface ScheduleDefenseDto {
  scheduledAt?: string;
  location?: string;
  examinerIds?: string[];
  chairId?: string;
}

export interface DefenseResultDto {
  result?: string;
  score?: number | string | null;
  notes?: string;
}

/** Urutan tahap untuk stepper di UI (tanpa PROPOSAL_REJECTED yang merupakan cabang). */
export const THESIS_STAGE_ORDER: ThesisStage[] = [
  'PROPOSAL_SUBMITTED',
  'PROPOSAL_GUIDANCE',
  'PROPOSAL_APPROVED',
  'SEMPRO_REGISTERED',
  'SEMPRO_SCHEDULED',
  'SKRIPSI_GUIDANCE',
  'SKRIPSI_APPROVED',
  'UJIAN_REGISTERED',
  'UJIAN_SCHEDULED',
  'COMPLETED',
];

const projectInclude = {
  student: {
    select: {
      id: true,
      nim: true,
      entryYear: true,
      user: { select: { fullName: true, email: true } },
      studyProgram: { select: { name: true } },
    },
  },
  supervisor1: { select: { id: true, nidn: true, nuptk: true, titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
  supervisor2: { select: { id: true, nidn: true, nuptk: true, titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } },
  approvals: true,
  guidances: { orderBy: { createdAt: 'desc' as const }, include: { lecturer: { select: { id: true, user: { select: { fullName: true } } } } } },
  defenses: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      examiners: {
        include: { lecturer: { select: { id: true, nidn: true, titlePrefix: true, titleSuffix: true, user: { select: { fullName: true } } } } },
      },
    },
  },
} satisfies Prisma.ThesisProjectInclude;

@Injectable()
export class ThesisService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  /** Berkas yang diunggah tersimpan privat (tautan bertanda tangan); diperbarui tiap dibaca agar tidak kedaluwarsa. */
  private fresh(url?: string | null) {
    return url ? this.storage.refreshPrivateUrl(url) : url;
  }

  // ---------------------------------------------------------------- util
  private lecturerName(l?: { titlePrefix?: string | null; titleSuffix?: string | null; user?: { fullName: string } | null } | null) {
    if (!l) return null;
    const name = l.user?.fullName || '';
    return [l.titlePrefix, name, l.titleSuffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  private async studentByUser(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new ForbiddenException('Akun ini bukan akun mahasiswa.');
    return student;
  }

  private async lecturerByUser(userId: string) {
    const lecturer = await this.prisma.lecturer.findUnique({ where: { userId }, select: { id: true } });
    if (!lecturer) throw new ForbiddenException('Akun ini bukan akun dosen.');
    return lecturer;
  }

  private shape(project: any) {
    const supervisors = [project.supervisor1, project.supervisor2].filter(Boolean);
    return {
      id: project.id,
      title: project.title,
      abstract: project.abstract,
      proposalFileUrl: this.fresh(project.proposalFileUrl),
      stage: project.stage as ThesisStage,
      adminNote: project.adminNote,
      finalScore: project.finalScore,
      finalGrade: project.finalGrade,
      completedAt: project.completedAt,
      submittedAt: project.submittedAt,
      supervisorAssignedAt: project.supervisorAssignedAt,
      student: project.student
        ? {
            id: project.student.id,
            nim: project.student.nim,
            name: project.student.user?.fullName ?? '',
            email: project.student.user?.email ?? '',
            studyProgram: project.student.studyProgram?.name ?? '-',
            entryYear: project.student.entryYear,
          }
        : undefined,
      supervisor1: project.supervisor1
        ? { id: project.supervisor1.id, name: this.lecturerName(project.supervisor1), nidn: project.supervisor1.nidn || project.supervisor1.nuptk }
        : null,
      supervisor2: project.supervisor2
        ? { id: project.supervisor2.id, name: this.lecturerName(project.supervisor2), nidn: project.supervisor2.nidn || project.supervisor2.nuptk }
        : null,
      approvals: (project.approvals ?? []).map((a: any) => ({ phase: a.phase, lecturerId: a.lecturerId, approvedAt: a.approvedAt })),
      guidances: (project.guidances ?? []).map((g: any) => ({
        id: g.id,
        phase: g.phase,
        lecturerId: g.lecturerId,
        lecturerName: g.lecturer ? g.lecturer.user?.fullName : null,
        chapter: g.chapter,
        topic: g.topic,
        notes: g.notes,
        fileUrl: this.fresh(g.fileUrl),
        meetingDate: g.meetingDate,
        status: g.status,
        feedback: g.feedback,
        reviewedAt: g.reviewedAt,
        createdAt: g.createdAt,
      })),
      defenses: (project.defenses ?? []).map((d: any) => ({
        id: d.id,
        type: d.type,
        status: d.status,
        fileUrl: this.fresh(d.fileUrl),
        registeredAt: d.registeredAt,
        scheduledAt: d.scheduledAt,
        location: d.location,
        result: d.result,
        score: d.score,
        gradeLetter: d.gradeLetter,
        gradeSyncedAt: d.gradeSyncedAt,
        gradeSyncNote: d.gradeSyncNote,
        notes: d.notes,
        examiners: (d.examiners ?? []).map((e: any) => ({
          lecturerId: e.lecturerId,
          role: e.role,
          name: this.lecturerName(e.lecturer),
        })),
      })),
      supervisorIds: supervisors.map((s: any) => s.id as string),
    };
  }

  private supervisorIdsOf(project: { supervisor1Id: string | null; supervisor2Id: string | null }) {
    return [project.supervisor1Id, project.supervisor2Id].filter((v): v is string => Boolean(v));
  }

  private gradeFromScore(score: number): string {
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 45) return 'D';
    return 'E';
  }

  private parseDate(value?: string, label = 'Tanggal') {
    if (!value) throw new BadRequestException(`${label} wajib diisi.`);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new BadRequestException(`${label} tidak valid.`);
    return d;
  }

  // ---------------------------------------------------------------- mahasiswa
  async getMine(userId: string) {
    const student = await this.studentByUser(userId);
    const project = await this.prisma.thesisProject.findUnique({ where: { studentId: student.id }, include: projectInclude });
    return { project: project ? this.shape(project) : null, stageOrder: THESIS_STAGE_ORDER };
  }

  async submitProposal(userId: string, dto: SubmitProposalDto) {
    const student = await this.studentByUser(userId);
    const title = (dto.title ?? '').trim();
    if (title.length < 10) throw new BadRequestException('Judul proposal minimal 10 karakter.');
    const abstract = (dto.abstract ?? '').trim() || null;
    const fileUrl = (dto.fileUrl ?? '').trim() || null;

    const existing = await this.prisma.thesisProject.findUnique({ where: { studentId: student.id } });
    if (existing && existing.stage !== 'PROPOSAL_REJECTED') {
      throw new BadRequestException('Proposal sudah diajukan. Pantau statusnya di halaman ini.');
    }

    const project = existing
      ? await this.prisma.thesisProject.update({
          where: { id: existing.id },
          data: { title, abstract, proposalFileUrl: fileUrl, stage: 'PROPOSAL_SUBMITTED', adminNote: null, submittedAt: new Date() },
          include: projectInclude,
        })
      : await this.prisma.thesisProject.create({
          data: { studentId: student.id, title, abstract, proposalFileUrl: fileUrl },
          include: projectInclude,
        });
    return this.shape(project);
  }

  async addGuidance(userId: string, dto: AddGuidanceDto) {
    // Catatan bimbingan kini hanya dicatat dosen pembimbing (lihat recordGuidance).
    throw new ForbiddenException('Catatan bimbingan dicatat oleh dosen pembimbing. Mahasiswa hanya dapat melihat riwayatnya.');
    const student = await this.studentByUser(userId);
    const project = await this.prisma.thesisProject.findUnique({ where: { studentId: student.id } });
    if (!project) throw new NotFoundException('Belum ada pengajuan proposal.');

    let phase: ThesisPhase;
    if (project.stage === 'PROPOSAL_GUIDANCE') phase = 'PROPOSAL';
    else if (project.stage === 'SKRIPSI_GUIDANCE') phase = 'SKRIPSI';
    else throw new BadRequestException('Bimbingan hanya dapat dicatat saat tahap bimbingan proposal atau bimbingan skripsi.');

    const topic = (dto.topic ?? '').trim();
    if (topic.length < 3) throw new BadRequestException('Topik bimbingan wajib diisi.');

    const supervisorIds = this.supervisorIdsOf(project);
    const lecturerId = dto.lecturerId || supervisorIds[0] || null;
    if (lecturerId && !supervisorIds.includes(lecturerId)) {
      throw new BadRequestException('Dosen yang dituju bukan pembimbing Anda.');
    }

    const meetingDate = dto.meetingDate ? this.parseDate(dto.meetingDate, 'Tanggal bimbingan') : new Date();
    const created = await this.prisma.thesisGuidance.create({
      data: {
        projectId: project.id,
        phase,
        lecturerId,
        topic,
        notes: (dto.notes ?? '').trim() || null,
        fileUrl: (dto.fileUrl ?? '').trim() || null,
        meetingDate,
      },
    });
    return { id: created.id };
  }

  async registerDefense(userId: string, dto: RegisterDefenseDto) {
    const student = await this.studentByUser(userId);
    const project = await this.prisma.thesisProject.findUnique({ where: { studentId: student.id } });
    if (!project) throw new NotFoundException('Belum ada pengajuan proposal.');

    const type = (dto.type ?? '').toUpperCase() as ThesisDefenseType;
    if (type !== 'SEMPRO' && type !== 'UJIAN') throw new BadRequestException('Jenis pendaftaran tidak valid.');

    const required: ThesisStage = type === 'SEMPRO' ? 'PROPOSAL_APPROVED' : 'SKRIPSI_APPROVED';
    if (project.stage !== required) {
      throw new BadRequestException(
        type === 'SEMPRO'
          ? 'Pendaftaran seminar proposal dibuka setelah proposal di-ACC pembimbing.'
          : 'Pendaftaran ujian skripsi dibuka setelah skripsi di-ACC pembimbing.'
      );
    }

    const fileUrl = (dto.fileUrl ?? '').trim() || null;
    const next: ThesisStage = type === 'SEMPRO' ? 'SEMPRO_REGISTERED' : 'UJIAN_REGISTERED';
    await this.prisma.$transaction([
      this.prisma.thesisDefense.create({ data: { projectId: project.id, type, fileUrl } }),
      this.prisma.thesisProject.update({ where: { id: project.id }, data: { stage: next } }),
    ]);
    return { success: true };
  }

  // ---------------------------------------------------------------- dosen
  async listForLecturer(userId: string) {
    const lecturer = await this.lecturerByUser(userId);
    const projects = await this.prisma.thesisProject.findMany({
      where: {
        OR: [
          { supervisor1Id: lecturer.id },
          { supervisor2Id: lecturer.id },
          { defenses: { some: { examiners: { some: { lecturerId: lecturer.id } } } } },
        ],
      },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return {
      lecturerId: lecturer.id,
      items: projects.map((p) => {
        const s = this.shape(p);
        return {
          ...s,
          myRole: [p.supervisor1Id, p.supervisor2Id].includes(lecturer.id) ? 'PEMBIMBING' : 'PENGUJI',
          iHaveApproved: p.approvals.filter((a) => a.lecturerId === lecturer.id).map((a) => a.phase),
        };
      }),
    };
  }

  private async assertSupervisor(userId: string, projectId: string) {
    const lecturer = await this.lecturerByUser(userId);
    const project = await this.prisma.thesisProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Data skripsi tidak ditemukan.');
    if (!this.supervisorIdsOf(project).includes(lecturer.id)) {
      throw new ForbiddenException('Anda bukan pembimbing mahasiswa ini.');
    }
    return { lecturer, project };
  }

  // ---------------------------------------------------------------- pengaturan bimbingan
  async getSettings() {
    const row = await this.prisma.thesisSetting.findUnique({ where: { id: 'default' } });
    return {
      minGuidanceProposal: row?.minGuidanceProposal ?? 1,
      minGuidanceSkripsi: row?.minGuidanceSkripsi ?? 1,
      chapters: row?.chapters?.length ? row.chapters : ['Bab I', 'Bab II', 'Bab III', 'Bab IV', 'Bab V'],
      gradeStatus: row?.gradeStatus === 'DRAFT' ? 'DRAFT' : 'FINAL',
    };
  }

  async updateSettings(dto: UpdateThesisSettingsDto) {
    const toInt = (v: unknown, label: string) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 50) throw new BadRequestException(`${label} harus berupa angka bulat 0-50.`);
      return n;
    };
    const minGuidanceProposal = toInt(dto.minGuidanceProposal ?? 1, 'Minimal bimbingan proposal');
    const minGuidanceSkripsi = toInt(dto.minGuidanceSkripsi ?? 1, 'Minimal bimbingan skripsi');
    const chapters = Array.from(new Set((dto.chapters ?? []).map((c) => String(c).trim()).filter(Boolean)));
    if (chapters.length === 0) throw new BadRequestException('Daftar bab minimal berisi satu bab.');
    if (chapters.some((c) => c.length > 60)) throw new BadRequestException('Nama bab maksimal 60 karakter.');
    const gradeStatus = dto.gradeStatus === 'DRAFT' ? 'DRAFT' : 'FINAL';
    await this.prisma.thesisSetting.upsert({
      where: { id: 'default' },
      create: { id: 'default', minGuidanceProposal, minGuidanceSkripsi, chapters, gradeStatus },
      update: { minGuidanceProposal, minGuidanceSkripsi, chapters, gradeStatus },
    });
    return this.getSettings();
  }

  /** Dosen pembimbing mencatat satu sesi bimbingan (tatap muka): tanggal, bab, dan deskripsi. */
  async recordGuidance(userId: string, projectId: string, dto: RecordGuidanceDto) {
    const { lecturer, project } = await this.assertSupervisor(userId, projectId);
    let phase: ThesisPhase;
    if (project.stage === 'PROPOSAL_GUIDANCE') phase = 'PROPOSAL';
    else if (project.stage === 'SKRIPSI_GUIDANCE') phase = 'SKRIPSI';
    else throw new BadRequestException('Bimbingan hanya dicatat saat tahap bimbingan proposal atau bimbingan skripsi.');

    const chapter = (dto.chapter ?? '').trim();
    if (!chapter) throw new BadRequestException('Bab yang dibahas wajib diisi.');
    if (chapter.length > 60) throw new BadRequestException('Nama bab maksimal 60 karakter.');
    const notes = (dto.notes ?? '').trim();
    if (notes.length < 3) throw new BadRequestException('Deskripsi bimbingan wajib diisi.');
    const meetingDate = dto.meetingDate ? this.parseDate(dto.meetingDate, 'Tanggal bimbingan') : new Date();
    if (meetingDate.getTime() > Date.now() + 24 * 3600 * 1000) throw new BadRequestException('Tanggal bimbingan tidak boleh di masa depan.');

    const created = await this.prisma.thesisGuidance.create({
      data: { projectId, phase, lecturerId: lecturer.id, chapter, topic: chapter, notes, meetingDate, status: 'RECORDED' },
    });
    return { id: created.id };
  }

  async reviewGuidance(userId: string, guidanceId: string, feedback?: string) {
    const guidance = await this.prisma.thesisGuidance.findUnique({ where: { id: guidanceId } });
    if (!guidance) throw new NotFoundException('Catatan bimbingan tidak ditemukan.');
    await this.assertSupervisor(userId, guidance.projectId);
    const text = (feedback ?? '').trim();
    if (text.length < 2) throw new BadRequestException('Catatan/tanggapan pembimbing wajib diisi.');
    await this.prisma.thesisGuidance.update({
      where: { id: guidanceId },
      data: { status: 'REVIEWED', feedback: text, reviewedAt: new Date() },
    });
    return { success: true };
  }

  async approve(userId: string, projectId: string, phaseRaw: string) {
    const { lecturer, project } = await this.assertSupervisor(userId, projectId);
    const phase = (phaseRaw ?? '').toUpperCase() as ThesisPhase;
    if (phase !== 'PROPOSAL' && phase !== 'SKRIPSI') throw new BadRequestException('Tahap ACC tidak valid.');

    const requiredStage: ThesisStage = phase === 'PROPOSAL' ? 'PROPOSAL_GUIDANCE' : 'SKRIPSI_GUIDANCE';
    if (project.stage !== requiredStage) {
      throw new BadRequestException('ACC hanya dapat diberikan pada tahap bimbingan yang sesuai.');
    }
    const settings = await this.getSettings();
    const required = Math.max(1, phase === 'PROPOSAL' ? settings.minGuidanceProposal : settings.minGuidanceSkripsi);
    // Minimal bimbingan berlaku PER PEMBIMBING: hanya catatan yang dibuat dosen ini yang dihitung untuk ACC-nya.
    const done = await this.prisma.thesisGuidance.count({
      where: { projectId, phase, lecturerId: lecturer.id, status: { in: ['REVIEWED', 'RECORDED'] } },
    });
    if (done < required) {
      throw new BadRequestException(
        `Catatan bimbingan ${phase === 'PROPOSAL' ? 'proposal' : 'skripsi'} Anda baru ${done}, minimal ${required} sebelum ACC.`,
      );
    }

    await this.prisma.thesisApproval.upsert({
      where: { projectId_phase_lecturerId: { projectId, phase, lecturerId: lecturer.id } },
      create: { projectId, phase, lecturerId: lecturer.id },
      update: { approvedAt: new Date() },
    });

    // Semua pembimbing yang ditetapkan harus ACC sebelum tahap maju.
    const supervisorIds = this.supervisorIdsOf(project);
    const approved = await this.prisma.thesisApproval.findMany({ where: { projectId, phase } });
    const allApproved = supervisorIds.every((id) => approved.some((a) => a.lecturerId === id));
    let stage: ThesisStage = project.stage;
    if (allApproved) {
      stage = phase === 'PROPOSAL' ? 'PROPOSAL_APPROVED' : 'SKRIPSI_APPROVED';
      await this.prisma.thesisProject.update({ where: { id: projectId }, data: { stage } });
    }
    return { success: true, stage, waitingOther: !allApproved };
  }

  // ---------------------------------------------------------------- admin (BAAK)
  async listAdmin(q: { stage?: string; search?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(String(q.page ?? '1'), 10) || 1);
    const pageSize = Math.min(200, Math.max(10, parseInt(String(q.pageSize ?? '25'), 10) || 25));
    const search = (q.search ?? '').trim();
    const where: Prisma.ThesisProjectWhereInput = {};
    if (q.stage && (THESIS_STAGE_ORDER as string[]).concat(['PROPOSAL_REJECTED']).includes(q.stage)) {
      where.stage = q.stage as ThesisStage;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { student: { nim: { contains: search, mode: 'insensitive' } } },
        { student: { user: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [total, rows, byStage] = await Promise.all([
      this.prisma.thesisProject.count({ where }),
      this.prisma.thesisProject.findMany({
        where,
        include: projectInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.thesisProject.groupBy({ by: ['stage'], _count: { _all: true } }),
    ]);
    const counts: Record<string, number> = {};
    byStage.forEach((b) => (counts[b.stage] = b._count._all));
    return { total, page, pageSize, counts, items: rows.map((r) => this.shape(r)) };
  }

  /** Pekerjaan baru untuk BAAK (lencana sidebar): proposal menunggu plotting, serta pendaftar sempro/ujian menunggu jadwal. */
  async pendingCountForAdmin() {
    const groups = await this.prisma.thesisProject.groupBy({
      by: ['stage'],
      where: { stage: { in: ['PROPOSAL_SUBMITTED', 'SEMPRO_REGISTERED', 'UJIAN_REGISTERED'] } },
      _count: { _all: true },
    });
    const by = (s: string) => groups.find((g) => g.stage === s)?._count._all ?? 0;
    const proposal = by('PROPOSAL_SUBMITTED');
    const sempro = by('SEMPRO_REGISTERED');
    const ujian = by('UJIAN_REGISTERED');
    return { pending: proposal + sempro + ujian, proposal, sempro, ujian };
  }

  /** Jumlah mahasiswa yang sedang dibimbing tiap dosen (pembimbing 1 atau 2, tugas akhir yang belum selesai/ditolak). */
  async supervisorLoad() {
    const rows = await this.prisma.thesisProject.findMany({
      where: { stage: { notIn: ['COMPLETED', 'PROPOSAL_REJECTED'] }, OR: [{ supervisor1Id: { not: null } }, { supervisor2Id: { not: null } }] },
      select: { supervisor1Id: true, supervisor2Id: true },
    });
    const load: Record<string, number> = {};
    for (const r of rows) for (const id of [r.supervisor1Id, r.supervisor2Id]) if (id) load[id] = (load[id] ?? 0) + 1;
    return { load };
  }

  private async getProjectOrThrow(id: string) {
    const project = await this.prisma.thesisProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Data skripsi tidak ditemukan.');
    return project;
  }

  async assignSupervisors(projectId: string, dto: AssignSupervisorsDto) {
    const project = await this.getProjectOrThrow(projectId);
    const s1 = dto.supervisor1Id || null;
    const s2 = dto.supervisor2Id || null;
    if (!s1) throw new BadRequestException('Pembimbing 1 wajib dipilih.');
    if (s1 === s2) throw new BadRequestException('Pembimbing 1 dan 2 tidak boleh orang yang sama.');
    if (['PROPOSAL_REJECTED', 'COMPLETED'].includes(project.stage)) {
      throw new BadRequestException('Pembimbing tidak dapat diubah pada tahap ini.');
    }
    const found = await this.prisma.lecturer.count({ where: { id: { in: [s1, ...(s2 ? [s2] : [])] } } });
    if (found !== (s2 ? 2 : 1)) throw new BadRequestException('Dosen pembimbing tidak ditemukan.');

    // Pembimbing berubah -> ACC sebelumnya tidak berlaku lagi untuk pembimbing yang diganti.
    const keep = [s1, ...(s2 ? [s2] : [])];
    await this.prisma.$transaction([
      this.prisma.thesisApproval.deleteMany({ where: { projectId, lecturerId: { notIn: keep } } }),
      this.prisma.thesisProject.update({
        where: { id: projectId },
        data: {
          supervisor1Id: s1,
          supervisor2Id: s2,
          supervisorAssignedAt: new Date(),
          stage: project.stage === 'PROPOSAL_SUBMITTED' ? 'PROPOSAL_GUIDANCE' : project.stage,
        },
      }),
    ]);
    return { success: true };
  }

  async rejectProposal(projectId: string, note?: string) {
    const project = await this.getProjectOrThrow(projectId);
    if (project.stage !== 'PROPOSAL_SUBMITTED') {
      throw new BadRequestException('Hanya proposal yang menunggu plotting yang dapat ditolak.');
    }
    const text = (note ?? '').trim();
    if (text.length < 3) throw new BadRequestException('Alasan penolakan wajib diisi.');
    await this.prisma.thesisProject.update({ where: { id: projectId }, data: { stage: 'PROPOSAL_REJECTED', adminNote: text } });
    return { success: true };
  }

  async scheduleDefense(defenseId: string, dto: ScheduleDefenseDto) {
    const defense = await this.prisma.thesisDefense.findUnique({ where: { id: defenseId }, include: { project: true } });
    if (!defense) throw new NotFoundException('Pendaftaran tidak ditemukan.');
    if (defense.status === 'DONE') throw new BadRequestException('Jadwal tidak dapat diubah karena sudah selesai.');

    const scheduledAt = this.parseDate(dto.scheduledAt, 'Tanggal & jam');
    const location = (dto.location ?? '').trim();
    if (!location) throw new BadRequestException('Tempat/ruang wajib diisi.');
    const examinerIds = Array.from(new Set((dto.examinerIds ?? []).filter(Boolean)));
    if (examinerIds.length < 1) throw new BadRequestException('Pilih minimal satu dosen penguji.');
    if (examinerIds.length > 5) throw new BadRequestException('Maksimal 5 dosen penguji.');
    const found = await this.prisma.lecturer.count({ where: { id: { in: examinerIds } } });
    if (found !== examinerIds.length) throw new BadRequestException('Ada dosen penguji yang tidak ditemukan.');
    const chairId = dto.chairId && examinerIds.includes(dto.chairId) ? dto.chairId : examinerIds[0];

    const nextStage: ThesisStage = defense.type === 'SEMPRO' ? 'SEMPRO_SCHEDULED' : 'UJIAN_SCHEDULED';
    await this.prisma.$transaction([
      this.prisma.thesisDefenseExaminer.deleteMany({ where: { defenseId } }),
      this.prisma.thesisDefenseExaminer.createMany({
        data: examinerIds.map((lecturerId) => ({ defenseId, lecturerId, role: lecturerId === chairId ? 'KETUA' : 'PENGUJI' })),
      }),
      this.prisma.thesisDefense.update({ where: { id: defenseId }, data: { scheduledAt, location, status: 'SCHEDULED' } }),
      this.prisma.thesisProject.update({ where: { id: defense.projectId }, data: { stage: nextStage } }),
    ]);
    return { success: true };
  }

  async inputDefenseResult(defenseId: string, dto: DefenseResultDto) {
    const defense = await this.prisma.thesisDefense.findUnique({ where: { id: defenseId } });
    if (!defense) throw new NotFoundException('Pendaftaran tidak ditemukan.');
    if (defense.status !== 'SCHEDULED') {
      throw new BadRequestException('Nilai hanya dapat diinput setelah jadwal dan penguji ditetapkan.');
    }
    const result = (dto.result ?? '').toUpperCase();
    if (!['LULUS', 'REVISI', 'TIDAK_LULUS'].includes(result)) throw new BadRequestException('Hasil tidak valid.');
    const notes = (dto.notes ?? '').trim() || null;

    let score: number | null = null;
    if (dto.score !== undefined && dto.score !== null && String(dto.score).trim() !== '') {
      score = Number(dto.score);
      if (Number.isNaN(score) || score < 0 || score > 100) throw new BadRequestException('Nilai harus angka 0-100.');
    }

    if (defense.type === 'UJIAN') {
      if (result === 'REVISI') throw new BadRequestException('Ujian skripsi hanya berhasil LULUS atau TIDAK_LULUS.');
      if (result === 'LULUS' && score === null) throw new BadRequestException('Nilai akhir ujian skripsi wajib diisi.');
    }
    const gradeLetter = score !== null ? this.gradeFromScore(score) : null;

    if (defense.type === 'SEMPRO') {
      const nextStage: ThesisStage = result === 'TIDAK_LULUS' ? 'PROPOSAL_APPROVED' : 'SKRIPSI_GUIDANCE';
      await this.prisma.$transaction([
        this.prisma.thesisDefense.update({
          where: { id: defenseId },
          data: { status: 'DONE', result, score, gradeLetter, notes },
        }),
        this.prisma.thesisProject.update({ where: { id: defense.projectId }, data: { stage: nextStage } }),
      ]);
      const grade = await this.applyDefenseGrade(defenseId);
      return { success: true, stage: nextStage, grade };
    }

    // UJIAN skripsi
    if (result === 'TIDAK_LULUS') {
      await this.prisma.$transaction([
        this.prisma.thesisDefense.update({
          where: { id: defenseId },
          data: { status: 'DONE', result, score, gradeLetter, notes },
        }),
        this.prisma.thesisProject.update({ where: { id: defense.projectId }, data: { stage: 'SKRIPSI_APPROVED' } }),
      ]);
      return { success: true, stage: 'SKRIPSI_APPROVED' as ThesisStage, grade: await this.applyDefenseGrade(defenseId) };
    }
    await this.prisma.$transaction([
      this.prisma.thesisDefense.update({
        where: { id: defenseId },
        data: { status: 'DONE', result, score, gradeLetter, notes },
      }),
      this.prisma.thesisProject.update({
        where: { id: defense.projectId },
        data: { stage: 'COMPLETED', finalScore: score, finalGrade: gradeLetter, completedAt: new Date() },
      }),
    ]);
    return { success: true, stage: 'COMPLETED' as ThesisStage, grade: await this.applyDefenseGrade(defenseId) };
  }

  // ---------------------------------------------------------------- pemetaan mata kuliah & penulisan nilai
  /** Huruf mutu & bobot dari Skala Nilai master (grup skala tahun akademik aktif); cadangan: rumus bawaan. */
  private async resolveGrade(score: number): Promise<{ letter: string; point: number }> {
    const activeYear = await this.prisma.academicYear.findFirst({ where: { isActive: true }, select: { id: true } });
    const group = activeYear
      ? await this.prisma.gradeScaleVersion.findFirst({
          where: { academicYearId: activeYear.id },
          orderBy: { createdAt: 'desc' },
          include: { scales: { where: { isActive: true }, orderBy: { minScore: 'desc' } } },
        })
      : null;
    const scales = group?.scales ?? [];
    if (scales.length) {
      const m = scales.find((x) => score >= x.minScore) || scales[scales.length - 1];
      return { letter: m.letter, point: m.gradePoint };
    }
    const letter = this.gradeFromScore(score);
    const points: Record<string, number> = { A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, D: 1, E: 0 };
    return { letter, point: points[letter] ?? 0 };
  }

  /**
   * Menulis nilai hasil seminar/ujian ke KRS mahasiswa pada mata kuliah hasil pemetaan prodinya.
   * Tidak ada pemetaan = tahap itu hanya syarat (tidak ada nilai). Mahasiswa belum KRS mata kuliahnya = nilai ditahan
   * (tercatat tertunda, bisa diterapkan ulang). KRS tidak pernah dibuat otomatis.
   */
  async applyDefenseGrade(defenseId: string): Promise<{ status: 'APPLIED' | 'SKIPPED' | 'PENDING'; note: string }> {
    const defense = await this.prisma.thesisDefense.findUnique({
      where: { id: defenseId },
      include: { project: { select: { studentId: true, student: { select: { studyProgramId: true } } } } },
    });
    if (!defense) throw new NotFoundException('Data sidang tidak ditemukan.');
    const save = async (status: 'APPLIED' | 'SKIPPED' | 'PENDING', note: string) => {
      await this.prisma.thesisDefense.update({
        where: { id: defenseId },
        data: { gradeSyncNote: note, gradeSyncedAt: status === 'PENDING' ? null : new Date() },
      });
      return { status, note };
    };

    if (defense.status !== 'DONE' || defense.result === 'TIDAK_LULUS') return save('SKIPPED', 'Tidak lulus: nilai tidak ditulis ke mata kuliah.');
    if (defense.score === null) return save('PENDING', 'Nilai belum diisi; belum bisa ditulis ke mata kuliah.');
    const programId = defense.project.student.studyProgramId;

    // Mata kuliah tujuan ditentukan oleh KATEGORI yang ditempel pada mata kuliah (Kurikulum & Mata Kuliah):
    // seminar proposal -> kategori "Seminar Proposal"; ujian skripsi -> kategori "Skripsi/TA".
    const label = defense.type === 'SEMPRO' ? 'Seminar Proposal' : 'Skripsi/TA';
    const stageName = defense.type === 'SEMPRO' ? 'seminar proposal' : 'skripsi';
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { studentId: defense.project.studentId, status: 'APPROVED', course: { studyProgramId: programId, finalProjectLabel: label } },
      include: { academicYear: { select: { isActive: true, code: true } }, course: { select: { code: true, name: true } } },
      orderBy: { academicYear: { code: 'desc' } },
    });
    if (enrollments.length === 0) {
      const exists = await this.prisma.course.count({ where: { studyProgramId: programId, finalProjectLabel: label } });
      if (exists === 0) {
        return save(
          'SKIPPED',
          `Program studi ini belum punya mata kuliah berkategori "${label}" (hanya syarat melanjutkan). Tandai mata kuliahnya di Kurikulum & Mata Kuliah bila ${stageName} memiliki nilai.`,
        );
      }
      return save('PENDING', `Mahasiswa belum mengambil mata kuliah ${stageName} (kategori "${label}") di KRS. Nilai ditahan.`);
    }
    const open = enrollments.filter((e) => e.gradeStatus !== 'FINAL');
    if (open.length === 0) return save('SKIPPED', `Mata kuliah ${stageName} sudah memiliki nilai final; tidak ditimpa.`);
    const pool = open.some((e) => e.academicYear.isActive) ? open.filter((e) => e.academicYear.isActive) : open.filter((e) => e.academicYear.code === open[0].academicYear.code);
    const distinct = Array.from(new Map(pool.map((e) => [e.courseId, e])).values());
    if (distinct.length > 1) {
      return save('PENDING', `Ada lebih dari satu mata kuliah ${stageName} di KRS (${distinct.map((e) => e.course.code).join(', ')}). Tandai satu saja dengan kategori "${label}".`);
    }
    const target = distinct[0];
    const courseLabel = `${target.course.code} ${target.course.name}`;

    const settings = await this.getSettings();
    const grade = await this.resolveGrade(defense.score);
    await this.prisma.courseEnrollment.update({
      where: { id: target.id },
      data: { totalScore: defense.score, gradeLetter: grade.letter, gradePoint: grade.point, gradeStatus: settings.gradeStatus },
    });
    return save('APPLIED', `Nilai ${defense.score} (${grade.letter}) ditulis ke ${courseLabel} (${settings.gradeStatus}).`);
  }

  /** Terapkan ulang semua nilai sidang yang masih tertunda (mis. setelah mahasiswa mengisi KRS atau pemetaan diubah). */
  async syncPendingGrades() {
    const pending = await this.prisma.thesisDefense.findMany({
      where: { status: 'DONE', gradeSyncedAt: null, result: { not: 'TIDAK_LULUS' } },
      select: { id: true },
    });
    let applied = 0;
    let stillPending = 0;
    for (const d of pending) {
      const r = await this.applyDefenseGrade(d.id);
      if (r.status === 'APPLIED') applied++;
      else if (r.status === 'PENDING') stillPending++;
    }
    return { checked: pending.length, applied, stillPending };
  }

  async pendingGradeCount() {
    const count = await this.prisma.thesisDefense.count({ where: { status: 'DONE', gradeSyncedAt: null, result: { not: 'TIDAK_LULUS' }, gradeSyncNote: { not: null } } });
    return { pending: count };
  }
}
