// ============================================================================
// Alamat antar-layanan (website, portal, PMB, P2M, P3M)
//
// Satu image yang sama dipakai banyak kampus, jadi alamat TIDAK boleh tertanam saat build. Urutan penentuan:
//   1. Alamat eksplisit dari konfigurasi server (PUBLIC_*_URL di .env, dibaca lewat GET /app-config) -- paling pasti.
//   2. Diturunkan dari host yang sedang dibuka, mendukung dua gaya penamaan:
//        titik   : portal.kampus.ac.id        (web = kampus.ac.id)
//        strip   : portal-kudus.contoh.com    (web = kudus.contoh.com)
//      Gaya strip dibutuhkan bila memakai Cloudflare Universal SSL, yang hanya mencakup subdomain SATU tingkat
//      (portal.kudus.contoh.com tidak tercakup, portal-kudus.contoh.com tercakup).
//   3. Host lokal/IP: port bawaan masing-masing layanan.
// Kode ini murni (tanpa window/fetch/env) agar bisa dipakai di browser maupun server.
// ============================================================================

export type ServiceName = 'web' | 'portal' | 'pmb' | 'p2m' | 'p3m';

export interface PublicUrlConfig {
  webUrl?: string | null;
  portalUrl?: string | null;
  pmbUrl?: string | null;
  p2mUrl?: string | null;
  p3mUrl?: string | null;
}

export interface HostInfo {
  hostname: string;
  /** 'http:' / 'https:' (atau tanpa titik dua). */
  protocol?: string;
  port?: string;
}

const LOCAL_PORTS: Record<ServiceName, number> = { web: 3000, portal: 3002, pmb: 3004, p2m: 3005, p3m: 3006 };
const SERVICE_PREFIXES = ['portal', 'pmb', 'p2m', 'p3m'];
// Label depan yang dianggap "alias website utama" di gaya titik.
const WEB_ALIASES = ['www', 'siakad', 'web'];

const CONFIG_KEY: Record<ServiceName, keyof PublicUrlConfig> = {
  web: 'webUrl',
  portal: 'portalUrl',
  pmb: 'pmbUrl',
  p2m: 'p2mUrl',
  p3m: 'p3mUrl',
};

export function isLocalHost(hostname: string): boolean {
  const h = hostname.split(':')[0].toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
}

/** Layanan yang sedang dibuka, dikenali dari awalan host (portal. / portal-). `null` = website utama / tidak dikenal. */
export function detectService(hostname: string): ServiceName | null {
  const first = hostname.toLowerCase().split('.')[0];
  for (const s of SERVICE_PREFIXES) {
    if (first === s || first.startsWith(`${s}-`)) return s as ServiceName;
  }
  return null;
}

function clean(url?: string | null): string | null {
  const u = (url ?? '').trim().replace(/\/+$/, '');
  return u || null;
}

/**
 * Alamat dasar (tanpa garis miring akhir) sebuah layanan untuk host yang sedang dibuka.
 * @param config alamat eksplisit dari server (boleh kosong)
 */
export function resolveServiceUrl(service: ServiceName, host: HostInfo, config?: PublicUrlConfig | null): string {
  const explicit = clean(config?.[CONFIG_KEY[service]]);
  if (explicit) return explicit;

  const proto = (host.protocol || 'https:').replace(/:?$/, ':');
  const hostname = host.hostname.toLowerCase();
  const port = host.port ? `:${host.port}` : '';

  if (isLocalHost(hostname)) return `http://localhost:${LOCAL_PORTS[service]}`;

  const labels = hostname.split('.');
  const first = labels[0];
  const rest = labels.slice(1).join('.');

  let tenant = '';
  let root = hostname;
  let style: 'dot' | 'dash' = 'dot';

  const dash = SERVICE_PREFIXES.map((s) => ({ s, m: first.match(new RegExp(`^${s}-(.+)$`)) })).find((x) => x.m);
  if (dash && dash.m) {
    style = 'dash';
    tenant = dash.m[1];
    root = rest;
  } else if (SERVICE_PREFIXES.includes(first) || (WEB_ALIASES.includes(first) && labels.length >= 3)) {
    root = rest;
  }

  if (service === 'web') return `${proto}//${style === 'dash' ? `${tenant}.${root}` : root}${port}`;
  return `${proto}//${style === 'dash' ? `${service}-${tenant}.${root}` : `${service}.${root}`}${port}`;
}
