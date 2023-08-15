import { Module } from '@nestjs/common';
import { GameSocketGateway } from './gameSocket.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { PassportModule } from '@nestjs/passport';
import { GameSocketService } from './gameSocket.service';

@Module({
  imports: [NormalJwtModule, PassportModule],
  providers: [GameSocketGateway, GameSocketService],
})
export class GameSocketModule {}
