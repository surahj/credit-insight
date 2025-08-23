import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Statement } from './statement.entity';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('insights')
export class Insight {
  @ApiProperty({ description: 'Insight unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Income Analysis
  @ApiProperty({ description: '3-month average income' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  avgMonthlyIncome: number;

  @ApiProperty({ description: 'Total income in the period' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalIncome: number;

  @ApiProperty({ description: 'Number of income transactions' })
  @Column({ default: 0 })
  incomeTransactionCount: number;

  // Flow Analysis
  @ApiProperty({ description: 'Total money inflow' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalInflow: number;

  @ApiProperty({ description: 'Total money outflow' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalOutflow: number;

  @ApiProperty({ description: 'Net cash flow (inflow - outflow)' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  netCashFlow: number;

  // Spending Buckets
  @ApiProperty({ description: 'Spending on groceries' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  groceriesSpend: number;

  @ApiProperty({ description: 'Spending on entertainment' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  entertainmentSpend: number;

  @ApiProperty({ description: 'Spending on transport' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  transportSpend: number;

  @ApiProperty({ description: 'Spending on utilities' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  utilitiesSpend: number;

  @ApiProperty({ description: 'Spending on healthcare' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  healthcareSpend: number;

  @ApiProperty({ description: 'Spending on shopping' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shoppingSpend: number;

  @ApiProperty({ description: 'Spending on dining' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  diningSpend: number;

  @ApiProperty({ description: 'Other spending' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  otherSpend: number;

  // Risk Analysis
  @ApiProperty({ description: 'Number of overdraft incidents' })
  @Column({ default: 0 })
  overdraftCount: number;

  @ApiProperty({ description: 'Number of bounced payments' })
  @Column({ default: 0 })
  bouncedPaymentCount: number;

  @ApiProperty({ description: 'Average daily balance' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  avgDailyBalance: number;

  @ApiProperty({ description: 'Minimum balance in the period' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  minBalance: number;

  @ApiProperty({ description: 'Maximum balance in the period' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  maxBalance: number;

  @ApiProperty({ enum: RiskLevel, description: 'Overall risk assessment' })
  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Array of risk flags identified' })
  @Column({ type: 'json', nullable: true })
  riskFlags: string[];

  // Parsing Statistics
  @ApiProperty({ description: 'Success rate of transaction parsing (0-1)' })
  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  parsingSuccessRate: number;

  @ApiProperty({ description: 'Total transactions processed' })
  @Column({ default: 0 })
  totalTransactions: number;

  @ApiProperty({ description: 'Successfully parsed transactions' })
  @Column({ default: 0 })
  successfulTransactions: number;

  @ApiProperty({ description: 'Failed transaction parsing attempts' })
  @Column({ default: 0 })
  failedTransactions: number;

  @ApiProperty({ description: 'Insight computation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Insight last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Statement, (statement) => statement.insight, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  statement: Statement;

  @Column()
  statementId: string;
}
