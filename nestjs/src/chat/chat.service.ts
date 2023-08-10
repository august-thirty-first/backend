import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
import { ChatStatus } from './enum/chat.status.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}

  createChat(createChatDto: CreateChatDto): Promise<void> {
    return this.chatRepository.createChat(createChatDto);
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

  async joinChat(
    chatParticipantCreateDto: ChatParticipantCreateDto,
    id: number,
  ) {
    return this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      id,
    );
  }
}
