import { UserStatus } from '../enum/userStatus.enum';

export default class User {
  public roomId: string;
  constructor(
    public readonly socketId: string,
    public readonly userId: number,
    public readonly nickName: string,
    public status: UserStatus,
  ) {}

  updateStatus(status: UserStatus) {
    this.status = status;
  }
  updateRoomId(roomId: string) {
    this.roomId = roomId;
  }
}
