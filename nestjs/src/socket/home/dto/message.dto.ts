import { IsNumber, IsString } from 'class-validator';

export class MessageDto {
  @IsNumber()
  roomId: number;
  @IsString()
  inputMessage: string;
}
