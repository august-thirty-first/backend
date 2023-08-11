import { Module } from '@nestjs/common';
import { GameSocketGateway } from './gameSocket.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [NormalJwtModule, PassportModule],
  providers: [GameSocketGateway],
})
export class GameSocketModule {}
