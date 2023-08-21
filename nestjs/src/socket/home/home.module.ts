import { Module } from '@nestjs/common';
import { HomeGateway } from './home.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { ConnectionService } from './connection.service';
import { ChatParticipantRepository } from 'src/chat/chatParticipant.repository';
import { ChatRepository } from 'src/chat/chat.respository';
import { MessageService } from './message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from 'src/chat/entities/chat.entity';
import { ChatParticipant } from 'src/chat/entities/chatParticipant.entity';

@Module({
  imports: [NormalJwtModule, TypeOrmModule.forFeature([Chat, ChatParticipant])],
  providers: [
    HomeGateway,
    ConnectionService,
    MessageService,
    ChatParticipantRepository,
    ChatRepository,
  ],
  exports: [ConnectionService, MessageService],
})
export class HomeModule {}
