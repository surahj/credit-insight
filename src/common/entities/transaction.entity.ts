import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Statement } from './statement.entity';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionCategory {
  INCOME = 'income',
  TRANSFER = 'transfer',
  GROCERIES = 'groceries',
  ENTERTAINMENT = 'entertainment',
  TRANSPORT = 'transport',
  UTILITIES = 'utilities',
  HEALTHCARE = 'healthcare',
  SHOPPING = 'shopping',
  DINING = 'dining',
  EDUCATION = 'education',
  INVESTMENT = 'investment',
  LOAN_PAYMENT = 'loan_payment',
  FEES_CHARGES = 'fees_charges',
  OTHER = 'other',
}

@Entity('transactions')
export class Transaction {
  @ApiProperty({ description: 'Transaction unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Transaction date' })
  @Column()
  date: Date;

  @ApiProperty({ description: 'Transaction description from bank statement' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Transaction amount (positive for credit, negative for debit)',
  })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Account balance after transaction' })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  balance: number;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type' })
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    enum: TransactionCategory,
    description: 'Categorized transaction type',
  })
  @Column({
    type: 'enum',
    enum: TransactionCategory,
    default: TransactionCategory.OTHER,
  })
  category: TransactionCategory;

  @ApiProperty({
    description: 'Whether this transaction is classified as income',
  })
  @Column({ default: false })
  isIncome: boolean;

  @ApiProperty({
    description: 'Confidence score of category classification (0-1)',
  })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  categoryConfidence: number;

  @ApiProperty({ description: 'Original CSV row data for debugging' })
  @Column({ type: 'text', nullable: true })
  rawData: string;

  @ApiProperty({ description: 'Transaction creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Statement, (statement) => statement.transactions, {
    onDelete: 'CASCADE',
  })
  statement: Statement;

  @Column()
  statementId: string;
}
