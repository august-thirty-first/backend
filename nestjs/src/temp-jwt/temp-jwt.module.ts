import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 60 * 60 },
    }),
  ],
  providers: [
    {
      provide: 'TempJwt',
      useExisting: JwtService,
    },
  ],
  exports: ['TempJwt'],
})
export class TempJwtModule {}
