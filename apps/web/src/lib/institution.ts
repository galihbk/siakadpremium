import { getApiBaseUrl } from './api';

export interface InstitutionProfile {
  campusName: string;
  campusShortName: string;
  tagline: string;
  rectorName: string;
  rectorTitle: string;
  rectorQuote: string;
  rectorSpeech: string;
  rectorImageUrl: string | null;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  socialInstagram: string | null;
  socialYoutube: string | null;
  socialLinkedin: string | null;
  foundationName: string;
  website: string;
  academicEmail: string;
  accreditation: string;
  accreditationSk: string;
  accreditationValidUntil: string;
  ptStatus: string;
  npsn: string;
  ptCode: string;
  establishmentYear: number;
  establishmentSk: string;
  activeSemester: string;
  activeAcademicYear: string;
  viceRector1: string;
  viceRector2: string;
  viceRector3: string;
  logoInitials: string;
  logoUrl: string | null;
  kopLine1: string;
  kopLine2: string;
  kopContact: string;
  nomorSuratFormat: string;
  pinFormat: string;
}

// Fallback identik dengan DEFAULT_SETTINGS di apps/api/src/modules/landing-page/landing-page.service.ts
// supaya halaman tetap konsisten kalau API sedang tidak bisa dihubungi.
export const FALLBACK_INSTITUTION_PROFILE: InstitutionProfile = {
  campusName: 'Institut Teknologi Nusantara',
  campusShortName: 'ITN',
  tagline: 'Kampus Inovasi Teknologi Masa Depan',
  rectorName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
  rectorTitle: 'Rektor Institut Teknologi Nusantara',
  rectorQuote:
    'Pendidikan di ITN tidak hanya berfokus pada penguasaan teori semata, melainkan melahirkan karya nyata dan solusi inovatif berdaya saing global bagi kemajuan bangsa.',
  rectorSpeech:
    'Selamat datang di kampus masa depan, Institut Teknologi Nusantara. Di tengah gelombang disrupsi kecerdasan buatan dan otomatisasi global, ITN berkomitmen penuh untuk menghadirkan kurikulum adaptif berbasis industri serta riset terapan kelas dunia.',
  rectorImageUrl: '/images/rector.png',
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
  kopLine1: 'Yayasan Pendidikan Teknologi Nusantara Mandiri',
  kopLine2: 'INSTITUT TEKNOLOGI NUSANTARA',
  kopContact: 'Jl. DI Panjaitan No. 128, Jakarta Selatan 12340 | Telp: (021) 7888-9900 | Email: baak@itn.ac.id',
  nomorSuratFormat: '{NO}/ITN-BAAK/{BULAN_ROMAWI}/{TAHUN}',
  pinFormat: '{KODE_PT}-{TAHUN}-{PRODI}-{NO_URUT}',
};

export async function getInstitutionProfile(): Promise<InstitutionProfile> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/landing-page`, { cache: 'no-store' });
    if (!res.ok) return FALLBACK_INSTITUTION_PROFILE;
    const json = await res.json();
    const data = json?.data || json;
    if (!data || typeof data !== 'object') return FALLBACK_INSTITUTION_PROFILE;
    return { ...FALLBACK_INSTITUTION_PROFILE, ...data };
  } catch {
    return FALLBACK_INSTITUTION_PROFILE;
  }
}
