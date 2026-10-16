import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { spawn } from 'child_process';
import { createWriteStream, existsSync } from 'fs';
import { mkdir, readdir, rename, stat, unlink } from 'fs/promises';
import { join, resolve } from 'path';

export interface BackupFile {
  name: string;
  type: 'manual' | 'otomatis';
  sizeBytes: number;
  createdAt: string;
}

const FILE_RE = /^siakad-(manual|auto)-\d{8}-\d{6}\.dump$/;

/**
 * Backup database PostgreSQL lewat `pg_dump` (format custom, sudah terkompresi).
 * - Lokasi: env BACKUP_DIR (default ./backups). Di produksi pasang sebagai volume.
 * - Otomatis: sekali sehari setelah BACKUP_AUTO_HOUR (default 2, jam server), dengan
 *   retensi BACKUP_RETENTION file otomatis terakhir (default 14). Matikan: BACKUP_AUTO=false.
 * - Dev tanpa pg_dump di host: set BACKUP_DOCKER_CONTAINER=<nama container postgres>.
 */
@Injectable()
export class BackupsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupsService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  private get dir() {
    return resolve(process.env.BACKUP_DIR || join(process.cwd(), 'backups'));
  }

  async onModuleInit() {
    await mkdir(this.dir, { recursive: true }).catch(() => undefined);
    if (process.env.BACKUP_AUTO === 'false') return;
    // Cek tiap 30 menit; backup otomatis dibuat sekali per hari setelah jam yang ditentukan.
    this.timer = setInterval(() => void this.autoTick(), 30 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async autoTick() {
    const hour = Number(process.env.BACKUP_AUTO_HOUR ?? 2);
    const now = new Date();
    if (now.getHours() < hour) return;
    const today = this.stamp(now).slice(0, 8);
    const files = await this.list().catch(() => [] as BackupFile[]);
    if (files.some((f) => f.type === 'otomatis' && f.name.includes(`-auto-${today}-`))) return;
    try {
      await this.create('auto');
      await this.applyRetention();
    } catch (err) {
      this.logger.error(`Backup otomatis gagal: ${err instanceof Error ? err.message : err}`);
    }
  }

  private stamp(d = new Date()) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  private parseDbUrl() {
    const raw = process.env.DATABASE_URL;
    if (!raw) throw new BadRequestException('DATABASE_URL belum dikonfigurasi.');
    const u = new URL(raw);
    return {
      host: u.hostname,
      port: u.port || '5432',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      db: u.pathname.replace(/^\//, ''),
    };
  }

  async list(): Promise<BackupFile[]> {
    if (!existsSync(this.dir)) return [];
    const names = (await readdir(this.dir)).filter((n) => FILE_RE.test(n));
    const out: BackupFile[] = [];
    for (const name of names) {
      const s = await stat(join(this.dir, name));
      out.push({
        name,
        type: name.startsWith('siakad-auto-') ? 'otomatis' : 'manual',
        sizeBytes: s.size,
        createdAt: s.mtime.toISOString(),
      });
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  info() {
    return {
      directory: this.dir,
      autoEnabled: process.env.BACKUP_AUTO !== 'false',
      autoHour: Number(process.env.BACKUP_AUTO_HOUR ?? 2),
      retention: Number(process.env.BACKUP_RETENTION ?? 14),
      running: this.running,
    };
  }

  async create(kind: 'manual' | 'auto'): Promise<BackupFile> {
    if (this.running) throw new BadRequestException('Proses backup lain masih berjalan, coba lagi sebentar.');
    const db = this.parseDbUrl();
    this.running = true;
    const name = `siakad-${kind}-${this.stamp()}.dump`;
    const finalPath = join(this.dir, name);
    const tmpPath = `${finalPath}.partial`;

    const container = process.env.BACKUP_DOCKER_CONTAINER;
    const pgArgs = ['-Fc', '--no-owner', '-U', db.user, '-d', db.db];
    let cmd: string;
    let args: string[];
    let env: NodeJS.ProcessEnv = process.env;
    if (container) {
      cmd = 'docker';
      args = ['exec', '-e', `PGPASSWORD=${db.password}`, container, 'pg_dump', ...pgArgs];
    } else {
      cmd = process.env.PG_DUMP_BIN || 'pg_dump';
      args = ['-h', db.host, '-p', db.port, ...pgArgs];
      env = { ...process.env, PGPASSWORD: db.password };
    }

    try {
      await mkdir(this.dir, { recursive: true });
      await new Promise<void>((res, rej) => {
        const child = spawn(cmd, args, { env });
        const out = createWriteStream(tmpPath);
        let stderr = '';
        child.stderr.on('data', (c) => (stderr += c.toString()));
        child.stdout.pipe(out);
        child.on('error', (e) =>
          rej(new Error(`Tidak dapat menjalankan pg_dump (${e.message}). Pastikan postgresql-client terpasang.`)),
        );
        child.on('close', (code) => {
          out.end(() => (code === 0 ? res() : rej(new Error(stderr.trim().slice(0, 300) || `pg_dump exit ${code}`))));
        });
      });
      await rename(tmpPath, finalPath);
    } catch (err) {
      await unlink(tmpPath).catch(() => undefined);
      this.logger.error(`Backup gagal: ${err instanceof Error ? err.message : err}`);
      throw new BadRequestException(err instanceof Error ? err.message : 'Backup gagal.');
    } finally {
      this.running = false;
    }

    const s = await stat(finalPath);
    this.logger.log(`Backup dibuat: ${name} (${s.size} bytes)`);
    return { name, type: kind === 'auto' ? 'otomatis' : 'manual', sizeBytes: s.size, createdAt: s.mtime.toISOString() };
  }

  private async applyRetention() {
    const keep = Math.max(1, Number(process.env.BACKUP_RETENTION ?? 14));
    const autos = (await this.list()).filter((f) => f.type === 'otomatis');
    for (const f of autos.slice(keep)) await unlink(join(this.dir, f.name)).catch(() => undefined);
  }

  /** Validasi nama berkas (anti path traversal) dan kembalikan path absolut. */
  pathFor(name: string) {
    if (!FILE_RE.test(name)) throw new BadRequestException('Nama berkas backup tidak valid.');
    const p = join(this.dir, name);
    if (!existsSync(p)) throw new NotFoundException('Berkas backup tidak ditemukan.');
    return p;
  }

  async remove(name: string) {
    await unlink(this.pathFor(name));
    return { success: true };
  }
}
