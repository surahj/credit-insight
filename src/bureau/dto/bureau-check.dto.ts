import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class BureauCheckDto {
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
