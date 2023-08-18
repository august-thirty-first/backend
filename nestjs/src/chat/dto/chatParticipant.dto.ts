import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';

export class ChatParticipantDto {
  id: number;
  chat_room_id: number;
  user_id: number;
  authority: ChatParticipantAuthority;
  ban: Date;
  authority_time: Date;
}
