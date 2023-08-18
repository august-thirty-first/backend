export default function getRandomNumberRange(min: number, max: number): number {
  if (Math.random() < 0.5) {
    return -(Math.floor(Math.random() * (max - min + 1)) + min);
  } else {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
