import Ball from './ball';
import GamePlayer from './gamePlayer';
import GameMap from './gameMap';

export default class RenderInfo {
  gamePlayers: { [socketId: string]: GamePlayer } = {};

  constructor(public gameMap: GameMap, public ball: Ball) {}

  initializeBall() {
    this.ball.initializePosition();
  }

  updateBallPosition(dx: number, dy: number) {
    this.ball.updatePosition(dx, dy);
  }

  addGamePlayer(gameplayer: GamePlayer) {
    this.gamePlayers[gameplayer.socket.id] = gameplayer;
  }

  updateGamePlayer(socketId: string, dx: number, dy: number) {
    const player: GamePlayer = this.gamePlayers[socketId];
    player.updateBarPosition(dx, dy);
  }
}
