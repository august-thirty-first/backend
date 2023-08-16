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

  @Get('participant/')
  getChatRoomByUserId(@Req() req): Promise<Chat[]> {
    return this.chatService.getChatRoomByUserId(req.user.id);
  }

  @Get('participant/:chat_room_id')
  getChatRoomByChatId(
    @Param('chat_room_id', ParseIntPipe) chat_room_id,
  ): Promise<Chat[]> {
    return this.chatService.getChatRoomByChatId(chat_room_id);
  }

  @Post('participant')
  joinChat(@Body() chatJoinDto: ChatJoinDto, @Req() req) {
    return this.chatService.joinChat(chatJoinDto, req.user.id);
  }

  @Patch('participant/authority/:target_user_id/:chat_room_id')
  switchAuthority(
    @Param('target_user_id', ParseIntPipe) target_user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Body() authority: ChatParticipantAuthority,
    @Req() req,
  ) {
    return this.chatService.updateAuthority(
      target_user_id,
      chat_room_id,
      authority,
      req.user.id,
    );
  }

  @Patch('participant/ban/:target_user_id/:chat_room_id')
  switchBan(
    @Param('target_user_id', ParseIntPipe) target_user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
    @Req() req,
  ) {
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
  ) {
    return this.chatService.switchUnBan(
      target_user_id,
      chat_room_id,
      req.user.id,
    );
  }

  @Delete('participant/:user_id/:chat_room_id')
  deleteChatParticipant(
    @Param('user_id', ParseIntPipe) user_id: number,
    @Param('chat_room_id', ParseIntPipe) chat_room_id: number,
  ): Promise<void> {
    return this.chatService.deleteChatParticipant(user_id, chat_room_id);
  }
}
