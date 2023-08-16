import { IsNotEmpty, IsNumber } from 'class-validator';

export default class FriendCommonRequestBodyDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
