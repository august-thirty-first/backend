import { User } from 'src/auth/entities/User.entity';
import { Chat } from '../entities/chat.entity';
import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';

export interface ChatParticipantWithBlackList {
  blackList: boolean;
  id: number;
  chat: Chat;
  user: User;
  authority: ChatParticipantAuthority;
  ban: Date;
  authority_time: Date;
}
