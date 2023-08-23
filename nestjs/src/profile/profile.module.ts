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

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FriendRequesting]),
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
  ],
})
export class ProfileModule {}
