import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class OauthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    response
      .status(HttpStatus.FOUND)
      .send(
        `<script type="text/javascript">alert('Oauth 로그인 실패..'); window.location.href='http://localhost:4000/login' </script>`,
      );
  }
}
