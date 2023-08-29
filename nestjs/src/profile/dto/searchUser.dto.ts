import { UserDto } from 'src/auth/dto/user.dto';
import { PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import GetAchievementDto from 'src/achievement/dto/getAchievement.dto';
import GameDataDto from './gameData.dto';

export enum FriendRequestStatus {
  Allow = 'allow',
  SendRequest = 'send',
  RecvRequest = 'recv',
}

export default class SearchUserDto extends PickType(UserDto, [
  'id',
  'nickname',
  'avata_path',
]) {
  constructor() {
    super();
    this.game_data = new GameDataDto();
  }
  @Expose()
  id: number;

  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @Expose()
  nickname: string;

  @Expose()
  avata_path: string;

  friend_status: FriendRequestStatus | null;
  achievements: GetAchievementDto[];
  game_data: GameDataDto;
}
