import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('oauth')
  @UseGuards(AuthGuard('42'))
  async oauth(@Req() req: Request, @Res() res: Response) {
    const user: any = req.user;
    const result: signInToken = await this.authService.sign(user.nickname);
    res
      .cookie('access_token', result.token)
      .status(302)
      .redirect(result.redirectUrl);
  }

  @Post('nickname')
  checkDuplicatedNickname(@Body('nickname') nickname: string) {
    return this.authService.checkDuplicatedNickname(nickname);
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('avata_path'))
  @UseGuards(AuthGuard('temp-jwt'))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile()
    avata_path: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user: any = req.user;
    createUserDto.intra_name = user.username;
    if (avata_path?.path) createUserDto.avata_path = avata_path.path;
    res.clearCookie('access_token');
    const token: string = await this.authService.createUser(createUserDto);
    res.cookie('access_token', token).redirect('http://10.19.233.2:4000/');
  }

  @Get('logout')
  @UseGuards(AuthGuard('jwt'))
  logoutUser(@Res() res: Response) {
    res
      .clearCookie('access_token')
      .status(302)
      .redirect('http://10.19.233.2:4000/login');
  }
}
