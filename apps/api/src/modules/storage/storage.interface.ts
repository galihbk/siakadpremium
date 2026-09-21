export type StorageDriver = 'local' | 'cloud';

export interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  originalSize?: number;
  isCompressed?: boolean;
  savingsRatio?: string;
  isPrivate?: boolean;
  driver: StorageDriver;
}

export interface UploadOptions {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
  isPrivate?: boolean;
}

export interface Base64UploadOptions {
  base64Data: string;
  folder?: string;
  fileName?: string;
  isPrivate?: boolean;
}

export interface SignedUrlOptions {
  key: string;
  expiresInSeconds?: number;
  download?: boolean;
}

export interface StorageConfig {
  driver: StorageDriver;
  uploadPath: string;
  maxFileSize: number;
  r2?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucketName?: string;
    publicUrl?: string;
  };
}
