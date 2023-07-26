import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities/User.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload } from 'src/passports/jwt.strategy';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('TempJwt')
    private tempJwtService: JwtService,
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async sign(intra_name: string): Promise<string> {
    const user: User = await this.userRepository.findOneBy({ intra_name });
    if (!user) throw new UnauthorizedException();
    const payload: JwtPayload = { id: user.id, nickname: user.nickname };
    const accessToken: string = await this.jwtService.sign(payload);
    return accessToken;
  }
}
