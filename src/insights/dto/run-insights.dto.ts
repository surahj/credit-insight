import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RunInsightsDto {
  @ApiProperty({ description: 'Statement ID to compute insights for' })
  @IsUUID()
  statementId: string;
}
