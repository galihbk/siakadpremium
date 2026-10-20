import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard yang menghitung per ALAMAT KLIEN SUNGGUHAN. Di produksi API berada di belakang
 * Cloudflare + proxy Next.js, sehingga `req.ip` selalu alamat proxy yang sama; tanpa ini seluruh
 * pengunjung berbagi satu jatah (login 10/menit, chat 5/jam, dst.) dan saling memblokir.
 */
@Injectable()
export class ProxyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const cf = req.headers?.['cf-connecting-ip'];
    if (typeof cf === 'string' && cf) return cf.trim();
    const xff = req.headers?.['x-forwarded-for'];
    const first = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
    return first || req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
