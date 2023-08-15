export default class Position {
  x: number;
  y: number;

  initialize(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  updateX(dx: number): void {
    this.x += dx;
  }

  updateY(dy: number): void {
    this.y += dy;
  }
}
