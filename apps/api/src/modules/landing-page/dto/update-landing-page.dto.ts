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

  // Legalitas & Identitas Resmi Institusi
  @ApiPropertyOptional({ example: 'Yayasan Pendidikan Teknologi Nusantara Mandiri' })
  @IsOptional()
  @IsString()
  foundationName?: string;

  @ApiPropertyOptional({ example: 'https://itn.ac.id' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'baak@itn.ac.id' })
  @IsOptional()
  @IsString()
  academicEmail?: string;

  @ApiPropertyOptional({ example: 'Unggul' })
  @IsOptional()
  @IsString()
  accreditation?: string;

  @ApiPropertyOptional({ example: 'No. 1042/SK/BAN-PT/Ak/PT/VIII/2024' })
  @IsOptional()
  @IsString()
  accreditationSk?: string;

  @ApiPropertyOptional({ example: '28 Agustus 2029' })
  @IsOptional()
  @IsString()
  accreditationValidUntil?: string;

  @ApiPropertyOptional({ example: 'Perguruan Tinggi Swasta (Aktif)' })
  @IsOptional()
  @IsString()
  ptStatus?: string;

  @ApiPropertyOptional({ example: '061024' })
  @IsOptional()
  @IsString()
  npsn?: string;

  @ApiPropertyOptional({ example: '071032' })
  @IsOptional()
  @IsString()
  ptCode?: string;

  @ApiPropertyOptional({ example: 1993 })
  @IsOptional()
  establishmentYear?: number;

  @ApiPropertyOptional({ example: 'Kepmendikbud No. 048/D/O/1993' })
  @IsOptional()
  @IsString()
  establishmentSk?: string;

  @ApiPropertyOptional({ example: 'Semester Gasal' })
  @IsOptional()
  @IsString()
  activeSemester?: string;

  @ApiPropertyOptional({ example: '2026/2027' })
  @IsOptional()
  @IsString()
  activeAcademicYear?: string;

  // Pimpinan Perguruan Tinggi
  @ApiPropertyOptional({ example: 'Dr. Ir. Hendra Gunawan, M.T. (Bid. Akademik & Riset)' })
  @IsOptional()
  @IsString()
  viceRector1?: string;

  @ApiPropertyOptional({ example: 'Dra. Hj. Sri Wahyuni, M.M., Ak. (Bid. Keuangan & SDM)' })
  @IsOptional()
  @IsString()
  viceRector2?: string;

  @ApiPropertyOptional({ example: 'Dr. Rian Hidayat, S.Kom., M.Kom. (Bid. Kemahasiswaan & Kerjasama)' })
  @IsOptional()
  @IsString()
  viceRector3?: string;

  @ApiPropertyOptional({ example: 'ITN' })
  @IsOptional()
  @IsString()
  logoInitials?: string;

  @ApiPropertyOptional({ example: '/images/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  // Identitas Visual & Format Penomoran Kampus
  @ApiPropertyOptional({ example: '#1E3A8A' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#D4A017' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional({ example: 'Nusantara Navy & Gold' })
  @IsOptional()
  @IsString()
  themeName?: string;

  @ApiPropertyOptional({ example: 'Yayasan Pendidikan Teknologi Nusantara Mandiri' })
  @IsOptional()
  @IsString()
  kopLine1?: string;

  @ApiPropertyOptional({ example: 'INSTITUT TEKNOLOGI NUSANTARA' })
  @IsOptional()
  @IsString()
  kopLine2?: string;

  @ApiPropertyOptional({ example: 'Jl. DI Panjaitan No. 128, Jakarta Selatan 12340' })
  @IsOptional()
  @IsString()
  kopContact?: string;

  @ApiPropertyOptional({ example: '{KODE_PT}-{TAHUN}-{PRODI}-{NO_URUT}' })
  @IsOptional()
  @IsString()
  pinFormat?: string;

  @ApiPropertyOptional({ example: '{NO}/ITN-BAAK/{BULAN_ROMAWI}/{TAHUN}' })
  @IsOptional()
  @IsString()
  nomorSuratFormat?: string;

  @ApiPropertyOptional({ example: '{ANGKATAN_2DIGIT}{KODE_PRODI_3DIGIT}{NO_URUT_4DIGIT}' })
  @IsOptional()
  @IsString()
  nimFormat?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  doubleBorderKop?: boolean;
}
