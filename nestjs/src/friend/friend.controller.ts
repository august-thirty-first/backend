import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import FriendCommonDto from './dto/friendCommon.dto';
import { Request } from 'express';
import { FriendService } from './friend.service';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedExceptionFilter } from 'src/filter/unauthorized-exception.filter';
import { RequestStatus } from './entities/FriendRequesting.entity';
import FriendCommonRequestBodyDto from './dto/friendCommonRequestBody.dto';
import FriendGetResponseDto from './dto/friendGetResponse.dto';

@Controller('friend')
@UseFilters(new UnauthorizedExceptionFilter())
@UseGuards(AuthGuard('jwt'))
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get()
  async getFriend(@Req() req: Request): Promise<FriendGetResponseDto[]> {
    const user: any = req.user;
    const friends: FriendGetResponseDto[] = await this.friendService.getFriends(
      user.id,
    );
    return friends;
  }

  @Post('request')
  async sendFriendRequest(
    @Req() req: Request,
    @Body() request_body: FriendCommonRequestBodyDto,
  ): Promise<void> {
    const user: any = req.user;
    const friend_dto: FriendCommonDto = {
      from_user_id: user.id,
      to_user_id: request_body.userId,
    };
    if (friend_dto.from_user_id === friend_dto.to_user_id)
      throw new BadRequestException('나 자신은 영원한 인생의 친구입니다.');
    await this.friendService.friendRequest(friend_dto);
  }

  @Patch('approve')
  @HttpCode(HttpStatus.NO_CONTENT)
  async approveFriendRequest(
    @Req() req: Request,
    @Body() request_body: FriendCommonRequestBodyDto,
  ): Promise<void> {
    const user: any = req.user;
    const friend_dto: FriendCommonDto = {
      from_user_id: request_body.userId,
      to_user_id: user.id,
    };
    await this.friendService.friendApproveOrReject(
      friend_dto,
      RequestStatus.Allow,
    );
  }

  @Patch('reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectFriendRequest(
    @Req() req: Request,
    @Body() request_body: FriendCommonRequestBodyDto,
  ): Promise<void> {
    const user: any = req.user;
    const friend_dto: FriendCommonDto = {
      from_user_id: request_body.userId,
      to_user_id: user.id,
    };
    await this.friendService.friendApproveOrReject(
      friend_dto,
      RequestStatus.Reject,
    );
  }

  @Patch('cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelFriendRequest(
    @Req() req: Request,
    @Body() request_body: FriendCommonRequestBodyDto,
  ): Promise<void> {
    const user: any = req.user;
    const friend_dto: FriendCommonDto = {
      from_user_id: user.id,
      to_user_id: request_body.userId,
    };
    await this.friendService.friendCancel(friend_dto);
  }

  @Delete('delete')
  async deleteFriend(
    @Req() req: Request,
    @Body() request_body: FriendCommonRequestBodyDto,
  ): Promise<void> {
    const user: any = req.user;
    const friend_dto: FriendCommonDto = {
      from_user_id: user.id,
      to_user_id: request_body.userId,
    };
    await this.friendService.friendDelete(friend_dto);
  }
}
