import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { UserRepository } from 'src/auth/user.repository';
import { PassportsModule } from 'src/passports/passports.module';
import { MulterModules } from 'src/multer/multer.module';
import { NormalJwtModule } from 'src/jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportsModule,
    MulterModules,
    NormalJwtModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, UserRepository],
})
export class ProfileModule {}
