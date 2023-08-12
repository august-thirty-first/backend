import { Socket } from 'socket.io';
import { UserStatus } from '../enum/userStatus.enum';

export default class User {
  constructor(
    public readonly socket: Socket,
    public readonly nickNmae: string,
    public status: UserStatus,
  ) {}

  updateStatus(status: UserStatus) {
    this.status = status;
  }
}
