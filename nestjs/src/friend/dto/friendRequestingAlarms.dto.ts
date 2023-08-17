import { FriendRequestStatus } from 'src/profile/dto/searchUser.dto';

export default class FriendRequestingAlarmsDto {
  id: number;
  nickname: string;
  avata_path: string;
  status: FriendRequestStatus;
}
