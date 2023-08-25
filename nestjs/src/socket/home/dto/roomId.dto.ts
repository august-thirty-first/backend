import { IsNumber } from 'class-validator';

export class RoomIdDto {
  @IsNumber()
  roomId: number;
}
