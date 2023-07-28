import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy } from 'passport-42';
import JwtPayload from './interface/jwtPayload.interface';

@Injectable()
export class FortyTwoStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      clientID: process.env.FORTYTWO_APP_ID,
      clientSecret: process.env.FORTYTWO_APP_SECRET,
      callbackURL: process.env.FORTYTWO_REDIRECT_URI,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<JwtPayload> {
    const payload: JwtPayload = {
      id: profile.id,
      nickname: profile.username,
    };
    return payload;
  }
}
