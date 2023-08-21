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

  @Patch('/:id')
  updateChat(
    @Param('id', ParseIntPipe) id,
    @Body() createChatDto: CreateChatDto,
    @Req() req,
  ): Promise<Chat> {
    return this.chatService.updateChat(id, createChatDto, req.user.id);
  }

  @Get('participant/')
  getChatRoomByUserId(@Req() req): Promise<Chat[]> {
    return this.chatService.getChatRoomByUserId(req.user.id);
  }

  @Get('participant/:chat_room_id')
  getChatRoomByChatId(
    @Param('chat_room_id', ParseIntPipe) chat_room_id,
    @Req() req,
  ): Promise<ChatParticipant[]> {
    return this.chatService.getChatRoomByChatId(chat_room_id, req.user.id);
  }

  @Post('participant/permission')
  isUserJoinableChatRoom(
    @Body() chatJoinDto: ChatJoinDto,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.isUserJoinableChatRoom(req.user.id, chatJoinDto);
  }

  @Post('participant')
  joinChat(
    @Body() chatJoinDto: ChatJoinDto,
    @Req() req,
  ): Promise<ChatParticipant> {
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
