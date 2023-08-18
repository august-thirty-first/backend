import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChatStatus } from '../enum/chat.status.enum';
import { ChatParticipant } from './chatParticipant.entity';

@Entity()
export class Chat extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ChatParticipant, chatParticipant => chatParticipant.chat, {
    cascade: true,
  })
  chatParticipants: ChatParticipant[];

  @Column({ nullable: false })
  room_name: string;

  @Column({ type: 'enum', enum: ChatStatus, nullable: false })
  status: ChatStatus;

  @Column({ nullable: true, select: false })
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
