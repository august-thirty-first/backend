import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportsModule } from 'src/passports/passports.module';
import { TempJwtModule } from 'src/temp-jwt/temp-jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/User.entity';
import { UserRepository } from './user.repository';
import { MulterModules } from 'src/multer/multer.module';

@Module({
  imports: [
    PassportsModule,
    TempJwtModule,
    TypeOrmModule.forFeature([User]),
    MulterModules,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
})
export class AuthModule {}
