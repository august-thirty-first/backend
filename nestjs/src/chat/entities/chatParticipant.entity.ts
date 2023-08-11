import { User } from 'src/auth/entities/User.entity';
import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatParticipantAuthority } from '../enum/chatParticipant.authority.enum';
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

  @Column({ type: 'enum', enum: ChatParticipantAuthority, nullable: false })
  authority: ChatParticipantAuthority;

  @Column({ nullable: true })
  ban: Date;

  @Column({ nullable: false })
  authority_time: Date;

  @BeforeInsert()
  setInitialAuthorityTime() {
    this.authority_time = new Date();
  }
  private originalAuthority: ChatParticipantAuthority;
  @BeforeUpdate()
  rememberOriginalStatus() {
    this.originalAuthority = this.authority;
  }

  @BeforeUpdate()
  updateStatusTime() {
    if (this.authority !== this.originalAuthority) {
      this.authority_time = new Date();
    }
  }
}
