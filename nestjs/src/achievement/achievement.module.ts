import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friends } from 'src/friend/entities/Friends.entity';
import { FriendsRepository } from 'src/friend/friends.repository';
import { AchievementRepository } from './achievement.repository';
import { AchievementSeederService } from './achievementSeeder.service';
import { Achievement } from './entities/Achievement.entity';
import { UserAchievement } from './entities/UserAchievement.entity';
import { FriendsCountStrategy } from './strategy/friendsCount.strategy';
import { FriendsSubscriber } from './subscriber/friend.subscriber';
import { UserAchievementRepository } from './userAchievement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Friends, Achievement, UserAchievement])],
  providers: [
    AchievementSeederService,
    AchievementRepository,
    UserAchievementRepository,
    FriendsRepository,
    FriendsSubscriber,
    FriendsCountStrategy,
  ],
  exports: [AchievementSeederService],
})
export class AchievementModule {}
