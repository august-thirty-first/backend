import { Repository } from 'typeorm';
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

  async createChat(createChatDto: CreateChatDto): Promise<Chat> {
    const { room_name, status, password } = createChatDto;
    let chat;
    if (status === ChatStatus.PROTECTED) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      chat = this.create({ room_name, password: hashedPassword, status });
    } else {
      chat = this.create({ room_name, password: null, status });
    }
    try {
      return this.save(chat);
    } catch (error) {
      console.log(error);
    }
  }
}
