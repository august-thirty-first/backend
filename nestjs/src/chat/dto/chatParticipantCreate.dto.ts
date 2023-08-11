import { PickType } from '@nestjs/swagger';
import { ChatParticipantDto } from './chatParticipant.dto';
import { IsNotEmpty } from 'class-validator';
import { ChatParticipantStatus } from '../enum/chatParticipant.status.enum';

export class ChatParticipantCreateDto extends PickType(ChatParticipantDto, [
  'chat_room_id',
  'status',
]) {
  @IsNotEmpty()
  chat_room_id: number;

  @IsNotEmpty()
  status: ChatParticipantStatus;
}
