import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import {
  StorageDriver,
  UploadOptions,
  UploadResult,
  Base64UploadOptions,
} from './storage.interface';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private driver: StorageDriver = 'local';
  private s3Client: S3Client | null = null;
  private uploadPath: string = './uploads';
  private maxFileSize: number = 10 * 1024 * 1024; // Maksimal 10MB
  private r2BucketName: string = '';
  private r2PublicUrl: string = '';
  private jwtSecret: string = 'siakad_premium_default_secret_key';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rawStorage = (
      this.configService.get<string>('STORAGE') ||
      process.env.STORAGE ||
      'local'
    )
      .toLowerCase()
      .trim();

    this.driver = rawStorage === 'cloud' ? 'cloud' : 'local';
    this.uploadPath =
      this.configService.get<string>('UPLOAD_PATH') ||
      process.env.UPLOAD_PATH ||
      './uploads';

    this.jwtSecret =
      this.configService.get<string>('JWT_SECRET') ||
      process.env.JWT_SECRET ||
      'siakad_premium_default_secret_key';

    const maxFileSizeConfig =
      this.configService.get<string>('MAX_FILE_SIZE') ||
      process.env.MAX_FILE_SIZE;
    if (maxFileSizeConfig) {
      const parsed = parseInt(String(maxFileSizeConfig).split('#')[0].trim(), 10);
      this.maxFileSize = !isNaN(parsed) && parsed > 0 ? parsed : 10 * 1024 * 1024;
    } else {
      this.maxFileSize = 10 * 1024 * 1024; // 10MB
    }

    if (this.driver === 'cloud') {
      const accountId =
        this.configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID') ||
        process.env.CLOUDFLARE_R2_ACCOUNT_ID;
      const accessKeyId =
        this.configService.get<string>('CLOUDFLARE_R2_ACCESS_KEY_ID') ||
        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
      const secretAccessKey =
        this.configService.get<string>('CLOUDFLARE_R2_SECRET_ACCESS_KEY') ||
        process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
      this.r2BucketName =
        this.configService.get<string>('CLOUDFLARE_R2_BUCKET_NAME') ||
        process.env.CLOUDFLARE_R2_BUCKET_NAME ||
        '';
      this.r2PublicUrl = (
        this.configService.get<string>('CLOUDFLARE_R2_PUBLIC_URL') ||
        process.env.CLOUDFLARE_R2_PUBLIC_URL ||
        ''
      ).replace(/\/+$/, '');

      if (!accountId || !accessKeyId || !secretAccessKey) {
        this.logger.warn(
          '⚠️ STORAGE di-set ke "cloud" (Cloudflare R2), tetapi kredensial CLOUDFLARE_R2_* belum lengkap. Upload cloud akan fallback ke local atau memicu peringatan.',
        );
      } else {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.logger.log(
          `☁️ Storage initialized: Cloudflare R2 (Bucket: ${this.r2BucketName || 'not-set'}) [PRIVATE MODE]`,
        );
      }
    } else {
      // Pastikan direktori lokal ada (khususnya subfolder private)
      const absUploadPath = path.isAbsolute(this.uploadPath)
        ? this.uploadPath
        : path.join(process.cwd(), this.uploadPath);

      const privatePath = path.join(absUploadPath, 'private');
      if (!fs.existsSync(privatePath)) {
        fs.mkdirSync(privatePath, { recursive: true });
      }
      this.logger.log(
        `📁 Storage initialized: Local Server Disk (${absUploadPath}) [PRIVATE MODE: ${privatePath}]`,
      );
    }
  }

  /**
   * Mendapatkan driver storage aktif saat ini ('local' | 'cloud')
   */
  getActiveDriver(): StorageDriver {
    return this.driver;
  }

  /**
   * Mendapatkan status konfigurasi storage untuk info sistem / diagnostik
   */
  getStorageInfo() {
    return {
      driver: this.driver,
      uploadPath: this.uploadPath,
      maxFileSize: this.maxFileSize,
      maxFileSizeMb: `${(this.maxFileSize / (1024 * 1024)).toFixed(1)} MB`,
      compressionEnabled: true,
      privateStorage: true,
      cloudConfigured: !!(this.s3Client && this.r2BucketName),
      r2Bucket: this.r2BucketName || null,
    };
  }

  /**
   * Validasi MIME Type dan Ekstensi Berkas
   */
  private validateMimeAndExt(mimeType: string, originalName: string): string {
    const allowedMimes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };

    let ext = allowedMimes[mimeType.toLowerCase()];
    if (!ext) {
      const detectedExt = path.extname(originalName).replace('.', '').toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(detectedExt)) {
        ext = detectedExt === 'jpeg' ? 'jpg' : detectedExt;
      } else {
        throw new BadRequestException(
          `Format file '${mimeType}' tidak didukung. Format yang diizinkan: JPG, PNG, WEBP, PDF.`,
        );
      }
    }
    return ext;
  }

  /**
   * Membuat nama file unik anti-collision
   */
  private generateSafeFileName(originalName: string, ext: string): string {
    const rawBase = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueId = crypto.randomBytes(6).toString('hex');
    const timestamp = Date.now();
    return `${rawBase || 'file'}_${timestamp}_${uniqueId}.${ext}`;
  }

  /**
   * Kompresi otomatis gambar (JPEG, PNG, WEBP) agar hemat penyimpanan dan cepat dimuat
   */
  private async compressImage(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    ext: string;
    wasCompressed: boolean;
    originalSize: number;
    compressedSize: number;
  }> {
    const originalSize = buffer.length;
    const isImage = mimeType.startsWith('image/');

    // Berkas non-gambar (misal PDF) tidak dikompresi oleh sharp
    if (!isImage) {
      return {
        buffer,
        mimeType,
        ext: this.validateMimeAndExt(mimeType, originalName),
        wasCompressed: false,
        originalSize,
        compressedSize: originalSize,
      };
    }

    try {
      const sharpInstance = sharp(buffer, { failOn: 'none' })
        .rotate()
        .resize({
          width: 1920,
          height: 1920,
          fit: 'inside',
          withoutEnlargement: true,
        });

      let compressedBuffer: Buffer;
      let finalMime = mimeType;
      let finalExt = this.validateMimeAndExt(mimeType, originalName);

      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        compressedBuffer = await sharpInstance
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        finalMime = 'image/jpeg';
        finalExt = 'jpg';
      } else if (mimeType === 'image/png') {
        compressedBuffer = await sharpInstance
          .png({ quality: 80, compressionLevel: 8 })
          .toBuffer();
        finalMime = 'image/png';
        finalExt = 'png';
      } else if (mimeType === 'image/webp') {
        compressedBuffer = await sharpInstance
          .webp({ quality: 80 })
          .toBuffer();
        finalMime = 'image/webp';
        finalExt = 'webp';
      } else {
        compressedBuffer = await sharpInstance
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        finalMime = 'image/jpeg';
        finalExt = 'jpg';
      }

      if (compressedBuffer.length < originalSize) {
        const savedPercent = (
          ((originalSize - compressedBuffer.length) / originalSize) *
          100
        ).toFixed(1);
        const origKb = (originalSize / 1024).toFixed(0);
        const compKb = (compressedBuffer.length / 1024).toFixed(0);

        this.logger.log(
          `🗜️ [Image Compressed] ${originalName}: ${origKb} KB -> ${compKb} KB (Hemat ${savedPercent}%)`,
        );

        return {
          buffer: compressedBuffer,
          mimeType: finalMime,
          ext: finalExt,
          wasCompressed: true,
          originalSize,
          compressedSize: compressedBuffer.length,
        };
      }
    } catch (err: any) {
      this.logger.warn(
        `Gagal melakukan kompresi gambar ${originalName}: ${err.message}. Menyimpan berkas asli.`,
      );
    }

    return {
      buffer,
      mimeType,
      ext: this.validateMimeAndExt(mimeType, originalName),
      wasCompressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  }

  /**
   * Pembuatan tanda tangan HMAC-SHA256 untuk Signed URL Private
   */
  createSignature(key: string, expires: number): string {
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${key}:${expires}`)
      .digest('hex');
  }

  /**
   * Verifikasi keabsahan HMAC Signature dan kedaluwarsa waktu
   */
  verifySignature(key: string, expires: number, signature: string): boolean {
    if (!key || !expires || !signature) return false;

    // Cek batas kedaluwarsa (berikan grace period 1 hari)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp > expires + 86400) {
      return false; // Expired
    }

    const cleanKey = key.replace(/^\/+/, '');
    const expectedClean = this.createSignature(cleanKey, expires);
    const expectedRaw = this.createSignature(key, expires);

    if (expectedClean === signature || expectedRaw === signature) {
      return true;
    }

    try {
      if (expectedClean.length === signature.length && crypto.timingSafeEqual(Buffer.from(expectedClean, 'hex'), Buffer.from(signature, 'hex'))) {
        return true;
      }
      if (expectedRaw.length === signature.length && crypto.timingSafeEqual(Buffer.from(expectedRaw, 'hex'), Buffer.from(signature, 'hex'))) {
        return true;
      }
    } catch {
      // Ignore
    }

    return false;
  }

  /**
   * Generate Signed URL aman untuk berkas privat
   * Berlaku selama expiresInSeconds (default 2 jam = 7200 detik)
   */
  generateSignedUrl(
    key: string,
    expiresInSeconds: number = 7200,
    download: boolean = false,
  ): string {
    const apiUrl = (
      this.configService.get<string>('API_URL') ||
      process.env.API_URL ||
      'http://localhost:3001'
    ).replace(/\/+$/, '');

    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const cleanKey = key.replace(/^\/+/, '');
    const sig = this.createSignature(cleanKey, expires);

    let url = `${apiUrl}/api/v1/storage/private?key=${encodeURIComponent(cleanKey)}&expires=${expires}&sig=${sig}`;
    if (download) {
      url += '&download=1';
    }
    return url;
  }

  /**
   * Upload berkas Buffer (Multipart File)
   * Secara default disimpan di FOLDER PRIVATE, terlindungi dari akses publik langsung.
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const {
      buffer,
      originalName,
      mimeType,
      folder = 'documents',
      isPrivate = true,
    } = options;

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Buffer file kosong.');
    }

    if (buffer.length > this.maxFileSize) {
      const maxMb = (this.maxFileSize / (1024 * 1024)).toFixed(0);
      throw new BadRequestException(
        `Ukuran file (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) melebihi batas maksimum ${maxMb} MB.`,
      );
    }

    // Kompresi gambar otomatis
    const compression = await this.compressImage(buffer, mimeType, originalName);
    const finalBuffer = compression.buffer;
    const finalMime = compression.mimeType;
    const ext = compression.ext;

    const rawFolder = folder.replace(/[^a-zA-Z0-9_\-/]/g, '').replace(/^\/+|\/+$/g, '');
    const fileName = this.generateSafeFileName(originalName, ext);

    // Pemisahan folder: Private diletakkan di prefix "private/"
    const targetFolder = isPrivate
      ? rawFolder.startsWith('private')
        ? rawFolder
        : `private/${rawFolder}`
      : rawFolder.startsWith('public')
      ? rawFolder
      : `public/${rawFolder}`;

    const key = targetFolder ? `${targetFolder}/${fileName}` : fileName;

    const savingsRatio = compression.wasCompressed
      ? `${(((compression.originalSize - finalBuffer.length) / compression.originalSize) * 100).toFixed(1)}%`
      : undefined;

    // 1. CLOUD STORAGE (Cloudflare R2 via S3 Client - PRIVATE BUCKET)
    if (this.driver === 'cloud' && this.s3Client && this.r2BucketName) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.r2BucketName,
          Key: key,
          Body: finalBuffer,
          ContentType: finalMime,
        });

        await this.s3Client.send(command);

        // Jika private, generate signed URL aplikasi
        const publicOrSignedUrl = isPrivate
          ? this.generateSignedUrl(key)
          : this.r2PublicUrl
          ? `${this.r2PublicUrl}/${key}`
          : `https://${this.r2BucketName}.r2.cloudflarestorage.com/${key}`;

        this.logger.log(
          `[Cloudflare R2 Upload Success] Key: ${key} (Private: ${isPrivate})`,
        );

        return {
          url: publicOrSignedUrl,
          key,
          fileName,
          originalName,
          mimeType: finalMime,
          size: finalBuffer.length,
          originalSize: compression.originalSize,
          isCompressed: compression.wasCompressed,
          savingsRatio,
          isPrivate,
          driver: 'cloud',
        };
      } catch (err: any) {
        this.logger.error(`Gagal upload ke Cloudflare R2: ${err.message}`, err.stack);
        throw new InternalServerErrorException(
          `Gagal mengunggah berkas ke Cloudflare R2: ${err.message}`,
        );
      }
    }

    // 2. LOCAL STORAGE (Server Filesystem - PRIVATE DIRECTORY)
    try {
      const targetDir = path.isAbsolute(this.uploadPath)
        ? path.join(this.uploadPath, targetFolder)
        : path.join(process.cwd(), this.uploadPath, targetFolder);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      await fs.promises.writeFile(filePath, finalBuffer);

      // Jika berkas private, akses HANYA via Signed URL privat
      const accessUrl = isPrivate
        ? this.generateSignedUrl(key)
        : `${(this.configService.get<string>('API_URL') || process.env.API_URL || 'http://localhost:3001').replace(/\/+$/, '')}/uploads/${targetFolder}/${fileName}`;

      this.logger.log(
        `[Local Disk Upload Success] Path: ${filePath} (Private: ${isPrivate})`,
      );

      return {
        url: accessUrl,
        key,
        fileName,
        originalName,
        mimeType: finalMime,
        size: finalBuffer.length,
        originalSize: compression.originalSize,
        isCompressed: compression.wasCompressed,
        savingsRatio,
        isPrivate,
        driver: 'local',
      };
    } catch (err: any) {
      this.logger.error(`Gagal menyimpan berkas ke Local Server: ${err.message}`, err.stack);
      throw new InternalServerErrorException(
        `Gagal menyimpan berkas ke penyimpanan server lokal: ${err.message}`,
      );
    }
  }

  /**
   * Upload berkas dari Base64 Data URI (secara default Private)
   */
  async uploadBase64(options: Base64UploadOptions): Promise<UploadResult> {
    const {
      base64Data,
      folder = 'documents',
      fileName = 'upload',
      isPrivate = true,
    } = options;

    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Data Base64 tidak valid.');
    }

    if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
      return {
        url: base64Data,
        key: base64Data,
        fileName: path.basename(base64Data),
        originalName: fileName,
        mimeType: 'application/octet-stream',
        size: 0,
        originalSize: 0,
        isCompressed: false,
        isPrivate,
        driver: this.driver,
      };
    }

    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);

    let mimeType = 'image/jpeg';
    let base64Body = base64Data;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Body = matches[2];
    }

    const buffer = Buffer.from(base64Body, 'base64');
    const originalName = fileName.includes('.') ? fileName : `${fileName}.jpg`;

    return this.uploadFile({
      buffer,
      originalName,
      mimeType,
      folder,
      isPrivate,
    });
  }

  /**
   * Streaming Berkas Privat ke Response HTTP (Hanya untuk request terotentikasi / valid signature)
   */
  async streamPrivateFile(
    key: string,
    res: Response,
    download: boolean = false,
  ): Promise<void> {
    const cleanKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
    if (cleanKey.includes('..')) {
      throw new ForbiddenException('Akses path berkas tidak diizinkan.');
    }

    const fileName = path.basename(cleanKey);
    const ext = path.extname(cleanKey).replace('.', '').toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // 1. CLOUD STORAGE (Cloudflare R2 GetObject)
    if (this.driver === 'cloud' && this.s3Client && this.r2BucketName) {
      try {
        const s3Response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.r2BucketName,
            Key: cleanKey,
          }),
        );

        if (!s3Response.Body) {
          throw new NotFoundException('Berkas tidak ditemukan di Cloud Storage.');
        }

        res.set({
          'Content-Type': s3Response.ContentType || mimeType,
          'Content-Length': s3Response.ContentLength?.toString(),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-transform, max-age=7200',
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`,
        });

        const stream = s3Response.Body as Readable;
        stream.pipe(res);
        return;
      } catch (err: any) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
          throw new NotFoundException('Berkas tidak ditemukan.');
        }
        throw new InternalServerErrorException(
          `Gagal membaca berkas dari Cloud Storage: ${err.message}`,
        );
      }
    }

    // 2. LOCAL STORAGE (Server Filesystem)
    const absUploadPath = path.isAbsolute(this.uploadPath)
      ? this.uploadPath
      : path.join(process.cwd(), this.uploadPath);

    const filePath = path.join(absUploadPath, cleanKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Berkas tidak ditemukan di penyimpanan server.');
    }

    const stat = fs.statSync(filePath);

    res.set({
      'Content-Type': mimeType,
      'Content-Length': stat.size.toString(),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-transform, max-age=7200',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(fileName)}"`,
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  }

  /**
   * Hapus Berkas dari Storage (Local atau Cloudflare R2)
   */
  async deleteFile(fileUrlOrKey: string): Promise<boolean> {
    if (!fileUrlOrKey) return false;

    try {
      let key = fileUrlOrKey;
      if (fileUrlOrKey.startsWith('http')) {
        try {
          const urlObj = new URL(fileUrlOrKey);
          // Ekstrak parameter 'key' jika merupakan signed URL
          if (urlObj.searchParams.has('key')) {
            key = urlObj.searchParams.get('key') || '';
          } else {
            key = urlObj.pathname.replace(/^\/?uploads\//, '');
          }
        } catch {
          key = fileUrlOrKey;
        }
      }

      if (!key) return false;

      if (this.driver === 'cloud' && this.s3Client && this.r2BucketName) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.r2BucketName,
            Key: key,
          }),
        );
        this.logger.log(`[Cloudflare R2 Delete Success] Key: ${key}`);
        return true;
      } else {
        const absPath = path.isAbsolute(this.uploadPath)
          ? path.join(this.uploadPath, key)
          : path.join(process.cwd(), this.uploadPath, key);

        if (fs.existsSync(absPath)) {
          await fs.promises.unlink(absPath);
          this.logger.log(`[Local Disk Delete Success] Path: ${absPath}`);
          return true;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Gagal menghapus berkas '${fileUrlOrKey}': ${err.message}`);
    }

    return false;
  }
}
