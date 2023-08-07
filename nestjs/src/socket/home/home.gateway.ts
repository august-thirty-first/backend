import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'home',
  cors: {
    origin: ['http://localhost:4000'],
  },
})
export class HomeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(client: Socket) {
    console.log('home gateway init');
  }

  handleConnection(client: Socket) {
    client.emit('connection', '서버에 접속하였습니다');
    console.log(`home socket: ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`home socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    // client.emit('message', 'emit 보냄');
    this.server.emit('message', payload);
    return payload;
  }
}
