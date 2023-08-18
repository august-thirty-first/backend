import { User } from 'src/auth/entities/User.entity';
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { FriendRequesting } from './FriendRequesting.entity';

@Entity()
@Unique(['user_id1', 'user_id2'])
export class Friends extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => FriendRequesting, { nullable: false })
  @JoinColumn({ name: 'friend_request_id' })
  friend_request_id: FriendRequesting;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id1' })
  user_id1: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id2' })
  user_id2: User;

  @CreateDateColumn()
  created_at: Date;
}
