import { BarInitPosition, BarInitVelocity } from '../enum/initStatus.enum';
import { PlayerSide } from '../enum/playerSide.enum';
import Position from './positon';
import velocity from './velocity';

export default class Bar {
  position: Position;
  velocity: velocity;

  constructor(
    private readonly side: PlayerSide,
    private readonly color: string,
  ) {
    this.position = new Position();
    this.velocity = new velocity();
  }

  initializePosition(): void {
    if (this.side === PlayerSide.LEFT) {
      this.position.initialize(BarInitPosition.LEFT_X, BarInitPosition.LEFT_Y);
    } else {
      this.position.initialize(
        BarInitPosition.RIGHT_X,
        BarInitPosition.RIGHT_Y,
      );
    }
  }

  initializeVelocity(): void {
    this.velocity.initialize(BarInitVelocity.X, BarInitVelocity.Y);
  }

  updateVelocity(dx: number, dy: number): void {
    this.velocity.updateX(dx);
    this.velocity.updateY(dy);
  }

  updatePosition(dx: number, dy: number): void {
    this.position.updateX(dx);
    this.position.updateY(dy);
  }
}
