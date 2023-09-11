import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { FortyTwoStrategy } from './fortytwo.strategy';
import { TempJwtStrategy } from './tempJwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { UserRepository } from 'src/auth/user.repository';

@Module({
  imports: [PassportModule.register({}), TypeOrmModule.forFeature([User])],
  providers: [JwtStrategy, FortyTwoStrategy, TempJwtStrategy, UserRepository],
  exports: [PassportModule],
})
export class PassportsModule {}
