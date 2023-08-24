import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum AchievementDomain {
  Friend = 'friend',
}

@Entity()
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ nullable: false })
  domain: AchievementDomain;
  @Column({ nullable: false })
  title: string;
  @Column({ nullable: false })
  description: string;
  @Column()
  value: number;
}
