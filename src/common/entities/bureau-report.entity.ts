import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

export enum BureauStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export enum RiskBand {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  VERY_POOR = 'very_poor',
}

@Entity('bureau_reports')
export class BureauReport {
  @ApiProperty({ description: 'Bureau report unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'External bureau reference ID' })
  @Column({ nullable: true })
  bureauReferenceId: string;

  @ApiProperty({ enum: BureauStatus, description: 'Bureau check status' })
  @Column({
    type: 'enum',
    enum: BureauStatus,
    default: BureauStatus.PENDING,
  })
  status: BureauStatus;

  // Bureau Response Data
  @ApiProperty({ description: 'Credit score (0-850)' })
  @Column({ nullable: true })
  score: number;

  @ApiProperty({ enum: RiskBand, description: 'Risk band classification' })
  @Column({
    type: 'enum',
    enum: RiskBand,
    nullable: true,
  })
  riskBand: RiskBand;

  @ApiProperty({ description: 'Number of enquiries in last 6 months' })
  @Column({ nullable: true })
  enquiries6m: number;

  @ApiProperty({ description: 'Number of defaults' })
  @Column({ nullable: true })
  defaults: number;

  @ApiProperty({ description: 'Number of open loans' })
  @Column({ nullable: true })
  openLoans: number;

  @ApiProperty({ description: 'Number of trade lines' })
  @Column({ nullable: true })
  tradeLines: number;

  // Request/Response Metadata
  @ApiProperty({ description: 'HTTP status code from bureau API' })
  @Column({ nullable: true })
  httpStatusCode: number;

  @ApiProperty({ description: 'Response time in milliseconds' })
  @Column({ nullable: true })
  responseTime: number;

  @ApiProperty({ description: 'Number of retry attempts' })
  @Column({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Error message if request failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ApiProperty({ description: 'Raw API response for debugging' })
  @Column({ type: 'json', nullable: true })
  rawResponse: any;

  @ApiProperty({ description: 'Additional metadata from bureau' })
  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ApiProperty({ description: 'Bureau report creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.bureauReports, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}
