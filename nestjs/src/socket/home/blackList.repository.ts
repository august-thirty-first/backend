import { DeleteResult, Repository } from 'typeorm';
import { BlackList } from './entities/blackList.entity';
import { InjectRepository } from '@nestjs/typeorm';

export class BlackListRepository extends Repository<BlackList> {
  constructor(
    @InjectRepository(BlackList)
    private blackListRepository: Repository<BlackList>,
  ) {
    super(
      blackListRepository.target,
      blackListRepository.manager,
      blackListRepository.queryRunner,
    );
  }

  getBlackListByFromId(fromUserId: number): Promise<BlackList[]> {
    return this.find({ where: { from: { id: fromUserId } } });
  }

  async createBlackList(
    fromUserId: number,
    toUserId: number,
  ): Promise<BlackList> {
    const blackList = this.create({
      from: { id: fromUserId },
      to: { id: toUserId },
    });
    try {
      await this.save(blackList);
    } catch (error) {
      console.log(error);
    }
    return blackList;
  }

  deleteBlackList(fromUserId: number, toUserId: number): Promise<DeleteResult> {
    return this.delete({ from: { id: fromUserId }, to: { id: toUserId } });
  }
}
