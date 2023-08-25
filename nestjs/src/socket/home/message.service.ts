import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRepository } from 'src/chat/chat.respository';
import { ChatParticipantRepository } from 'src/chat/chatParticipant.repository';
import { ChatParticipantAuthority } from 'src/chat/enum/chatParticipant.authority.enum';
import { parse } from 'cookie';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import { JwtService } from '@nestjs/jwt';
import { SkillDto } from './dto/skill.dto';
import { BlackListRepository } from './blackList.repository';

@Injectable()
export class MessageService {
  constructor(
    @Inject(NormalJwt)
    private readonly jwtService: JwtService,
    @InjectRepository(BlackListRepository)
    private blackListRepository: BlackListRepository,
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}
  //            Map<[user_id, chat_room_id], true/false>
  private mute: Map<string, boolean> = new Map();
  //            Map<[from_user_id, to_user_id], true/false>
  private blackList: Map<string, boolean> = new Map();

  async initBlackList(fromUserId: number) {
    const myBlackList = await this.blackListRepository.getBlackListByFromId(
      fromUserId,
    );
    // myBlackList 배열을 사용하여 blackList 맵 채우기
    myBlackList.forEach(item => {
      this.blackList.set([fromUserId, item.to.id].toString(), true);
    });
  }

  async setBlackList(fromUserId: number, toUserId: number): Promise<string> {
    if (this.blackList.has([fromUserId, toUserId].toString())) {
      return 'already in black list';
    }
    await this.blackListRepository.createBlackList(fromUserId, toUserId);
    this.blackList.set([fromUserId, toUserId].toString(), true);
    return 'set black list success';
  }

  async unSetBlackList(fromUserId: number, toUserId: number): Promise<string> {
    if (!this.blackList.has([fromUserId, toUserId].toString())) {
      return 'already not in black list';
    }

    const result = await this.blackListRepository.deleteBlackList(
      fromUserId,
      toUserId,
    );
    if (result.affected == 0) {
      return 'delete error';
    } else {
      this.blackList.delete([fromUserId, toUserId].toString());
    }
    return 'unset black list success';
  }

  isBlackList(fromUserId: number, toUserId: number): boolean {
    return this.blackList.has([fromUserId, toUserId].toString());
  }

  getJwt(client: Socket) {
    let jwt = null;
    if (client.handshake.headers?.cookie) {
      const token = parse(client.handshake.headers.cookie).access_token;
      try {
        jwt = this.jwtService.verify(token);
      } catch (error: any) {
        jwt = null;
      }
    }
    return jwt;
  }

  async isBossOrAdmin(userId: number, roomId: number) {
    let result = false;

    const requestUser =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        roomId,
      );
    if (
      requestUser &&
      !(requestUser.authority === ChatParticipantAuthority.NORMAL)
    ) {
      result = true;
    }

    return result;
  }

  async muteUser(roomId: number, targetUserId: number): Promise<string> {
    if (
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        targetUserId,
        roomId,
      )
    ) {
      const muteUser = this.mute.get([targetUserId, roomId].toString());
      if (!muteUser) {
        this.mute.set([targetUserId, roomId].toString(), true);
        setTimeout(() => {
          this.mute.delete([targetUserId, roomId].toString());
        }, 10000); //10초동안 mute
        return `user ${targetUserId} is muted`;
      } else {
        return `user ${targetUserId} is already muted`;
      }
    }
    return `user ${targetUserId} is not in chat room id ${roomId}`;
  }

  async kickUser(skillDto: SkillDto, targetSocket: Socket): Promise<string> {
    const willKickedUser =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        skillDto.targetUserId,
        skillDto.roomId,
      );
    if (!targetSocket || !willKickedUser) {
      return `user ${skillDto.targetUserId} is not in chat room id ${skillDto.roomId}`;
    }
    if (willKickedUser.authority === ChatParticipantAuthority.BOSS) {
      return `Can not kick boss ${skillDto.targetUserId}`;
    }
    try {
      await this.chatParticipantRepository.deleteChatParticipant(
        skillDto.roomId,
        skillDto.targetUserId,
      );
    } catch {
      return `user ${skillDto.targetUserId} is not in chat room id ${skillDto.roomId}`;
    }
    targetSocket.leave(skillDto.roomId.toString());
    targetSocket.emit(`kick`, 'You have been kicked from the room');
    return `user ${skillDto.targetUserId} is kicked`;
  }

  isImMute(userId: number, roomId: number): boolean {
    return this.mute.has([userId, roomId].toString());
  }
}
