import { ChatParticipantStatus } from '../enum/chatParticipant.status.enum';

export class ChatParticipantDto {
  id: number;
  chat_room_id: number;
  user_id: number;
  status: ChatParticipantStatus;
  ban: Date;
  status_time: Date;
}
