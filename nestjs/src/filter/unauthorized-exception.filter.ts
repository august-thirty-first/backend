import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    if (exception.message === 'Unauthorized') {
      response.clearCookie('access_token');
      exception.message = 'UNAUTHORIZED';
    }
    response.status(HttpStatus.UNAUTHORIZED).json(exception.getResponse());
  }
}
