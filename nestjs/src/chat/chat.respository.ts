import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
}
