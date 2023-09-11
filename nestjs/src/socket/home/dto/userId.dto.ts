import { IsNumber } from 'class-validator';

export class UserIdDto {
  @IsNumber()
  userId: number;
}
