import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private charParticipantRepository: ChatParticipantRepository,
  ) {}

  createChat(createChatDto: CreateChatDto): Promise<void> {
    return this.chatRepository.createChat(createChatDto);
  }

  async getAllChat(): Promise<Chat[]> {
    const query = this.chatRepository.createQueryBuilder('Chat');
    const chats = await query.getMany();
    return chats;
  }
}
