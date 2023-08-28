import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneralGameService {
  private generalGame: Map<number, number> = new Map();

  findGeneralGame(fromUserId: number): boolean {
    if (this.generalGame.has(fromUserId)) {
      return true;
    } else {
      return false;
    }
  }

  addGeneralGame(fromUserId: number, toUserId): boolean {
    if (this.findGeneralGame(fromUserId)) {
      return false;
    } else {
      this.generalGame.set(fromUserId, toUserId);
      return true;
    }
  }

  removeGeneralGame(fromUserId: number): void {
    this.generalGame.delete(fromUserId);
  }
}
