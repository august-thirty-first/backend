import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipant } from './entities/chatParticipant.entity';

export class ChatParticipantRepository extends Repository<ChatParticipant> {
  constructor(
    @InjectRepository(Chat)
    private chatParticipantRepository: Repository<ChatParticipant>,
  ) {
    super(
      chatParticipantRepository.target,
      chatParticipantRepository.manager,
      chatParticipantRepository.queryRunner,
    );
  }
}
