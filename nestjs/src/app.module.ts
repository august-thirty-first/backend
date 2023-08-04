import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PassportsModule } from './passports/passports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { HomeModule } from './socket/home/home.module';
import { GameModule } from './socket/game/game.module';

@Module({
  imports: [
    AuthModule,
    PassportsModule,
    TypeOrmModule.forRoot(typeORMConfig),
    HomeModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
