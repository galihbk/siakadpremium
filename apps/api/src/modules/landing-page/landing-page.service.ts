import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

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
