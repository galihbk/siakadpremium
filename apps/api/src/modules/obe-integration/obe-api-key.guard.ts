import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

const digest = (value: string) => createHash('sha256').update(value).digest();

/**
 * Mengamankan endpoint integrasi untuk sistem OBE. Ini BUKAN login pengguna: OBE memanggil
 * dari server ke server dengan header `Authorization: Bearer <OBE_API_KEY>`.
 *
 * - Kunci dibaca dari variabel lingkungan `OBE_API_KEY` (boleh beberapa, dipisah koma, agar kunci
 *   dapat diganti tanpa henti layanan). Tidak pernah disimpan di database atau ditulis ke log.
 * - Bila `OBE_API_KEY` belum diisi, endpoint ditutup sepenuhnya (503), bukan terbuka.
 * - Pembandingan memakai timingSafeEqual atas hash agar tidak bocor lewat waktu respons.
 */
@Injectable()
export class ObeApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const keys = (process.env.OBE_API_KEY ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keys.length === 0) {
      throw new ServiceUnavailableException('Integrasi OBE belum dikonfigurasi (OBE_API_KEY belum diisi).');
    }

    const header: string | undefined = context.switchToHttp().getRequest().headers?.authorization;
    const presented = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!presented) throw new UnauthorizedException('API key tidak ada.');

    const given = digest(presented);
    // Semua kunci diperiksa (tanpa berhenti di yang cocok) agar waktu respons tidak membocorkan urutan.
    let ok = false;
    for (const key of keys) ok = timingSafeEqual(given, digest(key)) || ok;
    if (!ok) throw new UnauthorizedException('API key tidak valid.');
    return true;
  }
}
