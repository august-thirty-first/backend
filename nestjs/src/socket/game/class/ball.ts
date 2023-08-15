import { BallInitPosition } from '../enum/initStatus.enum';
import Position from './positon';

export default class Ball {
  private position: Position;

  constructor(private readonly color: string) {
    this.position = new Position();
  }

  initializePosition(): void {
    this.position.initialize(BallInitPosition.X, BallInitPosition.Y);
  }

  updatePosition(dx: number, dy: number): void {
    this.position.updateX(dx);
    this.position.updateY(dy);
  }
}
