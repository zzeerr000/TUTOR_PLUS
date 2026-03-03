import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileEntity } from '../../files/entities/file.entity';
import { Event } from '../../calendar/entities/event.entity';

@Entity('homework')
export class Homework {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  lessonId: number;

  @ManyToOne(() => Event, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lessonId' })
  lesson: Event;

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

  @Column()
  subject: string;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 'pending' })
  status: string; // pending, completed, no_homework, missed, draft

  @Column({ type: 'text', nullable: true })
  studentComment: string;

  @Column({ type: 'text', nullable: true })
  question: string;

  @Column({ type: 'text', nullable: true })
  questionAnswer: string;

  @Column({ default: false })
  hasNewQuestion: boolean;

  @Column({ default: false })
  hasNewAnswer: boolean;

  @OneToMany(() => FileEntity, file => file.homework)
  files: FileEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
