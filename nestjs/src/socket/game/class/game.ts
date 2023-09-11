import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';
import { GameStatus } from '../enum/gameStatus.enum';
import RenderInfo from './renderInfo';
import User from './user';
import { GameType } from '../enum/gameType.enum';
import MatchHistory from './matchHistory';

export default class Game {
  renderInfo: RenderInfo;
  history: MatchHistory;
  users: User[] = [];
  voteMapType: MapType[] = [];
  voteMapDifficulty: MapDifficulty[] = [];

  constructor(
    public id: string,
    public status: GameStatus,
    public gameType: GameType,
  ) {}

  setRenderInfo(renderInfo: RenderInfo) {
    this.renderInfo = renderInfo;
  }

  setGameHistory(history: MatchHistory) {
    this.history = history;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  updateStatus(status: GameStatus) {
    this.status = status;
  }

  addVoteMapType(mapType: MapType): void {
    this.voteMapType.push(mapType);
  }

  addVoteMapDifficulty(mapDifficulty: MapDifficulty): void {
    this.voteMapDifficulty.push(mapDifficulty);
  }
}
