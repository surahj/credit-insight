/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statement, Transaction, StatementStatus } from '../common/entities';
import { CsvParserService } from './services/csv-parser.service';
import { UploadResponseDto, StatementListDto } from './dto';
import { InsightsService } from '../insights/insights.service';
import { Readable } from 'stream';
import csv from 'csv-parser';

@Injectable()
export class StatementsService {
  constructor(
    @InjectRepository(Statement)
    private statementRepository: Repository<Statement>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private csvParserService: CsvParserService,
    private insightsService: InsightsService,
  ) {}

  async uploadStatement(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResponseDto> {
    // Validate file type
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum 10MB allowed',
      );
    }

    // Validate CSV format
    const isValidFormat = await this.csvParserService.validateCSVFormat(
      file.buffer,
    );
    if (!isValidFormat) {
      throw new BadRequestException(
        'Invalid CSV format. Required columns: date, description, amount',
      );
    }

    // Create statement record
    const statement = this.statementRepository.create({
      filename: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: '', // No file path needed since we process from buffer
      status: StatementStatus.UPLOADED,
      userId,
    });

    const savedStatement = await this.statementRepository.save(statement);

    try {
      // Process CSV directly from buffer and save to database
      const processResult = await this.processStatementFromBuffer(
        savedStatement.id,
        file.buffer,
      );

      return {
        id: savedStatement.id,
        filename: savedStatement.filename,
        fileSize: savedStatement.fileSize,
        status: processResult.status,
        transactionCount: processResult.transactionCount,
        successfulTransactions: processResult.successfulTransactions,
        failedTransactions: processResult.failedTransactions,
        createdAt: savedStatement.createdAt,
      };
    } catch (error) {
      // Clean up on error
      await this.statementRepository.delete(savedStatement.id);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async getStatements(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<StatementListDto> {
    const [statements, total] = await this.statementRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      statements: statements.map((statement) => ({
        id: statement.id,
        filename: statement.filename,
        fileSize: statement.fileSize,
        status: statement.status,
        transactionCount: statement.transactionCount,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        createdAt: statement.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getStatement(id: string, userId: string): Promise<Statement> {
    const statement = await this.statementRepository.findOne({
      where: { id, userId },
      relations: ['transactions'],
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    return statement;
  }

  async deleteStatement(id: string, userId: string): Promise<void> {
    const statement = await this.statementRepository.findOne({
      where: { id, userId },
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    // Delete from database (transactions will be cascade deleted)
    await this.statementRepository.delete(id);
  }

  private async processStatementFromBuffer(
    statementId: string,
    fileBuffer: Buffer,
  ): Promise<{
    status: StatementStatus;
    transactionCount: number;
    successfulTransactions: number;
    failedTransactions: number;
  }> {
    return new Promise((resolve) => {
      // Update status to processing
      this.statementRepository.update(statementId, {
        status: StatementStatus.PROCESSING,
      });

      const transactions: any[] = [];
      const errors: string[] = [];
      let totalRows = 0;
      let successfulRows = 0;
      let failedRows = 0;

      // Create readable stream from buffer
      const readableFile = new Readable();
      readableFile.push(fileBuffer);
      readableFile.push(null);

      // Process CSV directly from buffer
      readableFile
        .pipe(csv())
        .on('data', (row) => {
          totalRows++;
          try {
            const transaction = this.csvParserService.parseRow(row, totalRows);
            if (transaction) {
              transactions.push({
                ...transaction,
                statementId,
              });
              successfulRows++;
            } else {
              failedRows++;
              errors.push(`Row ${totalRows}: Invalid data format`);
            }
          } catch (error) {
            failedRows++;
            errors.push(`Row ${totalRows}: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            if (transactions.length > 0) {
              // Save transactions in chunks
              const chunkSize = 1000;
              for (let i = 0; i < transactions.length; i += chunkSize) {
                const chunk = transactions.slice(i, i + chunkSize);
                await this.transactionRepository.save(chunk);
              }

              // Calculate period dates
              const dates = transactions.map((t) => t.date).sort();
              const periodStart = dates[0];
              const periodEnd = dates[dates.length - 1];

              // Update statement with results
              await this.statementRepository.update(statementId, {
                status: StatementStatus.PROCESSED,
                transactionCount: totalRows,
                successfulTransactions: successfulRows,
                failedTransactions: failedRows,
                periodStart,
                periodEnd,
                errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
              });

              // Trigger insights computation in background
              this.computeInsightsAsync(statementId);

              resolve({
                status: StatementStatus.PROCESSED,
                transactionCount: totalRows,
                successfulTransactions: successfulRows,
                failedTransactions: failedRows,
              });
            } else {
              await this.statementRepository.update(statementId, {
                status: StatementStatus.FAILED,
                errorMessage: 'No valid transactions found in CSV',
              });

              resolve({
                status: StatementStatus.FAILED,
                transactionCount: 0,
                successfulTransactions: 0,
                failedTransactions: 0,
              });
            }
          } catch (error) {
            // Update status to failed
            await this.statementRepository.update(statementId, {
              status: StatementStatus.FAILED,
              errorMessage: error.message,
            });

            resolve({
              status: StatementStatus.FAILED,
              transactionCount: 0,
              successfulTransactions: 0,
              failedTransactions: 0,
            });
          }
        })
        .on('error', (error) => {
          // Update status to failed
          this.statementRepository.update(statementId, {
            status: StatementStatus.FAILED,
            errorMessage: error.message,
          });

          resolve({
            status: StatementStatus.FAILED,
            transactionCount: 0,
            successfulTransactions: 0,
            failedTransactions: 0,
          });
        });
    });
  }

  private async computeInsightsAsync(statementId: string): Promise<void> {
    try {
      // Get the statement to find the userId
      const statement = await this.statementRepository.findOne({
        where: { id: statementId },
      });

      if (statement) {
        // Compute insights in background
        await this.insightsService.runInsights(statementId, statement.userId);
      }
    } catch (error) {
      console.error(
        `Failed to compute insights for statement ${statementId}:`,
        error,
      );
    }
  }
}
