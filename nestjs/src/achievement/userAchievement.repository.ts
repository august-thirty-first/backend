import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { Repository } from 'typeorm';
import { Achievement } from './entities/Achievement.entity';
import { UserAchievement } from './entities/UserAchievement.entity';

@Injectable()
export class UserAchievementRepository extends Repository<UserAchievement> {
  constructor(
    @InjectRepository(UserAchievement)
    private achievementRepository: Repository<UserAchievement>,
  ) {
    super(
      achievementRepository.target,
      achievementRepository.manager,
      achievementRepository.queryRunner,
    );
  }

  async getUserAchievement(user_id: number): Promise<UserAchievement[]> {
    const result = this.achievementRepository.find({
      relations: { achievement_id: true },
      where: { user_id: { id: user_id } },
    });
    return result;
  }

  async insertUserAchievement(
    user: User,
    achievement: Achievement,
  ): Promise<void> {
    const user_achievement = this.create({
      user_id: user,
      achievement_id: achievement,
    });
    try {
      await this.save(user_achievement);
    } catch (error) {
      if (error.code === '23505') return;
      else throw new InternalServerErrorException();
    }
  }
}
