/**
 * Nomor halaman ringkas untuk pagination: halaman pertama, terakhir, dan sekitar halaman aktif.
 * Celah diberi penanda negatif (-1 di kiri, -2 di kanan) supaya bisa digambar sebagai "…".
 */
export function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => keep.add(p));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => keep.add(p));
  const pages = Array.from(keep)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: number[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) out.push(i < pages.length / 2 ? -1 : -2);
    out.push(p);
  });
  return out;
}
