import { PickType } from '@nestjs/swagger';
import { ChatDto } from './chat.dto';
import { IsNotEmpty } from 'class-validator';
import { ChatStatus } from '../enum/chat.status.enum';
import { Transform } from 'class-transformer';

export class CreateChatDto extends PickType(ChatDto, [
  'room_name',
  'status',
  'password',
]) {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  room_name: string;

  @IsNotEmpty()
  status: ChatStatus;
}
