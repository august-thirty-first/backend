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
import { GeneralGameService } from './generalGame.service';
import { GameConnectionService } from '../game/gameConnection.service';

@WebSocketGateway({
  namespace: 'home',
  cors: {
    origin: [`${process.env.FRONTEND_URL}`],
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
    private readonly generalGameService: GeneralGameService,
    private readonly gameConnectionService: GameConnectionService,
  ) {}
  @WebSocketServer() server: Server;

  afterInit() {
    // console.log('home gateway init');
  }

  async handleConnection(client: Socket) {
    const jwt = this.messageService.getJwt(client);
    if (jwt) {
      if (this.connectionService.addUserConnection(jwt['id'], client)) {
        client['user_id'] = jwt['id'];
        client['nickname'] = jwt['nickname'];
        client['token_expiration'] = jwt['exp'] * 1000;
        setTimeout(() => {
          if (client.connected && Date.now() > client['token_expiration']) {
            client.emit('expired', '토큰 만료');
            client.disconnect(true);
          }
        }, client['token_expiration'] - Date.now());
        // console.log(`home socket: ${client.id} connected`);
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
    this.generalGameService.removeGeneralGame(client['user_id']);
    // console.log(`home socket: ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const messageDto: MessageDto = JSON.parse(payload);
    if (this.messageService.isImMute(client['user_id'], messageDto.roomId)) {
      client.emit('message', '음소거 상태입니다');
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
        targetSocket.emit(
          'directMessage',
          `${client['nickname']}: ${directMessageDto.inputMessage}`,
        );
      }
    } else {
      client.emit('message', `오프라인 상태입니다`);
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
      client.emit('muteReturnStatus', '음소거시킬 수 있는 권한이 없습니다');
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
          targetSocket.emit('ban', '채팅방에서 추방당했습니다');
        }
      }
      client.emit('banReturnStatus', '추방 완료');
    } else {
      client.emit('banReturnStatus', '추방할 수 있는 권한이 없습니다');
    }
  }

  @SubscribeMessage('unban')
  async handleUnBanSomeone(@ConnectedSocket() client: Socket) {
    client.emit('unbanReturnStatus', '추방 해제 완료');
  }

  @SubscribeMessage('toAdmin')
  handleToAdmin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    const targetSocket = this.connectionService.findSocketByUserId(
      skillDto.targetUserId,
    );

    if (targetSocket) {
      targetSocket.emit(
        'toAdmin',
        `${targetSocket['nickname']}님에게 관리자 자격이 부여되었습니다.`,
      );
    }
    client.emit('toAdminReturnStatus', '관리자 권한 부여 성공');
    client.to(skillDto.roomId.toString()).emit('toAdmin');
  }

  @SubscribeMessage('toNormal')
  handleToNormal(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ) {
    const skillDto: SkillDto = JSON.parse(payload);
    const targetSocket = this.connectionService.findSocketByUserId(
      skillDto.targetUserId,
    );

    if (targetSocket) {
      targetSocket.emit(
        'toNormal',
        `${targetSocket['nickname']}님에게 관리자 자격이 해제되었습니다.`,
      );
    }
    client.emit('toNormalReturnStatus', '관리자 권한 취소 성공');
    client.to(skillDto.roomId.toString()).emit('toNormal');
  }

  @SubscribeMessage('kick')
  async handleKickSomeone(
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
      const targetSocket = this.connectionService.findSocketByUserId(
        skillDto.targetUserId,
      );
      client.emit(
        'kickReturnStatus',
        await this.messageService.kickUser(skillDto, targetSocket),
      );
    } else {
      client.emit('kickReturnStatus', '내보낼 수 있는 권한이 없습니다');
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
      .emit('deleteRoom', '채팅방이 삭제되었습니다');
    // console.log('delete room event');
    // console.log(payload);
  }

  @SubscribeMessage('leaveAllRoom')
  handleLeaveAllRoom(@ConnectedSocket() client: Socket) {
    const currentRooms = client.rooms;
    for (const room of currentRooms) {
      if (room !== client.id) {
        client.leave(room);
        // console.log(`leave Room: ${room}`);
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
    // console.log(`join Room: ${roomIdDto.roomId}`);
    client.emit('roomChange', roomIdDto.roomId);
    client
      .to(roomIdDto.roomId.toString())
      .emit('enterRoom', `${client['nickname']}이 참가했습니다`);
  }

  @SubscribeMessage('requestGeneralGame')
  handleRequestGeneralGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: number,
  ) {
    const fromUserId: number = client['user_id'];
    const fromUserNickname: string = client['nickname'];
    const toUserId: number = payload;
    const toUserSocket = this.connectionService.findSocketByUserId(toUserId);

    if (fromUserId === toUserId)
      client.emit('requestGeneralGameError', '자신한테 게임 요청?!');
    else if (toUserSocket) {
      const isGaming: boolean =
        this.gameConnectionService.findGameConnection(toUserId);
      if (isGaming)
        client.emit('requestGeneralGameError', '게임중인 유저입니다.');
      else if (this.generalGameService.addGeneralGame(fromUserId, toUserId)) {
        client.emit('waitingPlayer');
        toUserSocket.emit('selectJoin', fromUserId, fromUserNickname);
      }
    } else client.emit('requestGeneralGameError', '오프라인 유저입니다.');
  }
}
