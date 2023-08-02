import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FortyTwoStrategy } from './fortytwo.strategy';
import { TempJwtStrategy } from './tempJwt.strategy';

@Module({
  imports: [PassportModule.register({})],
  providers: [JwtStrategy, FortyTwoStrategy, TempJwtStrategy],
  exports: [PassportModule],
})
export class PassportsModule {}
