/**
 * Catatan pembaruan sistem untuk Super Admin (menu "Updates").
 *
 * CARA MENAMBAH PEMBARUAN
 * 1. Tambahkan objek BARU di PALING ATAS larik UPDATES (urutan = terbaru dulu).
 * 2. `id` harus unik dan tidak boleh diubah setelah dirilis (dipakai menandai "sudah dibaca").
 * 3. Deploy. Super Admin otomatis melihat lencana "baru" di menu Updates sampai membukanya.
 */

export type UpdateType = 'Menu Baru' | 'Fitur Baru' | 'Peningkatan' | 'Perbaikan' | 'Keamanan' | 'Infrastruktur';

export interface SystemUpdate {
  id: string;
  version: string;
  /** Periode rilis, mis. "Oktober 2026". */
  period: string;
  type: UpdateType;
  title: string;
  summary: string;
  /** Poin-poin perubahan. */
  items: string[];
  /** Tautan ke menu terkait (bila ada) dan labelnya. */
  link?: { href: string; label: string };
  /** Tindakan yang perlu dilakukan Super Admin / operator server (bila ada). */
  action?: string;
}

/**
 * Sengaja kosong: catatan pembaruan baru mulai diisi setelah sistem dideploy ke pelanggan
 * dan ada pembaruan setelahnya. Isi bawaan (riwayat pengembangan awal) tidak ditampilkan.
 */
export const UPDATES: SystemUpdate[] = [];
