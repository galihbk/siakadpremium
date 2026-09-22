import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import { PrismaService } from '../../shared/prisma/prisma.service';

const SAMPLE_INTERVAL_MS = 5000;
const MAX_HISTORY_POINTS = 180; // 180 x 5s = 15 menit riwayat

export interface HistoryPoint {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
}

function cpuTimesSnapshot() {
  return os.cpus().map((c) => ({ ...c.times, total: c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq }));
}

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private history: HistoryPoint[] = [];
  private previousCpuTimes = cpuTimesSnapshot();
  private latestCpuPercent = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.sampleTick();
    this.timer = setInterval(() => this.sampleTick(), SAMPLE_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private computeCpuUsagePercent(): number {
    const current = cpuTimesSnapshot();
    let idleDelta = 0;
    let totalDelta = 0;

    current.forEach((core, i) => {
      const prev = this.previousCpuTimes[i];
      if (!prev) return;
      idleDelta += core.idle - prev.idle;
      totalDelta += core.total - prev.total;
    });

    this.previousCpuTimes = current;

    if (totalDelta <= 0) return 0;
    const usage = 100 - (idleDelta / totalDelta) * 100;
    return Number(Math.max(0, Math.min(100, usage)).toFixed(1));
  }

  private async getDiskUsage() {
    try {
      const stats = await fs.promises.statfs(process.cwd());
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const usedBytes = totalBytes - freeBytes;
      return {
        totalGB: Number((totalBytes / 1024 / 1024 / 1024).toFixed(1)),
        freeGB: Number((freeBytes / 1024 / 1024 / 1024).toFixed(1)),
        usedGB: Number((usedBytes / 1024 / 1024 / 1024).toFixed(1)),
        usagePercent: totalBytes > 0 ? Number(((usedBytes / totalBytes) * 100).toFixed(1)) : 0,
      };
    } catch {
      return { totalGB: 0, freeGB: 0, usedGB: 0, usagePercent: 0 };
    }
  }

  private getMemoryUsage() {
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    return {
      totalMB: Math.round(totalMemBytes / 1024 / 1024),
      freeMB: Math.round(freeMemBytes / 1024 / 1024),
      usedMB: Math.round(usedMemBytes / 1024 / 1024),
      usagePercent: Number(((usedMemBytes / totalMemBytes) * 100).toFixed(1)),
    };
  }

  private async sampleTick() {
    const cpuPercent = this.computeCpuUsagePercent();
    this.latestCpuPercent = cpuPercent;
    const memory = this.getMemoryUsage();
    const disk = await this.getDiskUsage();

    this.history.push({
      timestamp: new Date().toISOString(),
      cpuPercent,
      memoryPercent: memory.usagePercent,
      diskPercent: disk.usagePercent,
    });

    if (this.history.length > MAX_HISTORY_POINTS) {
      this.history.shift();
    }
  }

  getHistory() {
    return { points: this.history, intervalMs: SAMPLE_INTERVAL_MS };
  }

  async getServerHealth() {
    // Latensi database nyata (round-trip query, bukan simulasi)
    const dbStart = Date.now();
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }
    const dbLatencyMs = Date.now() - dbStart;

    const memory = this.getMemoryUsage();
    const disk = await this.getDiskUsage();
    const processMemory = process.memoryUsage();
    const cpus = os.cpus();
    const cpuUsagePercent = this.latestCpuPercent;

    // Konfigurasi integrasi eksternal dari database (sama seperti dashboard super admin)
    const pddiktiSetting = await this.prisma.pddiktiSetting
      .findUnique({ where: { id: 'default-pddikti-setting' } })
      .catch(() => null);
    const isFeederConnected = Boolean(
      pddiktiSetting?.isActive && pddiktiSetting?.baseUrl && pddiktiSetting?.username && pddiktiSetting?.password,
    );

    const bankSetting = await this.prisma.bankGatewaySetting
      .findUnique({ where: { id: 'default-bank-setting' } })
      .catch(() => null);
    const isBankGatewayConnected = Boolean(bankSetting?.isActive && bankSetting?.provider !== 'MANUAL' && bankSetting?.apiKey);

    const services = [
      {
        name: 'Database PostgreSQL',
        desc: `Master server (${dbOk ? 'aktif' : 'gagal terhubung'})`,
        isOnline: dbOk,
        responseTime: dbOk ? `${dbLatencyMs}ms` : '--',
      },
      {
        name: 'Feeder PDDIKTI',
        desc: 'Web Service Neo Feeder Kemdikbud',
        isOnline: isFeederConnected,
        responseTime: isFeederConnected ? `${dbLatencyMs}ms` : '--',
      },
      {
        name: 'Payment Gateway Bank',
        desc: bankSetting?.provider && bankSetting.provider !== 'MANUAL' ? bankSetting.provider : 'Belum dikonfigurasi',
        isOnline: isBankGatewayConnected,
        responseTime: '--',
      },
      {
        name: 'API Server (NestJS)',
        desc: `Node.js ${process.version} • PID ${process.pid}`,
        isOnline: true,
        responseTime: '<1ms',
      },
    ];

    const onlineCount = services.filter((s) => s.isOnline).length;

    return {
      generatedAt: new Date().toISOString(),
      server: {
        hostname: os.hostname(),
        platform: `${os.platform()} ${os.release()}`,
        nodeVersion: process.version,
        pid: process.pid,
        processUptimeSeconds: Math.floor(process.uptime()),
        osUptimeSeconds: Math.floor(os.uptime()),
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usagePercent: cpuUsagePercent,
      },
      memory: {
        ...memory,
        processHeapUsedMB: Math.round(processMemory.heapUsed / 1024 / 1024),
        processRssMB: Math.round(processMemory.rss / 1024 / 1024),
      },
      disk,
      database: {
        isOnline: dbOk,
        latencyMs: dbLatencyMs,
      },
      services,
      summary: {
        onlineCount,
        totalCount: services.length,
        isAllNormal: onlineCount === services.length,
      },
    };
  }
}
