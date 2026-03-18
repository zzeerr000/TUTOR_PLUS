import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { FinanceService } from '../finance/finance.service';
import { HomeworkService } from '../homework/homework.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private dataSource: DataSource,
    private financeService: FinanceService,
    private homeworkService: HomeworkService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingPaymentsAndHomework() {
    try {
      this.logger.log('Checking for past events to create pending payments and homework...');
      
      // Get all events that have started but don't have transactions/homework
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Get past events without transactions
        const pastEventsQuery = `
          SELECT e.*, s.studentAlias, s.name as studentName
          FROM events e
          LEFT JOIN students s ON e.studentId = s.id
          WHERE e.date || ' ' || e.time <= NOW() 
          AND e.id NOT IN (
            SELECT DISTINCT eventId 
            FROM transactions 
            WHERE eventId IS NOT NULL
          )
        `;
        
        const pastEvents = await queryRunner.query(pastEventsQuery);

        for (const event of pastEvents) {
          // Create transaction if amount > 0
          if (event.amount && parseFloat(event.amount) > 0) {
            try {
              await this.financeService.createTransaction({
                eventId: event.id,
                studentId: event.studentId,
                tutorId: event.tutorId,
                amount: parseFloat(event.amount),
                subject: event.subject,
                status: 'pending',
                createdAt: new Date().toISOString(),
              });
              this.logger.log(`Created transaction for event ${event.id}`);
            } catch (error) {
              this.logger.error(`Failed to create transaction for event ${event.id}:`, error);
            }
          }

          // Create homework draft if not exists
          try {
            const existingHomework = await queryRunner.query(
              'SELECT id FROM homework WHERE lessonId = ?',
              [event.id]
            );

            if (!existingHomework || existingHomework.length === 0) {
              await this.homeworkService.create({
                title: `Домашнее задание по ${event.subject}`,
                description: '',
                subject: event.subject,
                studentId: event.studentId,
                lessonId: event.id,
                dueDate: 'next_lesson',
                status: 'draft',
              });
              this.logger.log(`Created homework draft for event ${event.id}`);
            }
          } catch (error) {
            this.logger.error(`Failed to create homework for event ${event.id}:`, error);
          }
        }

        await queryRunner.commitTransaction();
        this.logger.log(`Processed ${pastEvents.length} past events`);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error('Failed to process pending items:', error);
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error('Error in scheduled task:', error);
    }
  }
}
