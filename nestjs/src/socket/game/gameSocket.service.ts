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
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistoryRepository } from './gameHistory.repository';
import {
  GameStatus,
  LADDER_LOSE_DELTA_SCORE,
  LADDER_WIN_DELTA_SCORE,
  TARGET_SCORE,
} from './enum/gameStatus.enum';
import MatchHistory from './class/matchHistory';
import { UserStatus } from './enum/userStatus.enum';
import { GameType } from './enum/gameType.enum';
import LadderRepository from './ladder.repository';

@Injectable()
export class GameSocketService {
  constructor(
    @InjectRepository(GameHistoryRepository)
    private gameHistoryRepository: GameHistoryRepository,
    @InjectRepository(LadderRepository)
    private ladderRepository: LadderRepository,
  ) {}

  private isGameOver(leftSideScore: number, rightSideScore: number): boolean {
    if (leftSideScore >= TARGET_SCORE || rightSideScore >= TARGET_SCORE) {
      return true;
    }
    return false;
  }

  getRoomId(socket: Socket): string {
    const rooms: Set<string> = socket.rooms;
    let roomId = '';
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
      leftSideUser.userId,
      leftSideUser.nickName,
      leftSideUser.status,
      0,
      PlayerSide.LEFT,
    );
    const rightSidePlayer = new GamePlayer(
      rightSideUser.socketId,
      rightSideUser.userId,
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

    curBall?.updatePosition(curBall.velocity.x, curBall.velocity.y);
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
        dy <= gamePlayerBar.length / 2 + curBall.radius
      ) {
        curBall.velocity.x *= -1.2;
        curBall.velocity.y *= 1.2;
      }
    }
  }

  updateScore(curGame: Game): void {
    const curRenderInfo = curGame.renderInfo;
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

    if (
      leftSidePlayer.status === UserStatus.IN_GAME &&
      rightSidePlayer.status === UserStatus.IN_GAME
    ) {
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
    } else {
      curGame.updateStatus(GameStatus.GAME_OVER_IN_PLAYING);
      if (leftSidePlayer?.status === UserStatus.OFFLINE) {
        leftSidePlayer.score = 0;
        rightSidePlayer.score = TARGET_SCORE;
      } else {
        leftSidePlayer.score = TARGET_SCORE;
        rightSidePlayer.score = 0;
      }
    }
  }

  updateGameStatus(curGame: Game): void {
    const curRenderInfo = curGame.renderInfo;
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

    if (
      curGame.status === GameStatus.IN_GAME &&
      this.isGameOver(leftSidePlayer.score, rightSidePlayer.score)
    ) {
      curGame.status = GameStatus.GAME_OVER;
    }
  }

  createGameHistory(curGame: Game): void {
    const curRenderInfo = curGame.renderInfo;
    const gameType = curGame.gameType;
    const history = new MatchHistory();
    let winnerId: number;
    let winnerNickname: string;
    let loserId: number;
    let loserNickname: string;

    for (const id in curRenderInfo.gamePlayers) {
      if (curRenderInfo.gamePlayers.hasOwnProperty(id)) {
        const gamePlayer = curRenderInfo.gamePlayers[id];
        if (gamePlayer.score >= TARGET_SCORE) {
          winnerId = gamePlayer.userId;
          winnerNickname = gamePlayer.nickName;
        } else {
          loserId = gamePlayer.userId;
          loserNickname = gamePlayer.nickName;
        }
      }
    }
    history.updateResult(winnerId, winnerNickname, loserId, loserNickname);
    curGame.setGameHistory(history);
    this.gameHistoryRepository.createGameHistory({
      winnerId,
      loserId,
      gameType,
    });
  }

  createOrUpdateLadder(curGame: Game): void {
    if (curGame.gameType === GameType.LADDER) {
      const gameHistory = curGame.history;
      this.ladderRepository.createOrUpdateLadderRecord({
        user_id: gameHistory.winnerId,
        delta_score: LADDER_WIN_DELTA_SCORE,
      });
      this.ladderRepository.createOrUpdateLadderRecord({
        user_id: gameHistory.loserId,
        delta_score: LADDER_LOSE_DELTA_SCORE,
      });
    }
  }
}
