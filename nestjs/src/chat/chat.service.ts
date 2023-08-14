import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
import { ChatStatus } from './enum/chat.status.enum';
import * as bcrypt from 'bcryptjs';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantAuthority } from './enum/chatParticipant.authority.enum';
import { ChatJoinDto } from './dto/chatJoin.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,
    @InjectRepository(ChatParticipantRepository)
    private chatParticipantRepository: ChatParticipantRepository,
  ) {}

  checkChatStatusAndPassword(status: ChatStatus, password: string) {
    if (status === ChatStatus.PROTECTED) {
      if (password === null) {
        throw new BadRequestException('Protected room require password');
      }
    } else {
      if (password !== null) {
        throw new BadRequestException(`${status} room do not require password`);
      }
    }
  }
  async createChat(
    createChatDto: CreateChatDto,
    user_id: number,
  ): Promise<(Chat | ChatParticipant)[]> {
    this.checkChatStatusAndPassword(
      createChatDto.status,
      createChatDto.password,
    );
    const chat = await this.chatRepository.createChat(createChatDto);
    const chat_room_id = chat.id;
    const chatParticipantCreateDto = {
      chat_room_id,
      authority: ChatParticipantAuthority.BOSS,
    };
    const chatParticipant = await this.chatParticipantRepository.joinChat(
      chatParticipantCreateDto,
      user_id,
    );
    const result = [chat, chatParticipant];
    return result;
  }

  async getAllChat(): Promise<Chat[]> {
    const query = this.chatRepository.createQueryBuilder('Chat');
    const chats = await query.getMany();
    return chats;
  }

  async getChatById(id: number): Promise<Chat> {
    return this.chatRepository.findOneBy({ id });
  }

  async deleteChat(id: number) {
    const result = await this.chatRepository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Can't find Chat with id ${id}`);
    }
  }

  async updateChat(id: number, createChatDto: CreateChatDto): Promise<Chat> {
    this.checkChatStatusAndPassword(
      createChatDto.status,
      createChatDto.password,
    );
    const chat = await this.getChatById(id);
    if (!chat) {
      throw new NotFoundException(`Can't find Chat id ${id}`);
    }
    chat.status = createChatDto.status;
    chat.room_name = createChatDto.room_name;
    if (createChatDto.status === ChatStatus.PUBLIC) {
      chat.password = null;
    } else {
      const salt = await bcrypt.genSalt();
      chat.password = await bcrypt.hash(createChatDto.password, salt);
    }
    return this.chatRepository.save(chat);
  }

  async getMyChatRoom(user_id: number): Promise<ChatParticipant[]> {
    return this.chatParticipantRepository
      .createQueryBuilder('cp')
      .innerJoin('cp.chat', 'c')
      .where('cp.user_id = :id', { id: user_id })
      .getMany();
  }

  async joinAlreadyExistChat(
    participant: ChatParticipant,
    user_id: number,
  ): Promise<ChatParticipant> {
    if (participant.ban) {
      //ban이 되어있으면 exception을 날림
      throw new NotFoundException(
        `user_id ${user_id} was banned ${participant.ban}`,
      );
    } else {
      //ban이 설정되었다가 풀렸을때는 생성하지 않고 update만 해줌
      participant.authority = ChatParticipantAuthority.NORMAL;
      return this.chatParticipantRepository.joinAlreadInChat(participant);
    }
  }

  async joinNotExistChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
  ): Promise<ChatParticipant> {
    const chatRoom = await this.chatRepository.findOneBy({
      id: chatJoinDto.chat_room_id,
    });
    if (chatRoom.status === ChatStatus.PUBLIC) {
      const chatParticipantCreateDto = {
        chat_room_id: chatJoinDto.chat_room_id,
        authority: ChatParticipantAuthority.NORMAL,
      };
      return this.chatParticipantRepository.joinChat(
        chatParticipantCreateDto,
        user_id,
      );
    } else if (chatRoom.status === ChatStatus.PROTECTED) {
      if (!(await bcrypt.compare(chatJoinDto.password, chatRoom.password))) {
        throw new UnauthorizedException('password does not match');
      } else {
        const chatParticipantCreateDto = {
          chat_room_id: chatJoinDto.chat_room_id,
          authority: ChatParticipantAuthority.NORMAL,
        };
        return this.chatParticipantRepository.joinChat(
          chatParticipantCreateDto,
          user_id,
        );
      }
    } else {
      //추후에 private room에 대한 로직 들어갈 예정
    }
  }

  async joinChat(
    chatJoinDto: ChatJoinDto,
    user_id: number,
  ): Promise<ChatParticipant> {
    const participant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('cp.chat_room_id = :id', {
        id: chatJoinDto.chat_room_id,
      })
      .andWhere('cp.user_id = :id', { id: user_id })
      .getOne();
    this.checkChatStatusAndPassword(
      participant.chat.status,
      chatJoinDto.password,
    );
    if (participant) {
      return this.joinAlreadyExistChat(participant, user_id);
    }
    //최초로 join을 하는 경우
    return this.joinNotExistChat(chatJoinDto, user_id);
  }

  async checkAdminOrBoss(user_id: number, chat_room_id: number): Promise<void> {
    const requestParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (requestParticipant.authority === ChatParticipantAuthority.NORMAL) {
      throw new UnauthorizedException(
        `user_id ${user_id} is not boss or admin`,
      );
    }
  }

  async updateAuthority(
    user_id: number,
    chat_room_id: number,
    authority: ChatParticipantAuthority,
    request_user_id: number,
  ) {
    this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    chatParticipant.authority = authority;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async updateBan(
    user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ) {
    this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException(`Already banned`);
    }
    chatParticipant.ban = new Date();
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async updateNotBan(
    user_id: number,
    chat_room_id: number,
    request_user_id: number,
  ) {
    this.checkAdminOrBoss(request_user_id, chat_room_id);
    const chatParticipant = await this.chatParticipantRepository
      .createQueryBuilder('cp')
      .where('user_id = :user_id', { user_id })
      .andWhere('chat_room_id = :chat_room_id', { chat_room_id })
      .getOne();
    if (!chatParticipant) {
      throw new NotFoundException(
        `Can't find ChatParticipant user_id ${user_id} chat_room_id ${chat_room_id}`,
      );
    }
    if (!chatParticipant.ban) {
      throw new NotFoundException(`Already not banned`);
    }
    chatParticipant.ban = null;
    return this.chatParticipantRepository.save(chatParticipant);
  }

  async deleteChatParticipant(user_id, chat_room_id) {
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
