import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FriendRequesting,
  RequestStatus,
} from './entities/FriendRequesting.entity';

@Injectable()
export class FriendRequestingRepository extends Repository<FriendRequesting> {
  constructor(
    @InjectRepository(FriendRequesting)
    private friendRequestingRepository: Repository<FriendRequesting>,
  ) {
    super(
      friendRequestingRepository.target,
      friendRequestingRepository.manager,
      friendRequestingRepository.queryRunner,
    );
  }

  async getFriendRequest(userId: number): Promise<FriendRequesting[]> {
    const search_result: FriendRequesting[] =
      await this.friendRequestingRepository.find({
        relations: {
          from_user_id: true,
          to_user_id: true,
        },
        where: [
          {
            from_user_id: { id: userId },
            status: RequestStatus.Requesting,
          },
          {
            to_user_id: { id: userId },
            status: RequestStatus.Requesting,
          },
        ],
      });
    return search_result;
  }

  async updateRequest(request: FriendRequesting): Promise<void> {
    try {
      await this.friendRequestingRepository.save(request);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findPrevRequest(
    from_user_id: number,
    to_user_id: number,
  ): Promise<FriendRequesting | null> {
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findOne({
        relations: { from_user_id: true, to_user_id: true },
        where: [
          {
            from_user_id: { id: from_user_id },
            to_user_id: { id: to_user_id },
          },
          {
            from_user_id: { id: to_user_id },
            to_user_id: { id: from_user_id },
          },
        ],
      });
    return prev_request;
  }

  async createRequest(from_user_id: number, to_user_id: number) {
    const req_entity = this.friendRequestingRepository.create({
      from_user_id: { id: from_user_id },
      to_user_id: { id: to_user_id },
      status: RequestStatus.Requesting,
    });
    try {
      await this.friendRequestingRepository.save(req_entity);
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return;
  }
}
