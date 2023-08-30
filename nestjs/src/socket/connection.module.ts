import { Module } from '@nestjs/common';
import { GameConnectionService } from './game/gameConnection.service';
import { ConnectionService } from './home/connection.service';
import { GeneralGameService } from './home/generalGame.service';

@Module({
  providers: [GameConnectionService, GeneralGameService, ConnectionService],
  exports: [GameConnectionService, GeneralGameService, ConnectionService],
})
export class ConnectionModule {}
