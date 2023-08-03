import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/userCreate.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import signInToken from './interfaces/signInToken.interface';
import { UnauthorizedExceptionFilter } from 'src/filter/unauthorized-exception.filter';
import { OauthExceptionFilter } from 'src/filter/oauth-exception.filter';
import unauthorizedException from 'src/filter/interface/unauthorized.interface';
import checkDuplicatedNicknameResponse from './interfaces/checkDuplicatedNicknameResponse.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  login(@Res() res: Response): void {
    const oauthUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${
      process.env.FORTYTWO_APP_ID
    }&redirect_uri=${encodeURIComponent(
      process.env.FORTYTWO_REDIRECT_URI,
    )}&response_type=code&`;
    res.status(HttpStatus.FOUND).redirect(oauthUrl);
  }

  @Get('oauth')
  @UseGuards(AuthGuard('42'))
  @UseFilters(new OauthExceptionFilter())
  async oauth(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user: any = req.user;
    const result: signInToken = await this.authService.sign(user.nickname);
    res
      .cookie('access_token', result.token)
      .status(HttpStatus.FOUND)
      .redirect(result.redirectUrl);
  }

  @Post('nickname')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('temp-jwt'))
  @UseFilters(new UnauthorizedExceptionFilter())
  async checkDuplicatedNickname(
    @Body('nickname') nickname: string,
  ): Promise<checkDuplicatedNicknameResponse | unauthorizedException> {
    const data = this.authService.checkDuplicatedNickname(nickname);
    return data;
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('avata_path'))
  @UseGuards(AuthGuard('temp-jwt'))
  @UseFilters(new UnauthorizedExceptionFilter())
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile()
    avata_path: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<
    | void
    | unauthorizedException
    | ConflictException
    | InternalServerErrorException
  > {
    const user: any = req.user;
    createUserDto.intra_name = user.intraName;
    if (avata_path?.path) createUserDto.avata_path = avata_path.path;
    const token: string = await this.authService.createUser(createUserDto);
    res.status(HttpStatus.OK).cookie('access_token', token).send();
  }

  @Get('logout')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(new UnauthorizedExceptionFilter())
  logoutUser(@Res() res: Response): void | unauthorizedException {
    res.clearCookie('access_token').status(HttpStatus.OK).send();
  }
}
