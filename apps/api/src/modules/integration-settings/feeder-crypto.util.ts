import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Enkripsi at-rest (AES-256-GCM) untuk kredensial Neo Feeder (password/secretKey) yang
 * disimpan di `PddiktiSetting`. Kunci diturunkan dari JWT_SECRET (sudah wajib ada di setiap
 * deployment dan sudah diperlakukan sebagai rahasia server) lewat scrypt dengan salt & info
 * tetap, supaya kunci enkripsi ini berbeda dari kunci JWT itu sendiri dan tidak perlu
 * menambah variabel environment baru.
 *
 * Format tersimpan: `enc:v1:<iv base64>:<authTag base64>:<ciphertext base64>`.
 * Nilai lama (dibuat sebelum hardening ini) tidak berprefiks `enc:v1:` -- dianggap plaintext
 * dan akan dienkripsi ulang otomatis saat pertama kali dibaca lewat `getFeederCredentials()`.
 */
const PREFIX = 'enc:v1:';

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Tidak melempar error keras di sini (akan meledakkan modul lain yang tidak terkait saat
    // boot), tapi ini kondisi yang harus diperbaiki sebelum produksi menyimpan kredensial baru.
    throw new Error(
      'JWT_SECRET belum diset -- diperlukan untuk mengenkripsi kredensial Web Service Neo Feeder. Set JWT_SECRET di .env sebelum menyimpan Pengaturan DIKTI.',
    );
  }
  cachedKey = scryptSync(secret, 'siakad-feeder-credential-v1', 32);
  return cachedKey;
}

export function isEncryptedFeederValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encryptFeederValue(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

/** Mendekripsi nilai berprefiks `enc:v1:`; nilai tanpa prefiks (data lama) dikembalikan apa adanya. */
export function decryptFeederValue(stored: string): string {
  if (!isEncryptedFeederValue(stored)) return stored;
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Format kredensial Feeder tersimpan tidak valid.');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return plain.toString('utf8');
}
