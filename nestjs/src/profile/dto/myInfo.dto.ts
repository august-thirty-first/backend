import { UserDto } from 'src/auth/dto/user.dto';
import { PickType } from '@nestjs/swagger';
import { Expose, Transform, TransformFnParams } from 'class-transformer';

export default class MyInfoDto extends PickType(UserDto, [
  'nickname',
  'avata_path',
]) {
  @Expose()
  nickname: string;
  @Expose()
  avata_path: string;
  @Expose()
  @Transform((params: TransformFnParams) => {
    return params.obj.otp_key !== null && params.obj.otp_key !== undefined;
  })
  has_otp_key: boolean;
}
