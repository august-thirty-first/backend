import { Module } from '@nestjs/common';
import { GameSocketGateway } from './gameSocket.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { GameSocketService } from './gameSocket.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryRepository } from './gameHistory.repository';
import { GameHistory } from './entities/gameHistory.entity';
import { GameConnectionService } from './gameConnection.service';

@Module({
  imports: [NormalJwtModule, TypeOrmModule.forFeature([GameHistory])],
  providers: [
    GameSocketGateway,
    GameSocketService,
    GameHistoryRepository,
    GameConnectionService,
  ],
  exports: [GameConnectionService],
})
export class GameSocketModule {}
