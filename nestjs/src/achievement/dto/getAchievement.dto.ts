import { PickType } from '@nestjs/swagger';
import { Achievement } from '../entities/Achievement.entity';

export default class GetAchievementDto extends PickType(Achievement, [
  'title',
  'description',
]) {}
