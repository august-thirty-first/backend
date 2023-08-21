import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
import { ChatRepository } from './chat.respository';
import { NotFoundException } from '@nestjs/common';

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
  ): Promise<ChatParticipant> {
    const { chat_room_id, authority } = chatParticipantCreateDto;
    const participant = this.create({
      chat: { id: chat_room_id },
      user: { id: user_id },
      authority,
    });
    try {
      await this.save(participant);
    } catch (error) {
      console.log(error);
    }
    return participant;
  }

  async joinAlreadInChat(
    participant: ChatParticipant,
  ): Promise<ChatParticipant> {
    return this.save(participant);
  }

  async getChatParticipant(
    user_id: number,
    chat_room_id,
  ): Promise<ChatParticipant> {
    const chatParticipant = await this.createQueryBuilder('cp')
      .where('cp.user_id = :user_id', { user_id })
      .andWhere('cp.chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find Chat with user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    return chatParticipant;
  }

  getChatRoomByUserId(user_id: number): Promise<ChatParticipant[]> {
    return this.find({
      relations: {
        chat: true,
      },
      where: {
        user: { id: user_id },
      },
    });
  }
  getChatRoomByChatId(chat_room_id: number): Promise<ChatParticipant[]> {
    return this.find({
      relations: {
        chat: true,
        user: true,
      },
      where: {
        chat: { id: chat_room_id },
      },
    });
  }

  async deleteChatParticipant(chat_room_id: number, user_id: number) {
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
