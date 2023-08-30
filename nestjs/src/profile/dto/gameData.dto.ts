import { GetGameHistoryDto } from 'src/socket/game/dto/getGameHistory.dto';

export default class GameDataDto {
  total_win: number;
  total_lose: number;
  ladder: number | null;
  game_history: GetGameHistoryDto[];
}
