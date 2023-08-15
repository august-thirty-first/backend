import Ball from './ball';
import GamePlayer from './gamePlayer';
import GameMap from './gameMap';
import { BALL_COLOR } from '../enum/initStatus.enum';

export default class RenderInfo {
  gamePlayers: { [socketId: string]: GamePlayer } = {};
  ball: Ball;

  constructor(public gameMap: GameMap) {
    this.ball = new Ball(BALL_COLOR);
  }

  initializeBall(posX: number, posY: number) {
    this.ball.initializePosition(posX, posY);
    this.ball.initializeVelocity();
  }

  updateBall(dx: number, dy: number, type: 'position' | 'velocity') {
    if (type === 'position') {
      this.ball.updatePosition(dx, dy);
    } else {
      this.ball.updateVelocity(dx, dy);
    }
  }

  addGamePlayer(gameplayer: GamePlayer) {
    this.gamePlayers[gameplayer.socketId] = gameplayer;
  }

  updateGamePlayer(
    socketId: string,
    dx: number,
    dy: number,
    type: 'position' | 'velocity',
  ) {
    const player: GamePlayer = this.gamePlayers[socketId];
    if (type === 'position') {
      player.updateBarPosition(dx, dy);
    } else {
      player.updateBarVelocity(dx, dy);
    }
  }
}
