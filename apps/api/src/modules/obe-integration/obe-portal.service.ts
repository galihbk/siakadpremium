import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

export type ObePortalResult =
  | { enabled: false }
  | { enabled: true; available: false; reason: 'NOT_IN_OBE' | 'UNREACHABLE' }
  | { enabled: true; available: true; data: unknown };

const TIMEOUT_MS = 8000;
const CACHE_MS = 60_000;

/**
 * Capaian OBE untuk portal mahasiswa. SIAKAD memanggil API OBE dari servernya sendiri (kunci API tidak pernah sampai ke
 * browser) dan hanya untuk mahasiswa yang sedang login, berdasarkan NIM dari data SIAKAD, bukan dari isian pengguna.
 *
 * Aktif hanya bila OBE_API_URL dan OBE_PORTAL_API_KEY diisi, yaitu bila kampus ini memakai OBE. Bila tidak, portal
 * berjalan seperti biasa dan tidak menampilkan apa pun tentang OBE. Gangguan di OBE tidak pernah mengganggu portal:
 * hasilnya hanya "tidak tersedia".
 */
@Injectable()
export class ObePortalService {
  private readonly log = new Logger(ObePortalService.name);
  private readonly cache = new Map<string, { at: number; value: ObePortalResult }>();

  constructor(private readonly prisma: PrismaService) {}

  private config(): { url: string; key: string } | null {
    const url = (process.env.OBE_API_URL ?? '').trim().replace(/\/+$/, '');
    const key = (process.env.OBE_PORTAL_API_KEY ?? '').trim();
    return url && key ? { url, key } : null;
  }

  enabled(): boolean {
    return this.config() !== null;
  }

  async forUser(userId: string): Promise<ObePortalResult> {
    const config = this.config();
    if (!config) return { enabled: false };
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { nim: true } });
    if (!student) throw new NotFoundException('Data mahasiswa tidak ditemukan.');

    const cached = this.cache.get(student.nim);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

    let value: ObePortalResult;
    try {
      const res = await fetch(`${config.url}/external/students/${encodeURIComponent(student.nim)}/obe`, {
        headers: { Authorization: `Bearer ${config.key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
      if (res.status === 404) value = { enabled: true, available: false, reason: 'NOT_IN_OBE' };
      else if (!res.ok) throw new Error(`OBE menjawab ${res.status}`);
      else value = { enabled: true, available: true, data: await res.json() };
    } catch (error) {
      // Kunci tidak pernah ikut tercatat: hanya penyebabnya.
      this.log.warn(`API OBE tidak dapat dibaca: ${(error as Error).message}`);
      return { enabled: true, available: false, reason: 'UNREACHABLE' };
    }
    this.cache.set(student.nim, { at: Date.now(), value });
    return value;
  }
}

