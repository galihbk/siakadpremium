import { GradeLetter, PaginatedResult } from '@siakad/types';

// ============================================================================
// COPYRIGHT NOTICE — JANGAN DIHAPUS / JANGAN DIUBAH TANPA IZIN NEXTVERSA
// Satu-satunya sumber teks copyright untuk seluruh aplikasi (portal, web, api).
// Ubah nilainya HANYA di sini agar tetap konsisten di semua permukaan.
// ============================================================================
export const COPYRIGHT_NOTICE = Object.freeze({
  product: 'SIAKAD Premium',
  owner: 'Nextversa',
  year: new Date().getFullYear(),
  url: 'https://nextversa.id',
});

/**
 * Mencetak notifikasi hak cipta ke console browser (client-side).
 * Dipanggil dari root layout tiap aplikasi Next.js (portal & web).
 */
export function printBrowserCopyright(): void {
  // Paket ini dibangun dengan target Node (tanpa lib DOM), jadi `window`/`console`
  // diakses lewat globalThis dengan cast aman alih-alih deklarasi tipe DOM langsung.
  const g = globalThis as { window?: unknown; console?: { log: (...args: unknown[]) => void } };
  if (typeof g.window === 'undefined' || !g.console) return;
  const { product, owner, year, url } = COPYRIGHT_NOTICE;
  g.console.log(
    `%c${product} %c© ${year} ${owner}. All rights reserved.`,
    'font-weight:700;font-size:14px;color:#1E3A8A;',
    'font-size:12px;color:#64748b;',
  );
  g.console.log(
    `%cPerangkat lunak ini dan seluruh kode sumbernya adalah hak cipta ${owner} (${url}). ` +
      'Dilarang menyalin, memodifikasi, menghapus notifikasi ini, atau mendistribusikan ulang tanpa izin tertulis.',
    'font-size:11px;color:#94a3b8;',
  );
}

/**
 * Mencetak notifikasi hak cipta ke console server (Node/Nest) saat aplikasi start.
 */
export function printServerCopyright(): void {
  const { product, owner, year, url } = COPYRIGHT_NOTICE;
  const line1 = `${product} — © ${year} ${owner}. All rights reserved.`;
  const line2 = `${url} — Dilarang menyalin/mendistribusikan ulang tanpa izin tertulis.`;
  const width = Math.max(line1.length, line2.length) + 2;
  const border = '─'.repeat(width);
  const pad = (s: string) => `│ ${s.padEnd(width - 1)}│`;
  const log = (globalThis as { console?: { log: (...args: unknown[]) => void } }).console?.log;
  log?.(`\n┌${border}┐\n${pad(line1)}\n${pad(line2)}\n└${border}┘\n`);
}

/**
 * Format currency into Indonesian Rupiah (IDR)
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date into Indonesian locale string (e.g. "17 Agustus 2026")
 */
export function formatDateIndo(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  };
  return new Intl.DateTimeFormat('id-ID', defaultOptions).format(new Date(date));
}

/**
 * Format semester label (e.g. "Semester Gasal 2026/2027")
 */
export function formatSemesterLabel(academicYear: string, type: 'ODD' | 'EVEN' | 'SHORT'): string {
  const typeMap = {
    ODD: 'Gasal (Ganjil)',
    EVEN: 'Genap',
    SHORT: 'Pendek / Antara',
  };
  return `Semester ${typeMap[type]} TA ${academicYear}`;
}

/**
 * Convert Grade Letter to Grade Point (0.00 - 4.00)
 */
export function gradeLetterToPoint(letter: GradeLetter | string): number {
  switch (letter) {
    case GradeLetter.A:
    case 'A':
      return 4.0;
    case GradeLetter.A_MINUS:
    case 'A-':
      return 3.75;
    case GradeLetter.B_PLUS:
    case 'B+':
      return 3.5;
    case GradeLetter.B:
    case 'B':
      return 3.0;
    case GradeLetter.B_MINUS:
    case 'B-':
      return 2.75;
    case GradeLetter.C_PLUS:
    case 'C+':
      return 2.5;
    case GradeLetter.C:
    case 'C':
      return 2.0;
    case GradeLetter.D:
    case 'D':
      return 1.0;
    case GradeLetter.E:
    case 'E':
    default:
      return 0.0;
  }
}

/**
 * Calculate GPA (Indeks Prestasi Kumulatif)
 */
export function calculateGPA(
  items: { sks: number; gradePoint: number }[],
): { gpa: number; totalSks: number } {
  if (!items || items.length === 0) {
    return { gpa: 0, totalSks: 0 };
  }

  let totalQualityPoints = 0;
  let totalSks = 0;

  for (const item of items) {
    totalQualityPoints += item.sks * item.gradePoint;
    totalSks += item.sks;
  }

  const gpa = totalSks > 0 ? Number((totalQualityPoints / totalSks).toFixed(2)) : 0;
  return { gpa, totalSks };
}

/**
 * Helper to paginate array in-memory
 */
export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 10,
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / safeLimit);
  const startIndex = (safePage - 1) * safeLimit;
  const paginatedItems = items.slice(startIndex, startIndex + safeLimit);

  return {
    items: paginatedItems,
    meta: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
}
