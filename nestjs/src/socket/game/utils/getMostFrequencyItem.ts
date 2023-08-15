import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';

export default function getMostFrequencyItem(
  curMap: Map<MapType | MapDifficulty, number>,
): MapType | MapDifficulty {
  let selectedItem: MapType | MapDifficulty;
  let maxFrequency = 0;

  curMap.forEach((frequency, item) => {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
      selectedItem = item;
    }
  });
  return selectedItem;
}
