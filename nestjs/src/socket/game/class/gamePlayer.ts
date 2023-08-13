import { Socket } from 'socket.io';
import User from './user';
import { UserStatus } from '../enum/userStatus.enum';
import Bar from './bar';
import { PlayerSide } from '../enum/playerSide.enum';
import { BAR_COLOR } from '../enum/initStatus.enum';

export default class GamePlayer extends User {
  bar: Bar;

  constructor(
    socket: Socket,
    nickName: string,
    status: UserStatus,
    public score: number,
    public side: PlayerSide,
  ) {
    super(socket, nickName, status);
    this.bar = new Bar(side, BAR_COLOR);
  }

  initializeBar() {
    this.bar.initializePosition();
  }

  updateBarPosition(dx: number, dy: number) {
    this.bar.updatePosition(dx, dy);
  }

  updateScore(dv: number) {
    this.score += dv;
  }
}
