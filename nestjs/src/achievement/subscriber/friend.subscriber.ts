import { Friends } from 'src/friend/entities/Friends.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import AchievementStrategy from '../strategy/interface/achievementStrategy.interface';
import { FriendsCountStrategy } from '../strategy/friendsCount.strategy';

@EventSubscriber()
export class FriendsSubscriber implements EntitySubscriberInterface<Friends> {
  private strategies: AchievementStrategy[] = [];

  constructor(
    dataSource: DataSource,
    private friendsCountStrategy: FriendsCountStrategy,
  ) {
    this.strategies.push(friendsCountStrategy);
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Friends;
  }

  async afterInsert(event: InsertEvent<Friends>): Promise<void> {
    this.strategies.forEach(async strategy => {
      await strategy.checkAchievement(event.entity);
    });
  }
}
