import { IsNumber } from 'class-validator';

export class SkillDto {
  @IsNumber()
  roomId: number;

  @IsNumber()
  targetUserId: number;
}
