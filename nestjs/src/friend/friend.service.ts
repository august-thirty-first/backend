import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/entities/User.entity';
import { UserRepository } from 'src/auth/user.repository';
import { FriendRequestStatus } from 'src/profile/dto/searchUser.dto';
import { ConnectionService } from 'src/socket/home/connection.service';
import { DataSource } from 'typeorm';
import FriendCommonDto from './dto/friendCommon.dto';
import FriendGetResponseDto, {
  FriendStatus,
} from './dto/friendGetResponse.dto';
import FriendRequestingAlarmsDto from './dto/friendRequestingAlarms.dto';
import {
  FriendRequesting,
  RequestStatus,
} from './entities/FriendRequesting.entity';
import { Friends } from './entities/Friends.entity';
import { FriendRequestingRepository } from './friendRequesting.repository';
import { FriendsRepository } from './friends.repository';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(FriendsRepository)
    private friendsRepository: FriendsRepository,
    @InjectRepository(FriendRequestingRepository)
    private friendRequestingRepository: FriendRequestingRepository,
    private dataSource: DataSource,
    private connectionService: ConnectionService,
  ) {}

  async approveRequestAndInsertFriends(
    request: FriendRequesting,
  ): Promise<void> {
    const friend_entity = this.friendsRepository.create({
      friend_request_id: request,
      user_id1: request.from_user_id,
      user_id2: request.to_user_id,
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await this.friendRequestingRepository.save(request);
      await this.friendsRepository.save(friend_entity);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await queryRunner.release();
    }
  }

  async deleteRequestAndDeleteFriends(
    request: FriendRequesting,
  ): Promise<void> {
    const query_runner = this.dataSource.createQueryRunner();
    await query_runner.connect();
    await query_runner.startTransaction();
    try {
      await this.friendRequestingRepository.save(request);
      const friend_row: Friends | null = await this.friendsRepository.findOneBy(
        {
          friend_request_id: { id: request.id },
        },
      );
      if (friend_row) await this.friendsRepository.delete(friend_row.id);
      await query_runner.commitTransaction();
    } catch (err) {
      await query_runner.rollbackTransaction();
      throw new InternalServerErrorException();
    } finally {
      await query_runner.release();
    }
  }

  async getFriendRequest(userId: number): Promise<FriendRequestingAlarmsDto[]> {
    const search_result: FriendRequesting[] =
      await this.friendRequestingRepository.getFriendRequest(userId);
    const result: FriendRequestingAlarmsDto[] = search_result.map(row => {
      let another_user: User;
      let status: FriendRequestStatus;
      if (row.from_user_id.id === userId) {
        another_user = row.to_user_id;
        status = FriendRequestStatus.SendRequest;
      } else {
        another_user = row.from_user_id;
        status = FriendRequestStatus.RecvRequest;
      }
      return {
        id: another_user.id,
        nickname: another_user.nickname,
        avata_path: another_user.avata_path,
        status: status,
      };
    });
    return result;
  }

  async getFriends(userId: number): Promise<FriendGetResponseDto[]> {
    const search_result: Friends[] = await this.friendsRepository.getFriend(
      userId,
    );
    const friends: FriendGetResponseDto[] = search_result.map(row => {
      const friend = row.user_id1.id !== userId ? row.user_id1 : row.user_id2;
      const check_online = this.connectionService.findUserConnection(friend.id);
      let status: FriendStatus = null;
      if (check_online) status = FriendStatus.Online;
      else status = FriendStatus.Offline;
      return {
        id: friend.id,
        nickname: friend.nickname,
        avata_path: friend.avata_path,
        status: status,
      };
    });
    return friends;
  }

  async friendRequest(friend_dto: FriendCommonDto): Promise<void> {
    const to_user: User = await this.userRepository.findOneBy({
      id: friend_dto.to_user_id,
    });
    if (!to_user) throw new BadRequestException('존재하지 않는 User입니다.');
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findPrevRequest(
        friend_dto.from_user_id,
        friend_dto.to_user_id,
      );
    switch (prev_request?.status) {
      case RequestStatus.Allow:
        throw new BadRequestException('이미 친구입니다.');
      case RequestStatus.Requesting:
        if (prev_request.from_user_id.id === friend_dto.from_user_id)
          throw new BadRequestException('이미 친구 요청하셨습니다.');
        else
          throw new BadRequestException(
            '먼저 요청을 받았습니다. 친구 요청 승인을 해주세요.',
          );
    }
    if (prev_request) {
      if (prev_request?.from_user_id.id !== friend_dto.from_user_id) {
        prev_request.from_user_id.id = friend_dto.from_user_id;
        prev_request.to_user_id.id = friend_dto.to_user_id;
      }
      prev_request.status = RequestStatus.Requesting;
      await this.friendRequestingRepository.updateRequest(prev_request);
    } else {
      await this.friendRequestingRepository.createRequest(
        friend_dto.from_user_id,
        friend_dto.to_user_id,
      );
    }
  }

  async friendApproveOrReject(
    friend_dto: FriendCommonDto,
    status: RequestStatus,
  ): Promise<void> {
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findPrevRequest(
        friend_dto.from_user_id,
        friend_dto.to_user_id,
      );
    if (!prev_request || prev_request.to_user_id.id != friend_dto.to_user_id)
      throw new BadRequestException('처리할 요청이 없습니다.');
    if (prev_request.status !== RequestStatus.Requesting)
      throw new BadRequestException('이미 승인 또는 거절된 요청입니다.');
    prev_request.status = status;
    if (prev_request.status === RequestStatus.Reject)
      await this.friendRequestingRepository.updateRequest(prev_request);
    else await this.approveRequestAndInsertFriends(prev_request);
  }

  async friendCancel(friend_dto: FriendCommonDto): Promise<void> {
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findPrevRequest(
        friend_dto.from_user_id,
        friend_dto.to_user_id,
      );
    if (!prev_request || prev_request.to_user_id.id != friend_dto.to_user_id)
      throw new BadRequestException('취소할 요청이 없습니다.');
    if (prev_request.status !== RequestStatus.Requesting)
      throw new BadRequestException('이미 승인 또는 거절된 요청입니다.');
    await this.friendRequestingRepository.delete(prev_request.id);
  }

  async friendDelete(friend_dto: FriendCommonDto) {
    const prev_request: FriendRequesting | null =
      await this.friendRequestingRepository.findPrevRequest(
        friend_dto.from_user_id,
        friend_dto.to_user_id,
      );
    if (!prev_request || prev_request.status !== RequestStatus.Allow)
      throw new BadRequestException('친구 관계가 아닙니다.');
    prev_request.status = RequestStatus.Delete;
    await this.deleteRequestAndDeleteFriends(prev_request);
  }
}
