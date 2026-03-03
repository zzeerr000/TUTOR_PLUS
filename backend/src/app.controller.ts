import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";

@Controller()
export class AppController {
  constructor(private dataSource: DataSource) {}

  @Get()
  getHello() {
    return { message: "TutorHub API is running", status: "ok" };
  }

  @Get("health")
  getHealth() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Post("admin/clear-data")
  @UseGuards(JwtAuthGuard)
  async clearData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Clear calendar events
      await queryRunner.query("DELETE FROM events");
      // Clear homework
      await queryRunner.query("DELETE FROM homework");
      // Clear tasks
      await queryRunner.query("DELETE FROM tasks");
      // Clear transactions (finance history)
      await queryRunner.query("DELETE FROM transactions");
      // Clear messages
      await queryRunner.query("DELETE FROM messages");
      // Clear progress
      await queryRunner.query("DELETE FROM progress");

      await queryRunner.commitTransaction();
      return { message: "All calendar, homework, finance and task data cleared successfully" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

