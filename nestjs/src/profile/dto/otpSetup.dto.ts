import { IsNotEmpty, MinLength } from 'class-validator';

export default class OtpSetupDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(32)
  secret: string;
}
