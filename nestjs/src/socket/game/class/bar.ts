import { MapDifficulty } from 'src/game/enum/gameOption.enum';
import { BarInitVelocity, BarSize } from '../enum/initStatus.enum';
import { PlayerSide } from '../enum/playerSide.enum';
import Position from './positon';
import velocity from './velocity';

export default class Bar {
  position: Position;
  velocity: velocity;
  width: number;
  length: number;

  constructor(
    private readonly side: PlayerSide,
    private readonly color: string,
  ) {
    this.position = new Position();
    this.velocity = new velocity();
  }

  initializePosition(clientWidth: number, clientHeight: number): void {
    if (this.side === PlayerSide.LEFT) {
      this.position.initialize(0, clientHeight / 2 - this.length / 2);
    } else {
      this.position.initialize(
        clientWidth - this.width,
        clientHeight / 2 - this.length / 2,
      );
    }
  }

  initializeVelocity(): void {
    this.velocity.initialize(BarInitVelocity.X, BarInitVelocity.Y);
  }

  initializeSize(mapDifficulty: MapDifficulty): void {
    if (mapDifficulty === MapDifficulty.EASY) {
      this.width = BarSize.EasyWidth;
      this.length = BarSize.EasyLength;
    } else {
      this.width = BarSize.HardWidth;
      this.length = BarSize.HardLength;
    }
  }

  updateVelocity(dx: number, dy: number): void {
    this.velocity.updateX(dx);
    this.velocity.updateY(dy);
  }

  updatePosition(dx: number, dy: number): void {
    this.position.updateX(dx);
    this.position.updateY(dy);
  }

  getCenterPosX() {
    return this.position.x + this.width / 2;
  }

  getCenterPoxY() {
    return this.position.y + this.length / 2;
  }
}
