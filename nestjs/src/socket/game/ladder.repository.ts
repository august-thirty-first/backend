import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Ladder } from './entities/ladder.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLadderDto } from './dto/createLadder.dto';

@Injectable()
export default class LadderRepository extends Repository<Ladder> {
  constructor(
    @InjectRepository(Ladder) private ladderRepository: Repository<Ladder>,
  ) {
    super(
      ladderRepository.target,
      ladderRepository.manager,
      ladderRepository.queryRunner,
    );
  }
  async createOrUpdateLadderRecord(
    createLadderDto: CreateLadderDto,
  ): Promise<Ladder> {
    const { user_id, delta_score } = createLadderDto;
    let ladderRecord = await this.findOne({
      where: { user_id: { id: user_id } },
    });

    if (ladderRecord) {
      ladderRecord.score += delta_score;
      if (ladderRecord.score < 0) {
        ladderRecord.score = 0;
      }
      try {
        await this.save(ladderRecord);
        return ladderRecord;
      } catch (err) {
        console.log(err);
        throw err;
      }
    } else {
      ladderRecord = this.create({ user_id: { id: user_id }, score: 0 });
      try {
        await this.save(ladderRecord);
        return ladderRecord;
      } catch (err) {
        console.log(err);
        throw err;
      }
    }
  }
}
