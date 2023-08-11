import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateChatDto } from './dto/chatCreate.dto';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { ChatParticipantAuthority } from './enum/chatParticipant.authority.enum';
import { ChatJoinDto } from './dto/chatJoin.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Get()
  getAllChat(): Promise<Chat[]> {
    return this.chatService.getAllChat();
  }

  @Post()
  createChat(
    @Body() createChatDto: CreateChatDto,
    @Req() req,
  ): Promise<(Chat | ChatParticipant)[]> {
    return this.chatService.createChat(createChatDto, req.user.id);
  }

  @Delete('/:id')
  deleteChat(@Param('id', ParseIntPipe) id): Promise<void> {
    return this.chatService.deleteChat(id);
  }

  @Patch('/:id')
  updateChat(
    @Param('id', ParseIntPipe) id,
    @Body() createChatDto: CreateChatDto,
  ): Promise<Chat> {
    return this.chatService.updateChat(id, createChatDto);
  }

  @Get('participant/:user_id')
  getMyChatRoom(
    @Param('user_id', ParseIntPipe) user_id,
  ): Promise<ChatParticipant[]> {
    return this.chatService.getMyChatRoom(user_id);
  }

  @Post('participant')
  joinChat(@Body() chatJoinDto: ChatJoinDto, @Req() req) {
    return this.chatService.joinChat(chatJoinDto, req.user.id);
  }

  @Patch('participant/authority/:user_id/:chat_room_id')
  switchAuthority(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Body() authority: ChatParticipantAuthority,
    @Req() req,
  ) {
    return this.chatService.updateAuthority(
      user_id,
      chat_room_id,
      authority,
      req.user.id,
    );
  }

  @Patch('participant/ban/:user_id/:chat_room_id')
  switchBan(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ) {
    return this.chatService.updateBan(user_id, chat_room_id, req.user.id);
  }

  @Patch('participant/notban/:user_id/:chat_room_id')
  switchNotBan(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ) {
    return this.chatService.updateNotBan(user_id, chat_room_id, req.user.id);
  }

  @Delete('/:user_id/:chat_room_id')
  deleteCharParticipant(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
  ): Promise<void> {
    return this.chatService.deleteChatParticipant(user_id, chat_room_id);
  }
}
