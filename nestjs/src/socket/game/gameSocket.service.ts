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
import FrameSizeDto from './dto/frameSize.dto';
import { Injectable } from '@nestjs/common';

@Injectable()
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
    curRenderInfo.addGamePlayer(leftSidePlayer);
    curRenderInfo.addGamePlayer(rightSidePlayer);
    return curRenderInfo;
  }

  initRenderInfoPositon(curRenderInfo: RenderInfo, frameSizeDto: FrameSizeDto) {
    curRenderInfo.initializeFrameSize(
      frameSizeDto.clientWidth,
      frameSizeDto.clientHeight,
    );
    curRenderInfo.initializeBall(
      curRenderInfo.clientWidth / 2,
      curRenderInfo.clientHeight / 2,
    );
    for (const socketId in curRenderInfo.gamePlayers) {
      const gamePlayer = curRenderInfo.gamePlayers[socketId];
      gamePlayer.initializeBar(
        curRenderInfo.clientWidth,
        curRenderInfo.clientHeight,
        curRenderInfo.gameMap.difficulty,
      );
    }
  }

  updateBallPosition(curRenderInfo: RenderInfo): void {
    const curBall = curRenderInfo.ball;

    curBall.updatePosition(curBall.velocity.x, curBall.velocity.y);
  }

  checkWallCollision(curRenderInfo: RenderInfo): void {
    const curBall = curRenderInfo.ball;

    if (curBall.position.y + curBall.radius >= curRenderInfo.clientHeight) {
      curBall.velocity.y *= -1;
    }
    if (curBall.position.y - curBall.radius <= 0) {
      curBall.velocity.y *= -1;
    }
  }

  checkBarCollision(curRenderInfo: RenderInfo): void {
    const curBall = curRenderInfo.ball;

    for (const id in curRenderInfo.gamePlayers) {
      const gamePlayerBar = curRenderInfo.gamePlayers[id].bar;

      const dx = Math.abs(curBall.position.x - gamePlayerBar.getCenterPosX());
      const dy = Math.abs(curBall.position.y - gamePlayerBar.getCenterPoxY());

      if (
        dx <= gamePlayerBar.width / 2 + curBall.radius &&
        dy <= gamePlayerBar.width / 2 + curBall.radius
      ) {
        curBall.velocity.x *= -1;
      }
    }
  }

  updateScore(curRenderInfo: RenderInfo): void {
    const curBall = curRenderInfo.ball;
    let leftSidePlayer: GamePlayer;
    let rightSidePlayer: GamePlayer;

    for (const id in curRenderInfo.gamePlayers) {
      const gamePlayer = curRenderInfo.gamePlayers[id];
      if (gamePlayer.side === PlayerSide.LEFT) {
        leftSidePlayer = gamePlayer;
      } else {
        rightSidePlayer = gamePlayer;
      }
    }

    // leftSidePlayer 득점
    if (curBall.position.x + curBall.radius >= curRenderInfo.clientWidth) {
      leftSidePlayer.score += 1;
      curBall.initializePosition(
        curRenderInfo.clientWidth / 2,
        curRenderInfo.clientHeight / 2,
      );
      curBall.initializeVelocity();
    }
    // rightSidePlayer 득점
    if (curBall.position.x - curBall.radius <= 0) {
      rightSidePlayer.score += 1;
      curBall.initializePosition(
        curRenderInfo.clientWidth / 2,
        curRenderInfo.clientHeight / 2,
      );
      curBall.initializeVelocity();
    }
  }
}
