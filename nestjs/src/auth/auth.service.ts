import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities/User.entity';
import { InjectRepository } from '@nestjs/typeorm';
import JwtPayload from 'src/passports/interface/jwtPayload.interface';
import { JwtService } from '@nestjs/jwt';
import TempJwtPayload from 'src/passports/interface/tempJwtPayload.interface';
import { CreateUserDto } from './dto/userCreate.dto';
import signInToken from './interfaces/signInToken.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @Inject('TempJwt')
    private tempJwtService: JwtService,
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async sign(intraName: string): Promise<signInToken> {
    const result: signInToken = {
      token: '',
      redirectUrl: '',
    };
    const user: User = await this.userRepository.findOneBy({
      intra_name: intraName,
    });
    if (!user) {
      const payload: TempJwtPayload = { username: intraName };
      result.token = this.tempJwtService.sign(payload);
      result.redirectUrl = `http://10.19.233.2:4000/signup?nickname=${intraName}`;
    } else {
      const payload: JwtPayload = { id: user.id, nickname: user.nickname };
      result.token = this.jwtService.sign(payload);
      result.redirectUrl = `http://10.19.233.2:4000/`;
    }
    return result;
  }

  async checkDuplicatedNickname(nickname: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ nickname });
    if (!user) return { status: false };
    return { status: true };
  }

  async createUser(createUserDto: CreateUserDto): Promise<string> {
    const date = new Date();
    createUserDto.created_at = date;
    createUserDto.updated_at = date;
    const user: User = await this.userRepository.createUser(createUserDto);
    const payload: JwtPayload = { id: user.id, nickname: user.nickname };
    return this.jwtService.sign(payload);
  }
}
