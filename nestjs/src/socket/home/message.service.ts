import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { ChatRepository } from 'src/chat/chat.respository';
import { ChatParticipantRepository } from 'src/chat/chatParticipant.repository';
import { ChatParticipantAuthority } from 'src/chat/enum/chatParticipant.authority.enum';
import { parse } from 'cookie';
import { NormalJwt } from 'src/jwt/interface/jwt.type';
import { JwtService } from '@nestjs/jwt';
import { MuteDto } from './dto/mute.dto';

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

  async muteUser(muteDto: MuteDto): Promise<string> {
    if (
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        parseInt(muteDto.target_user_id),
        parseInt(muteDto.roomId),
      )
    ) {
      const muteUser = this.mute.get([muteDto.target_user_id, muteDto.roomId]);
      if (!muteUser) {
        this.mute.set([muteDto.target_user_id, muteDto.roomId], true);
        setTimeout(() => {
          this.mute.delete([muteDto.target_user_id, muteDto.roomId]);
        }, 10000); //10초동안 mute
        return `user ${muteDto.target_user_id} is muted`;
      } else {
        return `user ${muteDto.target_user_id} is already muted`;
      }
    }
    return `user ${muteDto.target_user_id} is not in chat room id ${muteDto.roomId}`;
  }

  isImMute(user_id: string, chat_room_id: string): boolean {
    return this.mute.get([user_id, chat_room_id]);
  }
}
