import { UserDto } from 'src/auth/dto/user.dto';
import { PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export enum SearchUserRequestStatus {
  Allow = 'allow',
  SendRequest = 'send',
  RecvRequest = 'recv',
}

export default class SearchUserDto extends PickType(UserDto, [
  'id',
  'nickname',
  'avata_path',
]) {
  @Expose()
  id: number;

  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @Expose()
  nickname: string;

  @Expose()
  avata_path: string;

  friend_status: SearchUserRequestStatus;
}
