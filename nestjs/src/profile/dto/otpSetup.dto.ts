import { IsNotEmpty } from 'class-validator';

export default class OtpSetupDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  secret: string;
}
