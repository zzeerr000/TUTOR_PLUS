import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  date: string; // YYYY-MM-DD format

  @Column()
  time: string; // HH:MM AM/PM format

  @Column({ nullable: true })
  color: string;

  @Column()
  tutorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tutorId' })
  tutor: User;

  @Column()
  studentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ nullable: true })
  subject: string;

  @Column({ default: false })
  paymentPending: boolean;

  @Column({ nullable: true })
  transactionId: number;
}

