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
        throw new BadRequestException(`${status} room require password`);
      }
    } else {
      if (password && password.trim()) {
        throw new BadRequestException(`${status} room do not require password`);
      }
    }
  }

  async checkAdminOrBoss(
    user_id: number,
    chat_room_id: number,
  ): Promise<ChatParticipant> {
    if (!(await this.chatRepository.getChatByChatId(chat_room_id))) {
      throw new UnauthorizedException(
        `chat_room_id ${chat_room_id} does not exist`,
      );
    }
    const participant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chat_room_id,
      );
    if (!participant) {
      throw new UnauthorizedException(
        `user_id ${user_id} is not in chat_room_id ${chat_room_id}`,
      );
    }
    if (participant.authority === ChatParticipantAuthority.NORMAL) {
      throw new UnauthorizedException(
        `user_id ${user_id} is not boss or admin`,
      );
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

  getChatById(id: number): Promise<Chat> {
    return this.chatRepository.getChatById(id);
  }

  async deleteChat(id: number) {
    const result = await this.chatRepository.deleteChat(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Can't find Chat with id ${id}`);
    }
  }

  async updateChat(
    id: number,
    createChatDto: CreateChatDto,
    request_user_id: number,
  ): Promise<Chat> {
    const chat = await this.getChatById(id);
    if (!chat) {
      throw new NotFoundException(`Can't find Chat id ${id}`);
    }
    const participant = await this.checkAdminOrBoss(request_user_id, chat.id);
    if (participant.ban !== null) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
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
      throw new UnauthorizedException(
        'You do not have permission for this chat room',
      );
    } else if (chatParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
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
    console.log(participantsWithBlackList);
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
      throw new UnauthorizedException(
        'You do not have permission for this chat room',
      );
    } else if (chatParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    return chatParticipant;
  }

  async isUserJoinableChatRoom(user_id: number, chatJoinDto: ChatJoinDto) {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        user_id,
        chatJoinDto.chat_room_id,
      );
    const chatRoom = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chat_room_id,
    );
    if (!chatParticipant) {
      throw new UnauthorizedException(
        'You do not have permission for this chat room',
      );
    } else if (chatParticipant.ban !== null) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    } else if (
      chatRoom.status === ChatStatus.PROTECTED &&
      (!chatJoinDto.password ||
        !(await bcrypt.compare(chatJoinDto.password, chatRoom.password)))
    ) {
      throw new UnauthorizedException('password does not match');
    }
    return chatParticipant;
  }

  async creatNewChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
    chatRoom: Chat,
  ): Promise<ChatParticipant> {
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
        throw new UnauthorizedException('password does not match');
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
  ): Promise<ChatParticipant> {
    const chat = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chat_room_id,
    );
    if (!chat) {
      throw new BadRequestException(
        `Chat room id ${chatJoinDto.chat_room_id} does not exist`,
      );
    }
    if (chat.status === ChatStatus.PRIVATE) {
      throw new BadRequestException('Can not join private room');
    }
    const participant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        user_id,
        chatJoinDto.chat_room_id,
      );
    if (participant) {
      if (participant.ban) {
        throw new BadRequestException(
          `You have been banned from this chat room`,
        );
      } else {
        throw new BadRequestException(
          `User ${user_id} already in ${chatJoinDto.chat_room_id}`,
        );
      }
    }
    return this.creatNewChat(chatJoinDto, user_id, chat);
  }

  async updateAuthority(
    chatParticipantAuthorityDto: ChatParticipantAuthorityDto,
    request_user_id: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chatParticipantAuthorityDto.chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    const chatParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        chatParticipantAuthorityDto.target_user_id,
        chatParticipantAuthorityDto.chat_room_id,
      );
    if (!chatParticipant || chatParticipant.ban) {
      throw new NotFoundException(`채팅방을 나갔거나 ban당한 유저입니다.`);
    } else if (
      chatParticipantAuthorityDto.authority === ChatParticipantAuthority.BOSS
    ) {
      throw new UnauthorizedException(`Can't switch authority to boss`);
    } else if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      throw new UnauthorizedException(`Can't switch boss's authority`);
    }
    chatParticipant.authority = chatParticipantAuthorityDto.authority;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchBan(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    if (request_user_id === target_user_id) {
      throw new UnauthorizedException('Can not ban yourself');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${target_user_id} chat_room_id ${chat_room_id}`,
      );
    } else if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      throw new BadRequestException('Can not ban boss');
    } else if (chatParticipant.ban) {
      throw new NotFoundException(`Already banned`);
    }
    chatParticipant.ban = new Date();
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchUnBan(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      request_user_id,
      chat_room_id,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    if (request_user_id === target_user_id) {
      throw new UnauthorizedException('Can not unban yourself');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${target_user_id} chat_room_id ${chat_room_id}`,
      );
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException(`Already not banned`);
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
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
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
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    const targetParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        target_user_id,
        chat_room_id,
      );
    if (!targetParticipant && targetParticipant.ban) {
      throw new BadRequestException(
        'ban이 된 사용자는 내보낼 수 없습니다. ban을 해제하고 다시 시도하세요',
      );
    }
    const result = await this.chatParticipantRepository.delete({
      user: { id: target_user_id },
      chat: { id: chat_room_id },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Can't find Chat with user_id ${target_user_id} chat_room_id ${chat_room_id}`,
      );
    }
  }
}
