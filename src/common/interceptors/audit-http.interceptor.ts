import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request, Response } from 'express';

/**
 * Global HTTP audit interceptor.
 *
 * Logs every incoming request and its outcome to Winston.
 * Mutating methods (POST / PATCH / PUT / DELETE) are also written
 * to the structured audit log so compliance teams have a full trail
 * of data-changing actions alongside the data-level audit entries.
 *
 * Read operations (GET / HEAD) are logged at debug level only —
 * they do not persist to the audit collection to avoid noise.
 */
@Injectable()
export class AuditHttpInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url, body, ip } = req;
    const user = (req as any).user;
    const userId = user?.userId ?? user?.sub ?? 'anonymous';
    const tenantId = user?.tenantId ?? 'unknown';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        const logEntry = {
          type: 'HTTP_REQUEST',
          method,
          url,
          statusCode,
          duration,
          userId,
          tenantId,
          ip,
        };

        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          // Mutating request — log at info level with body summary
          this.logger.info('AUDIT_HTTP_MUTATE', {
            ...logEntry,
            bodyKeys: body ? Object.keys(body) : [],
          });
        } else {
          // Read request — debug level, no body
          this.logger.debug('AUDIT_HTTP_READ', logEntry);
        }
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.logger.warn('AUDIT_HTTP_ERROR', {
          type: 'HTTP_ERROR',
          method,
          url,
          duration,
          userId,
          tenantId,
          ip,
          errorMessage: err?.message,
          statusCode: err?.status ?? 500,
        });
        return throwError(() => err);
      }),
    );
  }
}
