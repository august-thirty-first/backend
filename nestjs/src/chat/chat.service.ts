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

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}

  checkChatStatusAndPassword(status: ChatStatus, password: string) {
    if (status === ChatStatus.PROTECTED) {
      if (!password.trim()) {
        throw new BadRequestException('Protected room require password');
      }
    } else {
      if (password.trim()) {
        throw new BadRequestException(`${status} room do not require password`);
      }
    }
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

  async getAllChat(): Promise<Chat[]> {
    return await this.chatRepository.find();
  }

  getChatById(id: number): Promise<Chat> {
    return this.chatRepository.findOneBy({ id });
  }

  async deleteChat(id: number) {
    const result = await this.chatRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Can't find Chat with id ${id}`);
    }
  }

  async updateChat(id: number, createChatDto: CreateChatDto): Promise<Chat> {
    const chat = await this.getChatById(id);
    if (!chat) {
      throw new NotFoundException(`Can't find Chat id ${id}`);
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

  async getChatRoomByChatId(chat_room_id: number): Promise<Chat[]> {
    const chatParticipants =
      await this.chatParticipantRepository.getChatRoomByChatId(chat_room_id);
    const chats = chatParticipants.map(participant => participant.chat);
    return chats;
  }

  async joinAlreadyExistChat(
    participant: ChatParticipant,
    user_id: number,
  ): Promise<ChatParticipant> {
    if (participant.ban) {
      //ban이 되어있으면 exception을 날림
      throw new NotFoundException(
        `user_id ${user_id} was banned ${participant.ban}`,
      );
    } else {
      //ban이 설정되었다가 풀렸을때는 생성하지 않고 update만 해줌
      participant.authority = ChatParticipantAuthority.NORMAL;
      return this.chatParticipantRepository.joinAlreadInChat(participant);
    }
  }

  async joinNotExistChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
  ): Promise<ChatParticipant> {
    const chatRoom = await this.chatRepository.findOneBy({
      id: chatJoinDto.chat_room_id,
    });
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
    } else {
      //추후에 private room에 대한 로직 들어갈 예정
    }
  }

  async checkChatExist(id: number): Promise<Chat> {
    const result = await this.chatRepository.findOneBy({ id });

    if (result === null) {
      throw new BadRequestException(`Chat room id ${id} does not exist`);
    }
    return result;
  }

  async joinChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
  ): Promise<ChatParticipant> {
    const chat = await this.checkChatExist(chatJoinDto.chat_room_id);
    const participant = await this.chatParticipantRepository.getChatParticipant(
      user_id,
      chatJoinDto.chat_room_id,
    );
    await this.checkChatStatusAndPassword(chat.status, chatJoinDto.password);
    if (participant) {
      return this.joinAlreadyExistChat(participant, user_id);
    }
    //최초로 join을 하는 경우
    return this.joinNotExistChat(chatJoinDto, user_id);
  }

  async checkAdminOrBoss(user_id: number, chat_room_id: number): Promise<void> {
    const requestParticipant =
      await this.chatParticipantRepository.getChatParticipant(
        user_id,
        chat_room_id,
      );
    if (requestParticipant.authority === ChatParticipantAuthority.NORMAL) {
      throw new UnauthorizedException(
        `user_id ${user_id} is not boss or admin`,
      );
    }
  }

  async updateAuthority(
    target_user_id: number,
    chat_room_id: number,
    authority: ChatParticipantAuthority,
    request_user_id: number,
  ) {
    await this.checkChatExist(chat_room_id);
    await this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipant(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${target_user_id} chat_room_id ${chat_room_id}`,
      );
    }
    chatParticipant.authority = authority;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async switchBan(
    target_user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ) {
    await this.checkChatExist(chat_room_id);
    await this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipant(
        target_user_id,
        chat_room_id,
      );
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${target_user_id} chat_room_id ${chat_room_id}`,
      );
    }
    if (!chatParticipant.ban) {
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
    await this.checkChatExist(chat_room_id);
    await this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant =
      await this.chatParticipantRepository.getChatParticipant(
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

  async deleteChatParticipant(user_id, chat_room_id) {
    const result = await this.chatParticipantRepository.delete({
      user: { id: user_id },
      chat: { id: chat_room_id },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Can't find Chat with user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
  }
}
