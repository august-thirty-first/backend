import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { UserRepository } from 'src/auth/user.repository';
import { PassportsModule } from 'src/passports/passports.module';
import { MulterModules } from 'src/multer/multer.module';
import { NormalJwtModule } from 'src/jwt/jwt.module';
import { FriendRequestingRepository } from 'src/friend/friendRequesting.repository';
import { FriendRequesting } from 'src/friend/entities/FriendRequesting.entity';
import { CryptoService } from 'src/auth/utils/crypto.service';
import { UserAchievementRepository } from 'src/achievement/userAchievement.repository';
import { UserAchievement } from 'src/achievement/entities/UserAchievement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FriendRequesting, UserAchievement]),
    PassportsModule,
    MulterModules,
    NormalJwtModule,
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    UserRepository,
    FriendRequestingRepository,
    CryptoService,
    UserAchievementRepository,
  ],
})
export class ProfileModule {}
