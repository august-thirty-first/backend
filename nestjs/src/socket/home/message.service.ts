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
  private mute: Map<[string, string], boolean> = new Map();
  //            Map<[from_user_id, to_user_id], true/false>
  private blackList: Map<[string, string], boolean> = new Map();

  async initBlackList(fromUserId: number) {
    const myBlackList = await this.blackListRepository.getBlackListByFromId(
      fromUserId,
    );
    // myBlackList 배열을 사용하여 blackList 맵 채우기
    myBlackList.forEach(item => {
      this.blackList.set([fromUserId.toString(), item.to.id.toString()], true);
    });
  }

  async setBlackList(fromUserId: string, toUserId: string): Promise<string> {
    if (this.blackList.has([fromUserId, toUserId])) {
      return 'already in black list';
    }
    await this.blackListRepository.createBlackList(
      parseInt(fromUserId),
      parseInt(toUserId),
    );
    this.blackList.set([fromUserId, toUserId], true);
    return 'set black list success';
  }

  async unSetBlackList(fromUserId: string, toUserId: string): Promise<string> {
    if (!this.blackList.has([fromUserId, toUserId])) {
      return 'already not in black list';
    }

    const result = await this.blackListRepository.deleteBlackList(
      parseInt(fromUserId),
      parseInt(toUserId),
    );
    if (result.affected == 0) {
      return 'delete error';
    } else {
      this.blackList.delete([fromUserId, toUserId]);
    }
    return 'unset black list success';
  }

  isBlackList(fromUserId: string, toUserId: string): boolean {
    return this.blackList.has([fromUserId, toUserId]);
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

  async isBossOrAdmin(user_id: number, roomId: number) {
    let result = false;

    const requestUser =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
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

  async muteUser(skillDto: SkillDto): Promise<string> {
    if (
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        parseInt(skillDto.targetUserId),
        parseInt(skillDto.roomId),
      )
    ) {
      const muteUser = this.mute.get([skillDto.targetUserId, skillDto.roomId]);
      if (!muteUser) {
        this.mute.set([skillDto.targetUserId, skillDto.roomId], true);
        setTimeout(() => {
          this.mute.delete([skillDto.targetUserId, skillDto.roomId]);
        }, 10000); //10초동안 mute
        return `user ${skillDto.targetUserId} is muted`;
      } else {
        return `user ${skillDto.targetUserId} is already muted`;
      }
    }
    return `user ${skillDto.targetUserId} is not in chat room id ${skillDto.roomId}`;
  }

  async kickUser(skillDto: SkillDto, targetSocket: Socket): Promise<string> {
    if (!targetSocket) {
      return `user ${skillDto.targetUserId} is not in chat room id ${skillDto.roomId}`;
    }

    const willKickedUser =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        parseInt(skillDto.targetUserId),
        parseInt(skillDto.roomId),
      );
    if (willKickedUser.authority === ChatParticipantAuthority.BOSS) {
      return `Can not kick boss ${skillDto.targetUserId}`;
    }
    try {
      await this.chatParticipantRepository.deleteChatParticipant(
        parseInt(skillDto.roomId),
        parseInt(skillDto.targetUserId),
      );
    } catch {
      return `user ${skillDto.targetUserId} is not in chat room id ${skillDto.roomId}`;
    }
    targetSocket.leave(skillDto.roomId);
    targetSocket.emit(`kick`, 'You have been kicked from the room');
    return `user ${skillDto.targetUserId} is kicked`;
  }

  isImMute(user_id: string, chat_room_id: string): boolean {
    return this.mute.get([user_id, chat_room_id]);
  }
}
