import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistory } from './entities/gameHistory.entity';
import { CreateGameHisotryDto } from './dto/createGameHistory.dto';

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

  async createGameHistory(
    createGameHistoryDto: CreateGameHisotryDto,
  ): Promise<void> {
    const { winnerId, loserId, gameType } = createGameHistoryDto;
    const gameHistory = this.create({
      winner: { id: winnerId },
      loser: { id: loserId },
      gameType,
    });
    try {
      await this.save(gameHistory);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
