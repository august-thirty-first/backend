import { Socket } from 'socket.io';
import { ReadyDto } from './dto/ready.dto';
import Game from './class/game';
import { MapDifficulty, MapType } from 'src/game/enum/gameOption.enum';
import setCountMap from './utils/setCountMap';
import getMostFrequencyItem from './utils/getMostFrequencyItem';
import GameMap from './class/gameMap';
import User from './class/user';
import RenderInfo from './class/renderInfo';
import { PlayerSide } from './enum/playerSide.enum';
import GamePlayer from './class/gamePlayer';

export class GameSocketService {
  getRoomId(socket: Socket): string {
    const rooms: Set<string> = socket.rooms;
    let roomId: string;
    for (const item of rooms) {
      roomId = item;
      break;
    }
    return roomId;
  }

  voteMap(curGame: Game, readyDto: ReadyDto): boolean {
    curGame.addVoteMapType(readyDto.mapType);
    curGame.addVoteMapDifficulty(readyDto.mapDifficulty);

    if (
      curGame.voteMapType.length === 2 &&
      curGame.voteMapDifficulty.length === 2
    ) {
      return true;
    } else {
      return false;
    }
  }

  setMap(curGame: Game): GameMap {
    const countMapType: Map<MapType, number> = new Map();
    const countMapDifficulty: Map<MapDifficulty, number> = new Map();

    setCountMap(curGame.voteMapType, countMapType);
    setCountMap(curGame.voteMapDifficulty, countMapDifficulty);
    const selectedMapType = getMostFrequencyItem(countMapType) as MapType;
    const selectedMapDifficulty = getMostFrequencyItem(
      countMapDifficulty,
    ) as MapDifficulty;

    return new GameMap(selectedMapType, selectedMapDifficulty);
  }

  initRenderInfo(
    curMap: GameMap,
    leftSideUser: User,
    rightSideUser: User,
  ): RenderInfo {
    const curRenderInfo = new RenderInfo(curMap);
    const leftSidePlayer = new GamePlayer(
      leftSideUser.socketId,
      leftSideUser.nickName,
      leftSideUser.status,
      0,
      PlayerSide.LEFT,
    );
    const rightSidePlayer = new GamePlayer(
      rightSideUser.socketId,
      rightSideUser.nickName,
      rightSideUser.status,
      0,
      PlayerSide.RIGHT,
    );
    leftSidePlayer.initializeBar();
    rightSidePlayer.initializeBar();
    curRenderInfo.initializeBall();
    curRenderInfo.addGamePlayer(leftSidePlayer);
    curRenderInfo.addGamePlayer(rightSidePlayer);
    return curRenderInfo;
  }
}