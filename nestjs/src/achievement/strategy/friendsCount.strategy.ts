import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { Friends } from 'src/friend/entities/Friends.entity';
import { FriendsRepository } from 'src/friend/friends.repository';
import { AchievementRepository } from '../achievement.repository';
import { Achievement, AchievementDomain } from '../entities/Achievement.entity';
import AchievementStrategy from './interface/achievementStrategy.interface';
import { UserAchievementRepository } from '../userAchievement.repository';

@Injectable()
export class FriendsCountStrategy implements AchievementStrategy {
  private domain: AchievementDomain;
  private achievements: Achievement[];

  constructor(
    @InjectRepository(AchievementRepository)
    private readonly achievementRepository: AchievementRepository,
    @InjectRepository(UserAchievementRepository)
    private readonly userAchievementRepository: UserAchievementRepository,
    @InjectRepository(FriendsRepository)
    private readonly friendsRepository: FriendsRepository,
  ) {
    this.domain = AchievementDomain.Friend;
    this.achievements = [];
  }

  async loadAchievements(): Promise<void> {
    this.achievements = await this.achievementRepository.findBy({
      domain: this.domain,
    });
  }

  async strategy(check_data: User): Promise<number> {
    const count = this.friendsRepository.count({
      where: [
        {
          user_id1: { id: check_data.id },
        },
        {
          user_id2: { id: check_data.id },
        },
      ],
    });
    return count;
  }

  async checker(check_data: User): Promise<void> {
    const user_count: number = await this.strategy(check_data);
    this.achievements.forEach(async achievement => {
      if (achievement.value === user_count)
        await this.userAchievementRepository.insertUserAchievement(
          check_data,
          achievement,
        );
    });
  }

  async checkAchievement(entity: Friends): Promise<void> {
    await this.loadAchievements();
    await this.checker(entity.user_id1);
    await this.checker(entity.user_id2);
  }
}
