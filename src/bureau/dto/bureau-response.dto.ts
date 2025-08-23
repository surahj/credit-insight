import { ApiProperty } from '@nestjs/swagger';
import { BureauStatus, RiskBand } from '../../common/entities';

export class BureauResponseDto {
  @ApiProperty({ description: 'Bureau report unique identifier' })
  id: string;

  @ApiProperty({ description: 'External bureau reference ID' })
  bureauReferenceId: string;

  @ApiProperty({ enum: BureauStatus, description: 'Bureau check status' })
  status: BureauStatus;

  @ApiProperty({ description: 'Credit score (0-850)' })
  score: number;

  @ApiProperty({ enum: RiskBand, description: 'Risk band classification' })
  riskBand: RiskBand;

  @ApiProperty({ description: 'Number of enquiries in last 6 months' })
  enquiries6m: number;

  @ApiProperty({ description: 'Number of defaults' })
  defaults: number;

  @ApiProperty({ description: 'Number of open loans' })
  openLoans: number;

  @ApiProperty({ description: 'Number of trade lines' })
  tradeLines: number;

  @ApiProperty({ description: 'HTTP status code from bureau API' })
  httpStatusCode: number;

  @ApiProperty({ description: 'Response time in milliseconds' })
  responseTime: number;

  @ApiProperty({ description: 'Number of retry attempts' })
  retryCount: number;

  @ApiProperty({
    description: 'Error message if request failed',
    required: false,
  })
  errorMessage?: string;

  @ApiProperty({ description: 'Bureau report creation timestamp' })
  createdAt: Date;
}
