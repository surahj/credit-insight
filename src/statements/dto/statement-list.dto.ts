import { ApiProperty } from '@nestjs/swagger';
import { StatementStatus } from '../../common/entities';

export class StatementListItemDto {
  @ApiProperty({ description: 'Statement unique identifier' })
  id: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ enum: StatementStatus, description: 'Processing status' })
  status: StatementStatus;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number;

  @ApiProperty({ description: 'Period start date', required: false })
  periodStart?: Date;

  @ApiProperty({ description: 'Period end date', required: false })
  periodEnd?: Date;

  @ApiProperty({ description: 'Upload timestamp' })
  createdAt: Date;
}

export class StatementListDto {
  @ApiProperty({
    type: [StatementListItemDto],
    description: 'List of statements',
  })
  statements: StatementListItemDto[];

  @ApiProperty({ description: 'Total number of statements' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}

export class StatementUploadDto {
  @ApiProperty({
    description: 'CSV file, message, and operator',
  })
  file: Express.Multer.File;
}
