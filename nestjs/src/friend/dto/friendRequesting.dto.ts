import { User } from 'src/auth/entities/User.entity';
import { RequestStatus } from '../entities/FriendRequesting.entity';

export class FriendRequestingDto {
  id: number;
  from_user_id: User;
  to_user_id: User;
  status: RequestStatus;
  time: Date;
}
