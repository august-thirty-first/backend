import { PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserDto } from 'src/auth/dto/user.dto';

export class UpdateUserDto extends PickType(UserDto, [
  'nickname',
  'avata_path',
]) {
  @Transform(({ value }) => value?.trim())
  nickname: string;
}
