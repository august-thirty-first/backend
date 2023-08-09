import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class OtpLoginDto {
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  token: string;
}
