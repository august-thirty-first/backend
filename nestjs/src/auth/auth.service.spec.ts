import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PassportsModule } from 'src/passports/passports.module';
import { TempJwtModule } from 'src/temp-jwt/temp-jwt.module';
import { MulterModules } from 'src/multer/multer.module';
import { UserRepository } from './user.repository';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportsModule, TempJwtModule, MulterModules],
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
