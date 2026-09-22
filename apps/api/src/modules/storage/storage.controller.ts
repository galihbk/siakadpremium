import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Query,
  Headers,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { StorageService } from './storage.service';

@ApiTags('Storage & File Management')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('info')
  @ApiOperation({ summary: 'Informasi konfigurasi storage (Local vs Cloudflare R2)' })
  getStorageInfo() {
    return {
      success: true,
      data: this.storageService.getStorageInfo(),
    };
  }

  @Get('private')
  @ApiOperation({
    summary: 'Akses berkas privat (Hanya via HMAC Signed URL atau JWT Session resmi aplikasi)',
  })
  async getPrivateFile(
    @Query('key') key: string,
    @Query('expires') expiresStr: string,
    @Query('sig') sig: string,
    @Query('token') tokenQuery: string,
    @Query('download') download: string,
    @Headers('authorization') authHeader: string,
    @Res() res: Response,
  ) {
    if (!key) {
      throw new BadRequestException('Parameter "key" berkas wajib disertakan.');
    }

    let isAuthorized = false;

    // 1. Verifikasi tanda tangan digital HMAC-SHA256 (Signed URL aplikasi)
    if (expiresStr && sig) {
      const expires = parseInt(expiresStr, 10);
      if (!isNaN(expires) && this.storageService.verifySignature(key, expires, sig)) {
        isAuthorized = true;
      }
    }

    // 2. Verifikasi via Bearer JWT Auth header atau Query Token
    const authToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.substring(7)
      : tokenQuery;

    if (!isAuthorized && authToken) {
      try {
        const payload = this.jwtService.verify(authToken);
        if (payload && (payload.id || payload.sub || payload.email)) {
          isAuthorized = true;
        }
      } catch {
        // Token tidak valid
      }
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'Akses ditolak. Berkas bersifat privat dan hanya dapat diakses melalui aplikasi resmi SIAKAD dengan tanda tangan digital sah atau login resmi.',
      );
    }

    const isDownload = download === '1' || download === 'true';
    await this.storageService.streamPrivateFile(key, res, isDownload);
  }

  @Post('sign-url')
  @ApiOperation({ summary: 'Generate Signed URL baru untuk berkas privat' })
  async createSignedUrl(
    @Body() body: { key: string; expiresInSeconds?: number; download?: boolean },
  ) {
    if (!body?.key) {
      throw new BadRequestException('Parameter "key" wajib diisi.');
    }

    const url = this.storageService.generateSignedUrl(
      body.key,
      body.expiresInSeconds || 7200,
      body.download || false,
    );

    return {
      success: true,
      data: {
        key: body.key,
        signedUrl: url,
        expiresInSeconds: body.expiresInSeconds || 7200,
      },
    };
  }

  @Post('upload')
  @ApiOperation({ summary: 'Unggah berkas tunggal privat (Multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Berkas dokumen atau gambar (JPG, PNG, WEBP, PDF)',
        },
        folder: {
          type: 'string',
          description: 'Subdirektori tujuan (misal: pmb-docs, payments, profiles)',
          example: 'pmb-docs',
        },
        isPrivate: {
          type: 'boolean',
          description: 'Simpan sebagai berkas privat (default: true)',
          default: true,
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // Maksimal 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') queryFolder?: string,
    @Body('folder') bodyFolder?: string,
    @Body('isPrivate') isPrivateBody?: string | boolean,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan dalam request.');
    }

    const folder = queryFolder || bodyFolder || 'documents';
    const isPrivate = isPrivateBody !== 'false' && isPrivateBody !== false;

    const result = await this.storageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder,
      isPrivate,
    });

    return {
      success: true,
      message: `Berkas berhasil diunggah menggunakan storage [${result.driver.toUpperCase()}] (Privat: ${result.isPrivate ? 'Ya' : 'Tidak'}).`,
      data: result,
    };
  }

  @Post('upload-base64')
  @ApiOperation({ summary: 'Unggah berkas privat via Base64 Data URI' })
  async uploadBase64(
    @Body()
    body: {
      base64: string;
      folder?: string;
      fileName?: string;
      isPrivate?: boolean;
    },
  ) {
    if (!body?.base64) {
      throw new BadRequestException('Field base64 wajib diisi.');
    }

    const isPrivate = body.isPrivate !== false;

    const result = await this.storageService.uploadBase64({
      base64Data: body.base64,
      folder: body.folder || 'documents',
      fileName: body.fileName || 'upload',
      isPrivate,
    });

    return {
      success: true,
      message: `Berkas base64 berhasil diunggah menggunakan storage [${result.driver.toUpperCase()}] (Privat: ${result.isPrivate ? 'Ya' : 'Tidak'}).`,
      data: result,
    };
  }
}
