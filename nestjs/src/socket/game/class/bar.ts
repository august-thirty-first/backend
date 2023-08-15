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

  initializePosition(clientWidth: number, clientHeight: number): void {
    if (this.side === PlayerSide.LEFT) {
      this.position.initialize(0, clientHeight / 2);
    } else {
      this.position.initialize(clientWidth, clientHeight / 2);
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
