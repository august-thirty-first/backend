import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface JwtPayload {
  id: number;
  nickname: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: JwtStrategy.extractJWTFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    let token = null;
    if (req && req.cookies['access_token']) {
      token = req.cookies['access_token'];
    }
    return token;
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const { id, nickname } = payload;
    // const user: Auth = await this.authRepository.findOneBy({id});
    // if (!user) {
    //   throw new UnauthorizedException('승인되지 않은...');
    // }
    return payload;
  }
}
