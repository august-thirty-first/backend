import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import { GameSocketService } from './gameSocket.service';
import User from './class/user';
import { parse } from 'cookie';
import { UserStatus } from './enum/userStatus.enum';
import Game from './class/game';
import { GameStatus } from './enum/gameStatus.enum';
import { ReadyDto } from './dto/ready.dto';
import GameMap from './class/gameMap';
import FrameSizeDto from './dto/frameSize.dto';
import { GameType } from './enum/gameType.enum';
import { GameConnectionService } from './gameConnection.service';
import { GeneralGameService } from '../home/generalGame.service';

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: [`${process.env.FRONTEND_URL}`],
  },
})
export class GameSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(NormalJwt) private readonly jwtService: JwtService,
    private readonly gameSocketService: GameSocketService,
    private readonly gameConnectionService: GameConnectionService,
    private readonly generalGameService: GeneralGameService,
  ) {}

  @WebSocketServer() server: Server;

  private ladderQueue: Socket[] = [];
  private users: { [socketId: string]: User } = {};
  private games: { [roomId: string]: Game } = {};
  private setIntervalId: NodeJS.Timer;
  private isCalledOnce = false;

  private updateRenderInfo(curGame: Game) {
    const curRenderInfo = curGame.renderInfo;
    const curGameRoomId = curGame.id;
    this.gameSocketService.updateBallPosition(curRenderInfo);
    this.gameSocketService.checkWallCollision(curRenderInfo);
    this.gameSocketService.checkBarCollision(curRenderInfo);
    this.gameSocketService.updateScore(curGame);
    this.gameSocketService.updateGameStatus(curGame);
    this.server
      .to(curGame.id)
      .emit('updateRenderInfo', JSON.stringify(curRenderInfo));
    if (
      curGame.status === GameStatus.GAME_OVER ||
      curGame.status === GameStatus.GAME_OVER_IN_PLAYING
    ) {
      this.gameSocketService.createGameHistory(curGame);
      this.gameSocketService.createOrUpdateLadder(curGame);
      switch (curGame.status) {
        case GameStatus.GAME_OVER:
          this.server
            .to(curGameRoomId)
            .emit('gameOver', JSON.stringify(curGame.history));
          break;
        case GameStatus.GAME_OVER_IN_PLAYING:
          this.server.to(curGameRoomId).emit('gameOverInPlaying');
          break;
      }
      delete this.games[curGameRoomId];
      console.log('game deleted after finish');
    }
  }

  private updateRenderInfoInterval() {
    this.setIntervalId = setInterval(() => {
      if (Object.keys(this.games).length > 0) {
        for (const roomId in this.games) {
          if (this.games.hasOwnProperty(roomId)) {
            const curGame = this.games[roomId];
            if (curGame.status === GameStatus.IN_GAME) {
              this.updateRenderInfo(curGame);
            }
          }
        }
      } else {
        clearInterval(this.setIntervalId);
        this.isCalledOnce = false;
        console.log('updateGame finished');
      }
    }, 15);
  }

  afterInit(server: Server) {
    console.log(`game socket server: ${server} init`);
    setInterval(() => {
      console.log('check games length function called');
      if (!this.isCalledOnce && Object.keys(this.games).length > 0) {
        this.isCalledOnce = true;
        console.log('innerCalled');
        this.updateRenderInfoInterval();
      }
    }, 5000);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`game socket: ${client.id} connected`);
    let jwtPayload: any = null;
    if (client.handshake.headers?.cookie) {
      const token = parse(client.handshake.headers.cookie).access_token;
      try {
        jwtPayload = this.jwtService.verify(token);
      } catch (error: any) {
        jwtPayload = null;
      }
    }
    if (jwtPayload) {
      if (
        this.gameConnectionService.addGameConnection(jwtPayload['id'], client)
      ) {
        this.users[client.id] = new User(
          client.id,
          jwtPayload['id'],
          jwtPayload['nickname'],
          UserStatus.PRE_GAME,
        );
        console.log('User join : ', Object.keys(this.users).length);
        console.log('User id : ', this.users[client.id].userId);
      } else {
        client.emit('multipleLadderConnect');
        client.disconnect();
      }
    } else client.disconnect();
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`game socket: ${client.id} disconnected`);
    const disconnectedUser: User = this.users[client.id];
    this.gameConnectionService.removeGameConnection(disconnectedUser.userId);
    this.generalGameService.removeGeneralGame(disconnectedUser.userId);
    const roomId: string = this.users[client.id].roomId;
    console.log(`disconnected socket's room: ${roomId}`);
    const curGame: Game = this.games[roomId];
    // 게임에 룸에 참가한 유저가 끊겼을 경우 (게임 옵션 창까지 들어간 유저)
    if (curGame) {
      if (this.games[roomId].status === GameStatus.PRE_GAME) {
        // 룸에 남아있는 상대방에게 게임 종료 이벤트 전송 후 게임 삭제
        this.server.to(roomId).emit('gameOverInOptionPage');
        delete this.games[roomId];
        console.log('game deleted in option selection page');
      } else if (this.games[roomId].status === GameStatus.IN_GAME) {
        // 연결이 끊긴 플레이어의 상태를 offline으로 변경
        curGame.renderInfo.gamePlayers[client.id].updateStatus(
          UserStatus.OFFLINE,
        );
      }
    } else {
      // 대기열에서 끊긴 경우 (대기열 창 or 1:1 수락창)
      // 옵션창에서 게임 끊긴 상대방
      // - 끊긴 본인은 레더 큐에서 제거
      this.ladderQueue = this.ladderQueue.filter(
        element => element.id !== client.id,
      );
      console.log(`matching queue length : ${this.ladderQueue.length}`);
    }
    delete this.users[client.id];
    console.log('User left : ', Object.keys(this.users).length);
  }

  @SubscribeMessage('joinQueue')
  handleJoinQueue(@ConnectedSocket() client: Socket): void {
    this.ladderQueue.push(client);
    console.log('join queue');
    console.log(`matching queue pushed : ${this.ladderQueue.length}`);
    if (this.ladderQueue.length >= 2) {
      const frontSocket = this.ladderQueue.shift();
      const backSocket = this.ladderQueue.shift();
      if (frontSocket === undefined || backSocket === undefined) {
        return;
      }
      const leftUser = this.users[frontSocket.id];
      const rightUser = this.users[backSocket.id];

      if (frontSocket.id === backSocket.id) {
        console.log(`same socket! pop() queue`);
        this.ladderQueue.pop();
        console.log(`queue length : ${this.ladderQueue.length}`);
        return;
      }
      backSocket.leave(backSocket.id);
      backSocket.join(frontSocket.id);
      this.games[frontSocket.id] = new Game(
        frontSocket.id,
        GameStatus.PRE_GAME,
        GameType.LADDER,
      );
      console.log(
        `new game id: ${this.games[frontSocket.id].id} length : ${
          Object.keys(this.games).length
        }`,
      );
      leftUser.updateStatus(UserStatus.IN_GAME);
      rightUser.updateStatus(UserStatus.IN_GAME);
      leftUser.updateRoomId(frontSocket.id);
      rightUser.updateRoomId(frontSocket.id);
      this.games[frontSocket.id].addUser(leftUser);
      this.games[frontSocket.id].addUser(rightUser);
      this.server.to(frontSocket.id).emit('joinGame');
    }
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    const roomId = this.gameSocketService.getRoomId(client);
    const curGame = this.games[roomId];
    if (curGame === undefined) {
      return;
    }
    const readyDto: ReadyDto = JSON.parse(data);
    const leftSideUser = curGame.users[0];
    const rightSideUser = curGame.users[1];
    console.log(readyDto);
    let curMap: GameMap;
    if (this.gameSocketService.voteMap(curGame, readyDto) === true) {
      curMap = this.gameSocketService.setMap(curGame);
      const curRenderInfo = this.gameSocketService.initRenderInfo(
        curMap,
        leftSideUser,
        rightSideUser,
      );
      curGame.setRenderInfo(curRenderInfo);
      curGame.updateStatus(GameStatus.IN_READY);
      this.server.to(roomId).emit('gameStart');
    }
  }

  @SubscribeMessage('renderReady')
  handleRenderReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    const roomId = this.gameSocketService.getRoomId(client);
    const curGame = this.games[roomId];
    if (curGame === undefined) {
      return;
    }
    const curRenderInfo = curGame.renderInfo;
    const frameSizeDto: FrameSizeDto = JSON.parse(data);
    if (
      curRenderInfo?.clientWidth === undefined &&
      curRenderInfo?.clientHeight === undefined
    ) {
      this.gameSocketService.initRenderInfoPositon(curRenderInfo, frameSizeDto);
    }
    this.server
      .to(roomId)
      .emit('updateRenderInfo', JSON.stringify(curRenderInfo));
    curGame.updateStatus(GameStatus.IN_GAME);
  }

  @SubscribeMessage('keyDown')
  handleKeyDown(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    const roomId = this.gameSocketService.getRoomId(client);
    const curGame = this.games[roomId];
    if (curGame === undefined) {
      return;
    }
    const curRenderInfo = curGame.renderInfo;
    const curGamePlayerBar = curRenderInfo.gamePlayers[client.id].bar;
    // TODO: 함수 서비스단으로 뺴기
    switch (data) {
      case 'keyW':
        if (curGamePlayerBar.position.y - curGamePlayerBar.velocity.y >= 0) {
          curGamePlayerBar.updatePosition(0, -curGamePlayerBar.velocity.y);
        }
        break;
      case 'keyS':
        if (
          curGamePlayerBar.position.y +
            curGamePlayerBar.length +
            curGamePlayerBar.velocity.y <=
          curRenderInfo.clientHeight
        ) {
          curGamePlayerBar.updatePosition(0, curGamePlayerBar.velocity.y);
        }
        break;
    }
  }

  @SubscribeMessage('validateSocket')
  handleValidateSocket(@ConnectedSocket() client: Socket) {
    if (this.users[client.id].status === UserStatus.IN_GAME) {
      client.emit('validateSuccess');
    } else {
      // client.emit('validateFail');
      client.disconnect();
    }
  }

  @SubscribeMessage('validateSocketGeneral')
  handleValidateGeneralGameSocket(@ConnectedSocket() client: Socket) {
    if (
      this.generalGameService.validateSocketGeneral(
        this.users[client.id].userId,
      )
    ) {
      client.emit('validateSuccessGeneral');
    } else {
      client.emit('validateFail');
      client.disconnect();
    }
  }

  @SubscribeMessage('generalGameApprove')
  handleGeneralGameApprove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: number,
  ) {
    const fromUserId: number = data;
    if (!this.generalGameService.findGeneralGame(fromUserId)) {
      // 일반 게임을 요청한 사람의 소켓 연결이 끊겼을 때
      // 일반 게임을 수락한 유저에게 게임 매칭이 실패했음을 알린다.
      client.emit('generalGameFail');
      return;
    }
    const fromUserSocketId: string =
      this.gameConnectionService.getUserSocketInfoById(fromUserId).id;
    const leftUser = this.users[fromUserSocketId];
    const rightUser = this.users[client.id];
    client.leave(client.id);
    client.join(fromUserSocketId);
    this.games[fromUserSocketId] = new Game(
      fromUserSocketId,
      GameStatus.PRE_GAME,
      GameType.GENERAL,
    );
    console.log(
      `new game id: ${this.games[fromUserSocketId].id} length : ${
        Object.keys(this.games).length
      }`,
    );
    leftUser.updateStatus(UserStatus.IN_GAME);
    rightUser.updateStatus(UserStatus.IN_GAME);
    leftUser.updateRoomId(fromUserSocketId);
    rightUser.updateRoomId(fromUserSocketId);
    this.games[fromUserSocketId].addUser(leftUser);
    this.games[fromUserSocketId].addUser(rightUser);
    this.server.to(fromUserSocketId).emit('joinGame');
  }
}
