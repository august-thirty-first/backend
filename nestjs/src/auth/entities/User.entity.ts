import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['id'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  intra_name: string;

  @Column({ nullable: true })
  avata_path: string;

  @Column({ nullable: true })
  otp_key: string;

  @Column({ unique: true })
  nickname: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;
}
