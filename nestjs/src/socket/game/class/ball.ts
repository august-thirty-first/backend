import { BallInitPosition } from '../enum/initStatus.enum';
import getRandomNumberRange from '../utils/getRandomNumberRange';
import Position from './positon';
import velocity from './velocity';

export default class Ball {
  position: Position;
  velocity: velocity;

  constructor(private readonly color: string) {
    this.position = new Position();
    this.velocity = new velocity();
  }

  initializePosition(x: number, y: number): void {
    this.position.initialize(x, y);
  }

  initializeVelocity(): void {
    this.velocity.initialize(
      getRandomNumberRange(-5, 5),
      getRandomNumberRange(-5, 5),
    );
  }

  updatePosition(dx: number, dy: number): void {
    this.position.updateX(dx);
    this.position.updateY(dy);
  }

  updateVelocity(dx: number, dy: number): void {
    this.velocity.updateX(dx);
    this.velocity.updateY(dy);
  }
}
