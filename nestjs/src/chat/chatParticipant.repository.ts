import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
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
    userId: number,
  ): Promise<ChatParticipant> {
    const { chatRoomId, authority } = chatParticipantCreateDto;
    const participant = this.create({
      chat: { id: chatRoomId },
      user: { id: userId },
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

  getAllChatParticipantByUserChatRoom(
    userId: number,
    chatRoomId: number,
  ): Promise<ChatParticipant> {
    return this.createQueryBuilder('cp')
      .where('cp.user_id = :user_id', { userId })
      .andWhere('cp.chat_room_id = :chat_room_id', { chatRoomId })
      .getOne();
  }

  getChatParticipantByUserChatRoom(
    userId: number,
    chatRoomId: number,
  ): Promise<ChatParticipant> {
    return this.createQueryBuilder('cp')
      .where('cp.user_id = :user_id', { userId })
      .andWhere('cp.chat_room_id = :chat_room_id', { chatRoomId })
      .andWhere('cp.ban IS NULL')
      .getOne();
  }

  getChatRoomByUserId(userId: number): Promise<ChatParticipant[]> {
    return this.find({
      relations: {
        chat: true,
      },
      where: {
        user: { id: userId },
      },
    });
  }

  getChatRoomByChatId(chatRoomId: number): Promise<ChatParticipant[]> {
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
        chat: { id: chatRoomId },
      },
    });
  }

  async deleteChatParticipant(chatRoomId: number, userId: number) {
    const result = await this.chatParticipantRepository.delete({
      user: { id: userId },
      chat: { id: chatRoomId },
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Can't find Chat with user_id ${userId} chat_room_id ${chatRoomId}`,
      );
    }
  }
}
