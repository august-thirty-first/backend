import { User } from 'src/auth/entities/User.entity';
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class BlackList extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  from: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  to: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
