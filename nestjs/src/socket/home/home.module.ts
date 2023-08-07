import { Module } from '@nestjs/common';
import { HomeGateway } from './home.gateway';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { PassportsModule } from 'src/passports/passports.module';

@Module({
  imports: [PassportsModule, NormalJwtModule],
  providers: [HomeGateway],
})
export class HomeModule {}
