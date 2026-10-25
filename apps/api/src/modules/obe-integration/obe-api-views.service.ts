import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { obeApiCreateStatements } from './obe-api-views';

/**
 * Memasang skema `obe_api` (view baca-saja untuk OBE) setiap API menyala. Seluruhnya satu transaksi, jadi OBE yang
 * sedang membaca tidak pernah melihat skema setengah jadi. Kegagalan hanya dicatat: SIAKAD tidak boleh gagal
 * menyala karena integrasi OBE.
 */
@Injectable()
export class ObeApiViewsService implements OnApplicationBootstrap {
  private readonly log = new Logger(ObeApiViewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.install();
    } catch (error) {
      this.log.warn(`Skema obe_api tidak terpasang: ${(error as Error).message}`);
    }
    try {
      await this.ensureDatabase();
    } catch (error) {
      this.log.warn(`Database untuk OBE tidak dapat disiapkan: ${(error as Error).message}`);
    }
  }

  /**
   * Menyediakan database KOSONG untuk OBE di server Postgres yang sama (terpisah dari database SIAKAD), supaya kampus
   * yang kelak membeli OBE tinggal menjalankannya: OBE membuat tabelnya sendiri saat pertama menyala.
   */
  async ensureDatabase(): Promise<void> {
    const name = (process.env.OBE_DATABASE_NAME ?? 'obe').replace(/[^a-z0-9_]/gi, '');
    if (!name) return;
    const found = await this.prisma.$queryRawUnsafe<unknown[]>('SELECT 1 FROM pg_database WHERE datname = $1', name);
    if (found.length > 0) return;
    await this.prisma.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
    this.log.log(`Database "${name}" untuk OBE dibuat`);
  }

  async install(): Promise<void> {
    const statements = obeApiCreateStatements();
    await this.prisma.$transaction(
      async (tx) => {
        // Beberapa replika API menyala bersamaan: yang kedua menunggu yang pertama selesai.
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(7355608)');
        for (const sql of statements) await tx.$executeRawUnsafe(sql);
      },
      { timeout: 30_000 },
    );
    this.log.log('Skema obe_api terpasang');
  }
}
