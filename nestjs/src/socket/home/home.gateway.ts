import { parse } from 'cookie';
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

  afterInit(@ConnectedSocket() client: Socket) {
    console.log('home gateway init');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    client.emit('connection', '서버에 접속하였습니다');
    const jwt = this.jwtService.decode(
      parse(client.handshake.headers.cookie).access_token,
    );

    client['nickname'] = jwt['nickname'];
    console.log(`home socket: ${client.id} connected`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
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
