export default class Position {
  constructor(public x: number, public y: number) {}

  updateX = (value: number) => {
    this.x += value;
  };

  updateY = (value: number) => {
    this.y += value;
  };
}
