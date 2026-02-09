import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Unique,
  Index,
} from "typeorm";

export enum UserRole {
  TUTOR = "tutor",
  STUDENT = "student",
}

@Entity("users")
@Index(["email", "role"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  name: string;

  @Column({
    type: "text",
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column({ nullable: true })
  zoomAccessToken: string;

  @Column({ nullable: true })
  zoomRefreshToken: string;

  @Column({ nullable: true, type: "bigint" })
  zoomTokenExpires: number;

  @Column({ default: false })
  isVirtual: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
