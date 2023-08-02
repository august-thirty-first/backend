import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import { NormalJwt } from './interface/jwt.type';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 60 * 60 },
    }),
  ],
  providers: [
    {
      provide: NormalJwt,
      useExisting: JwtService,
    },
  ],
  exports: [NormalJwt],
})
export class NormalJwtModule {}
