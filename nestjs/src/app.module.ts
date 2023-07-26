import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TempJwtModule } from './temp-jwt/temp-jwt.module';
import { PassportsModule } from './passports/passports.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeORMConfig } from './configs/typeorm.config';
@Module({
  imports: [
    AuthModule,
    PassportsModule,
    TempJwtModule,
    TypeOrmModule.forRoot(typeORMConfig),
    // ConfigModule.forRoot({
    //   envFilePath: '../../env/.env',
    //   isGlobal: true,
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
