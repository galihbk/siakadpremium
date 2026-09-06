import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    try {
      this.client = new Redis({
        host,
        port,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying if redis is not running
          }
          return Math.min(times * 500, 2000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`🚀 Terhubung ke Redis pada ${host}:${port}`);
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`⚠️ Redis belum aktif pada ${host}:${port}: ${err.message}`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
      });
    } catch (err: any) {
      this.logger.warn(`⚠️ Inisialisasi Redis dilewati: ${err.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      // Graceful fallback
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // Graceful fallback
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
