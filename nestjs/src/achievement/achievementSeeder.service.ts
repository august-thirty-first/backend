import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Achievement, AchievementDomain } from './entities/Achievement.entity';

@Injectable()
export class AchievementSeederService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
  ) {}

  friendAchievementSeedData(): Partial<Achievement>[] {
    const achievements: Partial<Achievement>[] = [
      {
        domain: AchievementDomain.Friend,
        title: '초보 네트워커',
        description:
          '첫 번째 친구가 생겼습니다! 계속해서 네트워크를 확장하세요.',
        value: 1,
      },
      {
        domain: AchievementDomain.Friend,
        title: '다정한 얼굴들',
        description:
          '세 명의 친구와 함께 진정한 커뮤니티를 구축하기 시작했습니다. 계속해서 훌륭한 활동을 해주세요!',
        value: 3,
      },
    ];
    return achievements;
  }

  async seed() {
    const count = await this.achievementRepository.count();

    if (count === 0) {
      const achievements: Partial<Achievement>[] =
        this.friendAchievementSeedData();

      await this.achievementRepository.save(achievements);
    }
  }
}
