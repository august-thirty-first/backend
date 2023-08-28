import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameConnectionService {
  private gameConnections: Map<number, Socket> = new Map();

  findGameConnection(userId: number): boolean {
    if (this.gameConnections.has(userId)) {
      return true;
    } else {
      return false;
    }
  }

  addGameConnection(userId: number, socket: Socket): boolean {
    if (this.findGameConnection(userId)) {
      return false;
    } else {
      this.gameConnections.set(userId, socket);
      return true;
    }
  }

  removeGameConnection(userId: number): void {
    this.gameConnections.delete(userId);
  }

  getUserSocketInfoById(userId: number): Socket {
    if (this.findGameConnection(userId)) {
      return this.gameConnections.get(userId);
    }
  }
}
