import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FortyTwoStrategy } from './fortytwo.strategy';
import { TempJwtStrategy } from './tempJwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 60 * 60 },
    }),
    PassportModule.register({}),
  ],
  providers: [JwtStrategy, FortyTwoStrategy, TempJwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class PassportsModule {}
