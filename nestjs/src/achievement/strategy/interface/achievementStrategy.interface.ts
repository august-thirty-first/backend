export default interface AchievementStrategy {
  loadAchievements(): Promise<void>;
  strategy(check_data: any): Promise<number>;
  checker(check_data: any): Promise<void>;
  checkAchievement(entity: any): Promise<void>;
}
