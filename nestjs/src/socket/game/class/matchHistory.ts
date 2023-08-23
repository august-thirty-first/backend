export default class MatchHistory {
  winnerNickname: string;
  loserNickname: string;

  updateResult(winner: string, loser: string) {
    this.winnerNickname = winner;
    this.loserNickname = loser;
  }
}
