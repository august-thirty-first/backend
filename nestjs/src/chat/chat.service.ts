import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
import { ChatStatus } from './enum/chat.status.enum';
import * as bcrypt from 'bcryptjs';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantAuthority } from './enum/chatParticipant.authority.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}

  async createChat(
    createChatDto: CreateChatDto,
    user_id: number,
  ): Promise<(Chat | ChatParticipant)[]> {
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
    const query = this.chatRepository.createQueryBuilder('Chat');
    const chats = await query.getMany();
    return chats;
  }

  async getChatById(id: number): Promise<Chat> {
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

  async getMyChatRoom(user_id: number): Promise<ChatParticipant[]> {
    return this.chatParticipantRepository
      .createQueryBuilder('cp')
      .innerJoin('cp.chat', 'c')
      .where('cp.user_id = :id', { id: user_id })
      .getMany();
  }

  async joinChatAsBoss(
    chatParticipantCreateDto: ChatParticipantCreateDto,
    user_id: number,
  ) {
    return this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      user_id,
    );
  }

  async joinChat(
    chatParticipantCreateDto: ChatParticipantCreateDto,
    user_id: number,
  ): Promise<ChatParticipant> {
    const participant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('cp.chat_room_id = :id', {
        id: chatParticipantCreateDto.chat_room_id,
      })
      .andWhere('cp.user_id = :id', { id: user_id })
      .getOne();
    if (participant) {
      if (participant.ban) {
        //ban이 되어있으면 exception을 날림
        throw new NotFoundException(
          `user_id ${user_id} was banned ${participant.ban}`,
        );
      } else {
        //ban이 설정되었다가 풀렸을때는 생성하지 않고 update만 해줌
        participant.authority = chatParticipantCreateDto.authority;
        return this.chatParticipantRepository.joinAlreadInChat(participant);
      }
    }
    //최초로 join을 하는 경우
    return this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      user_id,
    );
  }

  async updateAuthority(
    user_id: number,
    chat_room_id: number,
    authority: ChatParticipantAuthority,
  ) {
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    chatParticipant.authority = authority;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async updateBan(user_id: number, chat_room_id: number) {
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException(`Already banned`);
    }
    chatParticipant.ban = new Date();
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async updateNotBan(user_id: number, chat_room_id: number) {
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
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
