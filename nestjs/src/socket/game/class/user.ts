import { UserStatus } from '../enum/userStatus.enum';

export default class User {
  constructor(
    public readonly socketId: string,
    public readonly nickName: string,
    public status: UserStatus,
  ) {}

  updateStatus(status: UserStatus) {
    this.status = status;
  }
}
