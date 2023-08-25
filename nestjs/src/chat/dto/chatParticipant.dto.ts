import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';

export class ChatParticipantDto {
  id: number;
  chatRoomId: number;
  userId: number;
  authority: ChatParticipantAuthority;
  ban: Date;
  authorityTime: Date;
}
