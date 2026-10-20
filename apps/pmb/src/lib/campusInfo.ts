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
  };
}
