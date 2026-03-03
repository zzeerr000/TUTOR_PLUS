import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FileEntity } from './file.entity';

@Entity('folders')
export class FolderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  uploadedById: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => FolderEntity, folder => folder.subfolders, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: FolderEntity;

  @OneToMany(() => FolderEntity, folder => folder.parent)
  subfolders: FolderEntity[];

  @OneToMany(() => FileEntity, file => file.folder)
  files: FileEntity[];

  @CreateDateColumn()
  createdAt: Date;
}
