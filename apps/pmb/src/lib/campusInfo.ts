// Tipe & pengubah profil kampus -- tanpa 'use client' supaya aman dipakai di server component maupun client.

export interface CampusProfile {
  campusName: string;
  campusShortName: string;
  logoInitials: string;
  logoUrl: string | null;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactWhatsapp: string;
  website: string;
  foundationName?: string;
  // Format KOP surat yang diatur Super Admin di Profil Institusi
  kopLine1?: string;
  kopLine2?: string;
  kopContact?: string;
  doubleBorderKop?: boolean;
}

/** Bentuk siap pakai untuk teks halaman (nilai kosong = belum diisi di Profil Institusi). */
export interface CampusInfo {
  name: string;
  short: string;
  nameWithShort: string;
  initials: string;
  logoUrl: string | null;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  website: string;
  foundation: string;
  /** KOP surat resmi: baris 1 (yayasan), baris 2 (nama institusi, huruf besar), kontak, dan garis ganda. */
  kop: { line1: string; line2: string; contact: string; doubleBorder: boolean };
}

export const EMPTY_CAMPUS: CampusInfo = {
  name: '',
  short: '',
  nameWithShort: '',
  initials: '',
  logoUrl: null,
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  website: '',
  foundation: '',
  kop: { line1: '', line2: '', contact: '', doubleBorder: true },
};

export function toCampusInfo(p: Partial<CampusProfile> | null | undefined): CampusInfo {
  if (!p) return EMPTY_CAMPUS;
  const name = String(p.campusName ?? '').trim();
  const short = String(p.campusShortName ?? '').trim() || String(p.logoInitials ?? '').trim() || name;
  return {
    name,
    short,
    nameWithShort: name && short && short !== name ? `${name} (${short})` : name,
    initials: String(p.logoInitials ?? '').trim() || short.slice(0, 4).toUpperCase(),
    logoUrl: p.logoUrl || null,
    phone: String(p.contactPhone ?? '').trim(),
    email: String(p.contactEmail ?? '').trim(),
    whatsapp: String(p.contactWhatsapp ?? '').trim(),
    address: String(p.contactAddress ?? '').trim(),
    website: String(p.website ?? '').trim(),
    foundation: String(p.foundationName ?? '').trim(),
    kop: {
      // Sama dengan komponen KopSurat di portal: pengaturan KOP didahulukan, bila kosong dirakit dari data institusi
      line1: String(p.kopLine1 ?? '').trim() || String(p.foundationName ?? '').trim(),
      line2: (String(p.kopLine2 ?? '').trim() || name).toUpperCase(),
      contact:
        String(p.kopContact ?? '').trim() ||
        [String(p.contactAddress ?? '').trim(), p.contactPhone ? `Telp. ${String(p.contactPhone).trim()}` : '', String(p.website ?? '').trim()]
          .filter(Boolean)
          .join(' | '),
      doubleBorder: p.doubleBorderKop ?? true,
    },
  };
}
