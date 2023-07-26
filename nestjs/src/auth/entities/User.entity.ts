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

  @Column({ unique: true, nullable: true })
  intra_name: string;

  @Column({ nullable: true })
  avata_path: string;

  @Column()
  otp_key: string;

  @Column({ unique: true, nullable: true })
  nickname: string;

  @Column()
  created_at: Date;

  @Column({ nullable: true })
  updated_at: Date;
}
