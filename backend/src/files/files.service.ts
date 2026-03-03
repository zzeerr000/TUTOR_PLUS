import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, IsNull, Brackets } from "typeorm";
import { FileEntity } from "./entities/file.entity";
import { FolderEntity } from "./entities/folder.entity";
import { Homework } from "../homework/entities/homework.entity";
import { ConnectionsService } from "../connections/connections.service";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(process.cwd(), "uploads");

  constructor(
    @InjectRepository(FileEntity)
    private filesRepository: Repository<FileEntity>,
    @InjectRepository(FolderEntity)
    private foldersRepository: Repository<FolderEntity>,
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @Inject(forwardRef(() => ConnectionsService))
    private connectionsService: ConnectionsService,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, data: any): Promise<FileEntity> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const assignedToId = data.assignedToId ? parseInt(data.assignedToId) : null;
    const uploadedById = data.uploadedById;
    const folderId = data.folderId ? parseInt(data.folderId) : null;
    const homeworkId = data.homeworkId ? parseInt(data.homeworkId) : null;

    // If assigned to a student, verify connection
    if (assignedToId) {
      const connections = await this.connectionsService.getConnections(
        uploadedById,
        "tutor",
      );
      const isConnected = connections.some((c) => c.studentId === assignedToId);
      if (!isConnected) {
        throw new BadRequestException(
          "Can only assign files to connected students",
        );
      }
    }

    const fileName = data.name || file.originalname;
    const fileExtension = path.extname(file.originalname);
    const storedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
    const filePath = path.join(this.uploadPath, storedFileName);

    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Determine type
    let type = "document";
    const mimetype = file.mimetype;
    if (mimetype.startsWith("video/")) type = "video";
    else if (mimetype.startsWith("image/")) type = "image";

    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      if (bytes >= 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${bytes} B`;
    };

    const fileEntity = this.filesRepository.create({
      name: fileName,
      type: type,
      size: formatBytes(file.size),
      path: filePath,
      subjectId: data.subjectId ? parseInt(data.subjectId) : null,
      uploadedById: uploadedById,
      assignedToId: assignedToId,
      folderId: folderId,
      homeworkId: homeworkId,
    });

    return this.filesRepository.save(fileEntity);
  }

  async getFileForDownload(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<FileEntity> {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ["uploadedBy", "assignedTo"],
    });

    if (!file) {
      throw new NotFoundException("File not found");
    }

    // Check permissions
    if (userRole === "tutor") {
      if (file.uploadedById !== userId) {
        throw new ForbiddenException(
          "You do not have permission to download this file",
        );
      }
    } else {
      // Student can download if:
      // 1. Explicitly assigned to them
      // 2. Linked to a homework assigned to them
      // 3. It's a general file from a connected tutor

      let hasAccess = false;

      if (file.assignedToId === userId) {
        hasAccess = true;
      } else if (file.homeworkId) {
        const homework = await this.homeworkRepository.findOne({
          where: { id: file.homeworkId },
        });
        if (homework && homework.studentId === userId) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        const connections = await this.connectionsService.getConnections(
          userId,
          "student",
        );
        const connectedTutorIds = connections.map((c) => c.tutorId);
        if (!connectedTutorIds.includes(file.uploadedById)) {
          throw new ForbiddenException(
            "You do not have permission to download this file",
          );
        }
      }
    }

    if (!fs.existsSync(file.path)) {
      throw new NotFoundException("File not found on disk");
    }

    return file;
  }

  async findAll(
    userId: number,
    userRole: string,
    folderId: number | null = null,
    filterSubjectId: number | null = null,
  ): Promise<{ files: FileEntity[]; folders: any[] }> {
    if (userRole === "tutor") {
      const folderWhere: any = {
        uploadedById: userId,
        parentId: folderId,
      };
      if (filterSubjectId) {
        folderWhere.subjectId = filterSubjectId;
      }

      const folders = await this.foldersRepository.find({
        where: folderWhere,
        relations: ["subject", "uploadedBy"],
        order: { name: "ASC" },
      });

      const filesQuery = this.filesRepository
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
        .leftJoinAndSelect("file.assignedTo", "assignedTo")
        .leftJoinAndSelect("file.subject", "subject")
        .where("file.uploadedById = :userId", { userId })
        .andWhere(
          folderId ? "file.folderId = :folderId" : "file.folderId IS NULL",
          { folderId },
        )
        .orderBy("file.createdAt", "DESC");

      if (filterSubjectId) {
        filesQuery.andWhere("file.subjectId = :filterSubjectId", {
          filterSubjectId,
        });
      }

      const files = await filesQuery.getMany();
      const foldersWithCounts = await this.addCounts(folders);
      return { files, folders: foldersWithCounts };
    } else {
      // Student logic
      const connections = await this.connectionsService.getConnections(
        userId,
        "student",
      );
      const connectedTutorIds = connections.map((c) => c.tutorId);

      if (connectedTutorIds.length === 0) {
        return { files: [], folders: [] };
      }

      // Get allowed subject IDs from connections
      let allowedSubjectIds = connections
        .flatMap((c) => c.subjects || [])
        .map((s) => s.id);

      // If a specific subject is requested for filtering
      if (filterSubjectId) {
        // Check if the student is allowed to see this subject
        if (
          allowedSubjectIds.length > 0 &&
          !allowedSubjectIds.includes(filterSubjectId)
        ) {
          // If the requested subject is not in the allowed list, return nothing
          // (unless allowedSubjectIds is empty, which might mean "all subjects allowed" depending on logic,
          // but here empty usually means "no specific subjects assigned so maybe none allowed or all?
          // The previous logic was: if allowedSubjectIds > 0, filter by them.
          // So if I request subject X and I only have Y, I get nothing.)
          return { files: [], folders: [] };
        }
        // Narrow down the allowed list to just the requested one
        allowedSubjectIds = [filterSubjectId];
      }

      const whereConditions: any[] = [];

      // Condition 1: Public/General folders (no subject)
      if (!filterSubjectId) {
        whereConditions.push({
          uploadedById: In(connectedTutorIds),
          parentId: folderId,
          subjectId: IsNull(),
        });
      }

      // Condition 2: Folders with allowed subjects
      if (allowedSubjectIds.length > 0) {
        whereConditions.push({
          uploadedById: In(connectedTutorIds),
          parentId: folderId,
          subjectId: In(allowedSubjectIds),
        });
      } else if (filterSubjectId) {
        // If we are filtering by a subject but have no allowed subjects (and didn't return early),
        // it means we probably shouldn't see anything unless the logic allows "public" subjects when no restriction exists.
        // But the previous logic was: if allowedSubjectIds > 0, add restriction.
        // If allowedSubjectIds == 0, we only see no-subject folders?
        // Let's stick to the previous logic but add the filter.
      }

      const folders = await this.foldersRepository.find({
        where: whereConditions,
        relations: ["subject", "uploadedBy"],
        order: { name: "ASC" },
      });

      const filesQuery = this.filesRepository
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
        .leftJoinAndSelect("file.assignedTo", "assignedTo")
        .leftJoinAndSelect("file.subject", "subject")
        .where(
          "(file.assignedToId = :userId OR (file.assignedToId IS NULL AND file.uploadedById IN (:...tutorIds)))",
          { userId, tutorIds: connectedTutorIds },
        )
        .andWhere(
          folderId ? "file.folderId = :folderId" : "file.folderId IS NULL",
          { folderId },
        )
        .orderBy("file.createdAt", "DESC");

      // Apply subject filtering logic
      filesQuery.andWhere(
        new Brackets((qb) => {
          // Case 1: No subject (always allowed if not filtering by subject)
          if (!filterSubjectId) {
            qb.where("file.subjectId IS NULL");
          } else {
            // If filtering, we can't see "no subject" files unless we explicitly allow them,
            // but usually a subject filter means "show me Math".
            qb.where("1=0"); // Start with false
          }

          // Case 2: Allowed subjects
          if (allowedSubjectIds.length > 0) {
            qb.orWhere("file.subjectId IN (:...allowedSubjectIds)", {
              allowedSubjectIds,
            });
          }
        }),
      );

      const files = await filesQuery.getMany();
      return { files, folders };
    }
  }

  async createFolder(
    name: string,
    uploadedById: number,
    parentId: number | null = null,
    subjectId: number | null = null,
  ): Promise<FolderEntity> {
    const folder = this.foldersRepository.create({
      name,
      uploadedById,
      parentId,
      subjectId,
    });
    return this.foldersRepository.save(folder);
  }

  async removeFolder(
    id: number,
    userId: number,
    allowSubjectFolderDeletion: boolean = false,
  ): Promise<void> {
    const folder = await this.foldersRepository.findOne({
      where: { id, uploadedById: userId },
    });
    if (!folder) {
      throw new NotFoundException(
        "Folder not found or you do not have permission",
      );
    }

    // Prevent deleting subject root folders (auto-created) unless explicitly allowed
    if (folder.subjectId && !folder.parentId && !allowSubjectFolderDeletion) {
      throw new ForbiddenException(
        "Нельзя удалить корневую папку предмета. Удалите предмет, чтобы удалить папку.",
      );
    }

    // TypeORM with CASCADE should handle deleting files and subfolders,
    // but we need to delete physical files from disk.
    await this.deleteFolderContents(id);
    await this.foldersRepository.delete(id);
  }

  private async deleteFolderContents(folderId: number) {
    const files = await this.filesRepository.find({ where: { folderId } });
    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    const subfolders = await this.foldersRepository.find({
      where: { parentId: folderId },
    });
    for (const sub of subfolders) {
      await this.deleteFolderContents(sub.id);
    }
  }

  private async addCounts(folders: FolderEntity[]) {
    return Promise.all(
      folders.map(async (folder) => {
        const subfoldersCount = await this.foldersRepository.count({
          where: { parentId: folder.id },
        });
        const filesCount = await this.filesRepository.count({
          where: { folderId: folder.id },
        });
        return { ...folder, subfoldersCount, filesCount };
      }),
    );
  }

  async moveFile(
    fileId: number,
    folderId: number | null,
    userId: number,
  ): Promise<FileEntity> {
    const file = await this.filesRepository.findOne({
      where: { id: fileId, uploadedById: userId },
    });
    if (!file) {
      throw new NotFoundException("File not found");
    }
    file.folderId = folderId;
    return this.filesRepository.save(file);
  }

  async remove(id: number): Promise<void> {
    const file = await this.filesRepository.findOne({ where: { id } });
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    await this.filesRepository.delete(id);
  }

  async updateFolderSubject(
    folderId: number,
    subjectId: number,
  ): Promise<void> {
    await this.foldersRepository.update(folderId, { subjectId });
  }

  async updateFolderName(folderId: number, name: string): Promise<void> {
    await this.foldersRepository.update(folderId, { name });
  }

  async getStorageStats(
    userId: number,
    userRole: string,
  ): Promise<{
    used: number;
    total: number;
    usedFormatted: string;
    totalFormatted: string;
  }> {
    let files: FileEntity[] = [];

    if (userRole === "tutor") {
      files = await this.filesRepository.find({
        where: { uploadedById: userId },
      });
    } else {
      const res = await this.findAll(userId, userRole as any);
      files = res.files;
    }

    // Parse file sizes and sum them up
    let totalBytes = 0;
    files.forEach((file) => {
      const sizeStr = file.size || "0 B";
      const sizeMatch = sizeStr.match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toUpperCase();
        switch (unit) {
          case "GB":
            totalBytes += value * 1024 * 1024 * 1024;
            break;
          case "MB":
            totalBytes += value * 1024 * 1024;
            break;
          case "KB":
            totalBytes += value * 1024;
            break;
          default:
            totalBytes += value;
        }
      }
    });

    const totalGB = 5; // 5 GB limit
    const totalBytesLimit = totalGB * 1024 * 1024 * 1024;

    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      } else if (bytes >= 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      } else if (bytes >= 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      }
      return `${bytes} B`;
    };

    return {
      used: totalBytes,
      total: totalBytesLimit,
      usedFormatted: formatBytes(totalBytes),
      totalFormatted: `${totalGB} GB`,
    };
  }
}
