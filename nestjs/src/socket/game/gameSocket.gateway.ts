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

  afterInit(server: Server) {
    console.log(`game socket server: ${server} init`);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`game socket: ${client.id} connected`);
    const jwtPayload = this.jwtService.decode(
      parse(client.handshake.headers.cookie).access_token,
    );

    this.users[client.id] = new User(
      client,
      jwtPayload['nickname'],
      UserStatus.ONLINE,
    );
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
    const roomId = this.gameSocketService.getRoomId(client);
    const curGame = this.games[roomId];
    if (curGame) {
      if (this.games[roomId].status === GameStatus.PRE_GAME) {
        //TODO : PRE_GAME 이벤트  만들기
        this.server.to(roomId).emit('someEvent');
      }
    }
    delete this.users[client.id];
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
      );
      this.games[frontSocket.id].addUser(leftUser);
      this.games[frontSocket.id].addUser(rightUser);
    }
  }

  // @SubscribeMessage('ready')
  // handleReady(@ConnectedSocket() client: Socket, @MessageBody() data: string) {
  //   const dataObj: ReadyDto = JSON.parse(data);

  // }
}
