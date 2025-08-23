import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { Insight } from './insight.entity';

export enum StatementStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('statements')
export class Statement {
  @ApiProperty({ description: 'Statement unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Original filename of uploaded CSV' })
  @Column()
  filename: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column()
  fileSize: number;

  @ApiProperty({ description: 'MIME type of uploaded file' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'File upload path/URL' })
  @Column()
  filePath: string;

  @ApiProperty({
    enum: StatementStatus,
    description: 'Statement processing status',
  })
  @Column({
    type: 'enum',
    enum: StatementStatus,
    default: StatementStatus.UPLOADED,
  })
  status: StatementStatus;

  @ApiProperty({ description: 'Number of transactions parsed from CSV' })
  @Column({ default: 0 })
  transactionCount: number;

  @ApiProperty({ description: 'Number of successfully parsed transactions' })
  @Column({ default: 0 })
  successfulTransactions: number;

  @ApiProperty({ description: 'Number of failed transactions during parsing' })
  @Column({ default: 0 })
  failedTransactions: number;

  @ApiProperty({ description: 'Error message if processing failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @ApiProperty({ description: 'Statement period start date' })
  @Column({ nullable: true })
  periodStart: Date;

  @ApiProperty({ description: 'Statement period end date' })
  @Column({ nullable: true })
  periodEnd: Date;

  @ApiProperty({ description: 'Statement creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Statement last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.statements, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Transaction, (transaction) => transaction.statement, {
    cascade: true,
  })
  transactions: Transaction[];

  @OneToOne(() => Insight, (insight) => insight.statement)
  insight: Insight;
}
