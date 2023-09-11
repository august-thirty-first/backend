import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class OauthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    let message = 'Oauth 로그인 실패...';
    if (exception instanceof ConflictException)
      message = '이미 로그인 되어 있는 회원입니다.';
    response
      .status(HttpStatus.FOUND)
      .send(
        `<script type="text/javascript">alert('${message}'); window.location.href='${process.env.FRONTEND_URL}/login' </script>`,
      );
  }
}
