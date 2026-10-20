import { headers } from 'next/headers';
import { resolveServiceUrl } from '@siakad/utils';
import { loadCampus, loadLanding } from '@/lib/data';

/**
 * Alamat login portal. Memakai PUBLIC_PORTAL_URL dari .env server bila diisi; kalau tidak, diturunkan dari host
 * yang sedang dibuka (p2m.kampus.ac.id -> portal.kampus.ac.id, atau p2m-kudus.contoh.com -> portal-kudus.contoh.com).
 */
export async function resolvePortalUrl(): Promise<string> {
  const h = await headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || '').toLowerCase();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
  const [hostname, port] = host.split(':');
  const base = resolveServiceUrl('portal', { hostname, protocol: proto, port }, { portalUrl: process.env.PUBLIC_PORTAL_URL });
  return `${base}/login`;
}

/** Data yang dibutuhkan semua halaman: konten mutu, profil kampus, dan alamat portal. */
export async function loadSite() {
  const [landing, campus, portalUrl] = await Promise.all([loadLanding(), loadCampus(), resolvePortalUrl()]);
  return { ...landing, campus, portalUrl };
}
