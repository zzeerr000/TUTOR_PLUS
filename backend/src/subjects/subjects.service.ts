import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Subject } from "./entities/subject.entity";
import { FilesService } from "../files/files.service";
import { ConnectionsService } from "../connections/connections.service";

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectsRepository: Repository<Subject>,
    @Inject(forwardRef(() => FilesService))
    private filesService: FilesService,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {}

  async create(tutorId: number, createSubjectDto: any) {
    // 1. Create a folder for the subject
    const folder = await this.filesService.createFolder(
      createSubjectDto.name,
      tutorId,
      null,
    );

    // 2. Create the subject
    const subject = this.subjectsRepository.create({
      ...createSubjectDto,
      tutorId,
      folderId: folder.id,
    });

    const savedSubject = await this.subjectsRepository.save(subject);

    // 3. Update the folder with the subjectId
    await this.filesService.updateFolderSubject(
      folder.id,
      (savedSubject as any).id,
    );

    return savedSubject;
  }

  async findAll(userId: number, userRole: string = "tutor") {
    if (userRole === "tutor") {
      return this.subjectsRepository.find({
        where: { tutorId: userId },
        order: { name: "ASC" },
      });
    } else {
      // For student, get subjects from approved connections
      const connections = await this.connectionsService.getConnections(
        userId,
        "student",
      );

      // Collect all unique subjects from connections
      const subjectIds = new Set<number>();
      connections.forEach((connection) => {
        if (connection.subjects && connection.subjects.length > 0) {
          connection.subjects.forEach((subject) => subjectIds.add(subject.id));
        }
      });

      if (subjectIds.size === 0) {
        return [];
      }

      return this.subjectsRepository.find({
        where: { id: In(Array.from(subjectIds)) },
        order: { name: "ASC" },
      });
    }
  }

  async findOne(id: number) {
    return this.subjectsRepository.findOne({ where: { id } });
  }

  async update(id: number, updateSubjectDto: any) {
    const subject = await this.findOne(id);
    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // If name changed, update folder name
    if (updateSubjectDto.name && updateSubjectDto.name !== subject.name) {
      await this.filesService.updateFolderName(
        subject.folderId,
        updateSubjectDto.name,
      );
    }

    await this.subjectsRepository.update(id, updateSubjectDto);
    return this.findOne(id);
  }

  async findByIds(ids: number[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
    return this.subjectsRepository.find({
      where: { id: In(ids) },
    });
  }

  async remove(id: number) {
    const subject = await this.findOne(id);
    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    // Delete the folder (and its contents)
    if (subject.folderId) {
      await this.filesService.removeFolder(
        subject.folderId,
        subject.tutorId,
        true,
      );
    }

    return this.subjectsRepository.delete(id);
  }
}
