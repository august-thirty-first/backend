import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportsModule } from 'src/passports/passports.module';
import { TempJwtModule } from 'src/jwt/temp-jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/User.entity';
import { UserRepository } from './user.repository';
import { MulterModules } from 'src/multer/multer.module';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { HomeModule } from 'src/socket/home/home.module';
import { CryptoService } from './utils/crypto.service';

@Module({
  imports: [
    PassportsModule,
    NormalJwtModule,
    TempJwtModule,
    TypeOrmModule.forFeature([User]),
    MulterModules,
    HomeModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, CryptoService],
})
export class AuthModule {}
