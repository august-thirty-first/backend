import { Module } from '@nestjs/common';
import { GameSocketGateway } from './gameSocket.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { PassportModule } from '@nestjs/passport';
import { GameSocketService } from './gameSocket.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryRepository } from './gameHistory.repository';
import { GameHistory } from './entities/gameHistory.entity';

@Module({
  imports: [
    NormalJwtModule,
    PassportModule,
    TypeOrmModule.forFeature([GameHistory]),
  ],
  providers: [GameSocketGateway, GameSocketService, GameHistoryRepository],
})
export class GameSocketModule {}
