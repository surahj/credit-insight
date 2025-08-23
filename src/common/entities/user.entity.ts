import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Statement } from './statement.entity';
import { BureauReport } from './bureau-report.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ description: 'User first name' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column()
  lastName: string;

  @Column({ select: false }) // Exclude from queries by default
  password: string;

  @ApiProperty({ enum: UserRole, description: 'User role' })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Whether the user account is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ nullable: true })
  lastLoginAt: Date;

  @ApiProperty({ description: 'User creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Statement, (statement) => statement.user)
  statements: Statement[];

  @OneToMany(() => BureauReport, (report) => report.user)
  bureauReports: BureauReport[];
}
