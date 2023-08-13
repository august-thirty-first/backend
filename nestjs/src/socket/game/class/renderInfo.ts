import Ball from './ball';
import GamePlayer from './gamePlayer';
import Map from './map';

export default class RenderInfo {
  gamePlayers: GamePlayer[];

  constructor(public map: Map, public ball: Ball) {}

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
