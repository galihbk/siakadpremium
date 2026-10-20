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
  socialFacebook: string | null;
  socialTwitter: string | null;
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

// Nilai awal NETRAL (kosong) sampai profil institusi dimuat dari server -- sengaja bukan data kampus tertentu,
// supaya satu aplikasi yang sama tidak menampilkan identitas kampus lain saat memuat atau saat API tidak terjangkau.
export const FALLBACK_INSTITUTION_PROFILE: InstitutionProfile = {
  campusName: '',
  campusShortName: '',
  tagline: '',
  rectorName: '',
  rectorTitle: '',
  rectorQuote: '',
  rectorSpeech: '',
  rectorImageUrl: null,
  contactAddress: '',
  contactPhone: '',
  contactEmail: '',
  contactWhatsapp: '',
  socialFacebook: null,
  socialTwitter: null,
  socialInstagram: null,
  socialYoutube: null,
  socialLinkedin: null,
  foundationName: '',
  website: '',
  academicEmail: '',
  accreditation: '',
  accreditationSk: '',
  accreditationValidUntil: '',
  ptStatus: '',
  npsn: '',
  ptCode: '',
  establishmentYear: 0,
  establishmentSk: '',
  activeSemester: 'Semester Gasal',
  activeAcademicYear: '',
  viceRector1: '',
  viceRector2: '',
  viceRector3: '',
  logoInitials: '',
  logoUrl: null,
  kopLine1: '',
  kopLine2: '',
  kopContact: '',
  nomorSuratFormat: '{NO}/BAAK/{BULAN_ROMAWI}/{TAHUN}',
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
