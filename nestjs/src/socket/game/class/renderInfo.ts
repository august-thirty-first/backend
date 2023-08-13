import Ball from './ball';
import GamePlayer from './gamePlayer';
import GameMap from './gameMap';

export default class RenderInfo {
  gamePlayers: Map<string, GamePlayer> = new Map();

  constructor(public gameMap: GameMap, public ball: Ball) {}

  initializeBall() {
    this.ball.initializePosition();
  }

  updateBallPosition(dx: number, dy: number) {
    this.ball.updatePosition(dx, dy);
  }

  addGamePlayer(gameplayer: GamePlayer) {
    this.gamePlayers.set(gameplayer.socket.id, gameplayer);
  }

  updateGamePlayer(socketId: string, dx: number, dy: number) {
    const player: GamePlayer = this.gamePlayers.get(socketId);
    if (player) {
      player.updateBarPosition(dx, dy);
    }
  }
}
