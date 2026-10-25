/** Alamat halaman validasi dokumen (tujuan kode QR). Jenis: surat (kode = nomor tiket), ktm (NIM), pmb (nomor registrasi). */
export function verifyUrl(type: 'surat' | 'ktm' | 'pmb', code: string, base?: string): string {
  const origin = (base || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${origin}/verifikasi?type=${type}&code=${encodeURIComponent(code)}`;
}
