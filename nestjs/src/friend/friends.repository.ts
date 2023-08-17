import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friends } from './entities/Friends.entity';

@Injectable()
export class FriendsRepository extends Repository<Friends> {
  constructor(
    @InjectRepository(Friends)
    private friendsRepository: Repository<Friends>,
  ) {
    super(
      friendsRepository.target,
      friendsRepository.manager,
      friendsRepository.queryRunner,
    );
  }

  async getFriend(userId: number): Promise<Friends[]> {
    const search_result: Friends[] = await this.friendsRepository.find({
      relations: {
        user_id1: true,
        user_id2: true,
      },
      where: [
        {
          user_id1: { id: userId },
        },
        {
          user_id2: { id: userId },
        },
      ],
    });
    return search_result;
  }
}
