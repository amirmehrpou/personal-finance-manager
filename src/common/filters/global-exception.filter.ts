import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../types/api.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'خطای داخلی سرور';
    let fields: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (status === HttpStatus.UNAUTHORIZED) {
        code = ErrorCode.UNAUTHORIZED;
        message = 'احراز هویت لازم است.';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = ErrorCode.FORBIDDEN;
        message = 'دسترسی مجاز نیست.';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = ErrorCode.RESOURCE_NOT_FOUND;
        message = 'منبع درخواستی یافت نشد.';
      } else if (status === HttpStatus.CONFLICT) {
        code = ErrorCode.RESOURCE_CONFLICT;
        message = exceptionResponse?.message || 'تعارض در داده‌ها.';
      } else if (status === HttpStatus.BAD_REQUEST) {
        code = ErrorCode.VALIDATION_ERROR;
        if (Array.isArray(exceptionResponse?.message)) {
          message = 'اطلاعات واردشده معتبر نیست.';
          fields = this.parseValidationErrors(exceptionResponse.message);
        } else {
          message = exceptionResponse?.message || 'درخواست نامعتبر.';
        }
      } else {
        message = exceptionResponse?.message || message;
        code = exceptionResponse?.code || code;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    const errorBody: any = { error: { code, message } };
    if (fields) errorBody.error.fields = fields;

    response.status(status).json(errorBody);
  }

  private parseValidationErrors(messages: string[]): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const msg of messages) {
      const parts = msg.split(' ');
      if (parts.length > 0) {
        const field = parts[0];
        fields[field] = msg;
      }
    }
    return fields;
  }
}
