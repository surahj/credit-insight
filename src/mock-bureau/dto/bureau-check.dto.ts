import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class BureauCheckRequestDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Additional user identifier', required: false })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    description: 'Additional data for bureau check',
    required: false,
  })
  @IsOptional()
  additional_data?: any;
}

export class BureauCheckResponseDto {
  @ApiProperty({
    description: 'Credit score (300-850)',
    example: 750,
  })
  score: number;

  @ApiProperty({
    description: 'Risk band (A-E)',
    example: 'B',
  })
  risk_band: string;

  @ApiProperty({
    description: 'Number of credit enquiries in last 6 months',
    example: 2,
  })
  enquiries_6m: number;

  @ApiProperty({
    description: 'Number of defaults',
    example: 0,
  })
  defaults: number;

  @ApiProperty({
    description: 'Number of open loans',
    example: 3,
  })
  open_loans: number;

  @ApiProperty({
    description: 'Number of trade lines',
    example: 8,
  })
  trade_lines: number;

  @ApiProperty({
    description: 'Timestamp of the check',
    example: '2025-08-23T14:30:00.000Z',
  })
  timestamp: string;
}
