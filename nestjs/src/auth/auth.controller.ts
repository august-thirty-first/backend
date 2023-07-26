import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtPayload } from 'src/passports/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('oauth')
  @UseGuards(AuthGuard('42'))
  async oauth(@Req() req: Request) {
    const user: any = req.user;
    let accessToken;
    // try{
    //   accessToken = await this.authService.sign(user.nickname)
    // } catch {
    //   //회원가입 url로 리다이렉션 임시토큰을 쿠키로 넘겨
    // } else {
    //메인페이지로 리다이렉션 정상토큰을 쿠키로 넘겨
    // }
    // console.log(req.user);
    // console.log(this.tempJwtService.sign({ id: 'test' }));
    //   req.cookies("access_token", )
    //   req.redirect("http://localhost:4000/")
  }
}
