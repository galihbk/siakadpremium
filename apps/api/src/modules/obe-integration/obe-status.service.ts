import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OBE_API_VIEWS } from './obe-api-views';

export type ObeIntegrationState = 'NOT_INTEGRATED' | 'READY' | 'INTEGRATED';

export interface ObeStatus {
  /** NOT_INTEGRATED: OBE belum diaktifkan. READY: siap, OBE belum terlihat membaca. INTEGRATED: OBE terhubung. */
  state: ObeIntegrationState;
  /** Semua view skema obe_api terpasang. */
  viewsInstalled: boolean;
  /** Akun database OBE ada dan sudah diberi hak login (berarti OBE sudah dipasang di kampus ini). */
  readerCanLogin: boolean;
  /** Jumlah koneksi OBE yang sedang membaca database SIAKAD saat ini. */
  activeConnections: number;
  /** Kunci API untuk jalur REST terisi (isinya tidak pernah ditampilkan). */
  restKeyConfigured: boolean;
  /** Database kosong untuk OBE sudah disediakan. */
  obeDatabaseExists: boolean;
  obe: { url: string | null; health: 'UP' | 'DOWN' | 'UNKNOWN' };
  /** Jumlah baris yang tersedia untuk OBE pada tiap view; null bila tidak terhitung. */
  views: { name: string; rows: number | null }[];
  checkedAt: string;
}

const HEALTH_TIMEOUT_MS = 3000;

/**
 * Status integrasi SIAKAD dengan OBE untuk halaman Super Admin. Hanya MEMBACA: tidak mengubah apa pun, dan tidak
 * pernah menampilkan kata sandi, API key, atau isi data akademik (hanya jumlah baris).
 */
@Injectable()
export class ObeStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async status(): Promise<ObeStatus> {
    const [installed, reader, connections, database] = await Promise.all([
      this.prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM information_schema.views WHERE table_schema = 'obe_api'`).catch(() => [{ n: 0n }]),
      this.prisma.$queryRawUnsafe<{ rolcanlogin: boolean }[]>(`SELECT rolcanlogin FROM pg_roles WHERE rolname = 'obe_reader'`).catch(() => []),
      this.prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM pg_stat_activity WHERE usename = 'obe_reader'`).catch(() => [{ n: 0n }]),
      this.prisma
        .$queryRawUnsafe<unknown[]>('SELECT 1 FROM pg_database WHERE datname = $1', (process.env.OBE_DATABASE_NAME ?? 'obe').replace(/[^a-z0-9_]/gi, ''))
        .catch(() => []),
    ]);

    const viewsInstalled = Number(installed[0]?.n ?? 0) >= OBE_API_VIEWS.length;
    const readerCanLogin = reader[0]?.rolcanlogin === true;
    const activeConnections = Number(connections[0]?.n ?? 0);
    const restKeyConfigured = (process.env.OBE_API_KEY ?? '').trim().length > 0;
    const url = (process.env.OBE_URL ?? '').trim() || null;
    const health = await this.health(url);
    const views = viewsInstalled ? await Promise.all(OBE_API_VIEWS.map((v) => this.count(v.name))) : [];

    let state: ObeIntegrationState = 'NOT_INTEGRATED';
    if (viewsInstalled && (readerCanLogin || restKeyConfigured)) state = 'READY';
    if (viewsInstalled && readerCanLogin && (activeConnections > 0 || health === 'UP')) state = 'INTEGRATED';

    return {
      state,
      viewsInstalled,
      readerCanLogin,
      activeConnections,
      restKeyConfigured,
      obeDatabaseExists: database.length > 0,
      obe: { url, health },
      views,
      checkedAt: new Date().toISOString(),
    };
  }

  /** Baris pada satu view. Dibatasi waktu agar halaman status tidak menggantung bila datanya sangat besar. */
  private async count(name: string): Promise<{ name: string; rows: number | null }> {
    try {
      const rows = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = 5000`);
        return tx.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*)::bigint AS n FROM obe_api.${name}`);
      });
      return { name, rows: Number(rows[0]?.n ?? 0) };
    } catch {
      return { name, rows: null };
    }
  }

  /** Kesehatan OBE bila alamatnya diketahui (variabel OBE_URL, mis. https://obe-api.kampus.ac.id). */
  private async health(url: string | null): Promise<'UP' | 'DOWN' | 'UNKNOWN'> {
    if (!url) return 'UNKNOWN';
    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS), redirect: 'error' });
      return res.ok ? 'UP' : 'DOWN';
    } catch {
      return 'DOWN';
    }
  }
}
