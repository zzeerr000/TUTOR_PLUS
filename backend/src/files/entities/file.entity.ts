import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { FolderEntity } from "./folder.entity";
import { Homework } from "../../homework/entities/homework.entity";
import { Subject } from "../../subjects/entities/subject.entity";

@Entity("files")
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string; // document, video, image

  @Column()
  size: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  path: string;

  @Column({ nullable: true })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: true })
  @JoinColumn({ name: "subjectId" })
  subject: Subject;

  @Column()
  uploadedById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploadedById" })
  uploadedBy: User;

  @Column({ nullable: true })
  assignedToId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assignedToId" })
  assignedTo: User;

  @Column({ nullable: true })
  folderId: number;

  @ManyToOne(() => FolderEntity, (folder) => folder.files, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "folderId" })
  folder: FolderEntity;

  @Column({ nullable: true })
  homeworkId: number;

  @ManyToOne(() => Homework, (homework) => homework.files, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "homeworkId" })
  homework: Homework;

  @CreateDateColumn()
  createdAt: Date;
}
