import { ChatStatus } from '../enum/chat.status.enum';

export class ChatDto {
  id: number;
  room_name: string;
  status: ChatStatus;
  password: string;
  created_at: Date;
  updated_at: Date;
}
