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

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: ['http://localhost:4000'],
  },
})
export class GameSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(NormalJwt) private readonly jwtService: JwtService,
    private readonly gameSocketService: GameSocketService,
  ) {}

  @WebSocketServer() server: Server;

  private ladderQueue: Socket[] = [];
  private users: { [socketId: string]: User } = {};
  private games: { [roomId: string]: Game } = {};
  private setIntervalId: NodeJS.Timer;
  private isCalledOnce = false;

  private updateRenderInfo(curGame: Game) {
    const curRenderInfo = curGame.renderInfo;
    this.gameSocketService.updateBallPosition(curRenderInfo);
    this.gameSocketService.checkWallCollision(curRenderInfo);
    this.gameSocketService.checkBarCollision(curRenderInfo);
    this.gameSocketService.updateScore(curRenderInfo);
    this.server
      .to(curGame.id)
      .emit('updateRenderInfo', JSON.stringify(curRenderInfo));
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
    let jwtPayload = null;
    if (client.handshake.headers?.cookie) {
      const token = parse(client.handshake.headers.cookie).access_token;
      try {
        jwtPayload = this.jwtService.verify(token);
      } catch (error: any) {
        jwtPayload = null;
      }
    }
    if (jwtPayload) {
      this.users[client.id] = new User(
        client.id,
        jwtPayload['nickname'],
        jwtPayload['id'],
        UserStatus.ONLINE,
      );
      console.log('User join : ', Object.keys(this.users).length);
    } else client.disconnect(true);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`game socket: ${client.id} disconnected`);
    this.ladderQueue = this.ladderQueue.filter(
      element => element.id !== client.id,
    );
    console.log(`matching queue length : ${this.ladderQueue.length}`);
    const disconnectedUser: User = this.users[client.id];
    disconnectedUser.updateStatus(UserStatus.OFFLINE);
    // 소켓 연결이 해제된 유저가 속해있던 게임의 상태가 PRE_GAME일때 할 행동
    const roomId = this.users[client.id].roomId;
    console.log(`disconnected socket's room: ${roomId}`);
    const curGame = this.games[roomId];
    if (curGame) {
      if (this.games[roomId].status === GameStatus.PRE_GAME) {
        //TODO : gameEndBeforeStart 이벤트  만들기
        this.server.to(roomId).emit('gameEndBeforeStart');
      }
    }
    delete this.users[client.id];
    console.log('User left : ', Object.keys(this.users).length);
    delete this.games[roomId];
    console.log(
      `delte game id: ${roomId} games length: ${
        Object.keys(this.games).length
      }`,
    );
  }

  @SubscribeMessage('joinQueue')
  handleJoinQueue(@ConnectedSocket() client: Socket): void {
    this.ladderQueue.push(client);
    console.log('join queue');
    console.log(`matching queue pushed : ${this.ladderQueue.length}`);
    if (this.ladderQueue.length >= 2) {
      const frontSocket = this.ladderQueue[0];
      const backSocket = this.ladderQueue[1];
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
      this.ladderQueue = [];
      this.server.to(frontSocket.id).emit('joinGame');
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
      leftUser.updateRoomId(frontSocket.id);
      rightUser.updateRoomId(frontSocket.id);
      this.games[frontSocket.id].addUser(leftUser);
      this.games[frontSocket.id].addUser(rightUser);
    }
  }

  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
    const roomId = this.gameSocketService.getRoomId(client);
    const curGame = this.games[roomId];
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
    const curRenderInfo = curGame.renderInfo;
    const frameSizeDto: FrameSizeDto = JSON.parse(data);
    if (
      curRenderInfo.clientWidth === undefined &&
      curRenderInfo.clientHeight === undefined
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
    const curRenderInfo = curGame.renderInfo;
    const curGamePlayerBar = curRenderInfo.gamePlayers[client.id].bar;

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
}
