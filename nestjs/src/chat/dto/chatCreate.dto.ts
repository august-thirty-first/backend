import { PickType } from '@nestjs/swagger';
import { ChatDto } from './chat.dto';
import { IsNotEmpty } from 'class-validator';
import { ChatStatus } from '../enum/chat.status.enum';
import { Transform } from 'class-transformer';

export class CreateChatDto extends PickType(ChatDto, [
  'roomName',
  'status',
  'password',
]) {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  roomName: string;

  @IsNotEmpty()
  status: ChatStatus;
}
