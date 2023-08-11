import { User } from 'src/auth/entities/User.entity';
import {
  BaseEntity,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatParticipantStatus } from '../enum/chatParticipant.status.enum';
import { Chat } from './chat.entity';

@Entity()
export class ChatParticipant extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Chat)
  @JoinColumn({ name: 'chat_room_id' })
  chat: Chat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ChatParticipantStatus, nullable: false })
  status: ChatParticipantStatus;

  @Column({ nullable: true })
  ban: Date;

  @Column({ nullable: false })
  status_time: Date;

  private originalStatus: ChatParticipantStatus;
  @BeforeUpdate()
  rememberOriginalStatus() {
    this.originalStatus = this.status;
  }

  @BeforeUpdate()
  updateStatusTime() {
    if (this.status !== this.originalStatus) {
      this.status_time = new Date();
    }
  }
}
