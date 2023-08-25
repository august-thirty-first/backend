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

  @ManyToOne(() => Chat, chat => chat.chatParticipants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_room_id' })
  chat: Chat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ChatParticipantAuthority, nullable: false })
  authority: ChatParticipantAuthority;

  @Column({ nullable: true })
  ban: Date;

  @Column({ name: 'authority_time', nullable: false })
  authorityTime: Date;

  @BeforeInsert()
  setInitialAuthorityTime() {
    this.authorityTime = new Date();
  }
  private originalAuthority: ChatParticipantAuthority;
  @BeforeUpdate()
  rememberOriginalStatus() {
    this.originalAuthority = this.authority;
  }

  @BeforeUpdate()
  updateStatusTime() {
    if (this.authority !== this.originalAuthority) {
      this.authorityTime = new Date();
    }
  }
}
