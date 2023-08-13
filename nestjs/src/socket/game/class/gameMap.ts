import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';

export default class GameMap {
  constructor(public type: MapType, public difficulty: MapDifficulty) {}
}
