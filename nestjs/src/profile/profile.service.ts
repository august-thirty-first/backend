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
import GetAchievementDto from 'src/achievement/dto/getAchievement.dto';
import { UserAchievement } from 'src/achievement/entities/UserAchievement.entity';
import { UserAchievementRepository } from 'src/achievement/userAchievement.repository';
import { User } from 'src/auth/entities/User.entity';
import checkDuplicatedNicknameResponse from 'src/auth/interfaces/checkDuplicatedNicknameResponse.interface';
import { UserRepository } from 'src/auth/user.repository';
import { CryptoService } from 'src/auth/utils/crypto.service';
import {
  FriendRequesting,
  RequestStatus,
} from 'src/friend/entities/FriendRequesting.entity';
import { FriendRequestingRepository } from 'src/friend/friendRequesting.repository';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import JwtPayload from 'src/passports/interface/jwtPayload.interface';
import { GetGameHistoryDto } from 'src/socket/game/dto/getGameHistory.dto';
import { GameHistory } from 'src/socket/game/entities/gameHistory.entity';
import { GameHistoryRepository } from 'src/socket/game/gameHistory.repository';
import LadderRepository from 'src/socket/game/ladder.repository';
import MyInfoDto from './dto/myInfo.dto';
import SearchUserDto, { FriendRequestStatus } from './dto/searchUser.dto';
import { UpdateUserDto } from './dto/userUpdate.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserAchievementRepository)
    private readonly userAchievementRepository: UserAchievementRepository,
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(FriendRequestingRepository)
    private friendRequestingRepository: FriendRequestingRepository,
    @InjectRepository(GameHistoryRepository)
    private gameHistoryRepository: GameHistoryRepository,
    @InjectRepository(LadderRepository)
    private ladderRepository: LadderRepository,
    @Inject(NormalJwt)
    private jwtService: JwtService,
    private cryptoService: CryptoService,
  ) {}

  async myInfo(id: number): Promise<MyInfoDto> {
    const user: User | null = await this.userRepository.findOneBy({ id });
    const profile: MyInfoDto = plainToClass(MyInfoDto, user, {
      strategy: 'excludeAll',
    });
    return profile;
  }

  async getFriendStatus(
    my_id: number,
    target_id: number,
  ): Promise<FriendRequestStatus | null> {
    let result: FriendRequestStatus | null = null;
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

  async getProfileUserAchievement(
    user_id: number,
  ): Promise<GetAchievementDto[]> {
    const achievements: UserAchievement[] =
      await this.userAchievementRepository.getUserAchievement(user_id);

    const result: GetAchievementDto[] = achievements.map(row => {
      return {
        title: row.achievement_id.title,
        description: row.achievement_id.description,
      };
    });
    return result;
  }

  async getProfileUserGameHistory(
    user_id: number,
  ): Promise<GetGameHistoryDto[]> {
    const histories: GameHistory[] =
      await this.gameHistoryRepository.getGameHistory(user_id, 10, 0);
    const result: GetGameHistoryDto[] = histories.map(history => {
      return {
        winner_nickname: history.winner.nickname,
        winner_avata: history.winner.avata_path,
        loser_nickname: history.loser.nickname,
        loser_avata: history.loser.avata_path,
        gameType: history.gameType,
      };
    });
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
    result.achievements = await this.getProfileUserAchievement(profile.id);
    result.game_data.game_history = await this.getProfileUserGameHistory(
      profile.id,
    );
    result.game_data.total_win =
      await this.gameHistoryRepository.getWinnerCount(profile.id);
    result.game_data.total_lose =
      await this.gameHistoryRepository.getLoserCount(profile.id);
    result.game_data.ladder = await this.ladderRepository.getLadderScore(
      profile.id,
    );
    return result;
  }

  async searchByUserNickname(nickname: string): Promise<SearchUserDto | null> {
    const profile: User | null = await this.userRepository.findOneBy({
      nickname,
    });
    let result: SearchUserDto | null = null;
    if (profile)
      result = plainToClass(SearchUserDto, profile, { strategy: 'excludeAll' });
    return result;
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<string> {
    const user: User | null = await this.userRepository.findOneBy({ id });
    if (!user) throw new BadRequestException('해당 유저 없음');
    const prev_image: string | null = user.avata_path
      ? join(__dirname, '../../', user.avata_path)
      : null;
    if (updateUserDto.nickname) user.nickname = updateUserDto.nickname;
    if (updateUserDto.avata_path) user.avata_path = updateUserDto.avata_path;
    try {
      await this.userRepository.save(user);
      if (updateUserDto.avata_path && prev_image) unlinkSync(prev_image);
    } catch (error: any) {
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
    const user: User | null = await this.userRepository.findOneBy({ id });

    if (!user) throw new BadRequestException('해당 유저 없음');
    if (user.otp_key)
      throw new BadRequestException('이미 OTP KEY를 설정하셨습니다.');

    user.otp_key = this.cryptoService.encrypt(secret);
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async deleteOtp(id: number): Promise<void> {
    const user: User | null = await this.userRepository.findOneBy({ id });
    if (!user || !user.otp_key) return;
    user.otp_key = undefined;
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
