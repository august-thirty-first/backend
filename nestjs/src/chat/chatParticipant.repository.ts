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

  getChatParticipantByUserChatRoom(
    user_id: number,
    chat_room_id: number,
  ): Promise<ChatParticipant> {
    return this.createQueryBuilder('cp')
      .where('cp.user_id = :user_id', { user_id })
      .andWhere('cp.chat_room_id = :chat_room_id', { chat_room_id })
      .andWhere('cp.ban IS NULL')
      .getOne();
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
      select: {
        user: {
          id: true,
          nickname: true,
          intra_name: false,
          avata_path: false,
          otp_key: false,
          created_at: false,
          updated_at: false,
        },
      },
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
