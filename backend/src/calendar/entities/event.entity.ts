import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Subject } from "../../subjects/entities/subject.entity";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  date: string; // YYYY-MM-DD format

  @Column()
  time: string; // HH:MM AM/PM format

  @Column({ type: "int", default: 0 })
  timezoneOffsetMinutes: number;

  @Column({ nullable: true })
  color: string;

  @Column()
  tutorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "tutorId" })
  tutor: User;

  @Column()
  studentId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "studentId" })
  student: User;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: "subjectId" })
  subjectEntity: Subject;

  @Column({ default: false })
  paymentPending: boolean;

  @Column({ default: false })
  paymentIgnored: boolean;

  @Column({ nullable: true })
  transactionId: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: "int", default: 60 })
  duration: number; // in minutes

  @Column({ type: "text", nullable: true })
  notes: string;
}
