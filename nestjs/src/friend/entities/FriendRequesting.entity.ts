import { User } from 'src/auth/entities/User.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum RequestStatus {
  Allow = 'allow',
  Requesting = 'requesting',
  Reject = 'reject',
  Delete = 'delete',
}

@Entity()
@Unique(['from_user_id', 'to_user_id'])
export class FriendRequesting extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'from_user_id' })
  from_user_id: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'to_user_id' })
  to_user_id: User;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    nullable: false,
  })
  status: RequestStatus;

  @UpdateDateColumn()
  time: Date;
}
