import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ConnectionService {
  private userConnections: Map<number, Socket> = new Map();

  findUserConnection(userId: number): boolean {
    if (this.userConnections.has(userId)) return true;
    else return false;
  }

  addUserConnection(userId: number, socket: Socket): boolean {
    if (this.findUserConnection(userId)) return false;
    this.userConnections.set(userId, socket);
    return true;
  }

  removeUserConnection(userId: number): void {
    this.userConnections.delete(userId);
  }

  findSocketByUserId(userId: number): Socket | undefined {
    return this.userConnections[userId];
  }
}
