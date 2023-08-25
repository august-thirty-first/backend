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

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
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
    userId: number,
    chatRoomId: number,
  ): Promise<ChatParticipant> {
    if (!(await this.chatRepository.getChatByChatId(chatRoomId))) {
      throw new UnauthorizedException(
        `chatRoomId ${chatRoomId} does not exist`,
      );
    }
    const participant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        chatRoomId,
      );
    if (!participant) {
      throw new UnauthorizedException(
        `userId ${userId} is not in chatRoomId ${chatRoomId}`,
      );
    }
    if (participant.authority === ChatParticipantAuthority.NORMAL) {
      throw new UnauthorizedException(`userId ${userId} is not boss or admin`);
    }
    return participant;
  }

  async createChat(
    createChatDto: CreateChatDto,
    userId: number,
  ): Promise<(Chat | ChatParticipant)[]> {
    this.checkChatStatusAndPassword(
      createChatDto.status,
      createChatDto.password,
    );
    const chat = await this.chatRepository.createChat(createChatDto);
    const chatRoomId = chat.id;
    const chatParticipantCreateDto = {
      chatRoomId,
      authority: ChatParticipantAuthority.BOSS,
    };
    const chatParticipant = await this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      userId,
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
    requestUserId: number,
  ): Promise<Chat> {
    const chat = await this.getChatById(id);
    if (!chat) {
      throw new NotFoundException(`Can't find Chat id ${id}`);
    }
    const participant = await this.checkAdminOrBoss(requestUserId, chat.id);
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
    chat.roomName = createChatDto.roomName;
    if (createChatDto.status === ChatStatus.PUBLIC) {
      chat.password = null;
    } else {
      const salt = await bcrypt.genSalt();
      chat.password = await bcrypt.hash(createChatDto.password, salt);
    }
    return this.chatRepository.save(chat);
  }

  async getChatRoomByUserId(userId: number): Promise<Chat[]> {
    const chatParticipants =
      await this.chatParticipantRepository.getChatRoomByUserId(userId);
    const chats = chatParticipants.map(participant => participant.chat);
    return chats;
  }

  async getAllParticipantByChatId(
    chatRoomId: number,
    userId: number,
  ): Promise<ChatParticipant[]> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        chatRoomId,
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
    const chatParticipants =
      await this.chatParticipantRepository.getChatRoomByChatId(chatRoomId);
    return chatParticipants;
  }

  async getMyParticipantByChatId(
    chatRoomId: number,
    userId: number,
  ): Promise<ChatParticipant> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        chatRoomId,
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

  async isUserJoinableChatRoom(userId: number, chatJoinDto: ChatJoinDto) {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        chatJoinDto.chatRoomId,
      );
    const chatRoom = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chatRoomId,
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
    userId: number,
    chatRoom: Chat,
  ): Promise<ChatParticipant> {
    if (chatRoom.status === ChatStatus.PUBLIC) {
      const chatParticipantCreateDto = {
        chatRoomId: chatJoinDto.chatRoomId,
        authority: ChatParticipantAuthority.NORMAL,
      };
      return this.chatParticipantRepository.joinChat(
        chatParticipantCreateDto,
        userId,
      );
    } else if (chatRoom.status === ChatStatus.PROTECTED) {
      if (!(await bcrypt.compare(chatJoinDto.password, chatRoom.password))) {
        throw new UnauthorizedException('password does not match');
      } else {
        const chatParticipantCreateDto = {
          chatRoomId: chatJoinDto.chatRoomId,
          authority: ChatParticipantAuthority.NORMAL,
        };
        return this.chatParticipantRepository.joinChat(
          chatParticipantCreateDto,
          userId,
        );
      }
    }
  }

  async joinChat(
    chatJoinDto: ChatJoinDto,
    userId: number,
  ): Promise<ChatParticipant> {
    const chat = await this.chatRepository.getChatRoomWithPassword(
      chatJoinDto.chatRoomId,
    );
    if (!chat) {
      throw new BadRequestException(
        `Chat room id ${chatJoinDto.chatRoomId} does not exist`,
      );
    }
    if (chat.status === ChatStatus.PRIVATE) {
      throw new BadRequestException('Can not join private room');
    }
    const participant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        userId,
        chatJoinDto.chatRoomId,
      );
    if (participant) {
      if (participant.ban) {
        throw new BadRequestException(
          `You have been banned from this chat room`,
        );
      } else {
        throw new BadRequestException(
          `User ${userId} already in ${chatJoinDto.chatRoomId}`,
        );
      }
    }
    return this.creatNewChat(chatJoinDto, userId, chat);
  }

  async updateAuthority(
    chatParticipantAuthorityDto: ChatParticipantAuthorityDto,
    requestUserId: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      requestUserId,
      chatParticipantAuthorityDto.chatRoomId,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        chatParticipantAuthorityDto.targetUserId,
        chatParticipantAuthorityDto.chatRoomId,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant userId ${chatParticipantAuthorityDto.targetUserId} chatRoomId ${chatParticipantAuthorityDto.chatRoomId}`,
      );
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
    targetUserId: number,
    chatRoomId: number,
    requestUserId: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      requestUserId,
      chatRoomId,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    if (requestUserId === targetUserId) {
      throw new UnauthorizedException('Can not ban yourself');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        targetUserId,
        chatRoomId,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant userId ${targetUserId} chatRoomId ${chatRoomId}`,
      );
    }
    if (chatParticipant.ban) {
      throw new NotFoundException(`Already banned`);
    }
    chatParticipant.ban = new Date();
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchUnBan(
    targetUserId: number,
    chatRoomId: number,
    requestUserId: number,
  ) {
    const requestParticipant = await this.checkAdminOrBoss(
      requestUserId,
      chatRoomId,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    if (requestUserId === targetUserId) {
      throw new UnauthorizedException('Can not unban yourself');
    }
    const chatParticipant =
      await this.chatParticipantRepository.getAllChatParticipantByUserChatRoom(
        targetUserId,
        chatRoomId,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant userId ${targetUserId} chatRoomId ${chatRoomId}`,
      );
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException(`Already not banned`);
    }
    chatParticipant.ban = null;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async leaveChatParticipant(
    chatRoomId: number,
    userId: number,
  ): Promise<void> {
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipantByUserChatRoom(
        userId,
        chatRoomId,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant userId ${userId} chatRoomId ${chatRoomId}`,
      );
    }
    if (chatParticipant.authority === ChatParticipantAuthority.BOSS) {
      await this.deleteChat(chatRoomId);
    } else {
      await this.chatParticipantRepository.deleteChatParticipant(
        chatRoomId,
        userId,
      );
    }
  }

  async kickChatParticipant(
    targetUserId: number,
    chatRoomId: number,
    requestUserId: number,
  ): Promise<void> {
    const requestParticipant = await this.checkAdminOrBoss(
      requestUserId,
      chatRoomId,
    );
    if (requestParticipant.ban) {
      throw new UnauthorizedException(
        'You have been banned from this chat room',
      );
    }
    const result = await this.chatParticipantRepository.delete({
      user: { id: targetUserId },
      chat: { id: chatRoomId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Can't find Chat with userId ${targetUserId} chatRoomId ${chatRoomId}`,
      );
    }
  }
}
