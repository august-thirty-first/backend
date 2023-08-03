import { IsNotEmpty } from 'class-validator';
import { UserDto } from './user.dto';
import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto extends OmitType(UserDto, ['otp_key', 'id']) {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  nickname: string;
}
