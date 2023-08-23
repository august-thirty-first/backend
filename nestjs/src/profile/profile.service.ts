import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { User } from 'src/auth/entities/User.entity';
import checkDuplicatedNicknameResponse from 'src/auth/interfaces/checkDuplicatedNicknameResponse.interface';
import { UserRepository } from 'src/auth/user.repository';
import {
  FriendRequesting,
  RequestStatus,
} from 'src/friend/entities/FriendRequesting.entity';
import { FriendRequestingRepository } from 'src/friend/friendRequesting.repository';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import JwtPayload from 'src/passports/interface/jwtPayload.interface';
import MyInfoDto from './dto/myInfo.dto';
import SearchUserDto, { FriendRequestStatus } from './dto/searchUser.dto';
import { UpdateUserDto } from './dto/userUpdate.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(FriendRequestingRepository)
    private friendRequestingRepository: FriendRequestingRepository,
    @Inject(NormalJwt)
    private jwtService: JwtService,
  ) {}

  async myInfo(id: number): Promise<MyInfoDto> {
    const user: User = await this.userRepository.findOneBy({ id });
    const profile: MyInfoDto = plainToClass(MyInfoDto, user, {
      strategy: 'excludeAll',
    });
    return profile;
  }

  async getFriendStatus(
    my_id: number,
    target_id: number,
  ): Promise<FriendRequestStatus> {
    let result: FriendRequestStatus = null;
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findPrevRequest(my_id, target_id);

    switch (prev_request?.status) {
      case RequestStatus.Allow:
        result = FriendRequestStatus.Allow;
        break;
      case RequestStatus.Requesting:
        if (prev_request.to_user_id.id === my_id)
          result = FriendRequestStatus.RecvRequest;
        else result = FriendRequestStatus.SendRequest;
        break;
    }
    return result;
  }

  async searchByUserProfile(
    my_id: number,
    nickname: string,
  ): Promise<SearchUserDto | null> {
    const profile: User | null = await this.userRepository.findOneBy({
      nickname,
    });
    if (!profile) return null;
    const result = plainToClass(SearchUserDto, profile, {
      strategy: 'excludeAll',
    });
    result.friend_status = await this.getFriendStatus(my_id, profile.id);
    return result;
  }

  async searchByUserNickname(nickname: string): Promise<SearchUserDto | null> {
    const profile: User = await this.userRepository.findOneBy({
      nickname,
    });
    let result: SearchUserDto = null;
    if (profile)
      result = plainToClass(SearchUserDto, profile, { strategy: 'excludeAll' });
    return result;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<string> {
    const user: User = await this.userRepository.findOneBy({ id });
    const prev_image: string = user.avata_path
      ? join(__dirname, '../../', user.avata_path)
      : null;
    if (updateUserDto.nickname) user.nickname = updateUserDto.nickname;
    if (updateUserDto.avata_path) user.avata_path = updateUserDto.avata_path;
    try {
      await this.userRepository.save(user);
      if (updateUserDto.avata_path && prev_image) unlinkSync(prev_image);
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException('이미 존재하는 nickname 입니다.');
      if (updateUserDto.avata_path) unlinkSync(updateUserDto.avata_path);
      throw new InternalServerErrorException();
    }
    const payload: JwtPayload = { id: user.id, nickname: user.nickname };
    const token = this.jwtService.sign(payload);
    return token;
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

  async updateOtp(id: number, secret: string) {
    const user: User = await this.userRepository.findOneBy({ id });

    if (user.otp_key)
      throw new BadRequestException('이미 OTP KEY를 설정하셨습니다.');

    user.otp_key = secret;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async deleteOtp(id: number): Promise<void> {
    const user: User = await this.userRepository.findOneBy({ id });
    if (!user || !user.otp_key) return;
    user.otp_key = null;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
