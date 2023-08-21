import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/gameHistory.entity';

export class GameHistoryRepository extends Repository<GameHistory> {
  constructor(
    @InjectRepository(GameHistory)
    private gameHistoryRepository: Repository<GameHistory>,
  ) {
    super(
      gameHistoryRepository.target,
      gameHistoryRepository.manager,
      gameHistoryRepository.queryRunner,
    );
  }
}
