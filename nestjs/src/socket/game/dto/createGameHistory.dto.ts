import { GameType } from '../enum/gameType.enum';

export class CreateGameHisotryDto {
  winnerId: number;
  loserId: number;
  gameType: GameType;
}
