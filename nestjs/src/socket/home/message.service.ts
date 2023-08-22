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

@Injectable()
export class MessageService {
  constructor(
    @Inject(NormalJwt)
    private readonly jwtService: JwtService,
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}
  //           Map<[user_id, chat_room_id], true/false>
  private mute: Map<[string, string], boolean> = new Map();
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
