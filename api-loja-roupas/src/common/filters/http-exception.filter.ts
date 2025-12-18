import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();

    // Normaliza response para objeto, preservando campos extras (ex: code, details)
    const base =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as Record<string, any>);

    let payload: Record<string, any> = { ...base, statusCode: status };

    // Se for erro de validação (ValidationPipe), padroniza para message + errors[]
    if (status === HttpStatus.BAD_REQUEST) {
      // 1) payload já vem como { message: 'Erro de validação', errors: [...] }
      if (Array.isArray(payload.errors)) {
        // se errors está vazio, não force "Erro de validação" no frontend
        if (payload.errors.length === 0) {
          delete payload.errors;
        } else {
          payload.message = payload.message || 'Erro de validação';
        }
      }
      // 2) payload vem como { message: [ ... ] } (class-validator default)
      else if (Array.isArray(payload.message)) {
        payload = {
          statusCode: status,
          message: 'Erro de validação',
          errors: payload.message,
          ...('code' in base ? { code: base.code } : {}),
          ...('details' in base ? { details: base.details } : {}),
        };
      }
      // 3) BadRequestException com message string: mantém message e NÃO cria errors vazio
      else {
        if (payload.errors && Array.isArray(payload.errors) && payload.errors.length === 0) {
          delete payload.errors;
        }
      }
    }

    response.status(status).json({
      ...payload,
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}


