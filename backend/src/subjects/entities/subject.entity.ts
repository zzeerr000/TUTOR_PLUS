import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";
import { FolderEntity } from "../../files/entities/folder.entity";

@Entity("subjects")
export class Subject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  tutorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "tutorId" })
  tutor: User;

  @Column({ nullable: true })
  folderId: number;

  @OneToOne(() => FolderEntity)
  @JoinColumn({ name: "folderId" })
  folder: FolderEntity;

  @Column({ default: "#1db954" })
  color: string;

  @CreateDateColumn()
  createdAt: Date;
}
