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
}
