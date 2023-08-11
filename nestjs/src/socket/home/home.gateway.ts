import { parse } from 'cookie';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'home',
  cors: {
    origin: ['http://localhost:4000'],
  },
})
export class HomeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @Inject(NormalJwt)
    private jwtService: JwtService,
  ) {}

  @WebSocketServer() server: Server;

  afterInit(client: Socket) {
    console.log('home gateway init');
  }

  handleConnection(client: Socket) {
    client.emit('connection', '서버에 접속하였습니다');
    const jwt = this.jwtService.decode(
      parse(client.handshake.headers.cookie).access_token,
    );

    client['nickname'] = jwt['nickname'];
    console.log(`home socket: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`home socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    console.log(payload);
    client
      .to(payload.roomId)
      .emit('message', `${client.nickname}: ${payload.inputMessage}`);
    return payload;
  }

  @SubscribeMessage('enterRoom')
  handleEnterRoom(client: any, roomId: number) {
    const currentRooms = client.rooms;

    for (const room of currentRooms) {
      if (room !== client.id) {
        client.leave(room);
        console.log(`leave Room: ${room}`);
      }
    }
    client.join(roomId);
    console.log(`join Room: ${roomId}`);
    client.emit('roomChange', roomId);
  }
}
