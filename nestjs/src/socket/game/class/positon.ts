export default class Position {
  constructor(private x: number, private y: number) {}

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
