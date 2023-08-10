import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatParticipant } from './entities/chatParticipant.entity';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.respository';
import { ChatParticipantRepository } from './chatParticipant.repository';
import { PassportsModule } from 'src/passports/passports.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PassportsModule,
    NormalJwtModule,
    TypeOrmModule.forFeature([Chat, ChatParticipant]),
  ],
  providers: [ChatService, ChatRepository, ChatParticipantRepository],
  controllers: [ChatController],
})
export class ChatModule {}
