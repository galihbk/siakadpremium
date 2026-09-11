/**
 * Client-Side File Compression Utility for SIAKAD
 * Mengompresi file Gambar (JPG, PNG, WebP) dan Dokumen PDF secara otomatis
 * sebelum diunggah ke server agar menghemat bandwidth dan kapasitas penyimpanan.
 */

import { PDFDocument } from 'pdf-lib';

export interface ImageCompressOptions {
  /**
   * Batas maksimal lebar atau tinggi gambar dalam piksel.
   * Default: 1600 (cukup tajam untuk cetak/layar HD).
   */
  maxWidthOrHeight?: number;
  /**
   * Kualitas kompresi awal (0.1 - 1.0).
   * Default: 0.8
   */
  initialQuality?: number;
  /**
   * Batas maksimal ukuran file akhir yang ditargetkan dalam byte.
   * Default: 800 * 1024 (800 KB).
   */
  maxSizeBytes?: number;
  /**
   * Format output yang diinginkan: 'image/jpeg' atau 'image/webp'.
   * Default: 'image/jpeg' (paling kompatibel).
   */
  mimeType?: 'image/jpeg' | 'image/webp';
}

export interface PdfCompressOptions {
  /**
   * Batas maksimal ukuran file PDF akhir yang ditargetkan dalam byte.
   * Default: 1.5 * 1024 * 1024 (1.5 MB).
   */
  maxSizeBytes?: number;
}

export interface CompressResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  wasCompressed: boolean;
  previewUrl?: string;
}

/**
 * Format bytes ke format human-readable (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Kompresi Gambar menggunakan HTML5 Canvas API secara efisien
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressOptions = {},
): Promise<File> {
  const {
    maxWidthOrHeight = 1600,
    initialQuality = 0.8,
    maxSizeBytes = 800 * 1024, // 800 KB
    mimeType = 'image/jpeg',
  } = options;

  // Jika ukuran file gambar aslinya sudah di bawah 200KB, tidak perlu dikompres agresif
  if (file.size <= 200 * 1024 && file.type === 'image/jpeg') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Hitung scaling dimensi agar tidak melebihi batas resolusi
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback jika context gagal
        }

        // Gambar latar putih (khusus bila input PNG transparan dikonversi ke JPEG)
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        // Render gambar dengan smoothing tingkat tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = initialQuality;

        const attemptCompression = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // Jika masih di atas batas dan kualitas masih bisa diturunkan
              if (blob.size > maxSizeBytes && quality > 0.4) {
                attemptCompression(quality - 0.15);
                return;
              }

              // Buat nama file baru dengan ekstensi yang sesuai
              let newFileName = file.name;
              if (mimeType === 'image/jpeg' && !newFileName.toLowerCase().endsWith('.jpg') && !newFileName.toLowerCase().endsWith('.jpeg')) {
                newFileName = newFileName.replace(/\.[^/.]+$/, '') + '.jpg';
              } else if (mimeType === 'image/webp' && !newFileName.toLowerCase().endsWith('.webp')) {
                newFileName = newFileName.replace(/\.[^/.]+$/, '') + '.webp';
              }

              const compressedFile = new File([blob], newFileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              // Jika hasil kompresi malah lebih besar dari aslinya, gunakan aslinya
              if (compressedFile.size >= file.size) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            },
            mimeType,
            quality,
          );
        };

        attemptCompression(currentQuality);
      };
    };
  });
}

/**
 * Kompresi & Optimasi Dokumen PDF
 * Menata ulang objek stream, membersihkan metadata berlebih, dan mengompresi struktur PDF.
 */
export async function compressPdfFile(
  file: File,
  options: PdfCompressOptions = {},
): Promise<File> {
  // Jika ukuran PDF sudah di bawah 500KB, tidak perlu kompresi
  if (file.size <= 500 * 1024) {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    // Muat dokumen PDF
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });

    // Bersihkan metadata berlebihan untuk merampingkan ukuran
    pdfDoc.setTitle(file.name.replace(/\.pdf$/i, ''));
    pdfDoc.setAuthor('SIAKAD ITN');
    pdfDoc.setCreator('SIAKAD Document Optimizer');
    pdfDoc.setProducer('SIAKAD ITN System');

    // Simpan ulang dengan object streams compression diaktifkan
    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    // Cek jika ukuran berkurang
    if (optimizedBytes.byteLength < file.size) {
      const compressedFile = new File([optimizedBytes as any], file.name, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });
      return compressedFile;
    }

    return file;
  } catch (err) {
    console.warn('Optimasi PDF internal dilewati atau tidak didukung untuk file ini:', err);
    return file;
  }
}

/**
 * Fungsi Utama: Kompresi File Otomatis Berdasarkan Tipe Berkas (Gambar / PDF)
 */
export async function compressUploadedFile(
  file: File,
  options?: {
    imageOptions?: ImageCompressOptions;
    pdfOptions?: PdfCompressOptions;
  },
): Promise<CompressResult> {
  const originalSize = file.size;

  try {
    let resultFile = file;

    // 1. Jika file adalah Gambar
    if (file.type.startsWith('image/')) {
      resultFile = await compressImageFile(file, options?.imageOptions);
    }
    // 2. Jika file adalah PDF
    else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      resultFile = await compressPdfFile(file, options?.pdfOptions);
    }

    const compressedSize = resultFile.size;
    const wasCompressed = compressedSize < originalSize;
    const savedPercent = wasCompressed
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

    let previewUrl: string | undefined = undefined;
    if (resultFile.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(resultFile);
    }

    return {
      file: resultFile,
      originalSize,
      compressedSize,
      savedPercent,
      wasCompressed,
      previewUrl,
    };
  } catch (err) {
    console.error('Gagal melakukan kompresi file, menggunakan file asli:', err);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      wasCompressed: false,
    };
  }
}

/**
 * Helper untuk mengonversi File ke Base64 Data URL (berguna untuk form input preview atau penyimpanan lokal)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
