import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@siakad/types';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // If data already contains standardized meta
        let resultData = data;
        let meta = undefined;

        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          resultData = data.items;
          meta = data.meta;
        }

        return {
          success: true,
          statusCode,
          message: 'Permintaan berhasil diproses',
          data: resultData,
          meta,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
