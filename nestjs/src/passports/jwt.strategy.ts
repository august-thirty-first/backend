import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import JwtPayload from './interface/jwtPayload.interface';
import { UserRepository } from 'src/auth/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {
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
    const user: User = await this.userRepository.findOneBy({ id });
    if (!user) throw new UnauthorizedException();
    return payload;
  }
}
