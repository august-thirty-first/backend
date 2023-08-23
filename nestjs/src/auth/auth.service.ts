import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './entities/User.entity';
import { InjectRepository } from '@nestjs/typeorm';
import JwtPayload from 'src/passports/interface/jwtPayload.interface';
import { JwtService } from '@nestjs/jwt';
import TempJwtPayload from 'src/passports/interface/tempJwtPayload.interface';
import { CreateUserDto } from './dto/userCreate.dto';
import signInToken from './interfaces/signInToken.interface';
import { NormalJwt, TempJwt } from 'src/jwt/interface/jwt.type';
import checkDuplicatedNicknameResponse from './interfaces/checkDuplicatedNicknameResponse.interface';
import * as speakeasy from 'speakeasy';
import { ConnectionService } from 'src/socket/home/connection.service';
import { CryptoService } from './utils/crypto.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(NormalJwt)
    private jwtService: JwtService,
    @Inject(TempJwt)
    private tempJwtService: JwtService,
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private connectionService: ConnectionService,
    private cryptoService: CryptoService,
  ) {}

  async sign(intraName: string): Promise<signInToken> {
    const result: signInToken = {
      token: '',
      redirectUrl: '',
    };
    const user: User = await this.userRepository.findOneBy({
      intra_name: intraName,
    });
    if (user && this.connectionService.findUserConnection(user.id))
      throw new ConflictException();
    if (!user) {
      const payload: TempJwtPayload = { intraName: intraName };
      result.token = this.tempJwtService.sign(payload);
      result.redirectUrl = `http://localhost:4000/signup?intraName=${intraName}`;
    } else if (user.otp_key) {
      const payload: TempJwtPayload = { intraName: intraName };
      result.token = this.tempJwtService.sign(payload);
      result.redirectUrl = `http://localhost:4000/otp`;
    } else {
      const payload: JwtPayload = { id: user.id, nickname: user.nickname };
      result.token = this.jwtService.sign(payload);
      result.redirectUrl = `http://localhost:4000/`;
    }
    return result;
  }

  async checkDuplicatedNickname(
    nickname: string,
  ): Promise<checkDuplicatedNicknameResponse> {
    const result: checkDuplicatedNicknameResponse = { status: false };
    const user = await this.userRepository.findOneBy({ nickname });
    if (!user) result.status = false;
    else result.status = true;
    return result;
  }

  async createUser(createUserDto: CreateUserDto): Promise<string> {
    const date = new Date();
    createUserDto.created_at = date;
    createUserDto.updated_at = date;
    const user: User = await this.userRepository.createUser(createUserDto);
    const payload: JwtPayload = { id: user.id, nickname: user.nickname };
    return this.jwtService.sign(payload);
  }

  async verifyOTP(intraName: string, token: string): Promise<string> {
    const user: User = await this.userRepository.findOneBy({
      intra_name: intraName,
    });
    if (!user.otp_key)
      throw new BadRequestException('OTP 설정을 하지 않았습니다.');
    const decrypt_otp_key = this.cryptoService.decrypt(user.otp_key);
    const verify: boolean = speakeasy.totp.verify({
      secret: decrypt_otp_key,
      encoding: 'base32',
      token: token,
    });
    if (!verify) throw new UnauthorizedException('Token 값을 확인해주세요.');
    const payload: JwtPayload = { id: user.id, nickname: user.nickname };
    const new_token = this.jwtService.sign(payload);
    return new_token;
  }
}
