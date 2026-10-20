import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Terjadi kesalahan pada server internal';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        errorDetails = (res as any).error || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    // Terlalu banyak permintaan (rate limit): beri tahu pengguna berapa lama harus menunggu.
    let retryAfter: number | undefined;
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      const header = Number(response.getHeader('Retry-After'));
      retryAfter = Number.isFinite(header) && header > 0 ? Math.ceil(header) : undefined;
      const wait = retryAfter
        ? retryAfter < 60
          ? `${retryAfter} detik`
          : `${Math.ceil(retryAfter / 60)} menit`
        : 'beberapa saat';
      message = `Terlalu banyak percobaan. Silakan coba lagi dalam ${wait}.`;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      ...(retryAfter ? { retryAfter } : {}),
      error: errorDetails,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
