import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLandingPageDto {
  @ApiPropertyOptional({ example: 'Institut Teknologi Nusantara' })
  @IsOptional()
  @IsString()
  campusName?: string;

  @ApiPropertyOptional({ example: 'ITN' })
  @IsOptional()
  @IsString()
  campusShortName?: string;

  @ApiPropertyOptional({ example: 'Kampus Inovasi Teknologi Masa Depan' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Penerimaan Mahasiswa Baru TA 2026/2027 Telah Dibuka!' })
  @IsOptional()
  @IsString()
  heroBadge?: string;

  @ApiPropertyOptional({ example: 'Membentuk Generasi Unggul di Era Transformasi Digital' })
  @IsOptional()
  @IsString()
  heroTitle?: string;

  @ApiPropertyOptional({ example: 'Institut Teknologi Nusantara (ITN) memadukan keunggulan akademik...' })
  @IsOptional()
  @IsString()
  heroSubtitle?: string;

  @ApiPropertyOptional({ example: 'Daftar Sekarang (PMB)' })
  @IsOptional()
  @IsString()
  heroCtaText?: string;

  @ApiPropertyOptional({ example: '/pmb' })
  @IsOptional()
  @IsString()
  heroCtaLink?: string;

  @ApiPropertyOptional({ example: 'Jelajahi Program Studi' })
  @IsOptional()
  @IsString()
  heroSecondaryCtaText?: string;

  @ApiPropertyOptional({ example: '/#program-studi' })
  @IsOptional()
  @IsString()
  heroSecondaryCtaLink?: string;

  // Sambutan Rektor
  @ApiPropertyOptional({ example: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.' })
  @IsOptional()
  @IsString()
  rectorName?: string;

  @ApiPropertyOptional({ example: 'Rektor Institut Teknologi Nusantara' })
  @IsOptional()
  @IsString()
  rectorTitle?: string;

  @ApiPropertyOptional({ example: 'Pendidikan di ITN tidak hanya berfokus pada penguasaan teori...' })
  @IsOptional()
  @IsString()
  rectorQuote?: string;

  @ApiPropertyOptional({ example: 'Teks sambutan lengkap...' })
  @IsOptional()
  @IsString()
  rectorSpeech?: string;

  @ApiPropertyOptional({ example: '/images/rector.png' })
  @IsOptional()
  @IsString()
  rectorImageUrl?: string;

  // Banner Pengumuman
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  announcementActive?: boolean;

  @ApiPropertyOptional({ example: 'INFO AKADEMIK TERKINI' })
  @IsOptional()
  @IsString()
  announcementBadge?: string;

  @ApiPropertyOptional({ example: 'Pengisian KRS berlangsung...' })
  @IsOptional()
  @IsString()
  announcementText?: string;

  @ApiPropertyOptional({ example: '/portal' })
  @IsOptional()
  @IsString()
  announcementLink?: string;

  // Kontak & Lokasi
  @ApiPropertyOptional({ example: 'Jl. Raya Pendidikan No. 45' })
  @IsOptional()
  @IsString()
  contactAddress?: string;

  @ApiPropertyOptional({ example: '(021) 7890-1234' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@itn.ac.id' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+62 812-3456-7890' })
  @IsOptional()
  @IsString()
  contactWhatsapp?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/itn_official' })
  @IsOptional()
  @IsString()
  socialInstagram?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@itnofficial' })
  @IsOptional()
  @IsString()
  socialYoutube?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/school/itn-official' })
  @IsOptional()
  @IsString()
  socialLinkedin?: string;
}
