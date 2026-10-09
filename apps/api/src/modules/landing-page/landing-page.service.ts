import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const DEFAULT_SETTINGS = {
  id: 'default-setting',
  campusName: 'Institut Teknologi Nusantara',
  campusShortName: 'ITN',
  tagline: 'Kampus Inovasi Teknologi Masa Depan',
  heroBadge: 'Penerimaan Mahasiswa Baru TA 2026/2027 Telah Dibuka!',
  heroTitle: 'Membentuk Generasi Unggul di Era Transformasi Digital',
  heroSubtitle:
    'Institut Teknologi Nusantara (ITN) memadukan keunggulan akademik berstandar internasional, riset terapan mutakhir, dan ekosistem industri teknologi terdepan untuk mencetak profesional dan entrepreneur masa depan.',
  heroCtaText: 'Daftar Sekarang (PMB)',
  heroCtaLink: '/pmb',
  heroSecondaryCtaText: 'Jelajahi Program Studi',
  heroSecondaryCtaLink: '/#program-studi',
  rectorName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
  rectorTitle: 'Rektor Institut Teknologi Nusantara',
  rectorQuote:
    'Pendidikan di ITN tidak hanya berfokus pada penguasaan teori semata, melainkan melahirkan karya nyata dan solusi inovatif berdaya saing global bagi kemajuan bangsa.',
  rectorSpeech:
    'Selamat datang di kampus masa depan, Institut Teknologi Nusantara. Di tengah gelombang disrupsi kecerdasan buatan dan otomatisasi global, ITN berkomitmen penuh untuk menghadirkan kurikulum adaptif berbasis industri serta riset terapan kelas dunia.\n\nKami membekali setiap civitas akademika dengan fasilitas laboratorium superkomputasi, inkubator startup teknologi, dan jejaring magang internasional agar setiap lulusan tidak hanya siap kerja, tetapi juga siap memimpin masa depan. Bersama ITN, mari kita wujudkan impian besar Anda dalam ekosistem akademik yang inspiratif, inklusif, dan unggul.',
  rectorImageUrl: '/images/rector.png',
  announcementActive: true,
  announcementBadge: 'INFO AKADEMIK TERKINI',
  announcementText:
    'Pengisian KRS Semester Ganjil 2026/2027 diperpanjang hingga 31 Agustus 2026 pukul 23:59 WIB. Pastikan konsultasi Dosen PA telah disetujui.',
  announcementLink: '/portal',
  contactAddress: 'Jl. Raya Pendidikan No. 45, Kampus Terpadu ITN Cyber Park, Jakarta Selatan 12430',
  contactPhone: '(021) 7890-1234',
  contactEmail: 'info@itn.ac.id',
  contactWhatsapp: '+62 812-3456-7890',
  socialInstagram: 'https://instagram.com/itn_official',
  socialYoutube: 'https://youtube.com/@itnofficial',
  socialLinkedin: 'https://linkedin.com/school/itn-official',
  foundationName: 'Yayasan Pendidikan Teknologi Nusantara Mandiri',
  website: 'https://itn.ac.id',
  academicEmail: 'baak@itn.ac.id',
  accreditation: 'Unggul',
  accreditationSk: 'No. 1042/SK/BAN-PT/Ak/PT/VIII/2024',
  accreditationValidUntil: '28 Agustus 2029',
  ptStatus: 'Perguruan Tinggi Swasta (Aktif)',
  npsn: '061024',
  ptCode: '071032',
  establishmentYear: 1993,
  establishmentSk: 'Kepmendikbud No. 048/D/O/1993',
  activeSemester: 'Semester Gasal',
  activeAcademicYear: '2026/2027',
  viceRector1: 'Dr. Ir. Hendra Gunawan, M.T. (Bid. Akademik & Riset)',
  viceRector2: 'Dra. Hj. Sri Wahyuni, M.M., Ak. (Bid. Keuangan & SDM)',
  viceRector3: 'Dr. Rian Hidayat, S.Kom., M.Kom. (Bid. Kemahasiswaan & Kerjasama)',
  logoInitials: 'ITN',
  logoUrl: null,
  primaryColor: '#1E3A8A',
  accentColor: '#D4A017',
  themeName: 'Nusantara Navy & Gold',
  kopLine1: 'Yayasan Pendidikan Teknologi Nusantara Mandiri',
  kopLine2: 'INSTITUT TEKNOLOGI NUSANTARA',
  kopContact: 'Jl. DI Panjaitan No. 128, Jakarta Selatan 12340 | Telp: (021) 7888-9900 | Email: baak@itn.ac.id',
  pinFormat: '{KODE_PT}-{TAHUN}-{PRODI}-{NO_URUT}',
  nomorSuratFormat: '{NO}/ITN-BAAK/{BULAN_ROMAWI}/{TAHUN}',
  nimFormat: '{ANGKATAN_2DIGIT}{KODE_PRODI_3DIGIT}{NO_URUT_4DIGIT}',
  doubleBorderKop: true,
  updatedAt: new Date().toISOString(),
};

@Injectable()
export class LandingPageService {
  private inMemorySettings = { ...DEFAULT_SETTINGS };

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getSettings() {
    try {
      const dbSettings = await this.prisma.landingPageSetting.findUnique({
        where: { id: 'default-setting' },
      });
      if (dbSettings) {
        return dbSettings;
      }
    } catch {
      // Fallback to memory
    }
    return this.inMemorySettings;
  }

  async updateSettings(dto: UpdateLandingPageDto, userId?: string) {
    this.inMemorySettings = {
      ...this.inMemorySettings,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    try {
      const data: any = {
        ...dto,
        ...(userId ? { updatedByUserId: userId } : {}),
      };

      const updated = await this.prisma.landingPageSetting.upsert({
        where: { id: 'default-setting' },
        update: data,
        create: {
          id: 'default-setting',
          rectorSpeech: DEFAULT_SETTINGS.rectorSpeech,
          rectorName: DEFAULT_SETTINGS.rectorName,
          rectorTitle: DEFAULT_SETTINGS.rectorTitle,
          rectorQuote: DEFAULT_SETTINGS.rectorQuote,
          ...data,
        },
      });

      // Catat audit log pembaruan CMS secara real ke database
      try {
        await this.prisma.systemAuditLog.create({
          data: {
            action: 'CMS_UPDATE',
            detail: 'Super Administrator memperbarui konfigurasi landing page kampus',
            userEmail: 'superadmin@itn.ac.id',
          },
        });
      } catch {
        // non-blocking
      }

      // Clear cache
      await this.redis.del('landing-page:settings');
      return updated;
    } catch {
      return this.inMemorySettings;
    }
  }

  async getArticles() {
    try {
      const articles = await this.prisma.landingPageArticle.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: 'desc' },
      });
      if (articles.length > 0) return articles;
    } catch {
      // Fallback
    }

    return this.getDemoArticles();
  }

  // Dipakai halaman admin (BAAK/Super Admin) -- semua artikel termasuk yang belum dipublikasikan.
  async getAllArticlesAdmin() {
    try {
      const articles = await this.prisma.landingPageArticle.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return articles;
    } catch {
      return this.getDemoArticles();
    }
  }

  async getArticleById(id: string) {
    const article = await this.prisma.landingPageArticle.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Berita tidak ditemukan.');
    return article;
  }

  async createArticle(dto: CreateArticleDto, authorName: string) {
    let slug = slugify(dto.title);
    const existing = await this.prisma.landingPageArticle.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
    return this.prisma.landingPageArticle.create({
      data: {
        title: dto.title,
        slug,
        category: dto.category || 'Akademik',
        excerpt: dto.excerpt,
        content: dto.content,
        imageUrl: dto.imageUrl || null,
        authorName,
        readTime: dto.readTime || '4 min read',
        isFeatured: Boolean(dto.isFeatured),
        isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
      },
    });
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.landingPageArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Berita tidak ditemukan.');

    return this.prisma.landingPageArticle.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        category: dto.category !== undefined ? dto.category : undefined,
        excerpt: dto.excerpt !== undefined ? dto.excerpt : undefined,
        content: dto.content !== undefined ? dto.content : undefined,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : undefined,
        readTime: dto.readTime !== undefined ? dto.readTime : undefined,
        isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : undefined,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : undefined,
      },
    });
  }

  async deleteArticle(id: string) {
    const existing = await this.prisma.landingPageArticle.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Berita tidak ditemukan.');
    await this.prisma.landingPageArticle.delete({ where: { id } });
    return { success: true };
  }

  private getDemoArticles() {
    return [
      {
        id: 'demo-art-1',
        title: 'ITN Raih Juara 1 Kompetisi AI & Robotika Nasional 2026',
        slug: 'itn-raih-juara-1-kompetisi-ai-robotika-2026',
        category: 'Prestasi',
        excerpt:
          'Tim mahasiswa Fakultas Ilmu Komputer ITN sukses menyabet medali emas dengan inovasi Autonomous Drone pemantau pertanian cerdas.',
        content:
          'Prestasi gemilang kembali ditorehkan oleh mahasiswa ITN dalam ajang bergengsi Kompetisi AI Nasional. Karya prototipe drone berbasis Computer Vision mampu mendeteksi kesehatan tanaman secara presisi.',
        authorName: 'Humas ITN',
        readTime: '3 min read',
        isFeatured: true,
        publishedAt: new Date().toISOString(),
      },
      {
        id: 'demo-art-2',
        title: 'Kuliah Umum Internasional: Kolaborasi Riset Cloud Computing dengan Silicon Valley',
        slug: 'kuliah-umum-internasional-cloud-silicon-valley',
        category: 'Akademik',
        excerpt:
          'Menghadirkan Principal Cloud Architect ternama untuk membedah arsitektur microservices terdistribusi skala petabyte.',
        content:
          'ITN menggelar webinar dan workshop hands-on arsitektur cloud tingkat lanjut dengan pembicara industri internasional untuk meningkatkan kompetensi mahasiswa.',
        authorName: 'Biro Kerjasama ITN',
        readTime: '4 min read',
        isFeatured: false,
        publishedAt: new Date().toISOString(),
      },
    ];
  }
}
