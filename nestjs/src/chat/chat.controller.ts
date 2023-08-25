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

  @Get('allParticipant/:chatRoomId')
  getAllParticipantByChatId(
    @Param('chatRoomId', ParseIntPipe) chatRoomId,
    @Req() req,
  ): Promise<ChatParticipant[]> {
    return this.chatService.getAllParticipantByChatId(chatRoomId, req.user.id);
  }

  @Get('myParticipant/:chatRoomId')
  getMyParticipantByChatId(
    @Param('chatRoomId', ParseIntPipe) chatRoomId,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.getMyParticipantByChatId(chatRoomId, req.user.id);
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

  @Patch('participant/ban/:targetUserId/:chatRoomId')
  switchBan(
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.switchBan(targetUserId, chatRoomId, req.user.id);
  }

  @Patch('participant/unban/:targetUserId/:chatRoomId')
  switchUnBan(
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    @Req() req,
  ): Promise<ChatParticipant> {
    return this.chatService.switchUnBan(targetUserId, chatRoomId, req.user.id);
  }

  @Delete('participant/leave/:chatRoomId')
  leaveChatParticipant(
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    @Req() req,
  ): Promise<void> {
    return this.chatService.leaveChatParticipant(chatRoomId, req.user.id);
  }

  @Delete('participant/kick/:targetUserId/:chatRoomId')
  kickChatParticipant(
    @Param('targetUserId', ParseIntPipe) targetUserId: number,
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    @Req() req,
  ): Promise<void> {
    return this.chatService.kickChatParticipant(
      targetUserId,
      chatRoomId,
      req.user.id,
    );
  }
}
