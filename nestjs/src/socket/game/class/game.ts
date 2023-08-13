import { GameStatus } from '../enum/gameStatus.enum';
import GameHistory from './gameHistory';
import RenderInfo from './renderInfo';
import User from './user';

export default class Game {
  renderInfo: RenderInfo | null = null;
  history: GameHistory | null = null;
  users: User[] = [];

  constructor(public id: string, public status: GameStatus) {}

  setRenderInfo(renderInfo: RenderInfo) {
    this.renderInfo = renderInfo;
  }

  setGameHistory(gameHistory: GameHistory) {
    this.history = gameHistory;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  updateStatus(status: GameStatus) {
    this.status = status;
  }
}
