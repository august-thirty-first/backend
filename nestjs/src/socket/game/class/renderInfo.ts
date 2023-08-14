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

  initializeBall() {
    this.ball.initializePosition();
  }

  updateBallPosition(dx: number, dy: number) {
    this.ball.updatePosition(dx, dy);
  }

  addGamePlayer(gameplayer: GamePlayer) {
    this.gamePlayers[gameplayer.socketId] = gameplayer;
  }

  updateGamePlayer(socketId: string, dx: number, dy: number) {
    const player: GamePlayer = this.gamePlayers[socketId];
    player.updateBarPosition(dx, dy);
  }
}
