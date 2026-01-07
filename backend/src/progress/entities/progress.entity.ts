import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('progress')
export class Progress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  subject: string;

  @Column('decimal', { precision: 5, scale: 2 })
  progress: number; // percentage

  @Column({ nullable: true })
  grade: string;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  hoursStudied: number;

  @Column({ default: 0 })
  lessonsCompleted: number;

  @Column()
  studentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  tutorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutorId' })
  tutor: User;

  @CreateDateColumn()
  createdAt: Date;
}

