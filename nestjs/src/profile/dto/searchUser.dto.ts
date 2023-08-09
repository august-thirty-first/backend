import { UserDto } from 'src/auth/dto/user.dto';
import { PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export default class SearchUserDto extends PickType(UserDto, [
  'nickname',
  'avata_path',
]) {
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  @Expose()
  nickname: string;

  @Expose()
  avata_path: string;
}
