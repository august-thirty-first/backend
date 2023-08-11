import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GameService } from './game.service';

@Controller('game')
@UseGuards(AuthGuard('jwt'))
export class GameController {
  constructor(private readonly gameservice: GameService) {}
  @Post('/option')
  echoOptionData(@Body() data: any): any {
    return data;
  }
}
