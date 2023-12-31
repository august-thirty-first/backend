import { PickType } from '@nestjs/swagger';
import { ChatParticipantDto } from './chatParticipant.dto';
import { IsNotEmpty } from 'class-validator';

export class ChatParticipantCreateDto extends PickType(ChatParticipantDto, [
  'chat_room_id',
  'authority',
]) {
  @IsNotEmpty()
  chat_room_id: number;
}
