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
import { BlackList } from './entities/blackList.entity';
import { BlackListRepository } from './blackList.repository';
import { GeneralGameService } from './generalGame.service';

@Module({
  imports: [
    NormalJwtModule,
    TypeOrmModule.forFeature([BlackList, Chat, ChatParticipant]),
  ],
  providers: [
    HomeGateway,
    ConnectionService,
    MessageService,
    ChatParticipantRepository,
    ChatRepository,
    BlackListRepository,
    GeneralGameService,
  ],
  exports: [ConnectionService, MessageService, GeneralGameService],
})
export class HomeModule {}
