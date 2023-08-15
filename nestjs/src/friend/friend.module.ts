import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from './entities/Friends.entity';
import { FriendRequesting } from './entities/FriendRequesting.entity';
import { FriendsRepository } from './friends.repository';
import { FriendRequestingRepository } from './friendRequesting.repository';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';
import { UserRepository } from 'src/auth/user.repository';
import { User } from 'src/auth/entities/User.entity';
import { PassportsModule } from 'src/passports/passports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Friends, FriendRequesting]),
    PassportsModule,
  ],
  controllers: [FriendController],
  providers: [
    FriendService,
    FriendsRepository,
    FriendRequestingRepository,
    UserRepository,
  ],
})
export class FriendModule {}
