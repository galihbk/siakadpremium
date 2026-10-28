/**
 * Saklar fitur tingkat aplikasi.
 *
 * DOCS_ENABLED: menu & halaman Dokumentasi/Panduan Penggunaan (semua peran). Dimatikan selama
 * mode demo; ubah menjadi true lalu deploy ketika sistem masuk mode produksi (real).
 *
 * MOBILE_SUBSCRIPTION_ENABLED: menu & halaman Langganan Mobile App (khusus Super Admin). SEMENTARA: ubah menjadi false lalu
 * deploy untuk menutup menu. Endpoint di server ditutup terpisah lewat MOBILE_SUBSCRIPTION_ENABLED=false di .env API.
 */
export const DOCS_ENABLED = false;

export const MOBILE_SUBSCRIPTION_ENABLED = false;

/** Jalur halaman Langganan Mobile App. */
export const isMobileSubscriptionPath = (href: string) => /\/langganan-mobile$/.test(href);

/** Jalur halaman dokumentasi (dipakai menyaring menu & menutup akses langsung). */
export const isDocsPath = (href: string) => /\/dokumentasi$/.test(href);
