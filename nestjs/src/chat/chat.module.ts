import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    NormalJwtModule,
    TypeOrmModule.forFeature([Chat, ChatParticipant]),
  ],
  providers: [ChatService],
})
export class ChatModule {}
