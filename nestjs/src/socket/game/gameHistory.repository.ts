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

  async getGameHistory(
    user_id: number,
    take: number,
    skip: number,
  ): Promise<GameHistory[]> {
    const histories = this.gameHistoryRepository.find({
      relations: { winner: true, loser: true },
      where: [{ winner: { id: user_id } }, { loser: { id: user_id } }],
      order: { createdAt: 'DESC' },
      take: take,
      skip: skip,
    });
    return histories;
  }

  async getWinnerCount(user_id: number): Promise<number> {
    const count = this.gameHistoryRepository.count({
      where: {
        winner: { id: user_id },
      },
    });
    return count;
  }

  async getLoserCount(user_id: number): Promise<number> {
    const count = this.gameHistoryRepository.count({
      where: {
        loser: { id: user_id },
      },
    });
    return count;
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
      // console.log(err);
      throw err;
    }
  }
}
