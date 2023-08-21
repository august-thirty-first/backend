import { PickType } from '@nestjs/swagger';
import { ChatParticipantDto } from './chatParticipant.dto';
import { IsNotEmpty } from 'class-validator';
import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';

export class ChatParticipantAuthorityDto extends PickType(ChatParticipantDto, [
  'chat_room_id',
  'authority',
]) {
  @IsNotEmpty()
  chat_room_id: number;

  @IsNotEmpty()
  authority: ChatParticipantAuthority;
}
