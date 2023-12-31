import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PassportsModule } from './passports/passports.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
import { HomeModule } from './socket/home/home.module';
import { GameSocketModule } from './socket/game/gameSocket.module';
import { ProfileModule } from './profile/profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FriendModule } from './friend/friend.module';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { AchievementModule } from './achievement/achievement.module';
import { ConnectionModule } from './socket/connection.module';

@Module({
  imports: [
    AuthModule,
    PassportsModule,
    TypeOrmModule.forRoot(typeORMConfig),
    ConnectionModule,
    HomeModule,
    GameModule,
    GameSocketModule,
    ProfileModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'images'),
      serveRoot: '/images/',
      serveStaticOptions: {
        index: false,
      },
    }),
    FriendModule,
    ChatModule,
    AchievementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
