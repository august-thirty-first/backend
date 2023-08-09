import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateChatDto } from './dto/chatCreate.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  createChat(@Body() createChatDto: CreateChatDto): Promise<void> {
    console.log('createChatDto', createChatDto);
    return this.chatService.createChat(createChatDto);
  }

  @Get()
  getAllChat() {
    return this.chatService.getAllChat();
  }
}
