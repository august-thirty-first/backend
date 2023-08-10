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
import { ChatParticipantCreateDto } from './dto/chatParticipantCreate.dto';
import { Chat } from './entities/chat.entity';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Get()
  getAllChat(): Promise<Chat[]> {
    return this.chatService.getAllChat();
  }

  @Post()
  createChat(@Body() createChatDto: CreateChatDto): Promise<void> {
    return this.chatService.createChat(createChatDto);
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

  @Post('participant')
  joinChat(
    @Body() chatParticipantCreateDto: ChatParticipantCreateDto,
    @Req() req,
  ) {
    return this.chatService.joinChat(chatParticipantCreateDto, req.user.id);
  }
}
