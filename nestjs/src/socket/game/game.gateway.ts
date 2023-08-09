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

  afterInit(server: Server) {
    console.log(`game socket: ${server} init`);
  }

  handleConnection(client: Socket) {
    console.log(`game socket: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`game socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('joinQueue')
  handleMessage(client: any, payload: any): void {
    console.log('join queue');
  }
}
