import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface MobilePackage {
  id: string;
  name: string;
  maxStudents: number;
  /** Rupiah, as text with 2 decimals. */
  price: string;
  durationMonths: number;
}

export type MobileSubscriptionStatus =
  | { enabled: false }
  | { enabled: true; configured: false; missing: string[] }
  | {
      enabled: true;
      configured: true;
      /** false: NextVersa tidak dapat dihubungi, jadi statusnya tidak diketahui. */
      reachable: boolean;
      /** Masalah yang dijawab NextVersa (kredensial ditolak, kampus dinonaktifkan), bukan gangguan jaringan. */
      problem?: string;
      institutionName?: string;
      /** active: berjalan; expired: masa berlaku habis; inactive: belum pernah/dibatalkan. */
      state?: 'active' | 'inactive' | 'expired';
      allowed?: boolean;
      startedAt?: string | null;
      /** null: langganan tanpa batas akhir. */
      expiresAt?: string | null;
      package?: MobilePackage | null;
      /** null: tanpa batas mahasiswa (langganan buatan admin tanpa paket). */
      maxStudents?: number | null;
      activeStudentCount?: number;
      remaining?: number | null;
      overCapacity?: boolean;
    };

export interface MobileSubscriptionActivation {
  status: 'ACTIVE';
  startedAt: string;
  expiresAt: string | null;
  package: MobilePackage | null;
  maxStudents: number | null;
  activeStudentCount: number;
}

interface Config {
  url: string;
  clientId: string;
  clientSecret: string;
}

const TIMEOUT_MS = 10_000;
/** Token baru diminta sedikit sebelum yang lama habis. */
const TOKEN_MARGIN_MS = 60_000;

const ENV_NAMES = ['NEXTVERSA_GATEWAY_URL', 'NEXTVERSA_CLIENT_ID', 'NEXTVERSA_CLIENT_SECRET'] as const;

/** http hanya untuk komputer sendiri (pengembangan): kredensial tidak boleh melintas jaringan tanpa enkripsi. */
const isSafeUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
};

/**
 * Langganan aplikasi mobile NextVersa untuk kampus ini.
 *
 * SIAKAD memanggil Gateway NextVersa dari servernya sendiri: client id dan secret kampus tidak pernah sampai ke
 * browser, dan kampus yang dimaksud ditentukan oleh kredensial itu (bukan oleh isian pengguna). Paket dipilih dari
 * daftar milik NextVersa; jumlah mahasiswa aktif dihitung NextVersa sendiri dan tidak pernah diisi dari sini.
 * Tidak ada data akademik yang dikirim.
 *
 * SEMENTARA: menu ini dibuka hanya selama MOBILE_SUBSCRIPTION_ENABLED=true di server. Mematikannya menutup
 * endpoint tanpa perlu deploy ulang (menu di portal ditutup lewat lib/features.ts).
 */
@Injectable()
export class MobileSubscriptionService {
  private readonly log = new Logger(MobileSubscriptionService.name);
  private token: { value: string; expiresAt: number } | null = null;
  private pendingToken: Promise<string> | null = null;

  enabled(): boolean {
    return (process.env.MOBILE_SUBSCRIPTION_ENABLED ?? '').trim().toLowerCase() === 'true';
  }

  /** Isi konfigurasi, atau nama variabel yang belum diisi / tidak aman (nilainya tidak pernah ikut). */
  private config(): { config: Config } | { missing: string[] } {
    const values = {
      NEXTVERSA_GATEWAY_URL: (process.env.NEXTVERSA_GATEWAY_URL ?? '').trim().replace(/\/+$/, ''),
      NEXTVERSA_CLIENT_ID: (process.env.NEXTVERSA_CLIENT_ID ?? '').trim(),
      NEXTVERSA_CLIENT_SECRET: (process.env.NEXTVERSA_CLIENT_SECRET ?? '').trim(),
    };
    const missing: string[] = ENV_NAMES.filter((name) => !values[name]);
    if (values.NEXTVERSA_GATEWAY_URL && !isSafeUrl(values.NEXTVERSA_GATEWAY_URL)) missing.push('NEXTVERSA_GATEWAY_URL (harus https)');
    if (missing.length > 0) return { missing: [...new Set(missing)] };

    return {
      config: {
        url: values.NEXTVERSA_GATEWAY_URL,
        clientId: values.NEXTVERSA_CLIENT_ID,
        clientSecret: values.NEXTVERSA_CLIENT_SECRET,
      },
    };
  }

  /** Pengaturan yang siap dipakai, atau error yang menjelaskan apa yang kurang. */
  private ready(): Config {
    if (!this.enabled()) throw new NotFoundException('Fitur ini sedang ditutup.');
    const found = this.config();
    if ('missing' in found) {
      throw new ServiceUnavailableException(`Integrasi NextVersa belum diatur di server: ${found.missing.join(', ')}.`);
    }
    return found.config;
  }

  /** Langganan kampus ini sekarang: paket, batas dan pemakaian mahasiswa aktif, tanggal. Dibaca dari NextVersa. */
  async status(): Promise<MobileSubscriptionStatus> {
    if (!this.enabled()) return { enabled: false };
    const found = this.config();
    if ('missing' in found) return { enabled: true, configured: false, missing: found.missing };

    try {
      const res = await this.authorized(found.config, 'GET', '/institution/subscription');
      if (!res.ok) throw await this.errorFrom(res);

      const body = (await res.json()) as {
        institution?: { name?: string };
        subscription?: { state?: 'active' | 'inactive' | 'expired'; startedAt?: string; expiresAt?: string | null } | null;
        package?: MobilePackage | null;
        maxStudents?: number | null;
        activeStudentCount?: number;
        remaining?: number | null;
        overCapacity?: boolean;
      };
      const state = body.subscription?.state ?? 'inactive';
      return {
        enabled: true,
        configured: true,
        reachable: true,
        institutionName: body.institution?.name,
        state,
        allowed: state === 'active',
        startedAt: body.subscription?.startedAt ?? null,
        expiresAt: body.subscription?.expiresAt ?? null,
        package: body.package ?? null,
        maxStudents: body.maxStudents ?? null,
        activeStudentCount: body.activeStudentCount ?? 0,
        remaining: body.remaining ?? null,
        overCapacity: body.overCapacity === true,
      };
    } catch (error) {
      // Jawaban NextVersa (kredensial ditolak, kampus dinonaktifkan) dijelaskan; gangguan jaringan hanya "tidak diketahui".
      if (error instanceof BadGatewayException || error instanceof ForbiddenException) {
        return { enabled: true, configured: true, reachable: true, problem: error.message };
      }
      this.log.warn(`Status langganan tidak dapat dibaca: ${(error as Error).message}`);
      return { enabled: true, configured: true, reachable: false };
    }
  }

  /** Paket yang dapat dipilih kampus ini (milik NextVersa; kapasitas dan harga tidak diisi dari sini). */
  async packages(): Promise<MobilePackage[]> {
    const config = this.ready();
    const res = await this.authorized(config, 'GET', '/institution/packages');
    if (!res.ok) throw await this.errorFrom(res);

    const list = (await res.json().catch(() => null)) as MobilePackage[] | null;
    if (!Array.isArray(list)) throw new BadGatewayException('NextVersa tidak dapat memproses permintaan saat ini.');
    return list.map((p) => ({ id: p.id, name: p.name, maxStudents: p.maxStudents, price: p.price, durationMonths: p.durationMonths }));
  }

  /** Mengaktifkan atau memperpanjang langganan kampus ini dengan sebuah paket. */
  async activate(
    input: { packageId: string; durationMonths?: number },
    requestedBy: string,
  ): Promise<MobileSubscriptionActivation> {
    const config = this.ready();
    const res = await this.authorized(config, 'POST', '/institution/subscription/activate', {
      packageId: input.packageId,
      ...(input.durationMonths === undefined ? {} : { durationMonths: input.durationMonths }),
    });

    const body = (await res.clone().json().catch(() => null)) as Partial<MobileSubscriptionActivation> | null;
    if (res.ok && body?.status === 'ACTIVE' && typeof body.startedAt === 'string') {
      this.log.log(`Langganan mobile diaktifkan (paket ${body.package?.name ?? '-'}) oleh pengguna ${requestedBy}, berlaku sampai ${body.expiresAt ?? 'tanpa batas'}.`);
      return {
        status: 'ACTIVE',
        startedAt: body.startedAt,
        expiresAt: body.expiresAt ?? null,
        package: body.package ?? null,
        maxStudents: body.maxStudents ?? null,
        activeStudentCount: body.activeStudentCount ?? 0,
      };
    }
    throw await this.errorFrom(res);
  }

  /** Pesan untuk pengguna dari jawaban error NextVersa; kode dan angka kapasitas dijelaskan dalam bahasa Indonesia. */
  private async errorFrom(res: Response): Promise<HttpException> {
    const body = (await res.json().catch(() => null)) as {
      code?: string;
      capacity?: { packageName?: string; maxStudents?: number; activeStudentCount?: number };
    } | null;

    if (res.status === 409 && body?.code === 'CAPACITY_EXCEEDED' && body.capacity) {
      const { packageName, maxStudents, activeStudentCount } = body.capacity;
      return new ConflictException(
        `Paket ${packageName} hanya untuk ${maxStudents} mahasiswa aktif, sedangkan kampus ini memiliki ${activeStudentCount}. Pilih paket yang lebih besar.`,
      );
    }
    if (res.status === 400 && body?.code === 'PACKAGE_UNAVAILABLE') return new BadRequestException('Paket ini tidak tersedia. Muat ulang daftar paket.');
    if (res.status === 400) return new BadRequestException('NextVersa menolak data yang dikirim.');
    if (res.status === 403 && body?.code === 'INSTITUTION_INACTIVE') return new ForbiddenException('Kampus ini sedang dinonaktifkan di NextVersa.');
    if (res.status === 401) return new BadGatewayException('NextVersa menolak kredensial kampus ini. Periksa client id dan secret.');
    if (res.status === 429) return new ServiceUnavailableException('Terlalu banyak percobaan. Coba lagi beberapa menit lagi.');

    this.log.warn(`NextVersa menjawab ${res.status}`);
    return new BadGatewayException('NextVersa tidak dapat memproses permintaan saat ini.');
  }

  /** Permintaan ke Gateway dengan token kampus. Token yang sudah dicabut ditolak sekali; saat itu token baru diminta. */
  private async authorized(config: Config, method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
    for (let attempt = 0; ; attempt++) {
      const token = await this.accessToken(config);

      let res: Response;
      try {
        res = await fetch(`${config.url}/api/v1${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          redirect: 'error',
        });
      } catch (error) {
        this.log.warn(`NextVersa tidak dapat dihubungi: ${(error as Error).message}`);
        throw new ServiceUnavailableException('NextVersa tidak dapat dihubungi. Coba lagi beberapa saat lagi.');
      }

      if (res.status === 401 && attempt === 0) {
        this.token = null;
        continue;
      }
      return res;
    }
  }

  /** Token server-ke-server; dipakai ulang sampai hampir habis. Permintaan serempak berbagi satu permintaan token. */
  private async accessToken(config: Config): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    this.pendingToken ??= this.requestToken(config).finally(() => {
      this.pendingToken = null;
    });
    return this.pendingToken;
  }

  private async requestToken(config: Config): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${config.url}/api/v1/institution/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ clientId: config.clientId, clientSecret: config.clientSecret }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
    } catch (error) {
      this.log.warn(`NextVersa tidak dapat dihubungi: ${(error as Error).message}`);
      throw new ServiceUnavailableException('NextVersa tidak dapat dihubungi. Coba lagi beberapa saat lagi.');
    }

    const body = (await res.clone().json().catch(() => null)) as { accessToken?: string; expiresIn?: number } | null;
    if (!res.ok || typeof body?.accessToken !== 'string' || typeof body.expiresIn !== 'number') throw await this.errorFrom(res);

    this.token = { value: body.accessToken, expiresAt: Date.now() + body.expiresIn * 1000 - TOKEN_MARGIN_MS };
    return body.accessToken;
  }
}
