import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';

export class ChatParticipantRepository extends Repository<ChatParticipant> {
  constructor(
    @InjectRepository(ChatParticipant)
    private chatParticipantRepository: Repository<ChatParticipant>,
  ) {
    super(
      chatParticipantRepository.target,
      chatParticipantRepository.manager,
      chatParticipantRepository.queryRunner,
    );
  }

  async joinChat(
    chatParticipantCreateDto: ChatParticipantCreateDto,
    user_id: number,
  ) {
    const { chat_room_id, status } = chatParticipantCreateDto;
    const participant = this.create({
      chat: { id: chat_room_id },
      user: { id: user_id },
      status,
    });
    try {
      await this.save(participant);
    } catch (error) {
      console.log(error);
    }
    return participant;
  }
}
