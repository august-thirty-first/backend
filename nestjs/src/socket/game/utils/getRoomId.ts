import { Socket } from 'socket.io';

export default function getRoomId(socket: Socket): string {
  const rooms: Set<string> = socket.rooms;
  let roomId: string;
  for (const item of rooms) {
    roomId = item;
    break;
  }
  return roomId;
}
