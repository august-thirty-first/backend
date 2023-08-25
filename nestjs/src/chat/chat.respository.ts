import { DeleteResult, In, Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChatDto } from './dto/chatCreate.dto';
import { ChatStatus } from './enum/chat.status.enum';
import * as bcrypt from 'bcryptjs';

export class ChatRepository extends Repository<Chat> {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {
    super(
      chatRepository.target,
      chatRepository.manager,
      chatRepository.queryRunner,
    );
  }

  getOpenChat(): Promise<Chat[]> {
    return this.find({
      where: { status: In([ChatStatus.PROTECTED, ChatStatus.PUBLIC]) },
    });
  }

  getChatById(id: number): Promise<Chat> {
    return this.findOneBy({ id });
  }

  deleteChat(id: number): Promise<DeleteResult> {
    return this.chatRepository.delete({ id });
  }

  getChatByChatId(chatRoomId: number): Promise<Chat> {
    return this.findOneBy({ id: chatRoomId });
  }

  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const { roomName, status, password } = createChatDto;
    let chat;
    if (status === ChatStatus.PROTECTED || status === ChatStatus.PRIVATE) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      chat = this.create({ roomName, password: hashedPassword, status });
    } else {
      chat = this.create({ roomName, password: null, status });
    }
    try {
      await this.save(chat);
    } catch (error) {
      console.log(error);
    }
    return chat;
  }

  getChatRoomWithPassword(chatRoomId: number): Promise<Chat> {
    return this.chatRepository
      .createQueryBuilder('chat')
      .addSelect('chat.password')
      .where('chat.id = :id', { id: chatRoomId })
      .getOne();
  }
}
