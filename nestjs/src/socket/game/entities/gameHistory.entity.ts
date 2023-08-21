import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GameType } from '../enum/gameType.enum';
import { User } from 'src/auth/entities/User.entity';

@Entity()
export class GameHistory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winner_id' })
  winner: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'loser_id' })
  loser: User;

  @Column({ type: 'enum', enum: GameType, nullable: false })
  game_type: GameType;

  @CreateDateColumn()
  created_at: Date;
}
