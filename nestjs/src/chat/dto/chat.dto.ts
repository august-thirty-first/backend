import { ChatStatus } from '../enum/chat.status.enum';

export class ChatDto {
  id: number;
  roomName: string;
  status: ChatStatus;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
