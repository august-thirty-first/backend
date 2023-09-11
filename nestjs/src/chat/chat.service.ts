import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';
import { ChatStatus } from './enum/chat.status.enum';
import * as bcrypt from 'bcryptjs';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantAuthority } from './enum/chatParticipant.authority.enum';
import { ChatJoinDto } from './dto/chatJoin.dto';
import { ChatParticipantAuthorityDto } from './dto/chatParticipantAuthority.dto';
import { BlackListRepository } from 'src/socket/home/blackList.repository';
import { ChatParticipantWithBlackList } from './interfaces/ChatParticipantWithBlackList.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
    @InjectRepository(BlackListRepository)
    private blackListRepository: BlackListRepository,
  ) {}

  checkChatStatusAndPassword(status: ChatStatus, password: string) {
    if (status === ChatStatus.PROTECTED || status === ChatStatus.PRIVATE) {
      if (!password || !password.trim()) {
        throw new BadRequestException('비밀번호가 필요합니다');
      }
    } else {
      if (password && password.trim()) {
        throw new BadRequestException(
          '공개방은 비밀번호를 설정할 수 없습니다.',
        );
      }
    }
  }

  async checkAdminOrBoss(
    user_id: number,
    chat_room_id: number,
  ): Promise<ChatParticipant> {
    if (!(await this.chatRepository.getChatByChatId(chat_room_id))) {
      throw new UnauthorizedException('채팅방을 찾을 수 없습니다');
    }
    const participant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chat_room_id,
      );
    if (!participant) {
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }
    if (participant.authority === ChatParticipantAuthority.NORMAL) {
      throw new UnauthorizedException('권한이 없습니다.');
    }
    return participant;
  }

  async createChat(
    createChatDto: CreateChatDto,
    user_id: number,
  ): Promise<(Chat | ChatParticipant)[]> {
    this.checkChatStatusAndPassword(
      createChatDto.status,
      createChatDto.password,
    );
    const chat = await this.chatRepository.createChat(createChatDto);
    const chat_room_id = chat.id;
    const chatParticipantCreateDto = {
      chat_room_id,
      authority: ChatParticipantAuthority.BOSS,
    };
    const chatParticipant = await this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      user_id,
    );
    const result = [chat, chatParticipant];
    return result;
  }

  getOpenChat(): Promise<Chat[]> {
    return this.chatRepository.getOpenChat();
  }

  getChatById(id: number): Promise<Chat | null> {
    return this.chatRepository.getChatById(id);
  }

  async deleteChat(id: number) {
    const result = await this.chatRepository.deleteChat(id);

    if (result.affected === 0) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }
  }

  async updateChat(
    id: number,
    createChatDto: CreateChatDto,
    request_user_id: number,
  ): Promise<Chat> {
    const chat = await this.getChatById(id);
    if (!chat) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }
    const participant = await this.checkAdminOrBoss(request_user_id, chat.id);
    if (participant.ban !== null) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    this.checkChatStatusAndPassword(
      createChatDto.status,
      createChatDto.password,
    );
    chat.status = createChatDto.status;
    chat.room_name = createChatDto.room_name;
    if (createChatDto.status === ChatStatus.PUBLIC) {
      chat.password = null;
    } else {
      const salt = await bcrypt.genSalt();
      chat.password = await bcrypt.hash(createChatDto.password, salt);
    }
    return this.chatRepository.save(chat);
  }

  async getChatRoomByUserId(user_id: number): Promise<Chat[]> {
    const chatParticipants =
      await this.chatParticipantRepository.getChatRoomByUserId(user_id);

    const chats = chatParticipants.map(participant => participant.chat);
    return chats;
  }

  async getChatNameById(chat_room_id: number): Promise<Chat> {
    const chat = await this.chatRepository.getChatByChatId(chat_room_id);
    if (!chat) throw new BadRequestException('채팅방이 존재하지 않습니다');
    return chat;
  }

  async getAllParticipantByChatId(
    chat_room_id: number,
    user_id: number,
  ): Promise<ChatParticipantWithBlackList[]> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new UnauthorizedException('채팅방에 참여할 권한이 없습니다.');
    } else if (chatParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    const blackList = await this.blackListRepository.getBlackListByFromId(
      user_id,
    );
    const blackListArray = blackList.map(element => element.to);
    const chatParticipants =
      await this.chatParticipantRepository.getChatRoomByChatId(chat_room_id);

    const participantsWithBlackList = chatParticipants.map(participant => {
      const isBlacklisted = blackListArray.some(
        blacklistedUser => blacklistedUser.id === participant.user.id,
      );
      return { ...participant, blackList: isBlacklisted };
    });
    return participantsWithBlackList;
  }

  async getMyParticipantByChatId(
    chat_room_id: number,
    user_id: number,
  ): Promise<ChatParticipant> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new UnauthorizedException('채팅방에 참여할 권한이 없습니다.');
    } else if (chatParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    return chatParticipant;
  }

  async isUserJoinableChatRoom(
    user_id: number,
    chatJoinDto: ChatJoinDto,
  ): Promise<ChatParticipant> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chatJoinDto.chat_room_id,
      );
    const chatRoom = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chat_room_id,
    );
    if (!chatParticipant) {
      throw new UnauthorizedException('채팅방에 참여할 권한이 없습니다.');
    } else if (chatParticipant.ban !== null) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    } else if (
      (chatRoom?.status === ChatStatus.PROTECTED ||
        chatRoom?.status === ChatStatus.PRIVATE) &&
      (!chatJoinDto.password ||
        !(await bcrypt.compare(chatJoinDto.password, chatRoom.password)))
    ) {
      throw new UnauthorizedException('잘못된 비밀번호입니다.');
    }
    return chatParticipant;
  }

  async creatNewChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
    chatRoom: Chat,
  ): Promise<ChatParticipant | undefined> {
    if (chatRoom.status === ChatStatus.PUBLIC) {
      const chatParticipantCreateDto = {
        chat_room_id: chatJoinDto.chat_room_id,
        authority: ChatParticipantAuthority.NORMAL,
      };
      return this.chatParticipantRepository.joinChat(
        chatParticipantCreateDto,
        user_id,
      );
    } else if (chatRoom.status === ChatStatus.PROTECTED) {
      if (!(await bcrypt.compare(chatJoinDto.password, chatRoom.password))) {
        throw new UnauthorizedException('잘못된 비밀번호입니다.');
      } else {
        const chatParticipantCreateDto = {
          chat_room_id: chatJoinDto.chat_room_id,
          authority: ChatParticipantAuthority.NORMAL,
        };
        return this.chatParticipantRepository.joinChat(
          chatParticipantCreateDto,
          user_id,
        );
      }
    }
  }

  async joinChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
  ): Promise<ChatParticipant | undefined> {
    const chat = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chat_room_id,
    );
    if (!chat) {
      throw new BadRequestException('채팅방을 찾을 수 없습니다.');
    }
    if (chat.status === ChatStatus.PRIVATE) {
      throw new BadRequestException('비공개방에는 참여할 수 없습니다.');
    }
    const participant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        user_id,
        chatJoinDto.chat_room_id,
      );
    if (participant) {
      if (participant.ban) {
        throw new BadRequestException('이 채팅방에서 추방당했습니다.');
      } else {
        throw new BadRequestException('이미 참여중입니다');
      }
    }
    return this.creatNewChat(chatJoinDto, user_id, chat);
  }

  async updateAuthority(
    chatParticipantAuthorityDto: ChatParticipantAuthorityDto,
    request_user_id: number,
  ): Promise<ChatParticipant> {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chatParticipantAuthorityDto.chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        chatParticipantAuthorityDto.target_user_id,
        chatParticipantAuthorityDto.chat_room_id,
      );
    if (!chatParticipant || chatParticipant.ban) {
      throw new NotFoundException(`채팅방을 나갔거나 추방당한 유저입니다.`);
    } else if (
      chatParticipantAuthorityDto.authority === ChatParticipantAuthority.BOSS
    ) {
      throw new UnauthorizedException('방장으로 권한을 바꿀 수 없습니다.');
    } else if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      throw new UnauthorizedException('방장의 권한은 바꿀 수 없습니다.');
    }
    chatParticipant.authority = chatParticipantAuthorityDto.authority;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchBan(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ): Promise<ChatParticipant> {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    if (request_user_id === target_user_id) {
      throw new UnauthorizedException('스스로 추방할 수 없습니다');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    } else if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      throw new BadRequestException('방장은 추방할 수 없습니다.');
    } else if (chatParticipant.ban) {
      throw new NotFoundException('이미 추방했습니다');
    }
    chatParticipant.ban = new Date();
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchUnBan(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ): Promise<ChatParticipant> {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    if (request_user_id === target_user_id) {
      throw new UnauthorizedException('스스로 추방을 해제할 수 없습니다');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException('이미 추방이 해제되어있습니다');
    }
    chatParticipant.ban = null;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async leaveChatParticipant(
    chat_room_id: number,
    user_id: number,
  ): Promise<void> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException('존재하지 않는 채팅방입니다.');
    }
    if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      await this.deleteChat(chat_room_id);
    } else {
      await this.chatParticipantRepository.deleteChatParticipant(
        chat_room_id,
        user_id,
      );
    }
  }

  async kickChatParticipant(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ): Promise<void> {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException('이 채팅방에서 추방당했습니다.');
    }
    const targetParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!targetParticipant) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    if (targetParticipant.ban) {
      throw new BadRequestException(
        '추방된 사용자는 내보낼 수 없습니다. 추방을 해제하고 다시 시도하세요',
      );
    }
    const result = await this.chatParticipantRepository.delete({
      user: { id: target_user_id },
      chat: { id: chat_room_id },
    });

    if (result.affected === 0) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }
  }
}
