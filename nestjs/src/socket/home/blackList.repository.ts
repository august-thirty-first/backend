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
    return this.find({
      select: {
        from: {
          id: true,
          nickname: true,
          intra_name: false,
          avata_path: false,
          otp_key: false,
          created_at: false,
          updated_at: false,
        },
        to: {
          id: true,
          nickname: true,
          intra_name: false,
          avata_path: false,
          otp_key: false,
          created_at: false,
          updated_at: false,
        },
      },
      relations: { from: true, to: true },
      where: { from: { id: fromUserId } },
      order: { id: 'ASC' },
    });
  }

  async createBlackList(
    fromUserId: number,
    toUserId: number,
  ): Promise<BlackList> {
    const blackList = this.create({
      from: { id: fromUserId },
      to: { id: toUserId },
    });
    return this.save(blackList);
  }

  deleteBlackList(fromUserId: number, toUserId: number): Promise<DeleteResult> {
    return this.delete({ from: { id: fromUserId }, to: { id: toUserId } });
  }
}
