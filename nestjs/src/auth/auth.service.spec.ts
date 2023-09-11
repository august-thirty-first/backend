import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PassportsModule } from 'src/passports/passports.module';
import { TempJwtModule } from 'src/jwt/temp-jwt.module';
import { MulterModules } from 'src/multer/multer.module';
import { UserRepository } from './user.repository';
import { NormalJwtModule } from 'src/jwt/jwt.module';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportsModule, NormalJwtModule, TempJwtModule, MulterModules],
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
