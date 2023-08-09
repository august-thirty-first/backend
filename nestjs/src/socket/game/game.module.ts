import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [NormalJwtModule],
  providers: [GameGateway],
})
export class GameModule {}
