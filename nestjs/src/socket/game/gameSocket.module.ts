import { Module } from '@nestjs/common';
import { GameSocketGateway } from './gameSocket.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { GameSocketService } from './gameSocket.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryRepository } from './gameHistory.repository';
import { GameHistory } from './entities/gameHistory.entity';
import { GameConnectionService } from './gameConnection.service';
import { Ladder } from './entities/ladder.entity';
import LadderRepository from './ladder.repository';

@Module({
  imports: [NormalJwtModule, TypeOrmModule.forFeature([GameHistory, Ladder])],
  providers: [
    GameSocketGateway,
    GameSocketService,
    GameHistoryRepository,
    LadderRepository,
    GameConnectionService,
  ],
  exports: [GameConnectionService],
})
export class GameSocketModule {}
