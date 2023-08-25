import { PickType } from '@nestjs/swagger';
import { ChatParticipantDto } from './chatParticipant.dto';
import { IsNotEmpty } from 'class-validator';

export class ChatParticipantCreateDto extends PickType(ChatParticipantDto, [
  'chatRoomId',
  'authority',
]) {
  @IsNotEmpty()
  chatRoomId: number;
}
