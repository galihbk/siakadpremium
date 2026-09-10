import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class Lp3mService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialDataIfEmpty();
  }

  // ================= SEED INITIAL DATA =================
  private async seedInitialDataIfEmpty() {
    try {
      // 1. Seed Research & Community Service
      const researchCount = await this.prisma.lp3mResearch.count();
      if (researchCount === 0) {
        await this.prisma.lp3mResearch.createMany({
          data: [
            {
              code: 'P3M-LIT-2026-001',
              type: 'Penelitian',
              title: 'Implementasi Deep Learning untuk Deteksi Dini Retinopati Diabetik pada Citra Fundus',
              scheme: 'Penelitian Fundamental Internal',
              focusArea: 'Kecerdasan Buatan & Kesehatan Digital',
              leader: 'Dr. Bayu Wicaksono, M.Kom.',
              nidn: '0412088501',
              faculty: 'Fakultas Ilmu Komputer',
              studyProgram: 'Teknik Informatika',
              membersCount: 3,
              year: 2026,
              fundingAmount: 35000000,
              fundingSource: 'DIPA Internal',
              status: 'Sedang Berjalan',
              targetOutput: 'Jurnal Internasional Terindeks Scopus Q2 & Prototipe Web',
              reviewerNote: 'Proposal sangat baik, pastikan pengujian dataset klinis mencukupi.',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-retinopati.pdf',
              submittedAt: '12 Jan 2026',
            },
            {
              code: 'P3M-LIT-2026-002',
              type: 'Penelitian',
              title: 'Rancang Bangun Turbin Angin Sumbu Vertikal untuk Kawasan Pesisir Selatan Jawa',
              scheme: 'Penelitian Terapan Unggulan',
              focusArea: 'Energi Baru Terbarukan',
              leader: 'Ir. Hendra Kusuma, M.T., Ph.D.',
              nidn: '0423047802',
              faculty: 'Fakultas Teknik',
              studyProgram: 'Teknik Mesin',
              membersCount: 4,
              year: 2026,
              fundingAmount: 48000000,
              fundingSource: 'BIMA Kemendikbud',
              status: 'Menunggu Verifikasi',
              targetOutput: 'Paten Sederhana & Jurnal SINTA 2',
              reviewerNote: '',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-turbin.pdf',
              submittedAt: '18 Jan 2026',
            },
            {
              code: 'P3M-LIT-2026-003',
              type: 'Penelitian',
              title: 'Studi Formulasi Beton Ramah Lingkungan Berbasis Abu Vulkanik dan Fly Ash',
              scheme: 'Penelitian Kerjasama Industri',
              focusArea: 'Material Maju & Infrastruktur Hijau',
              leader: 'Dr. Siti Nurhaliza, S.T., M.T.',
              nidn: '0405118903',
              faculty: 'Fakultas Teknik',
              studyProgram: 'Teknik Sipil',
              membersCount: 2,
              year: 2026,
              fundingAmount: 42000000,
              fundingSource: 'CSR Semen Indonesia & DIPA',
              status: 'Sedang Berjalan',
              targetOutput: 'Jurnal Internasional Terindeks Scopus & Uji Kuat Tekan Lab',
              reviewerNote: 'Uji slump dan kuat tekan 28 hari wajib didokumentasikan resmi.',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/laporan-beton.pdf',
              submittedAt: '25 Jan 2026',
            },
            {
              code: 'P3M-PKM-2026-001',
              type: 'Pengabdian',
              title: 'Penerapan Sistem IoT Smart Farming untuk Petani Sayur Hidroponik di Desa Sukamaju',
              scheme: 'Program Kemitraan Masyarakat (PKM)',
              focusArea: 'Smart Agriculture & Ketahanan Pangan',
              leader: 'Budi Santoso, S.Kom., M.T.',
              nidn: '0415039001',
              faculty: 'Fakultas Ilmu Komputer',
              studyProgram: 'Sistem Informasi',
              membersCount: 3,
              year: 2026,
              fundingAmount: 22500000,
              fundingSource: 'DIPA Internal',
              status: 'Sedang Berjalan',
              targetOutput: 'Modul Pelatihan, Video Kegiatan di YouTube, & Publikasi Media Massa',
              mitraSasaran: 'Kelompok Tani Hidroponik Makmur, Desa Sukamaju',
              reviewerNote: 'Sertakan dokumentasi serah terima alat otomasi fertigasi ke mitra.',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/pkm-hidroponik.pdf',
              submittedAt: '15 Jan 2026',
            },
            {
              code: 'P3M-PKM-2026-002',
              type: 'Pengabdian',
              title: 'Pendampingan Sertifikasi Halal dan Digital Marketing bagi UMKM Olahan Pangan Lokal',
              scheme: 'Pemberdayaan Desa Binaan (PDB)',
              focusArea: 'Ekonomi Kreatif & Kewirausahaan',
              leader: 'Dr. Hj. Ratna Juwita, S.E., M.M.',
              nidn: '0420098202',
              faculty: 'Fakultas Teknik',
              studyProgram: 'Teknik Industri',
              membersCount: 4,
              year: 2026,
              fundingAmount: 28000000,
              fundingSource: 'BIMA Kemendikbud',
              status: 'Menunggu Verifikasi',
              targetOutput: '15 Sertifikat Halal BPJPH, Akun Marketplace, & Jurnal Pengabdian SINTA 4',
              mitraSasaran: 'Asosiasi UMKM Pesisir Maju Bersama',
              reviewerNote: '',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/pkm-umkm-halal.pdf',
              submittedAt: '20 Jan 2026',
            },
            {
              code: 'P3M-PKM-2026-003',
              type: 'Pengabdian',
              title: 'Instalasi Filter Air Bersih Mandiri Bertenaga Surya untuk Dusun Terpencil',
              scheme: 'Teknologi Tepat Guna (TTG)',
              focusArea: 'Sanitasi Lingkungan & Energi Surya',
              leader: 'Ahmad Fauzan, S.T., M.T.',
              nidn: '0408078604',
              faculty: 'Fakultas Teknik',
              studyProgram: 'Teknik Elektro',
              membersCount: 3,
              year: 2026,
              fundingAmount: 25000000,
              fundingSource: 'DIPA Internal',
              status: 'Selesai',
              targetOutput: 'Alat TTG Terpasang, Manual Book Penggunaan, & Berita Media Massa',
              mitraSasaran: 'Warga Dusun Wonosari RT 04 / RW 02',
              reviewerNote: 'Kegiatan tuntas 100%, laporan pertanggungjawaban telah disahkan.',
              documentUrl: 'https://siakad.itn.ac.id/dokumen/p3m/pkm-filter-surya.pdf',
              submittedAt: '10 Jan 2026',
            },
          ],
        });
      }

      // 2. Seed Intellectual Properties (HAKI)
      const ipCount = await this.prisma.lp3mIntellectualProperty.count();
      if (ipCount === 0) {
        await this.prisma.lp3mIntellectualProperty.createMany({
          data: [
            {
              regNumber: 'EC00202618901',
              title: 'Program Komputer: Sistem Monitoring Kualitas Udara Berbasis Mikrokontroler ESP32',
              type: 'Hak Cipta',
              inventor: 'Dr. Bayu Wicaksono, M.Kom. & Tim',
              nidn: '0412088501',
              faculty: 'Fakultas Ilmu Komputer',
              status: 'Tersertifikasi',
              grantYear: 2026,
              applicationDate: '10 Jan 2026',
              description: 'Perangkat lunak akuisisi data sensor PM2.5, suhu, dan kelembapan real-time.',
              certificateUrl: 'https://siakad.itn.ac.id/dokumen/haki/sertifikat-ec00202618901.pdf',
            },
            {
              regNumber: 'S00202600412',
              title: 'Paten Sederhana: Modul Inverter Surya Efisiensi Tinggi dengan Pendingin Pasif',
              type: 'Paten Sederhana',
              inventor: 'Ir. Hendra Kusuma, M.T., Ph.D.',
              nidn: '0423047802',
              faculty: 'Fakultas Teknik',
              status: 'Pemeriksaan Substantif',
              grantYear: 2026,
              applicationDate: '15 Jan 2026',
              description: 'Invensi alat inverter tenaga surya dengan sirip pendingin aluminium terintegrasi.',
              certificateUrl: 'https://siakad.itn.ac.id/dokumen/haki/permohonan-s00202600412.pdf',
            },
            {
              regNumber: 'EC00202619420',
              title: 'Karya Rekaman Video Animasi: Edukasi Mitigasi Gempa Bumi untuk Sekolah Dasar',
              type: 'Hak Cipta',
              inventor: 'Dian Permatasari, M.Ds. & Mahasiswa',
              nidn: '0419089201',
              faculty: 'Fakultas Teknik Sipil & Perencanaan',
              status: 'Tersertifikasi',
              grantYear: 2026,
              applicationDate: '22 Jan 2026',
              description: 'Video animasi 2D interaktif simulasi evakuasi mandiri di lingkungan sekolah.',
              certificateUrl: 'https://siakad.itn.ac.id/dokumen/haki/sertifikat-ec00202619420.pdf',
            },
          ],
        });
      }

      // 3. Seed LP3M Documents
      const docCount = await this.prisma.lp3mDocument.count();
      if (docCount === 0) {
        await this.prisma.lp3mDocument.createMany({
          data: [
            {
              code: 'RENSTRA-LP3M-2026',
              title: 'Rencana Strategis (RENSTRA) Penelitian & Pengabdian kepada Masyarakat 2024-2028',
              category: 'Panduan & Renstra',
              fileType: 'PDF',
              fileSize: '6.4 MB',
              version: 'Edisi Revisi 2.1',
              academicYear: '2024 - 2028',
              accessLevel: 'Publik',
              author: 'Dewan Riset LP3M',
              description: 'Peta jalan (roadmap) riset institusi, fokus riset unggulan kecerdasan buatan, energi terbarukan, dan UMKM.',
              downloadsCount: 582,
            },
            {
              code: 'PANDUAN-HIBAH-2026',
              title: 'Buku Panduan Pelaksanaan Hibah Penelitian & Pengabdian Internal Tahun Anggaran 2026',
              category: 'Panduan & Renstra',
              fileType: 'PDF',
              fileSize: '4.8 MB',
              version: 'Rev. 3.2',
              academicYear: '2026/2027',
              accessLevel: 'Publik',
              author: 'Tim Kurasi LP3M',
              description: 'Pedoman lengkap tata cara pengajuan usulan, kriteria penilaian reviewer, jadwal tahapan monev, dan luaran.',
              downloadsCount: 1240,
            },
            {
              code: 'SK-REK-014-2026',
              title: 'SK Rektor No. 014/REK/2026: Standar Biaya Masukan (SBM) & Honorarium Peneliti',
              category: 'Regulasi & SK Rektor',
              fileType: 'PDF',
              fileSize: '1.2 MB',
              version: 'SK Resmi',
              academicYear: '2026',
              accessLevel: 'Dosen & Reviewer',
              author: 'Biro Hukum & Rektorat',
              description: 'Ketetapan plafon biaya operasional penelitian, belanja bahan laboratorium, biaya publikasi, dan insentif HAKI.',
              downloadsCount: 730,
            },
            {
              code: 'TMP-PROP-LIT-2026',
              title: 'Template Dokumen Usulan Proposal Penelitian Fundamental & Terapan (Word .docx)',
              category: 'Template Proposal',
              fileType: 'DOCX',
              fileSize: '850 KB',
              version: 'v2026.1',
              academicYear: '2026',
              accessLevel: 'Publik',
              author: 'Subbag Publikasi',
              description: 'Format baku halaman judul, lembar pengesahan dekan, sistematika proposal, metode penelitian, dan jadwal Gantt Chart.',
              downloadsCount: 2150,
            },
            {
              code: 'TMP-RAB-EXCEL-2026',
              title: 'Template Rencana Anggaran Biaya (RAB) Otomatis Sesuai SBM Terkini (Excel .xlsx)',
              category: 'Template Proposal',
              fileType: 'XLSX',
              fileSize: '420 KB',
              version: 'v2026.2',
              academicYear: '2026',
              accessLevel: 'Publik',
              author: 'Tim Keuangan Riset',
              description: 'Formula spreadsheet terstandarisasi untuk perhitungan biaya bahan habis pakai, perjalanan dinas, dan pelaporan pajak.',
              downloadsCount: 1840,
            },
            {
              code: 'BOR-BANPT-9STD',
              title: 'Matriks Borang Akreditasi LKPS & LED Kriteria C.6 & C.7 (Standar 9 BAN-PT)',
              category: 'Instrumen Borang',
              fileType: 'XLSX',
              fileSize: '2.4 MB',
              version: 'Instrumen 2026',
              academicYear: '2026',
              accessLevel: 'Dosen & Reviewer',
              author: 'Tim Penjaminan Mutu & LP3M',
              description: 'Tabel perhitungan data kuantitatif penelitian/PkM dosen tetap program studi (DTPS) untuk borang akreditasi BAN-PT & LAM.',
              downloadsCount: 460,
            },
          ],
        });
      }

      // 4. Seed Borang Records
      const borangCount = await this.prisma.lp3mBorangRecord.count();
      if (borangCount === 0) {
        await this.prisma.lp3mBorangRecord.createMany({
          data: [
            {
              prodiCode: 'TI',
              prodiName: 'S1 Teknik Informatika',
              faculty: 'Fakultas Ilmu Komputer',
              academicYear: '2026',
              dtpsCount: 16,
              penelitianLokal: 24,
              penelitianNasional: 14,
              penelitianInternasional: 3,
              danaPenelitianTotal: 485000000,
              pkmLokal: 18,
              pkmNasional: 8,
              pkmInternasional: 1,
              danaPkmTotal: 180000000,
              scopusCount: 12,
              sintaCount: 28,
              hakiCount: 14,
              bukuCount: 5,
              scorePenelitian: 3.85,
              scorePkm: 3.75,
            },
            {
              prodiCode: 'SI',
              prodiName: 'S1 Sistem Informasi',
              faculty: 'Fakultas Ilmu Komputer',
              academicYear: '2026',
              dtpsCount: 12,
              penelitianLokal: 18,
              penelitianNasional: 9,
              penelitianInternasional: 1,
              danaPenelitianTotal: 310000000,
              pkmLokal: 14,
              pkmNasional: 6,
              pkmInternasional: 0,
              danaPkmTotal: 135000000,
              scopusCount: 7,
              sintaCount: 22,
              hakiCount: 9,
              bukuCount: 4,
              scorePenelitian: 3.70,
              scorePkm: 3.65,
            },
            {
              prodiCode: 'EL',
              prodiName: 'S1 Teknik Elektro',
              faculty: 'Fakultas Teknik',
              academicYear: '2026',
              dtpsCount: 14,
              penelitianLokal: 20,
              penelitianNasional: 12,
              penelitianInternasional: 2,
              danaPenelitianTotal: 460000000,
              pkmLokal: 15,
              pkmNasional: 7,
              pkmInternasional: 1,
              danaPkmTotal: 165000000,
              scopusCount: 11,
              sintaCount: 24,
              hakiCount: 8,
              bukuCount: 3,
              scorePenelitian: 3.80,
              scorePkm: 3.70,
            },
            {
              prodiCode: 'MS',
              prodiName: 'S1 Teknik Mesin',
              faculty: 'Fakultas Teknik',
              academicYear: '2026',
              dtpsCount: 15,
              penelitianLokal: 22,
              penelitianNasional: 11,
              penelitianInternasional: 2,
              danaPenelitianTotal: 490000000,
              pkmLokal: 16,
              pkmNasional: 6,
              pkmInternasional: 0,
              danaPkmTotal: 150000000,
              scopusCount: 9,
              sintaCount: 26,
              hakiCount: 11,
              bukuCount: 4,
              scorePenelitian: 3.75,
              scorePkm: 3.60,
            },
            {
              prodiCode: 'SP',
              prodiName: 'S1 Teknik Sipil',
              faculty: 'Fakultas Teknik',
              academicYear: '2026',
              dtpsCount: 18,
              penelitianLokal: 26,
              penelitianNasional: 15,
              penelitianInternasional: 1,
              danaPenelitianTotal: 520000000,
              pkmLokal: 20,
              pkmNasional: 9,
              pkmInternasional: 0,
              danaPkmTotal: 195000000,
              scopusCount: 8,
              sintaCount: 30,
              hakiCount: 7,
              bukuCount: 6,
              scorePenelitian: 3.80,
              scorePkm: 3.78,
            },
            {
              prodiCode: 'AR',
              prodiName: 'S1 Arsitektur',
              faculty: 'Fakultas Teknik Sipil & Perencanaan',
              academicYear: '2026',
              dtpsCount: 10,
              penelitianLokal: 14,
              penelitianNasional: 7,
              penelitianInternasional: 1,
              danaPenelitianTotal: 280000000,
              pkmLokal: 12,
              pkmNasional: 5,
              pkmInternasional: 0,
              danaPkmTotal: 120000000,
              scopusCount: 5,
              sintaCount: 18,
              hakiCount: 12,
              bukuCount: 5,
              scorePenelitian: 3.65,
              scorePkm: 3.60,
            },
          ],
        });
      }
    } catch (err) {
      console.warn('⚠️ Gagal mengeksekusi seed LP3M (kemungkinan tabel belum siap):', (err as Error).message);
    }
  }

  // ================= 1. OVERVIEW & STATS =================
  async getOverview() {
    const totalPenelitian = await this.prisma.lp3mResearch.count({
      where: { type: 'Penelitian' },
    });

    const penelitianDisetujui = await this.prisma.lp3mResearch.count({
      where: {
        type: 'Penelitian',
        status: { in: ['Sedang Berjalan', 'Selesai'] },
      },
    });

    const totalPengabdian = await this.prisma.lp3mResearch.count({
      where: { type: 'Pengabdian' },
    });

    const pengabdianDisetujui = await this.prisma.lp3mResearch.count({
      where: {
        type: 'Pengabdian',
        status: { in: ['Sedang Berjalan', 'Selesai'] },
      },
    });

    const totalHaki = await this.prisma.lp3mIntellectualProperty.count();
    const hakiCertified = await this.prisma.lp3mIntellectualProperty.count({
      where: { status: 'Tersertifikasi' },
    });

    const totalDocuments = await this.prisma.lp3mDocument.count();
    const pendingReviewCount = await this.prisma.lp3mResearch.count({
      where: { status: 'Menunggu Verifikasi' },
    });

    // Calculate aggregated funding
    const litItems = await this.prisma.lp3mResearch.findMany({
      where: { type: 'Penelitian' },
      select: { fundingAmount: true },
    });
    const totalDanaPenelitian = litItems.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    const pkmItems = await this.prisma.lp3mResearch.findMany({
      where: { type: 'Pengabdian' },
      select: { fundingAmount: true },
    });
    const totalDanaPengabdian = pkmItems.reduce((acc, curr) => acc + (curr.fundingAmount || 0), 0);

    return {
      success: true,
      data: {
        totalPenelitian,
        penelitianDisetujui,
        totalPengabdian,
        pengabdianDisetujui,
        totalHaki,
        hakiCertified,
        totalDocuments,
        pendingReviewCount,
        totalDanaPenelitian,
        totalDanaPengabdian,
        totalDanaKeseluruhan: totalDanaPenelitian + totalDanaPengabdian,
      },
    };
  }

  // ================= 2. RESEARCH & PKM CRUD =================
  async getResearches(query?: {
    type?: string;
    year?: string;
    status?: string;
    search?: string;
    faculty?: string;
  }) {
    const where: any = {};

    if (query?.type && query.type !== 'Semua') {
      where.type = query.type;
    }

    if (query?.year && query.year !== 'Semua') {
      where.year = parseInt(query.year, 10) || 2026;
    }

    if (query?.status && query.status !== 'Semua') {
      where.status = query.status;
    }

    if (query?.faculty && query.faculty !== 'Semua') {
      where.faculty = query.faculty;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { leader: { contains: q, mode: 'insensitive' } },
        { scheme: { contains: q, mode: 'insensitive' } },
        { focusArea: { contains: q, mode: 'insensitive' } },
        { faculty: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mResearch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      total: items.length,
      data: items,
    };
  }

  async getResearchById(id: string) {
    const item = await this.prisma.lp3mResearch.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!item) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    return { success: true, data: item };
  }

  async createResearch(dto: any) {
    const count = await this.prisma.lp3mResearch.count();
    const typePrefix = dto.type === 'Pengabdian' ? 'PKM' : 'LIT';
    const code = dto.code || `P3M-${typePrefix}-2026-${String(count + 1).padStart(3, '0')}`;

    const item = await this.prisma.lp3mResearch.create({
      data: {
        code,
        type: dto.type || 'Penelitian',
        title: dto.title,
        scheme: dto.scheme || 'Penelitian Fundamental Internal',
        focusArea: dto.focusArea || 'Kecerdasan Buatan & Digital',
        leader: dto.leader || 'Dosen Peneliti ITN',
        nidn: dto.nidn || '0401018501',
        faculty: dto.faculty || 'Fakultas Ilmu Komputer',
        studyProgram: dto.studyProgram || 'Teknik Informatika',
        membersCount: Number(dto.membersCount) || 2,
        year: Number(dto.year) || 2026,
        fundingAmount: Number(dto.fundingAmount) || 0,
        fundingSource: dto.fundingSource || 'DIPA Internal',
        status: dto.status || 'Menunggu Verifikasi',
        targetOutput: dto.targetOutput || 'Jurnal Terakreditasi & Laporan Akhir',
        mitraSasaran: dto.mitraSasaran || null,
        reviewerNote: dto.reviewerNote || null,
        documentUrl: dto.documentUrl || null,
        submittedAt: dto.submittedAt || 'Hari ini',
      },
    });

    return {
      success: true,
      message: `Usulan ${item.type} "${item.title}" berhasil didaftarkan ke basis data LP3M.`,
      data: item,
    };
  }

  async updateResearch(id: string, dto: any) {
    const exists = await this.prisma.lp3mResearch.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    const updated = await this.prisma.lp3mResearch.update({
      where: { id: exists.id },
      data: {
        title: dto.title !== undefined ? dto.title : exists.title,
        scheme: dto.scheme !== undefined ? dto.scheme : exists.scheme,
        focusArea: dto.focusArea !== undefined ? dto.focusArea : exists.focusArea,
        leader: dto.leader !== undefined ? dto.leader : exists.leader,
        nidn: dto.nidn !== undefined ? dto.nidn : exists.nidn,
        faculty: dto.faculty !== undefined ? dto.faculty : exists.faculty,
        studyProgram: dto.studyProgram !== undefined ? dto.studyProgram : exists.studyProgram,
        fundingAmount: dto.fundingAmount !== undefined ? Number(dto.fundingAmount) : exists.fundingAmount,
        fundingSource: dto.fundingSource !== undefined ? dto.fundingSource : exists.fundingSource,
        status: dto.status !== undefined ? dto.status : exists.status,
        reviewerNote: dto.reviewerNote !== undefined ? dto.reviewerNote : exists.reviewerNote,
        targetOutput: dto.targetOutput !== undefined ? dto.targetOutput : exists.targetOutput,
        mitraSasaran: dto.mitraSasaran !== undefined ? dto.mitraSasaran : exists.mitraSasaran,
        documentUrl: dto.documentUrl !== undefined ? dto.documentUrl : exists.documentUrl,
      },
    });

    return {
      success: true,
      message: `Data kegiatan LP3M "${updated.title}" berhasil diperbarui.`,
      data: updated,
    };
  }

  async deleteResearch(id: string) {
    const exists = await this.prisma.lp3mResearch.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Kegiatan LP3M dengan ID "${id}" tidak ditemukan.`);
    }

    await this.prisma.lp3mResearch.delete({ where: { id: exists.id } });

    return {
      success: true,
      message: `Usulan "${exists.title}" berhasil dihapus dari basis data LP3M.`,
    };
  }

  // ================= 3. SENTRA HAKI CRUD =================
  async getHakiList(query?: { status?: string; search?: string }) {
    const where: any = {};

    if (query?.status && query.status !== 'Semua') {
      where.status = query.status;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { inventor: { contains: q, mode: 'insensitive' } },
        { regNumber: { contains: q, mode: 'insensitive' } },
        { faculty: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mIntellectualProperty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, total: items.length, data: items };
  }

  async createHaki(dto: any) {
    const item = await this.prisma.lp3mIntellectualProperty.create({
      data: {
        regNumber: dto.regNumber || `EC002026${Date.now().toString().slice(-5)}`,
        title: dto.title,
        type: dto.type || 'Hak Cipta',
        inventor: dto.inventor || 'Dosen ITN',
        nidn: dto.nidn || null,
        faculty: dto.faculty || 'Fakultas Ilmu Komputer',
        status: dto.status || 'Menunggu Verifikasi',
        grantYear: Number(dto.grantYear) || 2026,
        applicationDate: dto.applicationDate || 'Hari ini',
        description: dto.description || null,
        certificateUrl: dto.certificateUrl || null,
      },
    });

    return {
      success: true,
      message: `Permohonan HAKI "${item.title}" berhasil didaftarkan ke basis data LP3M.`,
      data: item,
    };
  }

  async deleteHaki(id: string) {
    const exists = await this.prisma.lp3mIntellectualProperty.findFirst({
      where: { OR: [{ id }, { regNumber: id }] },
    });

    if (!exists) {
      throw new NotFoundException(`Data HAKI dengan ID "${id}" tidak ditemukan.`);
    }

    await this.prisma.lp3mIntellectualProperty.delete({ where: { id: exists.id } });
    return { success: true, message: `Arsip HAKI "${exists.title}" berhasil dihapus.` };
  }

  // ================= 4. BANK DOKUMEN CRUD =================
  async getDocuments(query?: { category?: string; search?: string }) {
    const where: any = {};

    if (query?.category && query.category !== 'Semua') {
      where.category = query.category;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, total: items.length, data: items };
  }

  async createDocument(dto: any) {
    const item = await this.prisma.lp3mDocument.create({
      data: {
        code: dto.code || `DOC-LP3M-${Date.now().toString().slice(-4)}`,
        title: dto.title,
        category: dto.category || 'Panduan & Renstra',
        fileType: dto.fileType || 'PDF',
        fileSize: dto.fileSize || '2.5 MB',
        version: dto.version || 'v2026.1',
        academicYear: dto.academicYear || '2026/2027',
        accessLevel: dto.accessLevel || 'Publik',
        description: dto.description || null,
        author: dto.author || 'Sekretariat LP3M',
        fileUrl: dto.fileUrl || null,
        downloadsCount: 0,
      },
    });

    return {
      success: true,
      message: `Dokumen "${item.title}" berhasil ditambahkan ke Bank Dokumen LP3M.`,
      data: item,
    };
  }

  async incrementDocumentDownload(id: string) {
    const exists = await this.prisma.lp3mDocument.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');

    const updated = await this.prisma.lp3mDocument.update({
      where: { id: exists.id },
      data: { downloadsCount: { increment: 1 } },
    });

    return { success: true, downloadsCount: updated.downloadsCount };
  }

  async deleteDocument(id: string) {
    const exists = await this.prisma.lp3mDocument.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });
    if (!exists) throw new NotFoundException('Dokumen tidak ditemukan.');

    await this.prisma.lp3mDocument.delete({ where: { id: exists.id } });
    return { success: true, message: `Dokumen "${exists.title}" berhasil dihapus.` };
  }

  // ================= 5. REKAP BORANG AKREDITASI =================
  async getBorangRecords(query?: { faculty?: string; search?: string }) {
    const where: any = {};

    if (query?.faculty && query.faculty !== 'Semua') {
      where.faculty = query.faculty;
    }

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { prodiName: { contains: q, mode: 'insensitive' } },
        { prodiCode: { contains: q, mode: 'insensitive' } },
        { faculty: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.lp3mBorangRecord.findMany({
      where,
      orderBy: { prodiCode: 'asc' },
    });

    // Summary calculations
    const totalDTPS = items.reduce((acc, curr) => acc + curr.dtpsCount, 0);
    const totalJudulLit = items.reduce(
      (acc, curr) => acc + curr.penelitianLokal + curr.penelitianNasional + curr.penelitianInternasional,
      0
    );
    const totalJudulPkm = items.reduce(
      (acc, curr) => acc + curr.pkmLokal + curr.pkmNasional + curr.pkmInternasional,
      0
    );
    const totalDanaLit = items.reduce((acc, curr) => acc + curr.danaPenelitianTotal, 0);
    const totalDanaPkm = items.reduce((acc, curr) => acc + curr.danaPkmTotal, 0);
    const totalScopus = items.reduce((acc, curr) => acc + curr.scopusCount, 0);
    const totalSinta = items.reduce((acc, curr) => acc + curr.sintaCount, 0);
    const totalHaki = items.reduce((acc, curr) => acc + curr.hakiCount, 0);

    const rasioLitPerDosen = totalDTPS > 0 ? (totalJudulLit / totalDTPS / 3).toFixed(2) : '0';
    const rasioPkmPerDosen = totalDTPS > 0 ? (totalJudulPkm / totalDTPS / 3).toFixed(2) : '0';

    return {
      success: true,
      summary: {
        totalDTPS,
        totalJudulLit,
        totalJudulPkm,
        totalDanaLit,
        totalDanaPkm,
        totalDanaGabungan: totalDanaLit + totalDanaPkm,
        totalScopus,
        totalSinta,
        totalHaki,
        rasioLitPerDosen,
        rasioPkmPerDosen,
      },
      data: items,
    };
  }
}
