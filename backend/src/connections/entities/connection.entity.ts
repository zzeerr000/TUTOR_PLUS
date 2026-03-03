import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Subject } from "../../subjects/entities/subject.entity";

export enum ConnectionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("connections")
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({
    type: "text",
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @Column()
  requestedById: number; // Who sent the request (tutor or student)

  @Column({ nullable: true })
  studentAlias: string;

  @Column({ nullable: true })
  defaultSubject: string;

  @ManyToMany(() => Subject)
  @JoinTable()
  subjects: Subject[];

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  defaultPrice: number;

  @Column({ type: "int", nullable: true })
  defaultDuration: number; // in minutes

  @CreateDateColumn()
  createdAt: Date;
}
