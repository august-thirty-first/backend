export enum FriendStatus {
  Online = 'online',
  Offline = 'offline',
  Gaming = 'gaming',
}

export default class FriendGetResponseDto {
  nickname: string;
  id: number;
  avata_path?: string;
  status: FriendStatus;
}
