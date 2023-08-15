import User from './user';
import { UserStatus } from '../enum/userStatus.enum';
import Bar from './bar';
import { PlayerSide } from '../enum/playerSide.enum';
import { BAR_COLOR } from '../enum/initStatus.enum';

export default class GamePlayer extends User {
  bar: Bar;

  constructor(
    socketId: string,
    nickName: string,
    status: UserStatus,
    public score: number,
    public side: PlayerSide,
  ) {
    super(socketId, nickName, status);
    this.bar = new Bar(side, BAR_COLOR);
  }

  initializeBar() {
    this.bar.initializePosition();
    this.bar.initializeVelocity();
  }

  updateBarPosition(dx: number, dy: number) {
    this.bar.updatePosition(dx, dy);
  }

  updateBarVelocity(dx: number, dy: number) {
    this.bar.updateVelocity(dx, dy);
  }

  updateScore(dv: number) {
    this.score += dv;
  }
}
