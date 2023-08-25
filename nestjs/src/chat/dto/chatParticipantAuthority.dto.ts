import { PickType } from '@nestjs/swagger';
import { ChatParticipantDto } from './chatParticipant.dto';
import { IsNotEmpty } from 'class-validator';
import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';

export class ChatParticipantAuthorityDto extends PickType(ChatParticipantDto, [
  'chatRoomId',
  'authority',
]) {
  @IsNotEmpty()
  chatRoomId: number;

  @IsNotEmpty()
  authority: ChatParticipantAuthority;

  @IsNotEmpty()
  targetUserId: number;
}
