import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
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
      subject: data.subject || "Other",
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
  ): Promise<{ files: FileEntity[]; folders: FolderEntity[] }> {
    if (userRole === "tutor") {
      const folders = await this.foldersRepository.find({
        where: { uploadedById: userId, parentId: folderId },
        order: { name: "ASC" },
      });

      const files = await this.filesRepository
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
        .leftJoinAndSelect("file.assignedTo", "assignedTo")
        .where("file.uploadedById = :userId", { userId })
        .andWhere(
          folderId ? "file.folderId = :folderId" : "file.folderId IS NULL",
          { folderId },
        )
        .orderBy("file.createdAt", "DESC")
        .getMany();

      return { files, folders };
    } else {
      // Student sees files assigned to them OR files from connected tutors with no assignment (general materials)
      const connections = await this.connectionsService.getConnections(
        userId,
        "student",
      );
      const connectedTutorIds = connections.map((c) => c.tutorId);

      if (connectedTutorIds.length === 0) {
        return { files: [], folders: [] };
      }

      // For students, folders are tricky. Let's show all folders from connected tutors at the root,
      // or filter by parentId if we want navigation.
      const folders = await this.foldersRepository.find({
        where: {
          uploadedById: In(connectedTutorIds),
          parentId: folderId,
        },
        order: { name: "ASC" },
      });

      const files = await this.filesRepository
        .createQueryBuilder("file")
        .leftJoinAndSelect("file.uploadedBy", "uploadedBy")
        .leftJoinAndSelect("file.assignedTo", "assignedTo")
        .where(
          "(file.assignedToId = :userId OR (file.assignedToId IS NULL AND file.uploadedById IN (:...tutorIds)))",
          { userId, tutorIds: connectedTutorIds },
        )
        .andWhere(
          folderId ? "file.folderId = :folderId" : "file.folderId IS NULL",
          { folderId },
        )
        .orderBy("file.createdAt", "DESC")
        .getMany();

      return { files, folders };
    }
  }

  async createFolder(
    name: string,
    uploadedById: number,
    parentId: number | null = null,
  ): Promise<FolderEntity> {
    const folder = this.foldersRepository.create({
      name,
      uploadedById,
      parentId,
    });
    return this.foldersRepository.save(folder);
  }

  async removeFolder(id: number, userId: number): Promise<void> {
    const folder = await this.foldersRepository.findOne({
      where: { id, uploadedById: userId },
    });
    if (!folder) {
      throw new NotFoundException(
        "Folder not found or you do not have permission",
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

  async getStorageStats(
    userId: number,
    userRole: string,
  ): Promise<{
    used: number;
    total: number;
    usedFormatted: string;
    totalFormatted: string;
  }> {
    const { files } = await this.findAll(userId, userRole);

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
