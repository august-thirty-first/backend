import { PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { UserDto } from './user.dto';

export class CheckNicknameDto extends PickType(UserDto, ['nickname']) {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  nickname: string;
}
