import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FortyTwoStrategy } from './fortytwo.strategy';
import { TempJwtStrategy } from './tempJwt.strategy';
import { NormalJwt } from 'src/auth/interfaces/jwt.type';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 60 * 60 },
    }),
    PassportModule.register({}),
  ],
  providers: [
    JwtStrategy,
    FortyTwoStrategy,
    TempJwtStrategy,
    {
      provide: NormalJwt,
      useExisting: JwtService,
    },
  ],
  exports: [PassportModule, NormalJwt],
})
export class PassportsModule {}
