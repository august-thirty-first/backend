import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './entities/Achievement.entity';

@Injectable()
export class AchievementRepository extends Repository<Achievement> {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
  ) {
    super(
      achievementRepository.target,
      achievementRepository.manager,
      achievementRepository.queryRunner,
    );
  }
}
