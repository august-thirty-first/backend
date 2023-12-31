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
import { ChatJoinDto } from './dto/chatJoin.dto';
import { ChatParticipantAuthorityDto } from './dto/chatParticipantAuthority.dto';
import { ChatParticipantWithBlackList } from './interfaces/ChatParticipantWithBlackList.interface';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Get()
  getOpenChat(): Promise<Chat[]> {
    return this.chatService.getOpenChat();
  }

  @Post()
  createChat(
    @Body() createChatDto: CreateChatDto,
    @Req() req,
  ): Promise<(Chat | ChatParticipant)[]> {
    return this.chatService.createChat(createChatDto, req.user.id);
  }

  @Patch('/:id')
  updateChat(
    @Param('id', ParseIntPipe) id,
    @Body() createChatDto: CreateChatDto,
    @Req() req,
  ): Promise<Chat> {
    return this.chatService.updateChat(id, createChatDto, req.user.id);
  }

  @Get('participation')
  getChatRoomByUserId(@Req() req): Promise<Chat[]> {
    return this.chatService.getChatRoomByUserId(req.user.id);
  }

  @Get('name/:chat_room_id')
  getChatNameById(@Param('chat_room_id') chat_room_id): Promise<Chat> {
    return this.chatService.getChatNameById(chat_room_id);
  }

  @Get('allParticipant/:chat_room_id')
  getAllParticipantByChatId(
    @Param('chat_room_id', ParseIntPipe) chat_room_id,
    @Req() req,
  ): Promise<ChatParticipantWithBlackList[]> {
    return this.chatService.getAllParticipantByChatId(
      chat_room_id,
      req.user.id,
    );
  }

  @Get('myParticipant/:chat_room_id')
  getMyParticipantByChatId(
    @Param('chat_room_id', ParseIntPipe) chat_room_id,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.getMyParticipantByChatId(chat_room_id, req.user.id);
  }

  @Post('enter')
  isUserJoinableChatRoom(
    @Body() chatJoinDto: ChatJoinDto,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.isUserJoinableChatRoom(req.user.id, chatJoinDto);
  }

  @Post('register')
  joinChat(
    @Body() chatJoinDto: ChatJoinDto,
    @Req() req,
  ): Promise<ChatParticipant | undefined> {
    return this.chatService.joinChat(chatJoinDto, req.user.id);
  }

  @Patch('participant/authority')
  switchAuthority(
    @Body() chatParticipantAuthorityDto: ChatParticipantAuthorityDto,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.updateAuthority(
      chatParticipantAuthorityDto,
      req.user.id,
    );
  }

  @Patch('participant/ban/:target_user_id/:chat_room_id')
  switchBan(
    @Param('target_user_id', ParseIntPipe) target_user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.switchBan(
      target_user_id,
      chat_room_id,
      req.user.id,
    );
  }

  @Patch('participant/unban/:target_user_id/:chat_room_id')
  switchUnBan(
    @Param('target_user_id', ParseIntPipe) target_user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.switchUnBan(
      target_user_id,
      chat_room_id,
      req.user.id,
    );
  }

  @Delete('participant/leave/:chat_room_id')
  leaveChatParticipant(
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ): Promise<void> {
    return this.chatService.leaveChatParticipant(chat_room_id, req.user.id);
  }

  @Delete('participant/kick/:target_user_id/:chat_room_id')
  kickChatParticipant(
    @Param('target_user_id', ParseIntPipe) target_user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ): Promise<void> {
    return this.chatService.kickChatParticipant(
      target_user_id,
      chat_room_id,
      req.user.id,
    );
  }
}
