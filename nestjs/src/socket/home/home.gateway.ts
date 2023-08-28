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
import { MessageService } from './message.service';
import { SkillDto } from './dto/skill.dto';
import { directMessageDto } from './dto/directMessage.dto';
import { UserIdDto } from './dto/userId.dto';

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
    private readonly messageService: MessageService,
  ) {}
  @WebSocketServer() server: Server;

  afterInit(@ConnectedSocket() client: Socket) {
    console.log('home gateway init');
  }

  async handleConnection(client: Socket) {
    const jwt = this.messageService.getJwt(client);
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
        await this.messageService.initBlackList(jwt['id']);
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
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const messageDto: MessageDto = JSON.parse(payload);
    if (this.messageService.isImMute(client['user_id'], messageDto.roomId)) {
      client.emit('message', 'Muted!!!!');
    } else {
      this.connectionService.getUserConnection().forEach((socketId, userId) => {
        if (
          socketId !== client &&
          socketId.rooms.has(messageDto.roomId.toString()) &&
          client.rooms.has(messageDto.roomId.toString()) &&
          !this.messageService.isBlackList(userId, client['user_id'])
        ) {
          socketId.emit(
            'message',
            `${client['nickname']}: ${messageDto.inputMessage}`,
          );
        }
      });
    }
  }

  @SubscribeMessage('directMessage')
  handleRequestDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const directMessageDto: directMessageDto = JSON.parse(payload);
    const targetSocket = this.connectionService.findSocketByUserId(
      directMessageDto.targetUserId,
    );
    if (targetSocket) {
      if (
        !this.messageService.isBlackList(
          directMessageDto.targetUserId,
          client['user_id'],
        )
      ) {
        this.handleLeaveAllRoom(client);
        targetSocket.emit(
          'directMessage',
          `${client['nickname']}: ${directMessageDto.inputMessage}`,
        );
      }
    } else {
      client.emit('directMessage', `${targetSocket['nickname']} is offline`);
    }
  }

  @SubscribeMessage('setBlackList')
  async handleBlackList(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const userIdDto: UserIdDto = JSON.parse(payload);

    client.emit(
      'setBlackList',
      await this.messageService.setBlackList(
        client['user_id'],
        userIdDto.userId,
      ),
    );
  }

  @SubscribeMessage('unSetBlackList')
  async handleUnSetBlackList(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const userIdDto: UserIdDto = JSON.parse(payload);

    client.emit(
      'unSetBlackList',
      await this.messageService.unSetBlackList(
        client['user_id'],
        userIdDto.userId,
      ),
    );
  }

  @SubscribeMessage('mute')
  async handleMuteSomeone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    if (
      await this.messageService.isBossOrAdmin(
        client['user_id'],
        skillDto.roomId,
      )
    ) {
      client.emit(
        'muteReturnStatus',
        await this.messageService.muteUser(
          skillDto.roomId,
          skillDto.targetUserId,
        ),
      );
    } else {
      client.emit(
        'muteReturnStatus',
        'You do not have the right to mute others',
      );
    }
  }

  @SubscribeMessage('ban')
  async handleBanSomeone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    const targetSocket = this.connectionService.findSocketByUserId(
      skillDto.targetUserId,
    );
    if (
      await this.messageService.isBossOrAdmin(
        client['user_id'],
        skillDto.roomId,
      )
    ) {
      if (targetSocket) {
        const rooms = targetSocket.rooms;
        if (rooms && rooms.has(skillDto.roomId.toString())) {
          targetSocket.leave(skillDto.roomId.toString());
          targetSocket.emit(
            'ban',
            `You have been left from the room: ${skillDto.roomId}`,
          );
        }
      }
      client.emit(
        'banReturnStatus',
        'Successfully banned the user and left them from the room',
      );
    } else {
      client.emit('banReturnStatus', 'You do not have the right to ban others');
    }
  }

  @SubscribeMessage('unban')
  async handleUnBanSomeone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    const targetSocket = this.connectionService.findSocketByUserId(
      skillDto.targetUserId,
    );

    // if (targetSocket) {
    //   targetSocket.emit('ban', `${skillDto.roomId} 채팅방에서 ban이 해제되었습니다.`);
    // }
    // 여기서 `${채팅방 이름}에서 ban이 해제되었습니다.` 이런 메시지를 보내줄 수 있었으면 좋겠는데 채팅방 이름을 받아올 방법이...ㅜ
    client.emit(
      'unbanReturnStatus',
      'Successfully unbaned the user and left them from the room',
    );
  }

  @SubscribeMessage('kick')
  async handleKickSomeone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    if (this.messageService.isBossOrAdmin(client['user_id'], skillDto.roomId)) {
      const targetSocket = this.connectionService.findSocketByUserId(
        skillDto.targetUserId,
      );
      client.emit(
        'kickReturnStatus',
        await this.messageService.kickUser(skillDto, targetSocket),
      );
    } else {
      client.emit(
        'kickReturnStatus',
        'You do not have the right to kick others',
      );
    }
  }

  @SubscribeMessage('deleteRoom')
  handleOutOfRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): void {
    const roomIdDto: RoomIdDto = JSON.parse(payload);
    client
      .to(roomIdDto.roomId.toString())
      .emit('deleteRoom', `roomId ${roomIdDto.roomId} deleted`);
    console.log('delete room event');
    console.log(payload);
  }

  @SubscribeMessage('leaveAllRoom')
  handleLeaveAllRoom(@ConnectedSocket() client: Socket) {
    const currentRooms = client.rooms;
    for (const room of currentRooms) {
      if (room !== client.id) {
        client.leave(room);
        console.log(`leave Room: ${room}`);
      }
    }
  }

  @SubscribeMessage('enterRoom')
  handleEnterRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const roomIdDto: RoomIdDto = JSON.parse(payload);

    this.handleLeaveAllRoom(client);
    client.join(roomIdDto.roomId.toString());
    console.log(`join Room: ${roomIdDto.roomId}`);
    client.emit('roomChange', roomIdDto.roomId);
  }
}
