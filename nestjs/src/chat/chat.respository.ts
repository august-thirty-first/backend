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
      order: { id: 'ASC' },
    });
  }

  getChatById(id: number): Promise<Chat> {
    return this.findOneBy({ id });
  }

  deleteChat(id: number): Promise<DeleteResult> {
    return this.chatRepository.delete({ id });
  }

  getChatByChatId(chat_room_id: number): Promise<Chat> {
    return this.findOneBy({ id: chat_room_id });
  }

  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const { room_name, status, password } = createChatDto;
    let chat;
    if (status === ChatStatus.PROTECTED || status === ChatStatus.PRIVATE) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      chat = this.create({ room_name, password: hashedPassword, status });
    } else {
      chat = this.create({ room_name, password: null, status });
    }
    try {
      await this.save(chat);
    } catch (error) {
      console.log(error);
    }
    return chat;
  }

  getChatRoomWithPassword(chat_room_id: number): Promise<Chat> {
    return this.chatRepository
      .createQueryBuilder('chat')
      .addSelect('chat.password')
      .where('chat.id = :id', { id: chat_room_id })
      .getOne();
  }
}
