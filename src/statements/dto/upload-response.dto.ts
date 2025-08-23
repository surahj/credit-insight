import { ApiProperty } from '@nestjs/swagger';
import { StatementStatus } from '../../common/entities';

export class UploadResponseDto {
  @ApiProperty({ description: 'Statement unique identifier' })
  id: string;

  @ApiProperty({ description: 'Original filename' })
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ enum: StatementStatus, description: 'Processing status' })
  status: StatementStatus;

  @ApiProperty({ description: 'Number of transactions parsed' })
  transactionCount: number;

  @ApiProperty({ description: 'Number of successful transactions' })
  successfulTransactions: number;

  @ApiProperty({ description: 'Number of failed transactions' })
  failedTransactions: number;

  @ApiProperty({ description: 'Upload timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Error message if any', required: false })
  errorMessage?: string;
}
