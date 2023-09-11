import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';

export default function setCountMap(
  voteList: MapType[] | MapDifficulty[],
  countMap: Map<MapType | MapDifficulty, number>,
): void {
  voteList.forEach(item => {
    if (countMap.has(item)) {
      countMap.set(item, countMap.get(item) + 1);
    } else {
      countMap.set(item, 1);
    }
  });
}
