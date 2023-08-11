import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NormalJwt } from 'src/jwt/interface/jwt.type';

@WebSocketGateway({
  namespace: 'game',
  cors: {
    origin: ['http://localhost:4000'],
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(@Inject(NormalJwt) private readonly jwtService: JwtService) {}
  @WebSocketServer() server: Server;

  private ladderQueue: Socket[] = [];

  afterInit(server: Server) {
    console.log(`game socket: ${server} init`);
  }

  handleConnection(client: Socket) {
    console.log(`game socket: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`game socket: ${client.id} disconnected`);
    this.ladderQueue = this.ladderQueue.filter(
      element => element.id !== client.id,
    );
    console.log(`matching queue length : ${this.ladderQueue.length}`);
  }

  @SubscribeMessage('joinQueue')
  handleMessage(client: Socket): void {
    console.log('join queue');
    this.ladderQueue.push(client);
    console.log(`matching queue pushed : ${this.ladderQueue.length}`);
    if (this.ladderQueue.length >= 2) {
      const frontSocket = this.ladderQueue[0];
      const backSocket = this.ladderQueue[1];
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
    }
  }
}
