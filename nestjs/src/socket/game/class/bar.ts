import { BarInitPosition } from '../enum/initStatus.enum';
import { PlayerSide } from '../enum/playerSide.enum';
import Position from './positon';

export default class Bar {
  private position: Position;

  constructor(
    private readonly side: PlayerSide,
    private readonly color: string,
  ) {
    this.position = new Position();
  }

  initializePosition() {
    if (this.side === PlayerSide.LEFT) {
      this.position.initialize(BarInitPosition.LEFT_X, BarInitPosition.LEFT_Y);
    } else {
      this.position.initialize(
        BarInitPosition.RIGHT_X,
        BarInitPosition.RIGHT_Y,
      );
    }
  }

  updatePosition(dx: number, dy: number) {
    this.position.updateX(dx);
    this.position.updateY(dy);
  }
}
