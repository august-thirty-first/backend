import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import SearchUserDto from './dto/searchUser.dto';
import { ProfileService } from './profile.service';
import MyInfoDto from './dto/myInfo.dto';
import { UnauthorizedExceptionFilter } from 'src/filter/unauthorized-exception.filter';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import OtpResponseDto from './dto/otpResponseDto.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import checkDuplicatedNicknameResponse from 'src/auth/interfaces/checkDuplicatedNicknameResponse.interface';
import { CheckNicknameDto } from 'src/auth/dto/checkNickname.dto';
import { UpdateUserDto } from './dto/userUpdate.dto';
import OtpSetupDto from './dto/otpSetup.dto';

@Controller('profile')
@UseFilters(new UnauthorizedExceptionFilter())
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  async getMyInfo(@Req() req: Request): Promise<MyInfoDto> {
    const user: any = req.user;
    const searchUser: MyInfoDto = await this.profileService.myInfo(user.id);
    return searchUser;
  }

  @Get('user')
  async getUserProfile(
    @Req() req: Request,
    @Query() searchUserDto: SearchUserDto,
  ): Promise<SearchUserDto | null> {
    const user: any = req.user;
    const result: SearchUserDto | null =
      await this.profileService.searchByUserProfile(
        user.id,
        searchUserDto.nickname,
      );
    return result;
  }

  @Post('nickname')
  @HttpCode(HttpStatus.OK)
  async checkDuplicatedNickname(
    @Body() checkNicknameDto: CheckNicknameDto,
  ): Promise<checkDuplicatedNicknameResponse> {
    const data = this.profileService.checkDuplicatedNickname(
      checkNicknameDto.nickname,
    );
    return data;
  }

  @Patch('edit')
  @UseInterceptors(FileInterceptor('avata_path'))
  async updateUserProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile()
    avata_path: Express.Multer.File,
  ): Promise<void | ConflictException> {
    const user: any = req.user;
    if (avata_path?.path) updateUserDto.avata_path = avata_path.path;
    const new_token: string = await this.profileService.updateUser(
      user.id,
      updateUserDto,
    );
    res.status(HttpStatus.NO_CONTENT).cookie('access_token', new_token).send();
  }

  @Get('otp')
  async getOtpImage(@Req() req: Request): Promise<OtpResponseDto> {
    const user: any = req.user;
    const random_key = speakeasy.generateSecret();
    const otp_url = speakeasy.otpauthURL({
      secret: random_key.ascii,
      issuer: 'growing_pains',
      label: user.nickname,
    });
    const image = await qrcode.toDataURL(otp_url);
    const result: OtpResponseDto = {
      qrImage: image,
      secret: random_key.base32,
    };
    return result;
  }

  @Patch('otp')
  async setupOtp(
    @Req() req: Request,
    @Res() res: Response,
    @Body() otpSetupDto: OtpSetupDto,
  ): Promise<void | UnauthorizedException | BadRequestException> {
    const verified: boolean = speakeasy.totp.verify({
      secret: otpSetupDto.secret,
      encoding: 'base32',
      token: otpSetupDto.token,
    });
    if (!verified) throw new UnauthorizedException('Token 값을 확인해주세요.');
    const user: any = req.user;
    await this.profileService.updateOtp(user.id, otpSetupDto.secret);
    res.status(HttpStatus.NO_CONTENT).send();
  }

  @Delete('otp')
  async deleteOtp(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user: any = req.user;

    await this.profileService.deleteOtp(user.id);
    res.status(HttpStatus.NO_CONTENT).send();
  }
}
