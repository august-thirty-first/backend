import Ball from './ball';
import GamePlayer from './gamePlayer';
import GameMap from './gameMap';
import { BALL_COLOR, BallRadius } from '../enum/initStatus.enum';
import { MapDifficulty } from 'src/game/enum/gameOption.enum';

export default class RenderInfo {
  gamePlayers: { [socketId: string]: GamePlayer } = {};
  ball: Ball;
  clientWidth: number;
  clientHeight: number;

  constructor(public gameMap: GameMap) {
    if (gameMap.difficulty === MapDifficulty.EASY) {
      this.ball = new Ball(BALL_COLOR, BallRadius.EasyRadius);
    } else {
      this.ball = new Ball(BALL_COLOR, BallRadius.HardRadius);
    }
  }

  initializeBall(posX: number, posY: number) {
    this.ball.initializePosition(posX, posY);
    this.ball.initializeVelocity();
  }

  initializeFrameSize(clientWidth: number, clientHeight: number) {
    this.clientWidth = clientWidth;
    this.clientHeight = clientHeight;
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
