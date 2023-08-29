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
    if (fromUserId === toUserId) {
      return '스스로를 차단할 수 없습니다.';
    } else if (this.blackList.has([fromUserId, toUserId].toString())) {
      return '이미 차단하였습니다';
    } else {
      await this.blackListRepository.createBlackList(fromUserId, toUserId);
      this.blackList.set([fromUserId, toUserId].toString(), true);
      return '차단 완료';
    }
  }

  async unSetBlackList(fromUserId: number, toUserId: number): Promise<string> {
    if (fromUserId === toUserId) {
      return '스스로 차단을 해재할 수 없습니다.';
    } else if (!this.blackList.has([fromUserId, toUserId].toString())) {
      return '이미 차단이 해재되어있습니다.';
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
    return '차단 해제 완료';
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
    const targetParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        targetUserId,
        roomId,
      );
    if (!targetParticipant || targetParticipant.ban) {
      return `차단되어있거나 접속하지 않은 유저입니다`;
    } else if (targetParticipant.authority === ChatParticipantAuthority.BOSS) {
      return '방장을 음소거할 수 없습니다.';
    }
    const muteUser = this.mute.get([targetUserId, roomId].toString());
    if (!muteUser) {
      this.mute.set([targetUserId, roomId].toString(), true);
      setTimeout(() => {
        this.mute.delete([targetUserId, roomId].toString());
      }, 10000); //10초동안 mute
      return `10초간 음소거됩니다`;
    } else {
      return '이미 음소거 상태입니다';
    }
  }

  async kickUser(skillDto: SkillDto, targetSocket: Socket): Promise<string> {
    const willKickedUser =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        skillDto.targetUserId,
        skillDto.roomId,
      );
    if (!willKickedUser) {
      return '유저를 찾을 수 없습니다';
    } else if (willKickedUser.ban) {
      return '추방된 사용자는 내보낼 수 없습니다. 추방을 해제하고 다시 시도하세요';
    } else if (willKickedUser.authority === ChatParticipantAuthority.BOSS) {
      return '방장은 추방할 수 없습니다';
    }
    try {
      await this.chatParticipantRepository.deleteChatParticipant(
        skillDto.roomId,
        skillDto.targetUserId,
      );
    } catch {
      return '유저를 찾을 수 없습니다';
    }
    if (targetSocket) {
      targetSocket.leave(skillDto.roomId.toString());
      targetSocket.emit(`kick`, '관리자에 의해 채팅방에서 내보내졌습니다');
    }
    return `내보내기 성공`;
  }

  isImMute(userId: number, roomId: number): boolean {
    return this.mute.has([userId, roomId].toString());
  }
}
