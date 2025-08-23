import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../common/entities';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  lastName: string;
}

export class AdminRegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (minimum 8 characters)',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User role (admin can create users with any role)',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
