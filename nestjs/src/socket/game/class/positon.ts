export default class Position {
  constructor(public x: number, public y: number) {}

  initialize = (x: number, y: number) => {
    this.x = x;
    this.y = y;
  };

  updateX = (value: number) => {
    this.x += value;
  };

  updateY = (value: number) => {
    this.y += value;
  };
}
