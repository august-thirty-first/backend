import { User } from 'src/auth/entities/User.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Achievement } from './Achievement.entity';

@Entity()
@Unique(['user_id', 'achievement_id'])
export class UserAchievement {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user_id: User;
  @ManyToOne(() => Achievement, { nullable: false })
  @JoinColumn({ name: 'achievement_id' })
  achievement_id: Achievement;
  @CreateDateColumn()
  created_at: Date;
}
