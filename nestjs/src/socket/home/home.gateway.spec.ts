import { Test, TestingModule } from '@nestjs/testing';
import { HomeGateway } from './home.gateway';

describe('HomeGateway', () => {
  let gateway: HomeGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeGateway],
    }).compile();

    gateway = module.get<HomeGateway>(HomeGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
