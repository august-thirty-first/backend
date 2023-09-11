import { GameType } from '../enum/gameType.enum';

export class GetGameHistoryDto {
  winner_nickname: string;
  winner_avata?: string;
  loser_nickname: string;
  loser_avata?: string;
  gameType: GameType;
}
