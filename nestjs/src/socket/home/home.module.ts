import { Module } from '@nestjs/common';
import { HomeGateway } from './home.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { ConnectionService } from './connection.service';

@Module({
  imports: [NormalJwtModule],
  providers: [HomeGateway, ConnectionService],
  exports: [ConnectionService],
})
export class HomeModule {}
