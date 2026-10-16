/**
 * Saklar fitur tingkat aplikasi.
 *
 * DOCS_ENABLED: menu & halaman Dokumentasi/Panduan Penggunaan (semua peran). Dimatikan selama
 * mode demo; ubah menjadi true lalu deploy ketika sistem masuk mode produksi (real).
 */
export const DOCS_ENABLED = false;

/** Jalur halaman dokumentasi (dipakai menyaring menu & menutup akses langsung). */
export const isDocsPath = (href: string) => /\/dokumentasi$/.test(href);
