import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';

export default class Map {
  constructor(public type: MapType, public difficulty: MapDifficulty) {}
}
