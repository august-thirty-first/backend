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

  @Column({ name: 'room_name', nullable: false })
  roomName: string;

  @Column({ type: 'enum', enum: ChatStatus, nullable: false })
  status: ChatStatus;

  @Column({ nullable: true, select: false })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
