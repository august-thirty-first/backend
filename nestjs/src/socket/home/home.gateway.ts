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
import { ConnectionService } from './connection.service';
import { parse } from 'cookie';

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
    private readonly jwtService: JwtService,
    private readonly connectionService: ConnectionService,
  ) {}
  @WebSocketServer() server: Server;

  afterInit(client: Socket) {
    console.log('home gateway init');
  }

  handleConnection(client: Socket) {
    let jwt = null;
    if (client.handshake.headers?.cookie) {
      const token = parse(client.handshake.headers.cookie).access_token;
      try {
        jwt = this.jwtService.verify(token);
      } catch (error: any) {
        jwt = null;
      }
    }
    if (jwt && this.connectionService.addUserConnection(jwt['id'], client)) {
      client['user_id'] = jwt['id'];
      client['nickname'] = jwt['nickname'];
      client['token_expiration'] = jwt['exp'] * 1000; // set milliseconds
      setTimeout(() => {
        if (client.connected && Date.now() > client['token_expiration'])
          client.disconnect(); // handleDisconnect 함수 실행 됨
      }, client['token_expiration'] - Date.now()); // timeOut 설정
      console.log(`home socket: ${client.id} connected`);
      client.emit('connection', '서버에 접속하였습니다');
    } else client.disconnect(true);
  }

  handleDisconnect(client: Socket) {
    this.connectionService.removeUserConnection(client['user_id']);
    console.log(`home socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
