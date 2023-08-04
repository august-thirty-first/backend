import { Module } from '@nestjs/common';
import { HomeGateway } from './home.gateway';

@Module({
  providers: [HomeGateway],
})
export class HomeModule {}
