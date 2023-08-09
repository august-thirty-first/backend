import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ChatStatus } from '../enum/chat.status.enum';

@Entity()
export class Chat extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ChatStatus, nullable: false })
  status: ChatStatus;

  @Column({ nullable: true })
  password: number;

  @Column({ nullable: false })
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;
}
