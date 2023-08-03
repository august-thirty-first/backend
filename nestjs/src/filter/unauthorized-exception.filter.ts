import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import unauthorizedException from './interface/unauthorized.interface';

@Catch(UnauthorizedException)
export class UnauthorizedExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const result: unauthorizedException = {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'UNAUTHORIZED',
    };
    response
      .clearCookie('access_token')
      .status(HttpStatus.UNAUTHORIZED)
      .json(result);
  }
}
