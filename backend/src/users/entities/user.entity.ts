import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique, Index } from 'typeorm';

export enum UserRole {
  TUTOR = 'tutor',
  STUDENT = 'student',
}

@Entity('users')
@Index(['email', 'role'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'text',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ unique: true, nullable: true })
  code: string;

  @CreateDateColumn()
  createdAt: Date;
}

