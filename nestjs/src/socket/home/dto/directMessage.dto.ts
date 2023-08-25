import { IsNumber, IsString } from 'class-validator';

export class directMessageDto {
  @IsNumber()
  targetUserId: number;
  @IsString()
  inputMessage: string;
}
