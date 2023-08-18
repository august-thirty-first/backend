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
import { Inject } from '@nestjs/common';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import { JwtService } from '@nestjs/jwt';
import { MessageDto } from './dto/message.dto';
import { RoomIdDto } from './dto/roomId.dto';
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

  afterInit(@ConnectedSocket() client: Socket) {
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
    if (jwt) {
      if (this.connectionService.addUserConnection(jwt['id'], client)) {
        client['user_id'] = jwt['id'];
        client['nickname'] = jwt['nickname'];
        client['token_expiration'] = jwt['exp'] * 1000; // set milliseconds
        setTimeout(() => {
          if (client.connected && Date.now() > client['token_expiration']) {
            client.emit('expired', '토큰 만료');
            client.disconnect(true);
          }
        }, client['token_expiration'] - Date.now()); // timeOut 설정
        console.log(`home socket: ${client.id} connected`);
        client.emit('connection', '서버에 접속하였습니다');
      } else {
        setTimeout(() => {
          client.emit('multipleConnect', '다중 로그인');
          client.disconnect(true);
        }, 500);
      }
    } else client.disconnect(true);
  }

  handleDisconnect(client: Socket) {
    this.connectionService.removeUserConnection(client['user_id']);
    console.log(`home socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): string {
    const messageDto: MessageDto = JSON.parse(payload);
    client
      .to(messageDto.roomId)
      .emit('message', `${client['nickname']}: ${messageDto.inputMessage}`);
    return payload;
  }

  @SubscribeMessage('deleteRoom')
  handleOutOfRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): void {
    const roomIdDto: RoomIdDto = JSON.parse(payload);
    client
      .to(roomIdDto.roomId)
      .emit('deleteRoom', `roomId ${roomIdDto.roomId} deleted`);
    console.log('delete room event');
    console.log(payload);
  }

  @SubscribeMessage('enterRoom')
  handleEnterRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const currentRooms = client.rooms;
    const roomIdDto: RoomIdDto = JSON.parse(payload);

    for (const room of currentRooms) {
      if (room !== client.id) {
        client.leave(room);
        console.log(`leave Room: ${room}`);
      }
    }
    client.join(roomIdDto.roomId);
    console.log(`join Room: ${roomIdDto.roomId}`);
    client.emit('roomChange', roomIdDto.roomId);
  }
}
