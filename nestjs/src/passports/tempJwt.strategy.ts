import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';

export interface TempJwtPayload {
  username: string;
}

@Injectable()
export class TempJwtStrategy extends PassportStrategy(Strategy, 'temp-jwt') {
  constructor() {
    super({
      jwtFromRequest: TempJwtStrategy.extractJWTFromCookie,
      ignoreExpiration: false,
      secretOrKey: 'test',
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
    const { username } = payload;
    // const user: Auth = await this.authRepository.findOneBy({id});
    // if (!user) {
    //   throw new UnauthorizedException('승인되지 않은...');
    // }
    return payload;
  }
}
