import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { PassportModule } from '@nestjs/passport';
import { NormalJwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [PassportModule, NormalJwtModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
