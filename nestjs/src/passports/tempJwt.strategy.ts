import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import TempJwtPayload from './interface/tempJwtPayload.interface';

@Injectable()
export class TempJwtStrategy extends PassportStrategy(Strategy, 'temp-jwt') {
  constructor() {
    super({
      jwtFromRequest: TempJwtStrategy.extractJWTFromCookie,
      ignoreExpiration: false,
      secretOrKey: process.env.TEMP_JWT_SECRET,
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    let token = null;
    if (req && req.cookies['access_token']) {
      token = req.cookies['access_token'];
    }
    return token;
  }

  async validate(payload: TempJwtPayload): Promise<TempJwtPayload> {
    return payload;
  }
}
