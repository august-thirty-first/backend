import { IsNotEmpty } from 'class-validator';
import { UserDto } from './user.dto';
import { OmitType } from '@nestjs/swagger';

export class CreateUserDto extends OmitType(UserDto, ['otp_key', 'id']) {
  @IsNotEmpty()
  nickname: string;
}
