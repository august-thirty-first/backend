export default class MatchHistory {
  winnerId: number;
  winnerNickname: string;
  loserId: number;
  loserNickname: string;

  updateResult(
    winnerId: number,
    winnerNickname: string,
    loserId: number,
    loserNickname: string,
  ) {
    this.winnerId = winnerId;
    this.winnerNickname = winnerNickname;
    this.loserId = loserId;
    this.loserNickname = loserNickname;
  }
}
